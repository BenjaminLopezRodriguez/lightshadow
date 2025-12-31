"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { api } from "@/trpc/react";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // If not authenticated, show fallback (landing page)
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // If authenticated but no profile, redirect will happen in useEffect
  if (isAuthenticated && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Redirecting to setup...</div>
      </div>
    );
  }

  // Profile exists, show the app
  return <>{children}</>;
}

