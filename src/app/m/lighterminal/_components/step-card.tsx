"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StepCardProps {
  question: string;
  onConfirm: () => void;
  isLoading?: boolean;
  className?: string;
}

export function StepCard({ question, onConfirm, isLoading, className }: StepCardProps) {
  return (
    <Card className={cn("p-6 border-border/50", className)}>
      <h3 className="text-lg font-semibold text-foreground mb-6">
        {question}
      </h3>
      <button
        onClick={onConfirm}
        disabled={isLoading}
        className={cn(
          "w-full md:w-auto px-8 py-3.5 rounded-lg",
          "bg-primary text-primary-foreground font-medium text-sm",
          "hover:bg-primary/90 active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-all duration-200 ease-out",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "shadow-sm hover:shadow-md hover:shadow-primary/20"
        )}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          "CONFIRM →"
        )}
      </button>
    </Card>
  );
}

