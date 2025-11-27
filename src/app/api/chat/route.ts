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

    const { messages, chatId, fileUrl, pdfDocumentId, chainOfThought } = await req.json();

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
            try {
              await db.insert(chatPdfReferences).values({
                chatId: currentChatId,
                pdfDocumentId: pdfDocumentId,
              });
              console.log(`Linked PDF ${pdfDocumentId} to chat ${currentChatId}`);
            } catch (error: any) {
              if (error?.code === '42P01') {
                console.warn("PDF reference table doesn't exist. Run migration at /api/migrate");
              } else {
                console.error("Error linking PDF to chat:", error);
              }
            }
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
            try {
              await db.insert(chatPdfReferences).values({
                chatId: currentChatId,
                pdfDocumentId: pdfDoc.id,
              });
              console.log(`Linked PDF ${pdfDoc.id} to chat ${currentChatId} via URL`);
            } catch (error: any) {
              if (error?.code === '42P01') {
                console.warn("PDF reference table doesn't exist. Run migration at /api/migrate");
              } else {
                console.error("Error linking PDF to chat:", error);
              }
            }
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
          try {
            await db.insert(chatPdfReferences).values({
              chatId: currentChatId,
              pdfDocumentId: pdfId,
            });
            console.log(`Linked PDF ${pdfId} to newly created chat ${currentChatId}`);
          } catch (error: any) {
            if (error?.code === '42P01') {
              console.warn("PDF reference table doesn't exist. Run migration at /api/migrate");
            } else {
              console.error("Error linking PDF to chat:", error);
            }
          }
        }
      }
    }

    // Get all PDF references for this chat
    if (currentChatId) {
      try {
        const chatPdfRefs = await db.query.chatPdfReferences.findMany({
          where: eq(chatPdfReferences.chatId, currentChatId),
        });
        const refIds = chatPdfRefs.map(ref => ref.pdfDocumentId);
        // Merge with any PDF IDs from the current request
        pdfDocIds = [...new Set([...pdfDocIds, ...refIds])];
      } catch (error: any) {
        // If table doesn't exist, log warning but continue
        if (error?.code === '42P01') {
          console.warn("PDF reference table doesn't exist. Run migration at /api/migrate");
        } else {
          console.error("Error fetching PDF references:", error);
        }
      }
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

    let stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk> | null = null;
    let systemContext = "";

    // Query Pinecone for PDF context as fallback (only if PDF.ai is not available)
    // We'll query Pinecone after checking PDF.ai, so we can use it as backup context
    let pineconeContext = "";
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
          pineconeContext = relevantChunks.map((chunk, idx) => 
            `[Context ${idx + 1}, Page ${chunk.pageNumber}]:\n${chunk.text}`
          ).join("\n\n");
        } else {
          console.warn("No relevant chunks found in Pinecone for this query");
        }
      } catch (error) {
        console.error("Error querying Pinecone for PDF context:", error);
        // Log detailed error for debugging
        if (error instanceof Error) {
          console.error("Pinecone error details:", error.message, error.stack);
        }
        // Continue without context if Pinecone query fails - don't fail the entire request
      }
    }

    // Check for cached response (only if we don't have fresh PDF context)
    // Skip cache if we have Pinecone context to ensure fresh answers
    let cachedResponse: string | null = null;
    if (pdfDocIds.length > 0 && pineconeContext) {
      // Don't use cache if we have fresh PDF context from Pinecone
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

    // PRIORITY 1: Use PDF.ai if PDF document is referenced and has pdfAiFileId
    // PDF.ai provides the best answers directly from the PDF
    if (pdfDocIds.length > 0 && pdfDocIds[0]) {
      const pdfDoc = await db.query.pdfDocuments.findFirst({
        where: eq(pdfDocuments.id, pdfDocIds[0]),
      });

      if (pdfDoc?.pdfAiFileId) {
        try {
          console.log(`Using PDF.ai API for PDF ${pdfDoc.pdfAiFileId}, question: "${lastMessage.content}"`);
          
          // Build history for PDF.ai (last 10 messages to avoid token limits)
          const recentMessages = messages.slice(-10);
          const pdfAiHistory = recentMessages.slice(0, -1).map((m: any) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          }));

          // Try PDF.ai chat endpoint first
          const pdfAiResponse = await fetch("https://api.pdf.ai/v1/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": env.PDFAI_API_KEY,
            },
            body: JSON.stringify({
              fileId: pdfDoc.pdfAiFileId,
              question: lastMessage.content,
              history: pdfAiHistory,
            }),
          });

          if (pdfAiResponse.ok) {
            const pdfAiData = await pdfAiResponse.json();
            console.log("PDF.ai response:", JSON.stringify(pdfAiData).substring(0, 200));
            
            // PDF.ai returns answer in different possible fields - try all common ones
            let responseText = pdfAiData.answer || 
                              pdfAiData.response || 
                              pdfAiData.text ||
                              pdfAiData.message ||
                              pdfAiData.content;
            
            // If it's nested in a data/result object
            if (!responseText && pdfAiData.data) {
              responseText = pdfAiData.data.answer || pdfAiData.data.response || pdfAiData.data.text;
            }
            
            // If still no text, try to extract from any string field
            if (!responseText && typeof pdfAiData === 'object') {
              for (const [key, value] of Object.entries(pdfAiData)) {
                if (typeof value === 'string' && value.length > 50) {
                  responseText = value;
                  break;
                }
              }
            }

            if (responseText && responseText.trim().length > 0) {
              console.log(`PDF.ai returned answer (${responseText.length} chars): ${responseText.substring(0, 100)}...`);

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
            } else {
              console.warn("PDF.ai returned empty or invalid response:", pdfAiData);
              // Fall through to OpenAI with Pinecone context
            }
          } else {
            const errorText = await pdfAiResponse.text();
            console.error(`PDF.ai API error (${pdfAiResponse.status}):`, errorText);
            // Log but continue - fall through to OpenAI with Pinecone context
            // Don't throw - let the fallback handle it
          }
        } catch (error) {
          console.error("PDF.ai API error:", error);
          // Log detailed error but continue - fall through to OpenAI with Pinecone context
          if (error instanceof Error) {
            console.error("PDF.ai error details:", error.message, error.stack);
          }
          // Don't throw - let the fallback handle it
        }
      }
    }
    
    // Build system context from Pinecone if available (as fallback or supplement)
    if (pineconeContext) {
      const isGeneralQuestion = /what'?s?\s+(in|the\s+content\s+of|contained\s+in)|(summarize|describe|tell\s+me\s+about)\s+(the\s+)?pdf/i.test(lastMessage.content);
      
      const chainOfThoughtInstruction = chainOfThought 
        ? "\n\nIMPORTANT: When answering, think step-by-step. Show your reasoning process by breaking down the problem, considering different aspects, and explaining your thought process before providing the final answer. Format each stage of your reasoning with '🧠thinking: ' followed by your thought process. For example: '🧠thinking: Let me break down this problem...' Then provide your final answer after the reasoning stages."
        : "";
      
      if (isGeneralQuestion) {
        systemContext = `You are a helpful assistant. The user has uploaded a PDF document and is asking about its contents. Here are relevant sections from the PDF:\n\n${pineconeContext}\n\nIMPORTANT: Provide a comprehensive summary of what's in the PDF based on the content above. Reference specific sections and pages when relevant.${chainOfThoughtInstruction}`;
      } else {
        systemContext = `You are a helpful assistant answering questions based on the following PDF document context. Always reference the PDF content when answering questions:\n\n${pineconeContext}\n\nIMPORTANT: Use the PDF context above to answer the user's question. If the question is about something in the PDF, reference specific details from the context.${chainOfThoughtInstruction}`;
      }
    } else if (pdfDocIds.length > 0) {
      // Even if no Pinecone chunks, mention PDFs are referenced
      try {
        const allUserPdfs = await db.query.pdfDocuments.findMany({
          where: eq(pdfDocuments.userId, user.id),
        });
        const referencedPdfs = allUserPdfs.filter(pdf => pdfDocIds.includes(pdf.id));
        
        if (referencedPdfs.length > 0 && !systemContext) {
          console.log(`PDFs referenced but no Pinecone context found. PDFs: ${referencedPdfs.map(p => p.fileName).join(", ")}`);
          const chainOfThoughtInstruction = chainOfThought 
            ? "\n\nIMPORTANT: When answering, think step-by-step. Show your reasoning process by breaking down the problem, considering different aspects, and explaining your thought process before providing the final answer. Format each stage of your reasoning with '🧠thinking: ' followed by your thought process. For example: '🧠thinking: Let me break down this problem...' Then provide your final answer after the reasoning stages."
            : "";
          systemContext = `The user has referenced PDF document(s): ${referencedPdfs.map(p => p.fileName).join(", ")}. The PDF content may not be fully indexed yet. Please acknowledge that you're aware of the PDF and try to help based on general knowledge if possible. If the question is specifically about the PDF content, suggest that the user wait a moment for indexing to complete or try re-uploading the PDF.${chainOfThoughtInstruction}`;
        }
      } catch (dbError) {
        console.error("Error fetching PDF documents for context:", dbError);
        // Continue without PDF context - don't fail the request
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
    // Ensure messages are in the correct format for OpenAI API
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "assistant" : msg.role === "system" ? "system" : "user",
      content: typeof msg.content === "string" ? msg.content : String(msg.content || ""),
    }));

    // Add chain of thought instruction if enabled and no system context exists
    let finalSystemContext = systemContext;
    if (chainOfThought && !systemContext) {
      finalSystemContext = "You are a helpful assistant. IMPORTANT: When answering, think step-by-step. Show your reasoning process by breaking down the problem, considering different aspects, and explaining your thought process before providing the final answer. Format each stage of your reasoning with '🧠thinking: ' followed by your thought process. For example: '🧠thinking: Let me break down this problem...' Then provide your final answer after the reasoning stages.";
    }

    const messagesWithContext = finalSystemContext
      ? [
          { role: "system" as const, content: finalSystemContext },
          ...formattedMessages,
        ]
      : formattedMessages;

    // Validate that we have messages to send
    if (messagesWithContext.length === 0) {
      console.error("No messages to send to OpenAI");
      return new Response(
        JSON.stringify({ 
          error: "Invalid request",
          message: "No messages provided"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Sending to OpenAI. Has PDF context: ${!!finalSystemContext}, PDF IDs: ${pdfDocIds.join(", ") || "none"}, Messages: ${messagesWithContext.length}, Chain of Thought: ${chainOfThought || false}`);

    try {
      stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messagesWithContext,
        stream: true,
      });
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError);
      // Provide more detailed error information
      const errorMessage = openaiError?.message || "Failed to connect to OpenAI API";
      const errorStatus = openaiError?.status || 500;
      
      // Log full error details for debugging
      console.error("OpenAI error details:", {
        message: errorMessage,
        status: errorStatus,
        error: openaiError?.error,
        stack: openaiError?.stack,
      });
      
      return new Response(
        JSON.stringify({ 
          error: "OpenAI API error",
          message: errorMessage,
          details: process.env.NODE_ENV === "development" ? (openaiError?.error || null) : undefined
        }),
        {
          status: errorStatus,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Ensure stream is defined
    if (!stream) {
      return new Response(
        JSON.stringify({ error: "Failed to create OpenAI stream" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const encoder = new TextEncoder();
    let accumulatedContent = "";

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            // Handle potential errors in chunk processing
            if (chunk.error) {
              console.error("OpenAI stream error:", chunk.error);
              throw new Error(chunk.error.message || "OpenAI API error in stream");
            }

            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              accumulatedContent += content;
              controller.enqueue(encoder.encode(content));
            }
          }

          // Check if we got any content
          if (accumulatedContent.trim().length === 0) {
            console.warn("OpenAI stream completed but no content was received");
            // Still try to save an empty message or handle gracefully
          }

          // Save assistant message only if we have content
          if (currentChatId && accumulatedContent.trim().length > 0) {
            try {
              await db.insert(messagesTable).values({
                chatId: currentChatId,
                role: "assistant",
                content: accumulatedContent,
              });
            } catch (dbError) {
              console.error("Error saving assistant message to database:", dbError);
              // Don't fail the request if DB save fails
            }
          }

          // Cache the response in Pinecone (only if we have content)
          if (accumulatedContent.trim().length > 0) {
            try {
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
            } catch (cacheError) {
              console.error("Error caching response:", cacheError);
              // Don't fail the request if caching fails
            }
          }

          controller.close();
        } catch (error) {
          console.error("Error in stream processing:", error);
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          console.error("Stream error details:", {
            message: errorMessage,
            stack: error instanceof Error ? error.stack : undefined,
            accumulatedContent: accumulatedContent.substring(0, 100),
          });
          
          // Send error as JSON instead of text in stream
          // Close the stream and let the outer catch handle it
          try {
            controller.error(error);
          } catch (closeError) {
            console.error("Error closing stream:", closeError);
          }
          // Re-throw to be caught by outer try-catch
          throw error;
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorDetails = error instanceof Error ? error.stack : String(error);
    
    console.error("Full error details:", {
      message: errorMessage,
      details: errorDetails,
      name: error instanceof Error ? error.name : undefined,
    });
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to process request",
        message: errorMessage,
        details: process.env.NODE_ENV === "development" ? errorDetails : undefined
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

