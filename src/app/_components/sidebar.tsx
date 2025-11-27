"use client";

import { Plus, MessageSquare, LogIn, LogOut, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { LoginLink, LogoutLink, RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { AddContact } from "./add-contact";

export function Sidebar({ className }: { className?: string }) {
    const { user, isAuthenticated, isLoading } = useKindeBrowserClient();
    const { data: profile } = api.user.getProfile.useQuery(undefined, { enabled: !!user });
    const { data: chats, refetch } = api.chat.getAll.useQuery(undefined, {
        enabled: !!user,
    });
    const { data: contacts } = api.contact.getAll.useQuery(undefined, { enabled: !!user });
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentChatId = searchParams.get("chatId");

    const handleNewChat = () => {
        router.push("/");
    };

    const handleChatSelect = (id: number) => {
        router.push(`/?chatId=${id}`);
    };

    const regularChats = chats?.filter((chat) => !chat.isGroupChat) || [];
    const groupChats = chats?.filter((chat) => chat.isGroupChat) || [];

    return (
        <aside className={cn("w-80 flex flex-col h-full border-r border-white/5 bg-black/20 backdrop-blur-xl", className)}>
            <div className="p-4 space-y-2">
                <Button
                    onClick={handleNewChat}
                    className="w-full justify-start gap-2 bg-white/10 hover:bg-white/20 text-white border-white/5 h-12 rounded-xl shadow-lg shadow-black/20 transition-all duration-300 group"
                >
                    <div className="p-1 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
                        <Plus className="w-4 h-4" />
                    </div>
                    <span className="font-medium">New Chat</span>
                </Button>
                {isAuthenticated && <AddContact />}
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-6">
                {isLoading ? (
                    <div className="px-4 text-white/40 text-sm">Loading...</div>
                ) : !isAuthenticated ? (
                    <div className="px-4 text-white/40 text-sm">Sign in to save chats</div>
                ) : (
                    <>
                        {/* Contacts Section */}
                        {contacts && contacts.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="px-4 text-xs font-medium text-white/40 uppercase tracking-wider">Contacts</h3>
                                <div className="space-y-1">
                                    {contacts.map((contact) => (
                                        <ContactItem
                                            key={contact.id}
                                            contact={contact}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Group Chats Section */}
                        {groupChats.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="px-4 text-xs font-medium text-white/40 uppercase tracking-wider">Group Chats</h3>
                                <div className="space-y-1">
                                    {groupChats.map((chat) => (
                                        <HistoryItem
                                            key={chat.id}
                                            title={chat.groupName || chat.name}
                                            active={currentChatId === chat.id.toString()}
                                            onClick={() => handleChatSelect(chat.id)}
                                            isGroup={true}
                                            themeColor={chat.themeColor}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Regular Chats Section */}
                        {regularChats.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="px-4 text-xs font-medium text-white/40 uppercase tracking-wider">Chats</h3>
                                <div className="space-y-1">
                                    {regularChats.map((chat) => (
                                        <HistoryItem
                                            key={chat.id}
                                            title={chat.name}
                                            active={currentChatId === chat.id.toString()}
                                            onClick={() => handleChatSelect(chat.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {chats?.length === 0 && contacts?.length === 0 && (
                            <div className="px-4 text-white/40 text-sm italic">No chats or contacts yet</div>
                        )}
                    </>
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
                            {profile?.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
                            ) : user?.picture ? (
                                <img src={user.picture} alt={user.given_name || "User"} className="w-full h-full object-cover" />
                            ) : (
                                (user?.given_name?.[0] || "U") + (user?.family_name?.[0] || "")
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white group-hover:text-white/90 truncate">
                                {profile?.username || user?.given_name || "User"}
                            </p>
                            <p className="text-xs text-white/40 truncate">{profile?.uniqueId || user?.email}</p>
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

function HistoryItem({
    title,
    active,
    onClick,
    isGroup = false,
    themeColor,
}: {
    title: string;
    active?: boolean;
    onClick: () => void;
    isGroup?: boolean;
    themeColor?: string | null;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 group flex items-center gap-3",
                active
                    ? "bg-white/10 text-white font-medium shadow-lg shadow-black/10"
                    : "text-white/60 hover:text-white hover:bg-white/5"
            )}
            style={
                active && themeColor
                    ? {
                          borderLeft: `3px solid ${themeColor}`,
                      }
                    : undefined
            }
        >
            {isGroup ? (
                <Users className={cn("w-4 h-4 opacity-50", active ? "text-white" : "group-hover:text-white")} />
            ) : (
                <MessageSquare className={cn("w-4 h-4 opacity-50", active ? "text-white" : "group-hover:text-white")} />
            )}
            <span className="truncate">{title}</span>
        </button>
    );
}

function ContactItem({ contact }: { contact: { id: number; contactId: string; profile?: { username: string; avatarUrl?: string | null; uniqueId: string } | null } }) {
    return (
        <div className="px-4 py-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center overflow-hidden">
                {contact.profile?.avatarUrl ? (
                    <img src={contact.profile.avatarUrl} alt={contact.profile.username} className="w-full h-full object-cover" />
                ) : (
                    <User className="w-4 h-4 text-white" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{contact.profile?.username || "Unknown"}</p>
                <p className="text-xs text-white/40 truncate">{contact.profile?.uniqueId}</p>
            </div>
        </div>
    );
}
