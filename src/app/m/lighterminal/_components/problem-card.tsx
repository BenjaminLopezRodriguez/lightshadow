"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProblemCardProps {
  title: string;
  description?: string;
  onClick: () => void;
  className?: string;
}

export function ProblemCard({ title, description, onClick, className }: ProblemCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-full text-left p-6 rounded-xl",
        "bg-card border border-border/50",
        "hover:border-border hover:shadow-lg hover:shadow-black/5",
        "dark:hover:shadow-black/20 dark:hover:border-border/80",
        "transition-all duration-300 ease-out",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "active:scale-[0.99]",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-foreground group-hover:text-primary transition-colors duration-200">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
        </div>
        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 ml-4" />
      </div>
    </button>
  );
}

