"use client";

import { RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function PageHeader({ 
  title, 
  showBack = false, 
  onBack, 
  onRefresh, 
  isRefreshing = false 
}: PageHeaderProps) {
  return (
    <div className="sticky top-[73px] z-10 border-b border-border/50 bg-background/95 backdrop-blur-xl px-4 md:px-8 py-5 md:py-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-4">
          {showBack && onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-lg h-9 w-9 hover:bg-accent transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
          <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">
            {title}
          </h1>
        </div>
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="rounded-lg h-9 w-9 hover:bg-accent"
          >
            <RefreshCw
              className={cn(
                "w-4 h-4 text-muted-foreground",
                isRefreshing && "animate-spin"
              )}
            />
          </Button>
        )}
      </div>
    </div>
  );
}

