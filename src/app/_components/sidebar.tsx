"use client";

import { Plus, MessageSquare, LogIn, LogOut, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { LoginLink, LogoutLink, RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { AddContact } from "./add-contact";
import { CreateGroupChat } from "./create-group-chat";

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
        <aside className={cn("w-80 flex flex-col h-full border-r border-border bg-sidebar/95 backdrop-blur-sm", className)}>
            <div className="p-4 space-y-2">
                <Button
                    onClick={handleNewChat}
                    className="w-full justify-start gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-lg shadow-sm transition-all group"
                >
                    <div className="p-1 rounded-md bg-primary-foreground/20 group-hover:bg-primary-foreground/30 transition-colors">
                        <Plus className="w-4 h-4" />
                    </div>
                    <span className="font-medium">New Chat</span>
                </Button>
                {isAuthenticated && (
                    <>
                        <CreateGroupChat />
                        <AddContact />
                    </>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-6">
                {isLoading ? (
                    <div className="px-4 text-muted-foreground text-sm">Loading...</div>
                ) : !isAuthenticated ? (
                    <div className="px-4 text-muted-foreground text-sm">Sign in to save chats</div>
                ) : (
                    <>
                        {/* Contacts Section */}
                        {contacts && contacts.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Contacts</h3>
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
                                <h3 className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Group Chats</h3>
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
                                <h3 className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Chats</h3>
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
                            <div className="px-4 text-muted-foreground text-sm italic">No chats or contacts yet</div>
                        )}
                    </>
                )}
            </div>

            <div className="p-4 border-t border-border">
                {!isAuthenticated ? (
                    <div className="flex gap-2">
                        <LoginLink className="flex-1">
                            <Button variant="outline" className="w-full">
                                <LogIn className="w-4 h-4 mr-2" />
                                Sign In
                            </Button>
                        </LoginLink>
                        <RegisterLink className="flex-1">
                            <Button className="w-full">
                                Sign Up
                            </Button>
                        </RegisterLink>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors group relative">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shadow-sm overflow-hidden">
                            {profile?.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
                            ) : user?.picture ? (
                                <img src={user.picture} alt={user.given_name || "User"} className="w-full h-full object-cover" />
                            ) : (
                                (user?.given_name?.[0] || "U") + (user?.family_name?.[0] || "")
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                                {profile?.username || user?.given_name || "User"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{profile?.uniqueId || user?.email}</p>
                        </div>
                        <LogoutLink className="absolute inset-0 flex items-center justify-end px-4 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-lg">
                            <LogOut className="w-4 h-4 text-foreground" />
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
                "w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 group flex items-center gap-3",
                active
                    ? "bg-accent text-accent-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
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
                <Users className={cn("w-4 h-4", active ? "text-accent-foreground" : "text-muted-foreground group-hover:text-foreground")} />
            ) : (
                <MessageSquare className={cn("w-4 h-4", active ? "text-accent-foreground" : "text-muted-foreground group-hover:text-foreground")} />
            )}
            <span className="truncate">{title}</span>
        </button>
    );
}

function ContactItem({ contact }: { contact: { id: number; contactId: string; profile?: { username: string; avatarUrl?: string | null; uniqueId: string } | null } }) {
    return (
        <div className="px-4 py-2 rounded-lg hover:bg-accent/50 transition-colors flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                {contact.profile?.avatarUrl ? (
                    <img src={contact.profile.avatarUrl} alt={contact.profile.username} className="w-full h-full object-cover" />
                ) : (
                    <User className="w-4 h-4 text-primary-foreground" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{contact.profile?.username || "Unknown"}</p>
                <p className="text-xs text-muted-foreground truncate">{contact.profile?.uniqueId}</p>
            </div>
        </div>
    );
}
