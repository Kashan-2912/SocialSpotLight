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
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Settings, X } from "lucide-react";
import {
  FaInstagram,
  FaTwitter,
  FaLinkedin,
  FaGithub,
  FaYoutube,
  FaTiktok,
  FaSpotify,
  FaGlobe,
} from "react-icons/fa";
import { SOCIAL_PLATFORMS } from "@shared/platforms";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ConnectedAccount } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const PLATFORM_ICONS: Record<string, React.ComponentType<any>> = {
  FaInstagram,
  FaTwitter,
  FaLinkedin,
  FaGithub,
  FaYoutube,
  FaTiktok,
  FaSpotify,
  FaGlobe,
};

interface ConnectAccountsDialogProps {
  profileId: string;
  onAccountConnected?: () => void;
}

export default function ConnectAccountsDialog({
  profileId,
  onAccountConnected,
}: ConnectAccountsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [manualData, setManualData] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: connectedAccounts = [] } = useQuery<ConnectedAccount[]>({
    queryKey: ["/api/connected-accounts", profileId],
    queryFn: async () => {
      const response = await fetch(`/api/connected-accounts/${profileId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: open,
  });

  const connectOAuth = useMutation({
    mutationFn: async (platformId: string) => {
      // Redirect to OAuth endpoint
      window.location.href = `/api/auth/${platformId}/connect?profileId=${profileId}`;
    },
  });

  const connectManual = useMutation({
    mutationFn: async ({
      platformId,
      data,
    }: {
      platformId: string;
      data: Record<string, string>;
    }) => {
      const response = await fetch("/api/social-links/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          platform: platformId,
          ...data,
        }),
      });
      if (!response.ok) throw new Error("Failed to connect");
      return response.json();
    },
    onSuccess: () => {
      setSelectedPlatform(null);
      setManualData({});
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/profile", profileId, "links"] });
      toast({
        title: "Success",
        description: "Link added successfully!",
      });
      onAccountConnected?.();
      setOpen(false);
    },
  });

  const disconnectAccount = useMutation({
    mutationFn: async (platformId: string) => {
      const response = await fetch(`/api/disconnect/${platformId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });
      if (!response.ok) throw new Error("Failed to disconnect");
      return response.json();
    },
    onSuccess: (_, platformId) => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/connected-accounts", profileId] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile", profileId, "links"] });
      toast({
        title: "Disconnected",
        description: "Account disconnected successfully!",
      });
      onAccountConnected?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to disconnect account",
        variant: "destructive",
      });
    },
  });

  const isConnected = (platformId: string) =>
    connectedAccounts.some((acc) => acc.platform === platformId);

  const handlePlatformClick = (platformId: string) => {
    const platform = SOCIAL_PLATFORMS.find((p) => p.id === platformId);
    if (!platform) return;

    if (platform.authType === "oauth2") {
      connectOAuth.mutate(platformId);
    } else {
      setSelectedPlatform(platformId);
    }
  };

  const handleManualSubmit = (platformId: string) => {
    connectManual.mutate({ platformId, data: manualData });
  };

  const selectedPlatformData = SOCIAL_PLATFORMS.find(
    (p) => p.id === selectedPlatform
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" data-testid="button-connect-social">
          <Settings className="h-4 w-4" />
          Connect Social Media Accounts
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Connect Social Media Accounts</DialogTitle>
          <DialogDescription>
            Connect your social media accounts to display live stats and sync your links
          </DialogDescription>
        </DialogHeader>

        {selectedPlatform && selectedPlatformData?.authType === "manual" ? (
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => setSelectedPlatform(null)}
              className="mb-2"
            >
              ← Back to platforms
            </Button>
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                {(() => {
                  const Icon =
                    PLATFORM_ICONS[selectedPlatformData.icon] || FaGlobe;
                  return <Icon className="h-5 w-5" />;
                })()}
                {selectedPlatformData.name}
              </h3>
              {selectedPlatformData.fields?.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>{field.label}</Label>
                  <Input
                    id={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={manualData[field.name] || ""}
                    onChange={(e) =>
                      setManualData({
                        ...manualData,
                        [field.name]: e.target.value,
                      })
                    }
                  />
                </div>
              ))}
              <Button
                onClick={() => handleManualSubmit(selectedPlatform)}
                disabled={connectManual.isPending}
                className="w-full"
              >
                {connectManual.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Add Link
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 py-4">
            {SOCIAL_PLATFORMS.map((platform, index) => {
              const Icon = PLATFORM_ICONS[platform.icon] || FaGlobe;
              const connected = isConnected(platform.id);

              return (
                <motion.div
                  key={platform.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    variant="outline"
                    className="w-full h-auto p-4 flex flex-col items-center gap-2 relative"
                    onClick={() => handlePlatformClick(platform.id)}
                    disabled={connectOAuth.isPending || connected}
                  >
                    {connected && (
                      <Badge
                        variant="secondary"
                        className="absolute top-2 right-2 h-5 w-5 p-0 flex items-center justify-center bg-green-500 text-white"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                      </Badge>
                    )}
                    <Icon
                      className="h-8 w-8"
                      style={{ color: platform.color }}
                    />
                    <span className="text-sm font-medium">{platform.name}</span>
                    {platform.authType === "manual" && (
                      <span className="text-xs text-muted-foreground">
                        Manual
                      </span>
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}

        {!selectedPlatform && connectedAccounts.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Connected Accounts</h4>
            <div className="space-y-2">
              {connectedAccounts.map((account) => {
                const platform = SOCIAL_PLATFORMS.find(
                  (p) => p.id === account.platform
                );
                const Icon = platform
                  ? PLATFORM_ICONS[platform.icon]
                  : FaGlobe;
                return (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-2 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="h-4 w-4" />}
                      <span className="text-sm font-medium">
                        {platform?.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        @{account.username}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        Connected
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => disconnectAccount.mutate(account.platform)}
                        disabled={disconnectAccount.isPending}
                        title="Disconnect account"
                      >
                        {disconnectAccount.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
