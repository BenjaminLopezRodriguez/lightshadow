"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "@/app/_components/markdown-content";

interface AIGuidanceCardProps {
  content: string;
  isLoading?: boolean;
  className?: string;
}

export function AIGuidanceCard({ content, isLoading, className }: AIGuidanceCardProps) {
  if (!content && !isLoading) return null;

  return (
    <Card className={cn("p-6 md:p-8 border-border/50 bg-card/50 backdrop-blur-sm", className)}>
      <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:text-foreground/90 prose-strong:text-foreground prose-p:leading-relaxed prose-ul:my-4 prose-li:my-2">
        <MarkdownContent content={content} />
        {isLoading && (
          <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
        )}
      </div>
    </Card>
  );
}

