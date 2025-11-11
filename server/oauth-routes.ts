import { Router, type Request, type Response } from 'express';
import { storage } from './storage';
import { getOAuthConfig } from './oauth-config';
import { randomUUID, createHash } from 'crypto';

const router = Router();

// Frontend URL for OAuth redirects
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5000';

// Store pending OAuth states temporarily
const pendingStates = new Map<
  string,
  {
    profileId: string;
    platform: string;
    timestamp: number;
    codeVerifier?: string;
  }
>();

// Clean up old states (older than 10 minutes)
setInterval(() => {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  Array.from(pendingStates.entries()).forEach(([state, data]) => {
    if (data.timestamp < tenMinutesAgo) {
      pendingStates.delete(state);
    }
  });
}, 5 * 60 * 1000);

// Helper function to generate PKCE code verifier and challenge
function generatePKCE() {
  const codeVerifier = randomUUID() + randomUUID();
  const codeChallenge = createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  return { codeVerifier, codeChallenge };
}

// Get connected accounts for a profile
router.get('/connected-accounts/:profileId', async (req: Request, res: Response) => {
  try {
    const { profileId } = req.params;
    const accounts = await storage.getConnectedAccounts(profileId);

    // Don't send access tokens to client
    const sanitized = accounts.map((acc) => ({
      id: acc.id,
      profileId: acc.profileId,
      platform: acc.platform,
      username: acc.username,
      connectedAt: acc.connectedAt,
    }));

    res.json(sanitized);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Initiate OAuth flow
router.get('/auth/:platform/connect', (req: Request, res: Response) => {
  try {
    const { platform } = req.params;
    const { profileId } = req.query;

    if (!profileId) {
      return res.status(400).json({ message: 'Profile ID is required' });
    }

    const config = getOAuthConfig(platform);
    if (!config) {
      return res.status(400).json({ message: 'Invalid platform' });
    }

    if (!config.clientId || !config.clientSecret) {
      return res.status(400).json({
        message: `${platform} OAuth is not configured. Please set the required environment variables.`,
      });
    }

    // Generate state for CSRF protection
    const state = randomUUID();
    const stateData: any = {
      profileId: profileId as string,
      platform,
      timestamp: Date.now(),
    };

    // Build authorization URL
    const authUrl = new URL(config.authUrl);
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('redirect_uri', config.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', config.scopes.join(' '));
    authUrl.searchParams.set('state', state);

    // Add PKCE for platforms that require it
    if (config.requiresPKCE) {
      const { codeVerifier, codeChallenge } = generatePKCE();
      stateData.codeVerifier = codeVerifier;
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
    }

    // Add additional auth params if specified
    if (config.additionalAuthParams) {
      Object.entries(config.additionalAuthParams).forEach(([key, value]) => {
        if (value) {
          authUrl.searchParams.set(key, value);
        }
      });
    }

    pendingStates.set(state, stateData);

    res.redirect(authUrl.toString());
  } catch (error: any) {
    console.error('OAuth initiation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// OAuth callback handler
router.get('/auth/:platform/callback', async (req: Request, res: Response) => {
  try {
    const { platform } = req.params;
    const { code, state, error, error_description } = req.query;

    if (error) {
      console.error(`OAuth error from ${platform}:`, error, error_description);
      return res.redirect(
        `${FRONTEND_URL}/?error=${encodeURIComponent(error as string)}&desc=${encodeURIComponent((error_description as string) || '')}`
      );
    }

    if (!code || !state) {
      return res.redirect(`${FRONTEND_URL}/?error=missing_code_or_state`);
    }

    // Verify state
    const stateData = pendingStates.get(state as string);
    if (!stateData || stateData.platform !== platform) {
      return res.redirect(`${FRONTEND_URL}/?error=invalid_state`);
    }
    pendingStates.delete(state as string);

    const config = getOAuthConfig(platform);
    if (!config) {
      return res.redirect(`${FRONTEND_URL}/?error=invalid_platform`);
    }

    // Prepare token request body
    const tokenBody: Record<string, string> = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code as string,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    };

    // Add PKCE code verifier if required
    if (config.requiresPKCE && stateData.codeVerifier) {
      tokenBody.code_verifier = stateData.codeVerifier;
    }

    // Exchange code for access token
    const tokenHeaders: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    };

    // GitHub and Twitter require Basic auth in headers
    if (platform === 'github' || platform === 'twitter') {
      const auth = Buffer.from(
        `${config.clientId}:${config.clientSecret}`
      ).toString('base64');
      tokenHeaders['Authorization'] = `Basic ${auth}`;
      // For Basic auth, don't include client_id and client_secret in body
      delete tokenBody.client_id;
      delete tokenBody.client_secret;
    }

    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: tokenHeaders,
      body: new URLSearchParams(tokenBody),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`Token exchange failed for ${platform}:`, errorText);
      return res.redirect(`${FRONTEND_URL}/?error=token_exchange_failed&platform=${platform}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in;

    if (!accessToken) {
      console.error(`No access token received for ${platform}:`, tokenData);
      return res.redirect(`${FRONTEND_URL}/?error=no_access_token`);
    }

    // Fetch user info
    let userInfoUrl = config.userInfoUrl;

    // Add platform-specific params
    if (platform === 'instagram') {
      userInfoUrl = `${userInfoUrl}?fields=id,username&access_token=${accessToken}`;
    }

    const userInfoHeaders: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
    };

    const userInfoResponse = await fetch(userInfoUrl, {
      headers: userInfoHeaders,
    });

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error(`User info fetch failed for ${platform}:`, errorText);
      return res.redirect(`${FRONTEND_URL}/?error=user_info_failed&platform=${platform}`);
    }

    const userInfo = await userInfoResponse.json();
    console.log(`User info for ${platform}:`, JSON.stringify(userInfo, null, 2));

    // Extract username based on platform
    let username = '';
    let accountId = '';

    switch (platform) {
      case 'instagram':
        username = userInfo.username || userInfo.id || 'Instagram User';
        accountId = userInfo.id || '';
        break;
      case 'twitter':
        username = userInfo.data?.username || userInfo.username || 'Twitter User';
        accountId = userInfo.data?.id || userInfo.id || '';
        break;
      case 'linkedin':
        // OpenID Connect returns: given_name, family_name, name, sub
        // v2 API returns: localizedFirstName, localizedLastName, id
        username = userInfo.name ||
                   `${userInfo.given_name || ''} ${userInfo.family_name || ''}`.trim() ||
                   `${userInfo.localizedFirstName || ''} ${userInfo.localizedLastName || ''}`.trim() ||
                   'LinkedIn User';
        accountId = userInfo.sub || userInfo.id || '';
        break;
      case 'github':
        username = userInfo.login || userInfo.name || 'GitHub User';
        accountId = userInfo.id?.toString() || '';
        break;
      case 'youtube':
        username = userInfo.name || 'YouTube User';
        accountId = userInfo.id || '';

        // Fetch YouTube channel information
        try {
          const channelResponse = await fetch(
            'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          console.log('YouTube channel API response status:', channelResponse.status);

          if (channelResponse.ok) {
            const channelData = await channelResponse.json();
            console.log('YouTube channel data:', JSON.stringify(channelData, null, 2));

            if (channelData.items && channelData.items.length > 0) {
              const channel = channelData.items[0];
              // Store channel ID in accountId for later URL generation
              accountId = channel.id || accountId;
              username = channel.snippet?.title || username;
              console.log('✅ YouTube channel found - ID:', accountId, 'Name:', username);
            } else {
              console.log('⚠️  No YouTube channel found for this account');
            }
          } else {
            const errorText = await channelResponse.text();
            console.error('❌ YouTube channel API error:', errorText);
          }
        } catch (error) {
          console.error('❌ Failed to fetch YouTube channel:', error);
          // Continue with basic userInfo if channel fetch fails
        }
        break;
      default:
        username = 'Unknown';
        accountId = 'unknown';
    }

    if (!accountId) {
      console.error(`Could not extract account ID for ${platform}:`, userInfo);
      return res.redirect(`${FRONTEND_URL}/?error=invalid_user_data&platform=${platform}`);
    }

    // Check if account already connected
    const existing = await storage.getConnectedAccount(
      stateData.profileId,
      platform
    );

    if (existing) {
      // Update existing connection
      await storage.updateConnectedAccount(existing.id, {
        accessToken,
        refreshToken,
        tokenExpiresAt: expiresIn
          ? new Date(Date.now() + expiresIn * 1000)
          : undefined,
        username,
        accountId,
      });
    } else {
      // Create new connection
      await storage.createConnectedAccount({
        profileId: stateData.profileId,
        platform,
        accountId,
        username,
        accessToken,
        refreshToken,
        tokenExpiresAt: expiresIn
          ? new Date(Date.now() + expiresIn * 1000)
          : undefined,
      });
    }

    // Create or update social link for display on profile
    const existingLinks = await storage.getSocialLinks(stateData.profileId);
    const existingLink = existingLinks.find(link => link.platform === platform);

    // Generate platform URL
    let platformUrl = '';
    switch (platform) {
      case 'instagram':
        platformUrl = `https://instagram.com/${username.replace('@', '')}`;
        break;
      case 'twitter':
        platformUrl = `https://twitter.com/${username.replace('@', '')}`;
        break;
      case 'linkedin':
        platformUrl = `https://linkedin.com/in/${username.toLowerCase().replace(/\s+/g, '-')}`;
        break;
      case 'github':
        platformUrl = `https://github.com/${username}`;
        break;
      case 'youtube':
        // Use channel URL if channel exists, otherwise just youtube.com
        console.log('YouTube accountId for URL generation:', accountId);
        if (accountId && accountId.startsWith('UC')) {
          // accountId is a YouTube channel ID (starts with UC)
          platformUrl = `https://youtube.com/channel/${accountId}`;
          console.log('Generated YouTube channel URL:', platformUrl);
        } else {
          // No channel exists, use base YouTube URL
          platformUrl = 'https://youtube.com';
          console.log('No valid channel ID, using youtube.com');
        }
        break;
    }

    if (!existingLink && platformUrl) {
      const maxOrder = existingLinks.reduce((max, link) => Math.max(max, link.order), 0);
      await storage.createSocialLink({
        profileId: stateData.profileId,
        platform,
        url: platformUrl,
        displayText: username.startsWith('@') ? username : `@${username}`,
        order: maxOrder + 1,
      });
    }

    // Redirect back to home with success
    res.redirect(`${FRONTEND_URL}/?connected=${platform}`);
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    res.redirect(`${FRONTEND_URL}/?error=callback_error`);
  }
});

// Manual link creation (for website and other non-OAuth platforms)
router.post('/social-links/manual', async (req: Request, res: Response) => {
  try {
    const { profileId, platform, url, displayText } = req.body;

    if (!profileId || !platform || !url || !displayText) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get the next order number
    const existingLinks = await storage.getSocialLinks(profileId);
    const maxOrder = existingLinks.reduce(
      (max, link) => Math.max(max, link.order),
      0
    );

    const link = await storage.createSocialLink({
      profileId,
      platform,
      url,
      displayText,
      order: maxOrder + 1,
    });

    res.json(link);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Disconnect OAuth account
router.post('/disconnect/:platform', async (req: Request, res: Response) => {
  try {
    const { platform } = req.params;
    const { profileId } = req.body;

    if (!profileId) {
      return res.status(400).json({ message: 'Missing profileId' });
    }

    // Get the connected account
    const connectedAccount = await storage.getConnectedAccount(profileId, platform);

    if (!connectedAccount) {
      return res.status(404).json({ message: 'Account not connected' });
    }

    const config = getOAuthConfig(platform);

    // Revoke OAuth token if the platform supports it
    if (config && connectedAccount.accessToken) {
      try {
        let revokeUrl = '';
        let revokeMethod = 'POST';
        let revokeBody: Record<string, string> = {};
        let revokeHeaders: Record<string, string> = {
          'Content-Type': 'application/x-www-form-urlencoded',
        };

        switch (platform) {
          case 'github':
            // GitHub: DELETE request to revoke token
            revokeUrl = `https://api.github.com/applications/${config.clientId}/token`;
            revokeMethod = 'DELETE';
            const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
            revokeHeaders['Authorization'] = `Basic ${auth}`;
            revokeBody = { access_token: connectedAccount.accessToken };
            break;

          case 'google':
          case 'youtube':
            // Google/YouTube: POST to revoke endpoint
            revokeUrl = `https://oauth2.googleapis.com/revoke?token=${connectedAccount.accessToken}`;
            break;

          case 'linkedin':
            // LinkedIn doesn't have a revoke endpoint, token expires naturally
            console.log('LinkedIn does not support token revocation');
            break;

          case 'twitter':
            // Twitter OAuth 2.0: POST to revoke endpoint
            revokeUrl = 'https://api.twitter.com/2/oauth2/revoke';
            const twitterAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
            revokeHeaders['Authorization'] = `Basic ${twitterAuth}`;
            revokeBody = {
              token: connectedAccount.accessToken,
              token_type_hint: 'access_token',
            };
            break;

          default:
            console.log(`No revocation endpoint configured for ${platform}`);
        }

        // Attempt to revoke the token
        if (revokeUrl) {
          const revokeResponse = await fetch(revokeUrl, {
            method: revokeMethod,
            headers: revokeHeaders,
            body: Object.keys(revokeBody).length > 0
              ? new URLSearchParams(revokeBody)
              : undefined,
          });

          if (!revokeResponse.ok) {
            console.error(`Failed to revoke ${platform} token:`, await revokeResponse.text());
            // Continue with disconnect even if revocation fails
          } else {
            console.log(`✅ Successfully revoked ${platform} token`);
          }
        }
      } catch (error) {
        console.error(`Error revoking ${platform} token:`, error);
        // Continue with disconnect even if revocation fails
      }
    }

    // Delete the connected account
    await storage.deleteConnectedAccount(connectedAccount.id);

    // Delete associated social links
    await storage.deleteSocialLinksByPlatform(profileId, platform);

    res.json({ message: 'Account disconnected successfully', platform });
  } catch (error: any) {
    console.error('Disconnect error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
