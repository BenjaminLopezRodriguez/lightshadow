"use client";

import { useState, useRef, useEffect } from "react";
import { Send, ChevronDown, Sparkles, Bot, User, Paperclip, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { UploadButton } from "@/lib/uploadthing";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string; pdfDocumentId?: number } | null>(null);
  const [chatPdfRefs, setChatPdfRefs] = useState<Array<{ id: number; fileName: string }>>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const chatId = searchParams.get("chatId");
  const { isAuthenticated } = useKindeBrowserClient();

  const utils = api.useUtils();
  const { data: chatHistory, isLoading: isLoadingHistory } = api.chat.getById.useQuery(
    { id: parseInt(chatId || "0") },
    { enabled: !!chatId }
  );

  const { data: pdfDocuments } = api.pdf.getAll.useQuery(undefined, {
    enabled: (isAuthenticated ?? false),
  });

  const { data: chatPdfs } = api.pdf.getByChatId.useQuery(
    { chatId: parseInt(chatId || "0") },
    { enabled: (!!chatId && (isAuthenticated ?? false)) }
  );

  useEffect(() => {
    if (chatPdfs) {
      setChatPdfRefs(chatPdfs.map(pdf => ({ id: pdf.id, fileName: pdf.fileName })));
    }
  }, [chatPdfs]);

  useEffect(() => {
    if (chatHistory) {
      setMessages(chatHistory.messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })));
    } else if (!chatId) {
      setMessages([]);
    }
  }, [chatHistory, chatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleSubmit = async (e?: React.FormEvent, value?: string) => {
    e?.preventDefault();
    const contentToSubmit = value || input;
    if (!contentToSubmit.trim() || isLoading) return;

    if (!isAuthenticated) {
      alert("Please sign in to chat");
      return;
    }

    const userMessage: Message = { role: "user", content: contentToSubmit.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          chatId: chatId ? parseInt(chatId) : undefined,
          fileUrl: attachedFile?.url,
          pdfDocumentId: attachedFile?.pdfDocumentId,
        }),
        signal: abortControllerRef.current.signal,
      });

      // Check if response is JSON error
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Failed to get response");
      }

      if (!response.ok) {
        // Try to get error message from response
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
        } catch (e) {
          // If not JSON, use status text
          throw new Error(`Failed to get response: ${response.status} ${response.statusText}`);
        }
      }

      const newChatId = response.headers.get("X-Chat-Id");
      if (newChatId && !chatId) {
        router.push(`/?chatId=${newChatId}`);
        utils.chat.getAll.invalidate();
        utils.pdf.getByChatId.invalidate({ chatId: parseInt(newChatId) });
      } else if (chatId) {
        // Invalidate PDF references for this chat
        utils.pdf.getByChatId.invalidate({ chatId: parseInt(chatId) });
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            accumulatedContent += chunk;
            setStreamingContent(accumulatedContent);
          }
        } catch (streamError) {
          console.error("Error reading stream:", streamError);
          // If we have some content, use it; otherwise throw error
          if (accumulatedContent.trim().length === 0) {
            throw streamError;
          }
        }
      }

      // Add completed message to messages array
      setMessages([...newMessages, { role: "assistant", content: accumulatedContent }]);
      setStreamingContent("");
      // Don't clear attached file - keep it so PDF context persists in the chat
      // setAttachedFile(null); // Clear attached file after sending
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Request aborted");
      } else {
        console.error("Chat error:", error);
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
          },
        ]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const displayMessages = [
    ...messages,
    ...(streamingContent ? [{ role: "assistant" as const, content: streamingContent }] : []),
  ];

  const suggestedPrompts = [
    { title: "Creative Writing", prompt: "Write a short story about a time traveler who gets stuck in 2024." },
    { title: "Code Helper", prompt: "Explain how React Server Components work in Next.js 15." },
    { title: "Analysis", prompt: "Analyze the current trends in renewable energy adoption." },
    { title: "Brainstorming", prompt: "Give me 5 unique ideas for a mobile app using AI." },
  ];

  return (
    <div className="flex-1 flex flex-col h-full relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 pb-40">
        {displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center px-4">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/20">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl font-serif text-white tracking-tight">How can I help you today?</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
              {suggestedPrompts.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSubmit(undefined, item.prompt)}
                  className="text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 group"
                >
                  <h3 className="font-medium text-white mb-1 group-hover:text-indigo-300 transition-colors">{item.title}</h3>
                  <p className="text-sm text-white/60 line-clamp-2">{item.prompt}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-3xl mx-auto space-y-8">
            {displayMessages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-indigo-500/20">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-6 py-4 shadow-sm",
                    message.role === "user"
                      ? "bg-white text-black ml-12"
                      : "bg-transparent text-white/90 border border-white/5"
                  )}
                >
                  <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                    {message.content}
                    {index === displayMessages.length - 1 &&
                      streamingContent &&
                      isLoading && (
                        <span className="inline-block w-1.5 h-4 ml-1 bg-current animate-pulse" />
                      )}
                  </p>
                </div>

                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className="w-full max-w-3xl mx-auto space-y-4">
          {/* Show PDF references for this chat */}
          {chatPdfRefs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {chatPdfRefs.map((pdf) => (
                <div
                  key={pdf.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-lg"
                >
                  <FileText className="w-3 h-3 text-indigo-300" />
                  <span className="text-xs text-indigo-200">{pdf.fileName}</span>
                </div>
              ))}
            </div>
          )}

          {attachedFile && (
            <div className="flex items-center gap-2 p-2 bg-white/10 rounded-lg w-fit">
              <FileText className="w-4 h-4 text-white" />
              <span className="text-sm text-white">{attachedFile.name}</span>
              <button onClick={() => setAttachedFile(null)} className="text-white/60 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e)} className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden ring-1 ring-white/5 focus-within:ring-white/20 transition-all">
              <div className="pl-2">
                <UploadButton
                  endpoint="pdfUploader"
                  onClientUploadComplete={(res) => {
                    if (res && res[0]) {
                      // UploadThing wraps the return value from onUploadComplete
                      const file = res[0];
                      // The pdfDocumentId might be in the serverData or directly accessible
                      const serverData = (file as any).serverData || {};
                      const pdfDocumentId = serverData.pdfDocumentId || (file as any).pdfDocumentId;
                      
                      console.log("PDF upload complete:", { file, pdfDocumentId });
                      
                      setAttachedFile({
                        url: file.url,
                        name: file.name,
                        pdfDocumentId: pdfDocumentId,
                      });
                      
                      // Invalidate PDF queries to refresh the list
                      utils.pdf.getAll.invalidate();
                    }
                  }}
                  onUploadError={(error: Error) => {
                    alert(`ERROR! ${error.message}`);
                  }}
                  appearance={{
                    button: "bg-transparent text-white/40 hover:text-white w-10 h-10 rounded-xl p-0",
                    allowedContent: "hidden",
                  }}
                  content={{
                    button: <Paperclip className="w-4 h-4" />
                  }}
                />
              </div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={attachedFile ? "Ask a question about this PDF..." : "Message Lumi..."}
                disabled={isLoading}
                className="flex-1 bg-transparent border-none px-4 py-4 text-white placeholder:text-white/40 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="pr-2">
                <Button
                  type="submit"
                  size="icon"
                  className="w-10 h-10 rounded-xl bg-white text-black hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40 transition-all"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </form>

          {/* Model Selector */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs font-medium text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors cursor-pointer">
              <span>Lumi 1.0 (GPT-4o)</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

