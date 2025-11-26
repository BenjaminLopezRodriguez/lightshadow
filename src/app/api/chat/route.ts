import { OpenAI } from "openai";
import { env } from "@/env";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/server/db";
import { chats, messages as messagesTable } from "@/server/db/schema";
import { eq } from "drizzle-orm";

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

    const { messages, chatId, fileUrl } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Messages array is required", { status: 400 });
    }

    let currentChatId = chatId;

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

    // If fileUrl is present, use PDF.ai
    if (fileUrl) {
      // For PDF.ai, we'll just do a single turn for now as it's a RAG endpoint usually
      // Or we can use OpenAI but with context.
      // Let's use OpenAI but fetch context from PDF.ai if possible, OR just use PDF.ai's chat endpoint.
      // PDF.ai has a chat endpoint: https://docs.pdf.ai/api-reference/chat

      const pdfAiResponse = await fetch("https://api.pdf.ai/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": env.PDFAI_API_KEY,
        },
        body: JSON.stringify({
          fileId: fileUrl, // Assuming fileUrl is actually fileId or we need to upload first? 
          // Wait, UploadThing gives a URL. PDF.ai needs a fileId.
          // We might need to upload to PDF.ai via URL first?
          // For now, let's assume the user uploads to PDF.ai directly or we upload via URL.
          // Actually, let's stick to the plan: "Integrate PDF.ai API".
          // If we use UploadThing, we get a URL. We can pass that URL to PDF.ai to "upload by URL".
          // But that might be slow.
          // Let's assume for this step we just use OpenAI for normal chat and I'll fix the PDF part in a sec.
          // Actually, let's just use OpenAI for everything for now to get persistence working, 
          // and I'll handle the PDF logic in a dedicated block below.
          question: lastMessage.content,
          history: messages.slice(0, -1).map((m: any) => ({ role: m.role, content: m.content })),
        }),
      });

      // If we were using PDF.ai, we would stream the response.
      // But PDF.ai might not support streaming easily in this proxy setup without more work.
      // Let's fallback to OpenAI for now and I'll add the PDF logic properly in the next step when I verify the PDF.ai API details.
      // Reverting to OpenAI for this step to ensure persistence works first.
    }

    stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
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

