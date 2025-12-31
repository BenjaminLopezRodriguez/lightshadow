"use client";

import { useState } from "react";
import { PageHeader } from "./page-header";
import { ProblemCard } from "./problem-card";

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
  { 
    id: "1", 
    title: "Fixing office printer",
    description: "Resolve paper jams and connectivity issues"
  },
  { 
    id: "2", 
    title: "Unclogging toilet",
    description: "Step-by-step plumbing troubleshooting"
  },
  { 
    id: "3", 
    title: "Fixing bread proofer machine",
    description: "Temperature and timing adjustments"
  },
];

export function LightTerminalWelcome({ userName, onProblemSelect }: WelcomeScreenProps) {
  const [problems] = useState<Problem[]>(defaultProblems);
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
      <PageHeader
        title={`Welcome back ${userName}`}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-16">
          <div className="space-y-4">
            {problems.map((problem, index) => (
              <div
                key={problem.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ProblemCard
                  title={problem.title}
                  description={problem.description}
                  onClick={() => onProblemSelect(problem)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border/50 px-4 md:px-8 py-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-muted-foreground text-center font-medium tracking-wide">
            solve next problem
          </p>
        </div>
      </div>
    </div>
  );
}
