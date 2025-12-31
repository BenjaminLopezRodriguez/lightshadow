import { Suspense } from "react";

import { HydrateClient } from "@/trpc/server";
import { AuthGuard } from "../_components/auth-guard";
import { HomeContent } from "../_components/home-content";

export default async function AppPage() {
  return (
    <HydrateClient>
      <AuthGuard fallback={null}>
        <HomeContent />
      </AuthGuard>
    </HydrateClient>
  );
}

