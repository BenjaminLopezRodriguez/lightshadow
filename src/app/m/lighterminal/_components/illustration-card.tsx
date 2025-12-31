"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Label {
  id: string;
  number: number;
  text: string;
}

interface IllustrationCardProps {
  illustration: React.ReactNode;
  labels: Label[];
  className?: string;
}

export function IllustrationCard({ illustration, labels, className }: IllustrationCardProps) {
  return (
    <Card className={cn("p-6 border-border/50 transition-all duration-300 hover:shadow-md", className)}>
      <div className="space-y-6">
        <div className="aspect-square bg-gradient-to-br from-muted/40 to-muted/20 rounded-lg flex items-center justify-center border border-border/30 transition-all duration-300 hover:border-border/50">
          {illustration}
        </div>
        <div className="space-y-3">
          {labels.map((label) => (
            <div key={label.id} className="flex items-center gap-3 group/label">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-transform duration-200 group-hover/label:scale-110">
                {label.number}
              </span>
              <span className="text-sm text-foreground">{label.text}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

