import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ConnectAccountsDialog from "./ConnectAccountsDialog";

interface SocialStat {
  platform: string;
  followers: number;
  growth: number;
}

const mockStats: SocialStat[] = [
  { platform: "Instagram", followers: 12500, growth: 5.2 },
  { platform: "Twitter", followers: 8300, growth: 3.1 },
  { platform: "YouTube", followers: 25000, growth: 8.5 },
  { platform: "TikTok", followers: 45000, growth: 12.3 },
];

interface SocialStatsProps {
  profileId: string;
}

export default function SocialStats({ profileId }: SocialStatsProps) {
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
        <Alert className="glass border-primary/20">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            Demo Mode: Displaying sample data. Connect social media accounts to show live follower counts.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-4">
          {mockStats.map((stat, index) => (
            <motion.div
              key={stat.platform}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              className="glass p-4 rounded-xl space-y-2 opacity-60 hover:opacity-80 transition-opacity"
            >
              <div className="text-sm font-semibold text-muted-foreground">
                {stat.platform}
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                  className="text-2xl font-bold"
                  data-testid={`text-followers-${stat.platform.toLowerCase()}`}
                >
                  {stat.followers.toLocaleString()}
                </motion.div>
                <Badge variant="secondary" className="flex items-center gap-1 glass">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="font-semibold">{stat.growth}%</span>
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="pt-2">
          <ConnectAccountsDialog profileId={profileId} />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-xs text-muted-foreground text-center pt-2"
        >
          Connect your accounts to display live follower counts and statistics
        </motion.p>
      </CardContent>
    </motion.div>
  );
}
