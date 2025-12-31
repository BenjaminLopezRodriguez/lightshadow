"use client";

import { useState, useRef, useEffect } from "react";
import { RefreshCw, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

interface Problem {
  id: string;
  title: string;
  description?: string;
}

interface TroubleshootingFlowProps {
  problem: Problem;
  onBack: () => void;
}

interface Step {
  id: string;
  question: string;
  instructions?: string;
  illustrations?: Array<{
    id: string;
    label: string;
    description: string;
  }>;
}

export function LightTerminalFlow({ problem, onBack }: TroubleshootingFlowProps) {
  const { isAuthenticated } = useKindeBrowserClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize AI guidance when component mounts
  useEffect(() => {
    if (problem && isAuthenticated) {
      fetchAIGuidance();
    }
  }, [problem, isAuthenticated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiResponse]);

  const fetchAIGuidance = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    const initialMessage = `I need help troubleshooting: ${problem.title}. Please provide step-by-step guidance with clear instructions. Format your response with numbered steps and questions I should answer.`;
    
    try {
      const messages = conversationHistory.length > 0 
        ? [...conversationHistory, { role: "user" as const, content: initialMessage }]
        : [{ role: "user" as const, content: initialMessage }];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;
          setAiResponse(accumulatedContent);
        }
      }

      // Update conversation history only if we have history, otherwise initialize it
      if (conversationHistory.length > 0) {
        setConversationHistory([
          ...conversationHistory,
          { role: "user", content: initialMessage },
          { role: "assistant", content: accumulatedContent }
        ]);
      } else {
        setConversationHistory([
          { role: "user", content: initialMessage },
          { role: "assistant", content: accumulatedContent }
        ]);
      }
    } catch (error) {
      console.error("Error fetching AI guidance:", error);
      setAiResponse("Sorry, I encountered an error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!isAuthenticated) {
      alert("Please sign in to continue");
      return;
    }

    setIsLoading(true);
    const confirmMessage = `I'm working on: ${problem.title}. I've completed the current step: "Have you unclogged the jam?" - Yes, I have completed this step. What's next?`;
    
    try {
      const messages = [
        ...conversationHistory,
        { role: "user" as const, content: confirmMessage }
      ];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;
          setAiResponse(accumulatedContent);
        }
      }

      // Update conversation history
      setConversationHistory([
        ...messages,
        { role: "assistant", content: accumulatedContent }
      ]);
      
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error("Error confirming step:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAIGuidance();
    setIsRefreshing(false);
  };

  const relatedProblems = [
    { id: "4", title: "Help fixing firewall security policy" },
    { id: "5", title: "Help fixing installation security policy" },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-73px)] bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Button>
          <h1 className="text-xl md:text-2xl font-serif font-semibold text-foreground">
            → {problem.title}
          </h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="rounded-lg"
        >
          <RefreshCw
            className={cn(
              "w-5 h-5 text-muted-foreground",
              isRefreshing && "animate-spin"
            )}
          />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Video/Animation Placeholder */}
          <Card className="aspect-video bg-black rounded-xl flex items-center justify-center">
            <div className="text-muted-foreground text-sm">
              Video/Animation Placeholder
            </div>
          </Card>

          {/* Illustrations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="text-4xl">🖨️</div>
                    <div className="text-xs text-muted-foreground">Printer Illustration</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                      1
                    </span>
                    <span className="text-sm text-foreground">Top cover</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                      2
                    </span>
                    <span className="text-sm text-foreground">Paper exit</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-4">
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="text-4xl">🖨️</div>
                    <div className="text-xs text-muted-foreground">Printer Open</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                      3
                    </span>
                    <span className="text-sm text-foreground">Open top cover</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* AI Guidance */}
          {aiResponse && (
            <Card className="p-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap text-foreground">
                  {aiResponse}
                  {isLoading && (
                    <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Question */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Have you unclogged the jam?
            </h3>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-3 font-medium"
            >
              CONFIRM →
            </Button>
          </Card>

          {/* Additional Input */}
          {showMore && (
            <Card className="p-6">
              <Input
                placeholder="Add notes or additional information..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="w-full"
              />
            </Card>
          )}

          {/* More Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              More
            </h3>
            {relatedProblems.map((relatedProblem) => (
              <Card
                key={relatedProblem.id}
                className="p-4 cursor-pointer hover:bg-accent transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium group-hover:text-primary transition-colors">
                    → {relatedProblem.title}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 md:px-6 py-4 text-center">
        <p className="text-sm text-muted-foreground">solve next problem</p>
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
}

