import { Suspense } from "react";
import { ArrowLeft, Menu } from "lucide-react";

import { HydrateClient } from "@/trpc/server";
import { Button } from "@/components/ui/button";
import { LottieLogo } from "./_components/lottie-logo";
import { Chat } from "./_components/chat";
import { Sidebar } from "./_components/sidebar";

export default async function Home() {
  return (
    <HydrateClient>
      <main className="min-h-screen flex flex-col bg-transparent">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="w-9 h-9 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 text-white" />
              </Button>
              <LottieLogo />
              <h1 className="text-xl font-serif text-white tracking-tight">LightShadow</h1>
            </div>
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 lg:hidden">
              <Menu className="w-4 h-4 text-white" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex pt-[73px]">
          {/* Left Sidebar */}
          <div className="hidden lg:block h-[calc(100vh-73px)] sticky top-[73px]">
            <Sidebar />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <Suspense fallback={<div className="flex-1 flex items-center justify-center text-white/60">Loading...</div>}>
              <Chat />
            </Suspense>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
