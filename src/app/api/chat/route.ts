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
      // Check if PDF belongs to user
      const pdfDoc = await db.query.pdfDocuments.findFirst({
        where: and(
          eq(pdfDocuments.id, pdfDocumentId),
          eq(pdfDocuments.userId, user.id)
        ),
      });

      if (pdfDoc) {
        pdfDocIds.push(pdfDocumentId);
        
        // Create PDF reference for this chat if it doesn't exist
        const existingRef = await db.query.chatPdfReferences.findFirst({
          where: and(
            eq(chatPdfReferences.chatId, currentChatId),
            eq(chatPdfReferences.pdfDocumentId, pdfDocumentId)
          ),
        });

        if (!existingRef && currentChatId) {
          await db.insert(chatPdfReferences).values({
            chatId: currentChatId,
            pdfDocumentId: pdfDocumentId,
          });
        }
      }
    } else if (fileUrl) {
      // Legacy support: if fileUrl is provided, try to find PDF document
      const pdfDoc = await db.query.pdfDocuments.findFirst({
        where: and(
          eq(pdfDocuments.fileUrl, fileUrl),
          eq(pdfDocuments.userId, user.id)
        ),
      });

      if (pdfDoc) {
        pdfDocIds.push(pdfDoc.id);
        
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
          }
        }
      }
    }

    // Get all PDF references for this chat
    if (currentChatId) {
      const chatPdfRefs = await db.query.chatPdfReferences.findMany({
        where: eq(chatPdfReferences.chatId, currentChatId),
      });
      pdfDocIds = chatPdfRefs.map(ref => ref.pdfDocumentId);
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

    // Check for cached response
    const cachedResponse = pdfDocIds.length > 0
      ? await queryCachedResponse(lastMessage.content, user.id, pdfDocIds)
      : await queryCachedResponse(lastMessage.content, user.id);

    let stream;
    let systemContext = "";

    // If PDFs are referenced, query Pinecone for relevant context
    if (pdfDocIds.length > 0) {
      const relevantChunks = await queryPdfChunks(
        lastMessage.content,
        user.id,
        pdfDocIds,
        5
      );

      if (relevantChunks.length > 0) {
        systemContext = `You are a helpful assistant answering questions based on the following PDF document context:\n\n${relevantChunks.map((chunk, idx) => `[Context ${idx + 1}, Page ${chunk.pageNumber}]:\n${chunk.text}`).join("\n\n")}\n\nUse this context to answer the user's question. If the context doesn't contain enough information, say so.`;
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

