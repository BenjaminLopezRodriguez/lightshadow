"use client";

import { useState } from "react";
import { User, Upload, Phone, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { UploadButton } from "@/lib/uploadthing";
import { useRouter } from "next/navigation";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

export function ProfileSetup() {
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user } = useKindeBrowserClient();

  const utils = api.useUtils();
  const createProfile = api.user.createProfile.useMutation({
    onSuccess: () => {
      utils.user.getProfile.invalidate();
      router.push("/");
      router.refresh();
    },
    onError: (error) => {
      alert(error.message || "Failed to create profile");
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createProfile.mutateAsync({
        username: username.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
      });
    } catch (error) {
      // Error handled in onError
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center  bg-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-2 w-full ">

          <div className="w-20 h-20 mx-auto mb-10 text-center rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-white/40" />
                  )}
                </div>
            <h1 className="text-2xl md:text-3xl font-serif font-semibold text-white">Complete Your Profile</h1>
            <p className="text-sm text-white/60">Set up your account to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <div className="space-y-2">
              <div className="flex items-center gap-4">
               
                <div className="flex-1">
                  <UploadButton
                    endpoint="avatarUploader"
                    onClientUploadComplete={(res) => {
                      if (res && res[0]) {
                        setAvatarUrl(res[0].url);
                      }
                    }}
                    onUploadError={(error: Error) => {
                      alert(`Upload failed: ${error.message}`);
                    }}
                    appearance={{
                      button: "bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg px-4 py-2 text-sm",
                      allowedContent: "text-white/60 text-xs",
                    }}
                    content={{
                      button: (
                        <div className="flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          <span>Upload Avatar</span>
                        </div>
                      ),
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-white/80 flex items-center gap-2">
                <User className="w-4 h-4" />
                Username *
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
                minLength={3}
                maxLength={100}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-white/30"
              />
              <p className="text-xs text-white/40">This will be your unique display name</p>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-white/80 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number (Optional)
              </label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
                maxLength={20}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-white/30"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!username.trim() || isSubmitting}
              className="w-full bg-white text-black hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40 h-12 rounded-xl font-medium"
            >
              {isSubmitting ? (
                "Creating Profile..."
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Complete Setup</span>
                </div>
              )}
            </Button>
          </form>

          {user && (
            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-white/40 text-center">
                Logged in as: {user.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
