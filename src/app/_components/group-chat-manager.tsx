"use client";

import { useState } from "react";
import { Users, Palette, Edit, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";

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

interface GroupChatManagerProps {
  chatId: number;
  isGroupChat: boolean;
  groupName?: string | null;
  themeColor?: string | null;
  onUpdate?: () => void;
}

export function GroupChatManager({
  chatId,
  isGroupChat,
  groupName: initialGroupName,
  themeColor: initialThemeColor,
  onUpdate,
}: GroupChatManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [groupName, setGroupName] = useState(initialGroupName || "");
  const [selectedColor, setSelectedColor] = useState(initialThemeColor || THEME_COLORS[0].value);
  const [isConverting, setIsConverting] = useState(false);

  const utils = api.useUtils();
  const { data: contacts } = api.contact.getAll.useQuery();
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  const convertToGroup = api.chat.convertToGroupChat.useMutation({
    onSuccess: () => {
      utils.chat.getAll.invalidate();
      utils.chat.getById.invalidate({ id: chatId });
      setIsOpen(false);
      setIsConverting(false);
      onUpdate?.();
    },
    onError: (error) => {
      alert(error.message || "Failed to convert to group chat");
      setIsConverting(false);
    },
  });

  const updateSettings = api.chat.updateGroupSettings.useMutation({
    onSuccess: () => {
      utils.chat.getAll.invalidate();
      utils.chat.getById.invalidate({ id: chatId });
      setIsOpen(false);
      onUpdate?.();
    },
    onError: (error) => {
      alert(error.message || "Failed to update settings");
    },
  });

  const handleSave = () => {
    if (isGroupChat) {
      updateSettings.mutate({
        chatId,
        groupName: groupName || undefined,
        themeColor: selectedColor || undefined,
      });
    } else {
      setIsConverting(true);
      convertToGroup.mutate({
        chatId,
        groupName: groupName || "Group Chat",
        themeColor: selectedColor || undefined,
        participantIds: selectedParticipants,
      });
    }
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
        variant="ghost"
        size="sm"
        className="text-white/60 hover:text-white hover:bg-white/10"
      >
        {isGroupChat ? (
          <>
            <Edit className="w-4 h-4 mr-2" />
            Edit Group
          </>
        ) : (
          <>
            <Users className="w-4 h-4 mr-2" />
            Convert to Group
          </>
        )}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black/90 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif text-white">
                {isGroupChat ? "Edit Group Chat" : "Convert to Group Chat"}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                <Edit className="w-4 h-4" />
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

            {!isGroupChat && (
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
                            <Plus className="w-3 h-3 text-white rotate-45" />
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
            )}

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
                onClick={handleSave}
                disabled={!groupName.trim() || (isConverting || updateSettings.isPending)}
                className="flex-1 bg-white text-black hover:bg-white/90"
              >
                {isConverting || updateSettings.isPending
                  ? "Saving..."
                  : isGroupChat
                  ? "Save Changes"
                  : "Convert to Group"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
