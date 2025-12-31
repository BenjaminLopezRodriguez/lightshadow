import { HydrateClient } from "@/trpc/server";
import { ProfileCheck } from "@/app/_components/profile-check";
import { LightTerminalApp } from "./_components/app";

export default async function LightTerminalPage() {
  return (
    <HydrateClient>
      <ProfileCheck>
        <main className="min-h-screen flex flex-col">
          <LightTerminalApp />
        </main>
      </ProfileCheck>
    </HydrateClient>
  );
}

