import { HydrateClient } from "@/trpc/server";
import { ProfileSetup } from "../_components/profile-setup";

export default async function SetupPage() {
  return (
    <HydrateClient>
      <ProfileSetup />
    </HydrateClient>
  );
}
