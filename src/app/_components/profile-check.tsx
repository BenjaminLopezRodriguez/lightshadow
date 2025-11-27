"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { api } from "@/trpc/react";

export function ProfileCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useKindeBrowserClient();
  const { data: profile, isLoading: profileLoading } = api.user.getProfile.useQuery(
    undefined,
    { enabled: isAuthenticated ?? false }
  );

  useEffect(() => {
    if (!authLoading && !profileLoading) {
      if (isAuthenticated && !profile) {
        // User is authenticated but hasn't completed profile setup
        router.push("/setup");
      }
    }
  }, [isAuthenticated, profile, authLoading, profileLoading, router]);

  // Show loading state while checking
  if (authLoading || (isAuthenticated && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  // If not authenticated, show the page (auth middleware will handle redirect)
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // If authenticated but no profile, redirect will happen in useEffect
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white/60">Redirecting to setup...</div>
      </div>
    );
  }

  // Profile exists, show the page
  return <>{children}</>;
}
