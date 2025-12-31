import { HydrateClient } from "@/trpc/server";
import { LandingPage } from "./_components/landing-page";

export default async function Home() {
  return (
    <HydrateClient>
      <LandingPage />
    </HydrateClient>
  );
}
