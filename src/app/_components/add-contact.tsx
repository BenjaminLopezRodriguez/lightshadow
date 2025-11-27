"use client";

import { useState } from "react";
import { Search, UserPlus, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";

export function AddContact() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const utils = api.useUtils();

  const { data: searchResults, isLoading: isSearching } = api.user.searchByUsername.useQuery(
    { username: searchQuery },
    { enabled: searchQuery.length >= 2 }
  );

  const { data: contacts } = api.contact.getAll.useQuery();
  const contactIds = new Set(contacts?.map((c) => c.contactId) || []);

  const addContact = api.contact.addContact.useMutation({
    onSuccess: () => {
      utils.contact.getAll.invalidate();
      setSearchQuery("");
      setIsOpen(false);
    },
    onError: (error) => {
      alert(error.message || "Failed to add contact");
    },
  });

  const handleAddContact = (userId: string) => {
    addContact.mutate({ contactId: userId });
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full justify-start gap-2 bg-white/10 hover:bg-white/20 text-white border-white/5 h-12 rounded-xl"
      >
        <UserPlus className="w-4 h-4" />
        <span className="font-medium">Add Contact</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black/90 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif text-white">Add Contact</h2>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSearchQuery("");
                }}
                className="text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by username..."
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {isSearching && searchQuery.length >= 2 && (
                <div className="text-center text-white/40 py-4">Searching...</div>
              )}

              {!isSearching && searchQuery.length >= 2 && searchResults && searchResults.length === 0 && (
                <div className="text-center text-white/40 py-4">No users found</div>
              )}

              {searchResults?.map((user) => {
                const isAlreadyContact = contactIds.has(user.userId);
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center overflow-hidden">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{user.username}</p>
                      <p className="text-xs text-white/40 truncate">{user.uniqueId}</p>
                    </div>
                    <Button
                      onClick={() => handleAddContact(user.userId)}
                      disabled={isAlreadyContact || addContact.isPending}
                      size="sm"
                      className={cn(
                        "h-8",
                        isAlreadyContact
                          ? "bg-white/10 text-white/40 cursor-not-allowed"
                          : "bg-white text-black hover:bg-white/90"
                      )}
                    >
                      {isAlreadyContact ? "Added" : "Add"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
