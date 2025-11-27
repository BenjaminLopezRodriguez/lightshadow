import { Suspense } from "react";

import { HydrateClient } from "@/trpc/server";
import { Chat } from "./_components/chat";
import { Sidebar } from "./_components/sidebar";
import { Toolbar } from "./_components/toolbar";
import { ProfileCheck } from "./_components/profile-check";

export default async function Home() {
  return (
    <HydrateClient>
      <ProfileCheck>
        <main className="min-h-screen flex flex-col">
          {/* Toolbar */}
          <Toolbar />

          {/* Main Content */}
          <div className="flex-1 flex pt-[73px]">
            {/* Left Sidebar */}
            <div className="hidden lg:block h-[calc(100vh-73px)] sticky top-[73px]">
              <Suspense fallback={<div className="w-80 h-full flex items-center justify-center text-muted-foreground">Loading...</div>}>
                <Sidebar />
              </Suspense>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
              <Suspense fallback={<div className="flex-1 flex items-center justify-center text-muted-foreground">Loading...</div>}>
                <Chat />
              </Suspense>
            </div>
          </div>
        </main>
      </ProfileCheck>
    </HydrateClient>
  );
}
