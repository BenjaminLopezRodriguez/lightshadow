import { ArrowLeft, Send, ChevronDown, Menu } from "lucide-react";

import { HydrateClient } from "@/trpc/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LottieLogo } from "./_components/lottie-logo";

export default async function Home() {
  return (
    <HydrateClient>
      <main className="bg-[#0a0a0a] min-h-screen flex flex-col">
        {/* Header */}
        <header className="border-b border-white/5 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="w-9 h-9 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 text-white" />
              </Button>
              <LottieLogo/>
              <h1 className="text-xl font-serif text-white">LightShadow</h1>
            </div>
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 lg:hidden">
              <Menu className="w-4 h-4 text-white" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Left Sidebar */}
          <aside className="hidden lg:block w-80 border-r border-white/5 p-6 space-y-4 overflow-y-auto">
            <Card className="bg-white/5 border border-white/10 rounded-xl h-64">
              <CardContent className="p-6 h-full flex items-center justify-center">
                <div className="text-white/40 text-sm">Card placeholder</div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border border-white/10 rounded-xl h-64">
              <CardContent className="p-6 h-full flex items-center justify-center">
                <div className="text-white/40 text-sm">Card placeholder</div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="w-full max-w-2xl space-y-6">
                <h2 className="text-3xl font-serif text-white">Lumi</h2>
                
                {/* Input Field */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Plan a day out in los Angelos"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 text-white hover:bg-white/10"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {/* Model Selector */}
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <ChevronDown className="w-4 h-4" />
                  <span>Using: Dark Model</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
