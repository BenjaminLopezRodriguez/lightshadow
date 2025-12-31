"use client";

import { useState } from "react";
import { RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Problem {
  id: string;
  title: string;
  description?: string;
}

interface WelcomeScreenProps {
  userName: string;
  onProblemSelect: (problem: Problem) => void;
}

const defaultProblems: Problem[] = [
  { id: "1", title: "Fixing office printer" },
  { id: "2", title: "Unclogging toilet" },
  { id: "3", title: "Fixing bread proofer machine" },
];

export function LightTerminalWelcome({ userName, onProblemSelect }: WelcomeScreenProps) {
  const [problems, setProblems] = useState<Problem[]>(defaultProblems);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // In the future, this could fetch problems from an API
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-73px)] bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm px-4 md:px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-serif font-semibold text-foreground">
          Welcome back {userName}
        </h1>
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
        <div className="max-w-2xl mx-auto space-y-4">
          {problems.map((problem) => (
            <Card
              key={problem.id}
              className="p-4 cursor-pointer hover:bg-accent transition-colors group"
              onClick={() => onProblemSelect(problem)}
            >
              <div className="flex items-center justify-between">
                <span className="text-foreground font-medium group-hover:text-primary transition-colors">
                  {problem.title}
                </span>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 md:px-6 py-4 text-center">
        <p className="text-sm text-muted-foreground">solve next problem</p>
      </div>
    </div>
  );
}

