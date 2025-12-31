"use client";

import { useState } from "react";
import { Toolbar } from "@/app/_components/toolbar";
import { LightTerminalWelcome } from "./welcome-screen";
import { LightTerminalFlow } from "./troubleshooting-flow";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

type Screen = "welcome" | "troubleshooting";

interface Problem {
  id: string;
  title: string;
  description?: string;
}

export function LightTerminalApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome");
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const { user } = useKindeBrowserClient();

  const handleProblemSelect = (problem: Problem) => {
    setSelectedProblem(problem);
    setCurrentScreen("troubleshooting");
  };

  const handleBack = () => {
    setCurrentScreen("welcome");
    setSelectedProblem(null);
  };

  return (
    <>
      <Toolbar />
      <div className="flex-1 flex pt-[73px]">
        <div className="flex-1 flex flex-col min-w-0">
          {currentScreen === "welcome" ? (
            <LightTerminalWelcome
              userName={user?.given_name || "User"}
              onProblemSelect={handleProblemSelect}
            />
          ) : (
            <LightTerminalFlow
              problem={selectedProblem!}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </>
  );
}

