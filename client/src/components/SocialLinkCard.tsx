import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Instagram,
  Twitter,
  Linkedin,
  Github,
  Youtube,
  Mail,
  Globe,
  Music,
  Check,
  Copy,
  ExternalLink,
  Eye,
  Clock,
} from "lucide-react";
import { SiTiktok, SiSpotify, SiTwitch, SiFacebook } from "react-icons/si";
import { useState } from "react";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { differenceInDays } from "date-fns";

interface SocialLinkCardProps {
  id: string;
  platform: string;
  url: string;
  displayText: string;
  clickCount?: number;
  expiresAt?: Date | null;
  onClickTracked?: () => void;
}

const platformConfig: Record<string, { icon: any; color: string }> = {
  instagram: { icon: Instagram, color: "text-pink-500" },
  twitter: { icon: Twitter, color: "text-blue-400" },
  linkedin: { icon: Linkedin, color: "text-blue-600" },
  github: { icon: Github, color: "text-foreground" },
  youtube: { icon: Youtube, color: "text-red-500" },
  tiktok: { icon: SiTiktok, color: "text-foreground" },
  spotify: { icon: SiSpotify, color: "text-green-500" },
  twitch: { icon: SiTwitch, color: "text-purple-500" },
  facebook: { icon: SiFacebook, color: "text-blue-600" },
  email: { icon: Mail, color: "text-foreground" },
  website: { icon: Globe, color: "text-foreground" },
  music: { icon: Music, color: "text-foreground" },
};

export default function SocialLinkCard({
  id,
  platform,
  url,
  displayText,
  clickCount = 0,
  expiresAt,
  onClickTracked,
}: SocialLinkCardProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [localClickCount, setLocalClickCount] = useState(clickCount);

  const config = platformConfig[platform.toLowerCase()] || {
    icon: Globe,
    color: "text-foreground",
  };
  const Icon = config.icon;

  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
  const daysUntilExpiry = expiresAt
    ? differenceInDays(new Date(expiresAt), new Date())
    : null;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "The link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClick = async () => {
    if (isExpired) {
      toast({
        title: "Link expired",
        description: "This link is no longer available.",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest("POST", "/api/track/link-click", { linkId: id });
      setLocalClickCount((prev) => prev + 1);
      if (onClickTracked) {
        onClickTracked();
      }
    } catch (error) {
      console.error("Failed to track click:", error);
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`glass glass-hover group cursor-pointer relative overflow-visible ${
        isExpired ? "opacity-60" : ""
      }`}
      onClick={handleClick}
      data-testid={`card-social-${platform.toLowerCase()}`}
    >
      {/* Subtle gradient accent */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
        style={{
          background: `radial-gradient(circle at top left, ${config.color}15, transparent 60%)`,
        }}
      />

      <div className="flex items-center gap-4 p-6 relative">
        {/* Icon container with glass effect */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative flex items-center justify-center w-14 h-14 rounded-2xl glass flex-shrink-0"
        >
          {/* Icon glow effect */}
          <div
            className="absolute inset-0 rounded-2xl opacity-20 blur-xl"
            style={{ backgroundColor: config.color }}
          />
          <Icon className={`w-7 h-7 ${config.color} relative z-10`} />
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className="text-lg font-semibold text-foreground truncate"
              data-testid={`text-platform-${platform.toLowerCase()}`}
            >
              {displayText}
            </h3>
            {isExpired && (
              <Badge variant="destructive" className="text-xs">
                Expired
              </Badge>
            )}
            {!isExpired && daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
              <Badge variant="secondary" className="text-xs glass">
                <Clock className="w-3 h-3 mr-1" />
                {daysUntilExpiry}d left
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="truncate font-medium">
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </span>
            {localClickCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 glass px-2 py-0.5 rounded-full"
                data-testid={`text-clicks-${id}`}
              >
                <Eye className="w-3 h-3" />
                {localClickCount.toLocaleString()}
              </motion.span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-all glass hover:scale-110"
            data-testid={`button-copy-${platform.toLowerCase()}`}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>

          <motion.div
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
