import { OpenAI } from "openai";
import { env } from "@/env";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/server/db";
import { chats, messages as messagesTable, pdfDocuments, chatPdfReferences } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { queryPdfChunks, queryCachedResponse, cacheChatResponse } from "@/lib/pinecone";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages, chatId, fileUrl, pdfDocumentId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Messages array is required", { status: 400 });
    }

    let currentChatId = chatId;
    let pdfDocIds: number[] = [];

    // Create new chat if not exists
    if (!currentChatId) {
      const firstMessage = messages[messages.length - 1]?.content || "New Chat";
      const name = firstMessage.slice(0, 30);
      const [newChat] = await db
        .insert(chats)
        .values({
          name,
          userId: user.id,
        })
        .returning();
      currentChatId = newChat?.id;
    }

    // Handle PDF document reference
    if (pdfDocumentId) {
      console.log(`Processing PDF document ID: ${pdfDocumentId} for user: ${user.id}`);
      // Check if PDF belongs to user
      const pdfDoc = await db.query.pdfDocuments.findFirst({
        where: and(
          eq(pdfDocuments.id, pdfDocumentId),
          eq(pdfDocuments.userId, user.id)
        ),
      });

      if (pdfDoc) {
        pdfDocIds.push(pdfDocumentId);
        console.log(`PDF document found: ${pdfDoc.fileName}, ID: ${pdfDoc.id}`);
        
        // Create PDF reference for this chat if it doesn't exist
        // Note: currentChatId might be null for first message, so we'll link it after chat creation
        if (currentChatId) {
          const existingRef = await db.query.chatPdfReferences.findFirst({
            where: and(
              eq(chatPdfReferences.chatId, currentChatId),
              eq(chatPdfReferences.pdfDocumentId, pdfDocumentId)
            ),
          });

          if (!existingRef) {
            await db.insert(chatPdfReferences).values({
              chatId: currentChatId,
              pdfDocumentId: pdfDocumentId,
            });
            console.log(`Linked PDF ${pdfDocumentId} to chat ${currentChatId}`);
          }
        }
      } else {
        console.warn(`PDF document ${pdfDocumentId} not found or doesn't belong to user ${user.id}`);
      }
    } else if (fileUrl) {
      // Legacy support: if fileUrl is provided, try to find PDF document
      console.log(`Looking up PDF by fileUrl: ${fileUrl}`);
      const pdfDoc = await db.query.pdfDocuments.findFirst({
        where: and(
          eq(pdfDocuments.fileUrl, fileUrl),
          eq(pdfDocuments.userId, user.id)
        ),
      });

      if (pdfDoc) {
        pdfDocIds.push(pdfDoc.id);
        console.log(`Found PDF by URL: ${pdfDoc.fileName}, ID: ${pdfDoc.id}`);
        
        if (currentChatId) {
          const existingRef = await db.query.chatPdfReferences.findFirst({
            where: and(
              eq(chatPdfReferences.chatId, currentChatId),
              eq(chatPdfReferences.pdfDocumentId, pdfDoc.id)
            ),
          });

          if (!existingRef) {
            await db.insert(chatPdfReferences).values({
              chatId: currentChatId,
              pdfDocumentId: pdfDoc.id,
            });
            console.log(`Linked PDF ${pdfDoc.id} to chat ${currentChatId} via URL`);
          }
        }
      } else {
        console.warn(`PDF not found by URL: ${fileUrl}`);
      }
    }
    
    // If chat was just created and we have a PDF, link it now
    if (!chatId && currentChatId && pdfDocIds.length > 0) {
      for (const pdfId of pdfDocIds) {
        const existingRef = await db.query.chatPdfReferences.findFirst({
          where: and(
            eq(chatPdfReferences.chatId, currentChatId),
            eq(chatPdfReferences.pdfDocumentId, pdfId)
          ),
        });

        if (!existingRef) {
          await db.insert(chatPdfReferences).values({
            chatId: currentChatId,
            pdfDocumentId: pdfId,
          });
          console.log(`Linked PDF ${pdfId} to newly created chat ${currentChatId}`);
        }
      }
    }

    // Get all PDF references for this chat
    if (currentChatId) {
      const chatPdfRefs = await db.query.chatPdfReferences.findMany({
        where: eq(chatPdfReferences.chatId, currentChatId),
      });
      const refIds = chatPdfRefs.map(ref => ref.pdfDocumentId);
      // Merge with any PDF IDs from the current request
      pdfDocIds = [...new Set([...pdfDocIds, ...refIds])];
    }

    const lastMessage = messages[messages.length - 1];

    // Save user message
    if (currentChatId && lastMessage) {
      await db.insert(messagesTable).values({
        chatId: currentChatId,
        role: "user",
        content: lastMessage.content,
      });
    }

    let stream;
    let systemContext = "";

    // Always query Pinecone for PDF context if PDFs are referenced
    if (pdfDocIds.length > 0) {
      try {
        console.log(`Querying Pinecone for PDF context. PDF IDs: ${pdfDocIds.join(", ")}, User: ${user.id}`);
        
        // For general questions like "what's in the PDF", use a broader query
        const isGeneralQuestion = /what'?s?\s+(in|the\s+content\s+of|contained\s+in)|(summarize|describe|tell\s+me\s+about)\s+(the\s+)?pdf/i.test(lastMessage.content);
        const queryText = isGeneralQuestion 
          ? "document content summary overview" // Broader query for general questions
          : lastMessage.content; // Specific query for targeted questions
        
        const topK = isGeneralQuestion ? 10 : 5; // Get more chunks for general questions
        
        const relevantChunks = await queryPdfChunks(
          queryText,
          user.id,
          pdfDocIds,
          topK
        );

        console.log(`Found ${relevantChunks.length} relevant chunks from Pinecone`);

        if (relevantChunks.length > 0) {
          if (isGeneralQuestion) {
            // For general questions, provide a comprehensive overview
            systemContext = `You are a helpful assistant. The user has uploaded a PDF document and is asking about its contents. Here are relevant sections from the PDF:\n\n${relevantChunks.map((chunk, idx) => `[Section ${idx + 1}, Page ${chunk.pageNumber}]:\n${chunk.text}`).join("\n\n")}\n\nIMPORTANT: Provide a comprehensive summary of what's in the PDF based on the content above. Reference specific sections and pages when relevant. If the user asks "what's in the PDF", give them a detailed overview of the document's contents.`;
          } else {
            systemContext = `You are a helpful assistant answering questions based on the following PDF document context. Always reference the PDF content when answering questions:\n\n${relevantChunks.map((chunk, idx) => `[Context ${idx + 1}, Page ${chunk.pageNumber}]:\n${chunk.text}`).join("\n\n")}\n\nIMPORTANT: Use the PDF context above to answer the user's question. If the question is about something in the PDF, reference specific details from the context. If the context doesn't contain enough information, acknowledge that but still try to help based on what is available.`;
          }
        } else {
          // Even if no chunks found, add a note that PDFs are referenced
          const allUserPdfs = await db.query.pdfDocuments.findMany({
            where: eq(pdfDocuments.userId, user.id),
          });
          const referencedPdfs = allUserPdfs.filter(pdf => pdfDocIds.includes(pdf.id));
          
          if (referencedPdfs.length > 0) {
            systemContext = `The user has referenced PDF document(s): ${referencedPdfs.map(p => p.fileName).join(", ")}. However, no relevant context was found in Pinecone for this query. Please acknowledge that you're aware of the PDF but may need more specific information to answer accurately. Try to help based on general knowledge if possible.`;
            console.warn(`No Pinecone chunks found for PDFs: ${referencedPdfs.map(p => p.id).join(", ")}. Query: "${lastMessage.content}"`);
          }
        }
      } catch (error) {
        console.error("Error querying Pinecone for PDF context:", error);
        // Continue without context if Pinecone query fails
      }
    }

    // Check for cached response (only if we have context or no PDFs)
    let cachedResponse: string | null = null;
    if (pdfDocIds.length > 0 && systemContext) {
      // Don't use cache if we have fresh PDF context
      cachedResponse = null;
    } else {
      try {
        cachedResponse = pdfDocIds.length > 0
          ? await queryCachedResponse(lastMessage.content, user.id, pdfDocIds)
          : await queryCachedResponse(lastMessage.content, user.id);
      } catch (error) {
        console.error("Error querying cached response:", error);
      }
    }

    // Use PDF.ai if PDF document is referenced and has pdfAiFileId
    if (pdfDocIds.length > 0 && pdfDocIds[0]) {
      const pdfDoc = await db.query.pdfDocuments.findFirst({
        where: eq(pdfDocuments.id, pdfDocIds[0]),
      });

      if (pdfDoc?.pdfAiFileId) {
        try {
          const pdfAiResponse = await fetch("https://api.pdf.ai/v1/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": env.PDFAI_API_KEY,
            },
            body: JSON.stringify({
              fileId: pdfDoc.pdfAiFileId,
              question: lastMessage.content,
              history: messages.slice(0, -1).map((m: any) => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: m.content,
              })),
            }),
          });

          if (pdfAiResponse.ok) {
            const pdfAiData = await pdfAiResponse.json();
            const responseText = pdfAiData.answer || pdfAiData.response || JSON.stringify(pdfAiData);

            // Cache the response
            await cacheChatResponse(
              lastMessage.content,
              responseText,
              user.id,
              pdfDocIds
            );

            // Save assistant message
            if (currentChatId) {
              await db.insert(messagesTable).values({
                chatId: currentChatId,
                role: "assistant",
                content: responseText,
              });
            }

            // Return as stream
            const encoder = new TextEncoder();
            const readableStream = new ReadableStream({
              start(controller) {
                controller.enqueue(encoder.encode(responseText));
                controller.close();
              },
            });

            return new Response(readableStream, {
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
                "X-Chat-Id": currentChatId.toString(),
              },
            });
          }
        } catch (error) {
          console.error("PDF.ai API error:", error);
          // Fall through to OpenAI
        }
      }
    }

    // Use cached response if available
    if (cachedResponse) {
      // Save assistant message
      if (currentChatId) {
        await db.insert(messagesTable).values({
          chatId: currentChatId,
          role: "assistant",
          content: cachedResponse,
        });
      }

      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(cachedResponse));
          controller.close();
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Chat-Id": currentChatId.toString(),
        },
      });
    }

    // Build messages with system context if PDFs are referenced
    const messagesWithContext = systemContext
      ? [
          { role: "system" as const, content: systemContext },
          ...messages,
        ]
      : messages;

    console.log(`Sending to OpenAI. Has PDF context: ${!!systemContext}, PDF IDs: ${pdfDocIds.join(", ") || "none"}`);

    stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messagesWithContext,
      stream: true,
    });

    const encoder = new TextEncoder();
    let accumulatedContent = "";

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              accumulatedContent += content;
              controller.enqueue(encoder.encode(content));
            }
          }

          // Save assistant message
          if (currentChatId) {
            await db.insert(messagesTable).values({
              chatId: currentChatId,
              role: "assistant",
              content: accumulatedContent,
            });
          }

          // Cache the response in Pinecone
          if (pdfDocIds.length > 0) {
            await cacheChatResponse(
              lastMessage.content,
              accumulatedContent,
              user.id,
              pdfDocIds
            );
          } else {
            await cacheChatResponse(
              lastMessage.content,
              accumulatedContent,
              user.id
            );
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Chat-Id": currentChatId.toString(),
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

