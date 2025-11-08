import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Social Media Stats
        </CardTitle>
        <CardDescription>
          Live follower counts across platforms
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Demo Mode: Displaying sample data. Connect social media accounts to show live follower counts.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-4">
          {mockStats.map((stat, index) => (
            <motion.div
              key={stat.platform}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2 opacity-60"
            >
              <div className="text-sm font-medium text-muted-foreground">
                {stat.platform}
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold" data-testid={`text-followers-${stat.platform.toLowerCase()}`}>
                  {stat.followers.toLocaleString()}
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.growth}%
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>

        <ConnectAccountsDialog profileId={profileId} />

        <p className="text-xs text-muted-foreground text-center">
          Connect your accounts to display live follower counts and statistics
        </p>
      </CardContent>
    </Card>
  );
}
