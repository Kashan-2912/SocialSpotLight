import { Card } from "@/components/ui/card";
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
import { apiRequest } from "@/lib/queryClient";
import { differenceInDays, formatDistanceToNow } from "date-fns";

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
    <Card
      className={`group cursor-pointer hover-elevate active-elevate-2 transition-all duration-200 hover:shadow-md overflow-visible ${
        isExpired ? "opacity-60" : ""
      }`}
      onClick={handleClick}
      data-testid={`card-social-${platform.toLowerCase()}`}
    >
      <div className="flex items-center gap-4 p-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted flex-shrink-0">
          <Icon className={`w-6 h-6 ${config.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className="text-lg font-medium text-foreground truncate"
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
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {daysUntilExpiry}d left
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="truncate">
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </span>
            {localClickCount > 0 && (
              <span className="flex items-center gap-1" data-testid={`text-clicks-${id}`}>
                <Eye className="w-3 h-3" />
                {localClickCount.toLocaleString()} clicks
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            data-testid={`button-copy-${platform.toLowerCase()}`}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>

          <ExternalLink className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
    </Card>
  );
}
