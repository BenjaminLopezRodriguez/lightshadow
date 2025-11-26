"use client";

import { Plus, MessageSquare, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { LoginLink, LogoutLink, RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useRouter, useSearchParams } from "next/navigation";

export function Sidebar({ className }: { className?: string }) {
    const { user, isAuthenticated, isLoading } = useKindeBrowserClient();
    const { data: chats, refetch } = api.chat.getAll.useQuery(undefined, {
        enabled: !!user,
    });
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentChatId = searchParams.get("chatId");

    const handleNewChat = () => {
        router.push("/");
    };

    const handleChatSelect = (id: number) => {
        router.push(`/?chatId=${id}`);
    };

    return (
        <aside className={cn("w-80 flex flex-col h-full border-r border-white/5 bg-black/20 backdrop-blur-xl", className)}>
            <div className="p-4">
                <Button
                    onClick={handleNewChat}
                    className="w-full justify-start gap-2 bg-white/10 hover:bg-white/20 text-white border-white/5 h-12 rounded-xl shadow-lg shadow-black/20 transition-all duration-300 group"
                >
                    <div className="p-1 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
                        <Plus className="w-4 h-4" />
                    </div>
                    <span className="font-medium">New Chat</span>
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-6">
                {isLoading ? (
                    <div className="px-4 text-white/40 text-sm">Loading...</div>
                ) : !isAuthenticated ? (
                    <div className="px-4 text-white/40 text-sm">Sign in to save chats</div>
                ) : (
                    <div className="space-y-2">
                        <h3 className="px-4 text-xs font-medium text-white/40 uppercase tracking-wider">History</h3>
                        <div className="space-y-1">
                            {chats?.map((chat) => (
                                <HistoryItem
                                    key={chat.id}
                                    title={chat.name}
                                    active={currentChatId === chat.id.toString()}
                                    onClick={() => handleChatSelect(chat.id)}
                                />
                            ))}
                            {chats?.length === 0 && (
                                <div className="px-4 text-white/40 text-sm italic">No chats yet</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-white/5">
                {!isAuthenticated ? (
                    <div className="flex gap-2">
                        <LoginLink className="flex-1">
                            <Button variant="outline" className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10">
                                <LogIn className="w-4 h-4 mr-2" />
                                Sign In
                            </Button>
                        </LoginLink>
                        <RegisterLink className="flex-1">
                            <Button className="w-full bg-white text-black hover:bg-white/90">
                                Sign Up
                            </Button>
                        </RegisterLink>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group relative">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-purple-500/20 overflow-hidden">
                            {user?.picture ? (
                                <img src={user.picture} alt={user.given_name || "User"} className="w-full h-full object-cover" />
                            ) : (
                                (user?.given_name?.[0] || "U") + (user?.family_name?.[0] || "")
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white group-hover:text-white/90 truncate">
                                {user?.given_name} {user?.family_name}
                            </p>
                            <p className="text-xs text-white/40 truncate">{user?.email}</p>
                        </div>
                        <LogoutLink className="absolute inset-0 flex items-center justify-end px-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm rounded-xl">
                            <LogOut className="w-4 h-4 text-white" />
                        </LogoutLink>
                    </div>
                )}
            </div>
        </aside>
    );
}

function HistoryItem({ title, active, onClick }: { title: string; active?: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 group flex items-center gap-3",
                active
                    ? "bg-white/10 text-white font-medium shadow-lg shadow-black/10"
                    : "text-white/60 hover:text-white hover:bg-white/5"
            )}
        >
            <MessageSquare className={cn("w-4 h-4 opacity-50", active ? "text-white" : "group-hover:text-white")} />
            <span className="truncate">{title}</span>
        </button>
    );
}
