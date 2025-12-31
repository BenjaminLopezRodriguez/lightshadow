"use client";

import { useState } from "react";
import { Menu, X, Plus, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LottieLogo } from "./lottie-logo";
import { ThemeToggle } from "./theme-toggle";
import { Sidebar } from "./sidebar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

export function Toolbar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated } = useKindeBrowserClient();

  const handleNewChat = () => {
    router.push("/");
    setSidebarOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm px-6 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Sidebar Toggle Button - Mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 rounded-lg border border-border bg-muted/50 hover:bg-muted lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="w-4 h-4 text-foreground" />
          </Button>

          {/* Logo and Title with spacing */}
          <div className="flex items-center gap-3">
            <LottieLogo />
            <h1 className="text-xl font-serif text-foreground tracking-tight">
              LightShadow
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Create Chat Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewChat}
            className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-muted/50 hover:bg-muted text-foreground"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Chat</span>
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Avatar */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Avatar className="w-9 h-9 border border-border">
                {user.picture ? (
                  <AvatarImage src={user.picture} alt={user.given_name || "User"} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-bold">
                  {(user.given_name?.[0] || "U") + (user.family_name?.[0] || "")}
                </AvatarFallback>
              </Avatar>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="w-80 bg-background/95 backdrop-blur-xl border-border p-0"
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <Sidebar className="h-full border-0" />
        </SheetContent>
      </Sheet>
    </header>
  );
}
