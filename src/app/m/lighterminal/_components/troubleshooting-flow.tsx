"use client";

import { useState, useRef, useEffect } from "react";
import { PageHeader } from "./page-header";
import { StepCard } from "./step-card";
import { IllustrationCard } from "./illustration-card";
import { AIGuidanceCard } from "./ai-guidance-card";
import { ProblemCard } from "./problem-card";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

  // Dynamic illustrations based on problem
  const getIllustrations = () => {
    if (problem.title.toLowerCase().includes("printer")) {
      return [
        {
          illustration: (
            <div className="text-center space-y-2">
              <div className="text-5xl">🖨️</div>
              <div className="text-xs text-muted-foreground font-medium">Printer</div>
            </div>
          ),
          labels: [
            { id: "1", number: 1, text: "Top cover" },
            { id: "2", number: 2, text: "Paper exit" },
          ],
        },
        {
          illustration: (
            <div className="text-center space-y-2">
              <div className="text-5xl">🖨️</div>
              <div className="text-xs text-muted-foreground font-medium">Printer Open</div>
            </div>
          ),
          labels: [
            { id: "3", number: 3, text: "Open top cover" },
          ],
        },
      ];
    }
    // Default illustrations
    return [
      {
        illustration: (
          <div className="text-center space-y-2">
            <div className="text-5xl">🔧</div>
            <div className="text-xs text-muted-foreground font-medium">Equipment</div>
          </div>
        ),
        labels: [
          { id: "1", number: 1, text: "Component A" },
          { id: "2", number: 2, text: "Component B" },
        ],
      },
    ];
  };

  const illustrations = getIllustrations();

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-73px)] bg-background">
      <PageHeader
        title={`→ ${problem.title}`}
        showBack
        onBack={onBack}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <div className="space-y-8 md:space-y-10">
            {/* Video/Animation Placeholder */}
            <Card className="aspect-video bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border-border/50 flex items-center justify-center overflow-hidden">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">Video/Animation Placeholder</p>
              </div>
            </Card>

            {/* Illustrations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {illustrations.map((ill, index) => (
                <IllustrationCard
                  key={index}
                  illustration={ill.illustration}
                  labels={ill.labels}
                />
              ))}
            </div>

            {/* AI Guidance */}
            <AIGuidanceCard content={aiResponse} isLoading={isLoading} />

            {/* Step Question */}
            <StepCard
              question="Have you unclogged the jam?"
              onConfirm={handleConfirm}
              isLoading={isLoading}
            />

            {/* Additional Input */}
            {showMore && (
              <Card className="p-6 border-border/50">
                <Input
                  placeholder="Add notes or additional information..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="w-full"
                />
              </Card>
            )}

            {/* More Section */}
            <div className="space-y-4 pt-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                More
              </h3>
              <div className="space-y-3">
                {relatedProblems.map((relatedProblem) => (
                  <ProblemCard
                    key={relatedProblem.id}
                    title={relatedProblem.title}
                    onClick={() => {
                      // Could navigate to this problem
                      console.log("Navigate to:", relatedProblem);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border/50 px-4 md:px-8 py-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm text-muted-foreground text-center font-medium tracking-wide">
            solve next problem
          </p>
        </div>
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
}
