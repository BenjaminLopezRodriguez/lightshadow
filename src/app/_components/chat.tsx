"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Bot, User, Paperclip, FileText, X, Brain, Reply, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { UploadButton } from "@/lib/uploadthing";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { ChainOfThought } from "./chain-of-thought";
import { MarkdownContent } from "./markdown-content";
import { GroupChatManager } from "./group-chat-manager";

interface Message {
  id?: number;
  role: "user" | "assistant";
  content: string;
  thoughts?: Array<{ id: number; thought: string; timestamp: number }>;
  replyToMessageId?: number | null;
  mentions?: string[];
}

interface ThoughtStage {
  id: number;
  thought: string;
  timestamp: number;
}

interface ReplyPreview {
  id: number;
  content: string;
  role: "user" | "assistant";
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingThoughts, setStreamingThoughts] = useState<ThoughtStage[]>([]);
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string; pdfDocumentId?: number } | null>(null);
  const [chatPdfRefs, setChatPdfRefs] = useState<Array<{ id: number; fileName: string }>>([]);
  const [chainOfThought, setChainOfThought] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyPreview | null>(null);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionPosition, setMentionPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const mentionListRef = useRef<HTMLDivElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const chatId = searchParams.get("chatId");
  const { isAuthenticated, user } = useKindeBrowserClient();

  const utils = api.useUtils();
  const { data: chatHistory, isLoading: isLoadingHistory } = api.chat.getById.useQuery(
    { id: parseInt(chatId || "0") },
    { enabled: !!chatId }
  );

  const { data: contacts } = api.contact.getAll.useQuery(undefined, {
    enabled: (isAuthenticated ?? false) && !!chatId,
  });


  const { data: pdfDocuments } = api.pdf.getAll.useQuery(undefined, {
    enabled: (isAuthenticated ?? false),
  });

  const { data: chatPdfs } = api.pdf.getByChatId.useQuery(
    { chatId: parseInt(chatId || "0") },
    { enabled: (!!chatId && (isAuthenticated ?? false)) }
  );

  // Get users available for mentions (contacts + group chat participants)
  const mentionableUsers = (() => {
    const users: Array<{ userId: string; username: string; uniqueId: string }> = [];
    
    if (contacts) {
      contacts.forEach(contact => {
        if (contact.profile) {
          users.push({
            userId: contact.contactId,
            username: contact.profile.username,
            uniqueId: contact.profile.uniqueId,
          });
        }
      });
    }

    if (chatHistory?.isGroupChat && chatHistory.participants) {
      chatHistory.participants.forEach(participant => {
        if (participant.userId !== user?.id && !users.find(u => u.userId === participant.userId)) {
          // We'd need to fetch profiles for participants, but for now we'll use contacts
          const contact = contacts?.find(c => c.contactId === participant.userId);
          if (contact?.profile) {
            users.push({
              userId: participant.userId,
              username: contact.profile.username,
              uniqueId: contact.profile.uniqueId,
            });
          }
        }
      });
    }

    return users;
  })();

  const filteredMentions = mentionQuery
    ? mentionableUsers.filter(u => 
        u.username.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        u.uniqueId.toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : mentionableUsers;

  useEffect(() => {
    if (chatPdfs) {
      setChatPdfRefs(chatPdfs.map(pdf => ({ id: pdf.id, fileName: pdf.fileName })));
    }
  }, [chatPdfs]);

  useEffect(() => {
    if (chatHistory) {
      setMessages(chatHistory.messages.map(m => ({ 
        id: m.id,
        role: m.role as "user" | "assistant", 
        content: m.content,
        replyToMessageId: (m as any).replyToMessageId,
        mentions: (m as any).mentions || [],
      })));
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

  // Handle mention input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    const cursorPos = e.target.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setMentionQuery(textAfterAt);
        setMentionPosition(lastAtIndex);
        setShowMentions(true);
        return;
      }
    }

    setShowMentions(false);
    setMentionQuery("");
  };

  const insertMention = (username: string, uniqueId: string) => {
    const beforeMention = input.substring(0, mentionPosition);
    const afterMention = input.substring(inputRef.current?.selectionStart || input.length);
    const newInput = `${beforeMention}@${username}${afterMention}`;
    setInput(newInput);
    setShowMentions(false);
    setMentionQuery("");
    
    setTimeout(() => {
      const newCursorPos = mentionPosition + username.length + 1;
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      inputRef.current?.focus();
    }, 0);
  };

  // Parse mentions from content
  const parseMentions = (content: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const matches = content.match(mentionRegex);
    if (!matches) return [];
    
    return matches.map(match => {
      const username = match.substring(1);
      const user = mentionableUsers.find(u => u.username === username || u.uniqueId === username);
      return user?.userId || "";
    }).filter(Boolean);
  };

  // Parse chain of thought reasoning from content
  const parseChainOfThought = (content: string): { thoughts: ThoughtStage[]; cleanContent: string } => {
    if (!chainOfThought) {
      return { thoughts: [], cleanContent: content };
    }

    const thoughts: ThoughtStage[] = [];
    let cleanContent = content;
    
    const explicitThoughtPattern = /🧠\s*thinking\s*:\s*([\s\S]*?)(?=🧠\s*thinking\s*:|$)/gi;
    let match;
    let thoughtId = 0;
    
    while ((match = explicitThoughtPattern.exec(content)) !== null) {
      const thoughtText = match[1].trim();
      if (thoughtText.length > 0) {
        thoughts.push({
          id: thoughtId++,
          thought: thoughtText,
          timestamp: Date.now() + thoughtId * 100,
        });
      }
    }

    if (thoughts.length > 0) {
      cleanContent = content.replace(/🧠\s*thinking\s*:\s*[\s\S]*?(?=🧠\s*thinking\s*:|$)/gi, "").trim();
    }

    if (thoughts.length === 0 && chainOfThought) {
      const reasoningPattern = /(Let me think through this[^\.]+\.|First, I need to consider[^\.]+\.|Based on this analysis[^\.]+\.)/gi;
      let reasoningMatch;
      while ((reasoningMatch = reasoningPattern.exec(content)) !== null) {
        const thoughtText = reasoningMatch[1].trim();
        if (thoughtText.length > 10) {
          thoughts.push({
            id: thoughtId++,
            thought: thoughtText,
            timestamp: Date.now() + thoughtId * 100,
          });
        }
      }
    }

    cleanContent = cleanContent
      .replace(/\n{3,}/g, "\n\n")
      .replace(/^\s+|\s+$/g, "")
      .trim();

    return { thoughts, cleanContent };
  };

  const handleSubmit = async (e?: React.FormEvent, value?: string) => {
    e?.preventDefault();
    const contentToSubmit = value || input;
    if (!contentToSubmit.trim() || isLoading) return;

    if (!isAuthenticated) {
      alert("Please sign in to chat");
      return;
    }

    const mentions = parseMentions(contentToSubmit);
    const userMessage: Message = { 
      role: "user", 
      content: contentToSubmit.trim(),
      replyToMessageId: replyTo?.id || null,
      mentions: mentions.length > 0 ? mentions : undefined,
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setReplyTo(null);
    setIsLoading(true);
    setStreamingContent("");
    setStreamingThoughts([]);
    setShowMentions(false);

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
          chainOfThought: chainOfThought,
          replyToMessageId: replyTo?.id,
          mentions: mentions.length > 0 ? mentions : undefined,
        }),
        signal: abortControllerRef.current.signal,
      });

      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Failed to get response");
      }

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
        } catch (e) {
          throw new Error(`Failed to get response: ${response.status} ${response.statusText}`);
        }
      }

      const newChatId = response.headers.get("X-Chat-Id");
      if (newChatId && !chatId) {
        router.push(`/?chatId=${newChatId}`);
        utils.chat.getAll.invalidate();
        utils.pdf.getByChatId.invalidate({ chatId: parseInt(newChatId) });
      } else if (chatId) {
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
            
            if (chainOfThought) {
              const parsed = parseChainOfThought(accumulatedContent);
              setStreamingThoughts(parsed.thoughts);
            }
          }
        } catch (streamError) {
          console.error("Error reading stream:", streamError);
          if (accumulatedContent.trim().length === 0) {
            throw streamError;
          }
        }
      }

      const parsed = parseChainOfThought(accumulatedContent);
      
      setMessages([...newMessages, { 
        role: "assistant", 
        content: parsed.cleanContent,
        thoughts: parsed.thoughts.length > 0 ? parsed.thoughts : undefined
      }]);
      setStreamingContent("");
      setStreamingThoughts([]);
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

  const getThoughtsForMessage = (index: number): ThoughtStage[] => {
    if (index === displayMessages.length - 1 && streamingContent && isLoading) {
      return streamingThoughts;
    }
    const message = messages[index];
    return message?.thoughts || [];
  };

  const getReplyPreview = (messageId: number | null | undefined): ReplyPreview | null => {
    if (!messageId) return null;
    const message = messages.find(m => m.id === messageId);
    if (!message) return null;
    return {
      id: message.id!,
      content: message.content.substring(0, 100) + (message.content.length > 100 ? "..." : ""),
      role: message.role,
    };
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

  const isGroupChat = chatHistory?.isGroupChat ?? false;
  const themeColor = chatHistory?.themeColor;
  const groupName = chatHistory?.groupName;

  // Render message content with mentions highlighted
  const renderMessageContent = (content: string, mentions?: string[]) => {
    if (!mentions || mentions.length === 0) {
      return content;
    }

    let rendered = content;
    mentionableUsers.forEach(user => {
      if (mentions.includes(user.userId)) {
        const regex = new RegExp(`@${user.username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, "g");
        rendered = rendered.replace(regex, `<span class="text-primary font-medium">@${user.username}</span>`);
      }
    });

    return rendered;
  };

  return (
    <div className="flex-1 flex flex-col h-full relative">
      {/* Group Chat Header */}
      {chatId && (
        <div className="border-b border-border bg-card/50 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isGroupChat && groupName && (
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: themeColor || "#6366f1" }}
                />
                <h2 className="text-sm font-medium text-foreground">{groupName}</h2>
              </div>
            )}
          </div>
          {chatId && (
            <GroupChatManager
              chatId={parseInt(chatId)}
              isGroupChat={isGroupChat}
              groupName={groupName || undefined}
              themeColor={themeColor || undefined}
              onUpdate={() => {
                utils.chat.getById.invalidate({ id: parseInt(chatId) });
              }}
            />
          )}
        </div>
      )}

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-40"
        style={
          isGroupChat && themeColor
            ? {
                  borderLeft: `3px solid ${themeColor}`,
                  paddingLeft: "calc(1rem + 3px)",
                }
            : undefined
        }
      >
        {displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center px-4">
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto shadow-lg">
                <Sparkles className="w-7 h-7 text-primary-foreground" />
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-semibold text-foreground tracking-tight">How can I help you today?</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
              {suggestedPrompts.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSubmit(undefined, item.prompt)}
                  className="text-left p-4 rounded-lg bg-card border border-border hover:bg-accent transition-colors group"
                >
                  <h3 className="font-medium text-foreground mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.prompt}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-3xl mx-auto space-y-6">
            {displayMessages.map((message, index) => {
              const thoughts = getThoughtsForMessage(index);
              const isStreaming = index === displayMessages.length - 1 && streamingContent && isLoading;
              const parsedContent = chainOfThought && message.role === "assistant" 
                ? parseChainOfThought(message.content).cleanContent 
                : message.content;
              const replyPreview = getReplyPreview(message.replyToMessageId);

              return (
                <div key={index} className="w-full group">
                  <div
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                        <Bot className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}

                    <div className="flex-1 max-w-[85%] flex flex-col gap-1.5">
                      {/* Reply Preview */}
                      {replyPreview && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1 px-3 py-1.5 bg-muted/50 rounded-md border-l-2 border-primary">
                          <Reply className="w-3 h-3" />
                          <span className="font-medium">{replyPreview.role === "user" ? "You" : "Assistant"}</span>
                          <span className="truncate">{replyPreview.content}</span>
                        </div>
                      )}

                      {/* Chain of Thought */}
                      {message.role === "assistant" && (thoughts.length > 0 || (isStreaming && chainOfThought)) && (
                        <div className="mb-1">
                          <ChainOfThought 
                            thoughts={thoughts} 
                            isStreaming={isStreaming && chainOfThought}
                          />
                        </div>
                      )}

                      <div
                        className={cn(
                          "rounded-lg px-4 py-3 shadow-sm relative",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border"
                        )}
                      >
                        {message.role === "assistant" ? (
                          <div className="text-sm">
                            <MarkdownContent content={parsedContent} />
                            {isStreaming && (
                              <span className="inline-block w-1 h-4 ml-1 bg-current animate-pulse" />
                            )}
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {message.mentions && message.mentions.length > 0 ? (
                              <span dangerouslySetInnerHTML={{ __html: renderMessageContent(parsedContent, message.mentions) }} />
                            ) : (
                              parsedContent
                            )}
                          </p>
                        )}
                      </div>

                      {/* Reply button */}
                      {message.role === "assistant" && (
                        <button
                          onClick={() => {
                            setReplyTo({
                              id: message.id || index,
                              content: message.content.substring(0, 100),
                              role: message.role,
                            });
                            inputRef.current?.focus();
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 w-fit px-2 py-1 rounded hover:bg-muted"
                        >
                          <Reply className="w-3 h-3" />
                          Reply
                        </button>
                      )}
                    </div>

                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="w-full max-w-3xl mx-auto space-y-3">
          {/* Reply Preview */}
          {replyTo && (
            <div className="flex items-center justify-between px-3 py-2 bg-muted rounded-lg text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Reply className="w-3 h-3" />
                <span>Replying to:</span>
                <span className="font-medium text-foreground">{replyTo.content}</span>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* PDF references */}
          {chatPdfRefs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {chatPdfRefs.map((pdf) => (
                <div
                  key={pdf.id}
                  className="flex items-center gap-2 px-2 py-1 bg-primary/10 border border-primary/20 rounded-md"
                >
                  <FileText className="w-3 h-3 text-primary" />
                  <span className="text-xs text-primary">{pdf.fileName}</span>
                </div>
              ))}
            </div>
          )}

          {attachedFile && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg w-fit">
              <FileText className="w-4 h-4 text-foreground" />
              <span className="text-sm text-foreground">{attachedFile.name}</span>
              <button onClick={() => setAttachedFile(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mention dropdown */}
          {showMentions && filteredMentions.length > 0 && (
            <div
              ref={mentionListRef}
              className="absolute bottom-full left-4 right-4 mb-2 max-h-48 overflow-y-auto bg-popover border border-border rounded-lg shadow-lg z-50"
            >
              {filteredMentions.map((user) => (
                <button
                  key={user.userId}
                  onClick={() => insertMention(user.username, user.uniqueId)}
                  className="w-full text-left px-4 py-2 hover:bg-accent flex items-center gap-2 text-sm"
                >
                  <AtSign className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-foreground">{user.username}</div>
                    <div className="text-xs text-muted-foreground">{user.uniqueId}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e)} className="relative">
            <div className="flex items-center bg-card border border-border rounded-lg shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:border-ring transition-all">
              <div className="pl-2">
                <UploadButton
                  endpoint="pdfUploader"
                  onClientUploadComplete={(res) => {
                    if (res && res[0]) {
                      const file = res[0];
                      const serverData = (file as any).serverData || {};
                      const pdfDocumentId = serverData.pdfDocumentId || (file as any).pdfDocumentId;
                      
                      setAttachedFile({
                        url: file.url,
                        name: file.name,
                        pdfDocumentId: pdfDocumentId,
                      });
                      
                      utils.pdf.getAll.invalidate();
                    }
                  }}
                  onUploadError={(error: Error) => {
                    alert(`ERROR! ${error.message}`);
                  }}
                  appearance={{
                    button: "bg-transparent text-muted-foreground hover:text-foreground w-9 h-9 rounded-md p-0",
                    allowedContent: "hidden",
                  }}
                  content={{
                    button: <Paperclip className="w-4 h-4" />
                  }}
                />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (showMentions && e.key === "Escape") {
                    setShowMentions(false);
                  }
                  if (showMentions && e.key === "ArrowDown") {
                    e.preventDefault();
                    mentionListRef.current?.querySelector("button")?.focus();
                  }
                }}
                placeholder={attachedFile ? "Ask a question about this PDF..." : "Message..."}
                disabled={isLoading}
                className="flex-1 bg-transparent border-none px-3 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="pr-2">
                <Button
                  type="submit"
                  size="icon"
                  className="w-9 h-9 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </form>

          {/* Chain of Thought Toggle */}
          <div className="flex justify-center items-center">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-xs font-medium">
              <Brain className="w-3 h-3" />
              <span>Chain of Thought</span>
              <Switch
                checked={chainOfThought}
                onCheckedChange={setChainOfThought}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
