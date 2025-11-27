"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Brain } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface ThoughtStage {
  id: number;
  thought: string;
  timestamp: number;
}

interface ChainOfThoughtProps {
  thoughts: ThoughtStage[];
  isStreaming?: boolean;
}

export function ChainOfThought({ thoughts, isStreaming = false }: ChainOfThoughtProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [displayedThoughts, setDisplayedThoughts] = useState<ThoughtStage[]>([]);
  const [fadeState, setFadeState] = useState<"in" | "out">("in");

  useEffect(() => {
    if (thoughts.length > 0) {
      // Auto-open when new thoughts arrive
      setIsOpen(true);
      // Set selected step to the latest thought
      setSelectedStep(thoughts.length - 1);
      // Animate thoughts appearing one by one
      setDisplayedThoughts(thoughts);
    }
  }, [thoughts]);

  useEffect(() => {
    if (selectedStep !== null && displayedThoughts.length > 0) {
      // Fade out, then fade in with new content
      setFadeState("out");
      const timer = setTimeout(() => {
        setFadeState("in");
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [selectedStep, displayedThoughts.length]);

  if (thoughts.length === 0 && !isStreaming) {
    return null;
  }

  const selectedThought = selectedStep !== null ? displayedThoughts[selectedStep] : null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-white/5 transition-colors group">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Brain className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
            Reasoning Process
          </span>
          {thoughts.length > 0 && (
            <span className="text-xs text-white/40 px-1.5 py-0.5 rounded-full bg-white/5">
              {thoughts.length} {thoughts.length === 1 ? "stage" : "stages"}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-white/40 transition-transform duration-200",
            isOpen && "transform rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down transition-all duration-200">
        <div className="mt-2 pl-7">
          {/* Step Selector Dropdown */}
          {displayedThoughts.length > 0 && (
            <div className="mb-3">
              <select
                value={selectedStep ?? ""}
                onChange={(e) => setSelectedStep(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              >
                {displayedThoughts.map((_, index) => (
                  <option key={index} value={index} className="bg-black text-white">
                    Stage {index + 1}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Display Selected Thought with Fade Animation */}
          {selectedThought && (
            <div
              className={cn(
                "transition-opacity duration-300",
                fadeState === "in" ? "opacity-100" : "opacity-0"
              )}
            >
              <div className="flex gap-3 items-start">
                <div className="flex flex-col items-center mt-1">
                  <div className="w-2 h-2 rounded-full bg-indigo-500/60 flex-shrink-0 animate-pulse" />
                </div>
                <div className="flex-1 pb-3">
                  <div className="text-xs font-medium text-indigo-300/80 mb-1">
                    Stage {selectedStep! + 1} of {displayedThoughts.length}
                  </div>
                  <div className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap break-words">
                    🧠 thinking: {selectedThought.thought}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Streaming Indicator */}
          {isStreaming && (
            <div className="flex gap-3 items-start animate-pulse">
              <div className="flex flex-col items-center mt-1">
                <div className="w-2 h-2 rounded-full bg-indigo-500/40 flex-shrink-0" />
              </div>
              <div className="flex-1 pb-3">
                <div className="text-xs font-medium text-indigo-300/60 mb-1">
                  Processing...
                </div>
                <div className="text-sm text-white/50 leading-relaxed">
                  <span className="inline-block w-1.5 h-4 bg-current animate-pulse" />
                </div>
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
