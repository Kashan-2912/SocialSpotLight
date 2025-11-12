import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import ProfileEditDialog from "./ProfileEditDialog";
import type { Profile } from "@shared/schema";

interface ProfileHeaderProps {
  profile: Profile;
}

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
  const { name, bio, avatarUrl } = profile;

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col items-center text-center py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative mb-6"
      >
        {/* Edit Profile Button */}
        <ProfileEditDialog profile={profile} />
        {/* Glass backdrop for avatar */}
        <div className="absolute inset-0 rounded-full glass-strong scale-110 -z-10" />

        {/* Animated glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full opacity-50 -z-20"
          style={{
            background: "conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--chart-2)), hsl(var(--primary)))",
            filter: "blur(20px)",
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <Avatar className="w-28 h-28 md:w-32 md:h-32 ring-4 ring-background shadow-2xl">
          <AvatarImage src={avatarUrl || undefined} alt={name} />
          <AvatarFallback className="text-3xl font-bold bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-3xl md:text-4xl font-bold mb-4 text-foreground tracking-tight"
        data-testid="text-profile-name"
      >
        {name}
      </motion.h1>

      {bio && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base md:text-lg text-muted-foreground max-w-md leading-relaxed px-4"
          data-testid="text-profile-bio"
        >
          {bio}
        </motion.p>
      )}
    </div>
  );
}
