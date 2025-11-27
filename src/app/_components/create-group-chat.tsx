"use client";

import { useState } from "react";
import { Users, Palette, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const THEME_COLORS = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Orange", value: "#f97316" },
  { name: "Red", value: "#ef4444" },
  { name: "Yellow", value: "#eab308" },
];

export function CreateGroupChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedColor, setSelectedColor] = useState(THEME_COLORS[0].value);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const router = useRouter();

  const utils = api.useUtils();
  const { data: contacts } = api.contact.getAll.useQuery();

  const createGroupChat = api.chat.createGroupChat.useMutation({
    onSuccess: (chat) => {
      utils.chat.getAll.invalidate();
      setIsOpen(false);
      setGroupName("");
      setSelectedParticipants([]);
      setSelectedColor(THEME_COLORS[0].value);
      router.push(`/?chatId=${chat.id}`);
    },
    onError: (error) => {
      alert(error.message || "Failed to create group chat");
    },
  });

  const handleCreate = () => {
    if (!groupName.trim()) {
      alert("Please enter a group name");
      return;
    }

    if (selectedParticipants.length === 0) {
      alert("Please select at least one participant");
      return;
    }

    createGroupChat.mutate({
      name: groupName.trim(),
      groupName: groupName.trim(),
      themeColor: selectedColor,
      participantIds: selectedParticipants,
    });
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full justify-start gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-white border border-indigo-500/30 h-12 rounded-xl shadow-lg shadow-indigo-500/10 transition-all duration-300 group"
      >
        <div className="p-1 rounded-lg bg-indigo-500/20 group-hover:bg-indigo-500/30 transition-colors">
          <Users className="w-4 h-4" />
        </div>
        <span className="font-medium">Create Group Chat</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black/90 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif text-white">Create Group Chat</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Group Name
              </label>
              <Input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Add Participants
              </label>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {contacts && contacts.length > 0 ? (
                  contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                        selectedParticipants.includes(contact.contactId)
                          ? "bg-indigo-500/20 border border-indigo-500/50"
                          : "bg-white/5 hover:bg-white/10"
                      )}
                      onClick={() => toggleParticipant(contact.contactId)}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center overflow-hidden">
                        {contact.profile?.avatarUrl ? (
                          <img
                            src={contact.profile.avatarUrl}
                            alt={contact.profile.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {contact.profile?.username || "Unknown"}
                        </p>
                      </div>
                      {selectedParticipants.includes(contact.contactId) && (
                        <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                          <X className="w-3 h-3 text-white rotate-45" />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-white/40 py-4 text-sm">
                    No contacts available. Add contacts first.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Theme Color
              </label>
              <div className="grid grid-cols-4 gap-2">
                {THEME_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={cn(
                      "h-12 rounded-lg border-2 transition-all",
                      selectedColor === color.value
                        ? "border-white scale-110"
                        : "border-white/20 hover:border-white/40"
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
                className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!groupName.trim() || selectedParticipants.length === 0 || createGroupChat.isPending}
                className="flex-1 bg-white text-black hover:bg-white/90"
              >
                {createGroupChat.isPending ? "Creating..." : "Create Group"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
