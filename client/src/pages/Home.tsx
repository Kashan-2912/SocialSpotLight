import ProfileHeader from "@/components/ProfileHeader";
import SocialLinkCard from "@/components/SocialLinkCard";
import SocialStats from "@/components/SocialStats";
import ThemeToggle from "@/components/ThemeToggle";
import QRCodeDialog from "@/components/QRCodeDialog";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import type { Profile, SocialLink } from "@shared/schema";
import { Link } from "wouter";

const PROFILE_ID = "default-profile";

export default function Home() {
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
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 z-10">
        <QRCodeDialog url={currentUrl} title={profile.name} />
        <Link href="/analytics">
          <Button variant="ghost" size="icon" data-testid="button-analytics">
            <BarChart3 className="h-5 w-5" />
          </Button>
        </Link>
        <ThemeToggle />
      </div>

      <div className="max-w-2xl mx-auto px-6 md:px-8 py-8 relative z-0">
        <ProfileHeader
          name={profile.name}
          bio={profile.bio || undefined}
          avatarUrl={profile.avatarUrl || ""}
        />

        <div className="space-y-4 pb-8" data-testid="container-social-links">
          {links.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No links available yet</p>
            </div>
          ) : (
            links.map((link) => (
              <SocialLinkCard
                key={link.id}
                id={link.id}
                platform={link.platform}
                url={link.url}
                displayText={link.displayText}
                clickCount={link.clickCount}
                expiresAt={link.expiresAt}
                onClickTracked={() => refetchLinks()}
              />
            ))
          )}
        </div>

        <SocialStats profileId={PROFILE_ID} />

        <footer className="text-center py-6 text-sm text-muted-foreground">
          <p>Made with ❤️ using Link in Bio</p>
        </footer>
      </div>
    </div>
  );
}
