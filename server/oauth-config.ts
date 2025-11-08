import { config } from 'dotenv';
config();

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  userInfoUrl: string;
  requiresPKCE?: boolean;
  additionalAuthParams?: Record<string, string>;
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

export const OAUTH_CONFIGS: Record<string, OAuthConfig> = {
  instagram: {
    clientId: process.env.INSTAGRAM_CLIENT_ID || '',
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
    redirectUri: `${BASE_URL}/api/auth/instagram/callback`,
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scopes: ['instagram_basic', 'instagram_manage_insights'],
    userInfoUrl: 'https://graph.facebook.com/me',
    additionalAuthParams: {
      config_id: process.env.INSTAGRAM_CONFIG_ID || '',
    },
  },
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID || '',
    clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
    redirectUri: `${BASE_URL}/api/auth/twitter/callback`,
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    scopes: ['tweet.read', 'users.read', 'offline.access'],
    userInfoUrl: 'https://api.twitter.com/2/users/me',
    requiresPKCE: true,
  },
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    redirectUri: `${BASE_URL}/api/auth/linkedin/callback`,
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scopes: ['openid', 'profile', 'email'],
    userInfoUrl: 'https://api.linkedin.com/v2/userinfo',
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    redirectUri: `${BASE_URL}/api/auth/github/callback`,
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: ['read:user'],
    userInfoUrl: 'https://api.github.com/user',
  },
  youtube: {
    clientId: process.env.YOUTUBE_CLIENT_ID || '',
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
    redirectUri: `${BASE_URL}/api/auth/youtube/callback`,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  },
};

export function getOAuthConfig(platform: string): OAuthConfig | null {
  return OAUTH_CONFIGS[platform] || null;
}
