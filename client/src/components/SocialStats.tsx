import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertCircle, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ConnectAccountsDialog from "./ConnectAccountsDialog";
import { useQuery } from "@tanstack/react-query";

interface SocialStatsProps {
  profileId: string;
}

const platformDisplayNames: Record<string, string> = {
  instagram: "Instagram",
  twitter: "Twitter",
  youtube: "YouTube",
  tiktok: "TikTok",
  github: "GitHub",
  linkedin: "LinkedIn",
};

export default function SocialStats({ profileId }: SocialStatsProps) {
  const { data: stats, isLoading } = useQuery<Record<string, { count: number; growth: number }>>({
    queryKey: ["/api/social-stats", profileId],
    queryFn: async () => {
      const response = await fetch(`/api/social-stats/${profileId}`);
      if (!response.ok) return {};
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const hasConnectedAccounts = stats && Object.keys(stats).length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mt-6 glass glass-hover"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Users className="h-6 w-6 text-primary" />
          </motion.div>
          Social Media Stats
        </CardTitle>
        <CardDescription className="text-base">
          Live follower counts across platforms
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasConnectedAccounts ? (
          <Alert className="glass border-primary/20">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              Connect social media accounts to show live follower counts.
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : null}

        {hasConnectedAccounts && stats && (
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(stats)
              .filter(([platform, data]) => {
                // Hide LinkedIn if count is 0 (API limitation)
                if (platform === 'linkedin' && data.count === 0) return false;
                return true;
              })
              .map(([platform, data], index) => (
                <motion.div
                  key={platform}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                  className="glass p-4 rounded-xl space-y-2 hover:opacity-100 transition-opacity"
                >
                  <div className="text-sm font-semibold text-muted-foreground">
                    {platformDisplayNames[platform] || platform}
                  </div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                      className="text-2xl font-bold"
                      data-testid={`text-followers-${platform.toLowerCase()}`}
                    >
                      {data.count.toLocaleString()}
                    </motion.div>
                    {data.growth !== 0 && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                          data.growth > 0
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        {data.growth > 0 ? (
                          <ArrowUp className="h-3.5 w-3.5 font-bold" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 font-bold" />
                        )}
                        <span className="text-xs font-bold">{Math.abs(data.growth).toFixed(1)}%</span>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
          </div>
        )}

        <div className="pt-2">
          <ConnectAccountsDialog profileId={profileId} />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-xs text-muted-foreground text-center pt-2"
        >
          {hasConnectedAccounts
            ? "Stats refresh automatically every minute"
            : "Connect your accounts to display live follower counts and statistics"}
        </motion.p>
      </CardContent>
    </motion.div>
  );
}
