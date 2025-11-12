import ProfileHeader from "@/components/ProfileHeader";
import SocialLinkCard from "@/components/SocialLinkCard";
import SocialStats from "@/components/SocialStats";
import ThemeToggle from "@/components/ThemeToggle";
import QRCodeDialog from "@/components/QRCodeDialog";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import type { Profile, SocialLink } from "@shared/schema";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const PROFILE_ID = "default-profile";

export default function Home() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: profile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ["/api/profile", PROFILE_ID],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/profile/${PROFILE_ID}`);
        if (!response.ok) {
          return null;
        }
        return response.json();
      } catch {
        return null;
      }
    },
  });

  const { data: links = [], isLoading: linksLoading, refetch: refetchLinks } = useQuery<SocialLink[]>({
    queryKey: ["/api/profile", PROFILE_ID, "links"],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/profile/${PROFILE_ID}/links`);
        if (!response.ok) {
          return [];
        }
        return response.json();
      } catch {
        return [];
      }
    },
  });

  const trackPageView = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/track/page-view", {
        profileId: PROFILE_ID,
      });
    },
  });

  useEffect(() => {
    trackPageView.mutate();

    // Check for OAuth callback success
    const urlParams = new URLSearchParams(window.location.search);
    const connectedPlatform = urlParams.get('connected');
    const error = urlParams.get('error');
    const errorDesc = urlParams.get('desc');

    if (connectedPlatform) {
      // Invalidate queries to refresh both connected accounts and links
      queryClient.invalidateQueries({ queryKey: ["/api/connected-accounts", PROFILE_ID] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile", PROFILE_ID, "links"] });

      // Show success toast
      toast({
        title: "Account Connected!",
        description: `Successfully connected ${connectedPlatform}`,
      });

      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error) {
      // Show error toast
      toast({
        title: "Connection Failed",
        description: errorDesc || `Failed to connect: ${error}`,
        variant: "destructive",
      });

      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (profileLoading || linksLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Profile not found</p>
          <p className="text-sm text-muted-foreground">
            Please check your configuration
          </p>
        </div>
      </div>
    );
  }

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <AnimatedBackground />

      {/* Floating action buttons with glass effect */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 z-10"
      >
        <div className="glass p-1 rounded-2xl flex items-center gap-1">
          <QRCodeDialog url={currentUrl} title={profile.name} />
          <Link href="/analytics">
            <Button variant="ghost" size="icon" className="hover-elevate" data-testid="button-analytics">
              <BarChart3 className="h-5 w-5" />
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </motion.div>

      {/* Main content container */}
      <div className="max-w-2xl mx-auto px-6 md:px-8 py-8 relative z-0">
        <ProfileHeader profile={profile} />

        {/* Social links section with staggered animations */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="space-y-4 pb-8"
          data-testid="container-social-links"
        >
          {links.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-12 glass rounded-2xl"
            >
              <p className="text-muted-foreground">No links available yet</p>
            </motion.div>
          ) : (
            links.map((link, index) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <SocialLinkCard
                  id={link.id}
                  platform={link.platform}
                  url={link.url}
                  displayText={link.displayText}
                  clickCount={link.clickCount}
                  expiresAt={link.expiresAt}
                  onClickTracked={() => refetchLinks()}
                />
              </motion.div>
            ))
          )}
        </motion.div>

        <SocialStats profileId={PROFILE_ID} />

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="text-center py-8 text-sm text-muted-foreground"
        >
          <div className="glass inline-block px-6 py-3 rounded-full">
            <p>Made with ❤️ using Link in Bio</p>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}
