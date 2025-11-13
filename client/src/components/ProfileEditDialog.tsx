import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, Sparkles, Upload, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Profile } from "@shared/schema";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface ProfileEditDialogProps {
  profile: Profile;
}

export default function ProfileEditDialog({ profile }: ProfileEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || "");
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateProfile = useMutation({
    mutationFn: async (data: { name: string; bio: string; avatarUrl: string }) => {
      const response = await fetch(`/api/profile/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update profile");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile", profile.id] });
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      setOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const generateAIBio = async () => {
    setIsGeneratingBio(true);
    try {
      const response = await fetch('/api/ai/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate bio');
      }

      const data = await response.json();
      setBio(data.bio);
      toast({
        title: "✨ AI Bio Generated!",
        description: "Powered by Gemini AI - feel free to customize it",
      });
    } catch (error: any) {
      console.error('AI Bio generation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate bio. Check if Gemini API key is configured.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB for Cloudinary upload)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      // Convert to base64 for upload
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        // Upload to Cloudinary
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64String }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload image');
        }

        const data = await response.json();
        setAvatarUrl(data.url);

        toast({
          title: "Image uploaded!",
          description: "Your profile picture has been uploaded to cloud storage",
        });
        setIsUploadingImage(false);
      };

      reader.onerror = () => {
        toast({
          title: "Upload failed",
          description: "Failed to read image file",
          variant: "destructive",
        });
        setIsUploadingImage(false);
      };

      reader.readAsDataURL(file);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = () => {
    updateProfile.mutate({ name, bio, avatarUrl });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="absolute -top-2 -right-2 z-10 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center glass-strong"
          title="Edit Profile"
        >
          <Pencil className="h-4 w-4" />
        </motion.button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Edit Profile
          </DialogTitle>
          <DialogDescription>
            Customize your SocialSpotlight profile with AI assistance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative"
            >
              {avatarUrl ? (
                <div className="relative">
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="h-24 w-24 rounded-full object-cover ring-4 ring-primary/20"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => setAvatarUrl("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 text-3xl font-bold text-white ring-4 ring-primary/20">
                  {getInitials(name)}
                </div>
              )}
            </motion.div>

            <div className="w-full space-y-2">
              <Label htmlFor="avatar-upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Profile Picture
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </>
                  )}
                </Button>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Upload an image (max 5MB) - JPG, PNG, or GIF. Uploaded to cloud storage.
              </p>
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Bio Field with AI Generator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bio" className="flex items-center gap-2">
                Bio
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Powered
                </Badge>
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={generateAIBio}
                disabled={isGeneratingBio || !name}
                className="h-7 text-xs"
              >
                {isGeneratingBio ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-1" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="bio"
              placeholder="Tell the world about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {bio.length}/200 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={updateProfile.isPending || !name}
            >
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
