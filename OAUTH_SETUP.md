# OAuth Setup Guide

This guide explains how to set up OAuth for each social media platform.

## Required Environment Variables

Add these to your `.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
BASE_URL=http://localhost:5000

# Instagram (Facebook)
INSTAGRAM_CLIENT_ID=your_client_id
INSTAGRAM_CLIENT_SECRET=your_client_secret
INSTAGRAM_CONFIG_ID=your_config_id

# Twitter/X
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret

# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret

# GitHub
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

# YouTube (Google)
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
```

## Platform-Specific Setup

### Instagram (via Facebook)

1. Go to https://developers.facebook.com/apps/
2. Create a new app or use an existing one
3. Add "Instagram Basic Display" product
4. Set OAuth redirect URI: `http://localhost:5000/api/auth/instagram/callback`
5. Get your Client ID, Client Secret, and Configuration ID
6. Note: Instagram now requires Facebook Login - you may need to use Facebook Graph API

### Twitter/X

1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new app
3. Enable OAuth 2.0
4. Set Redirect URI: `http://localhost:5000/api/auth/twitter/callback`
5. Add scopes: `tweet.read`, `users.read`, `offline.access`
6. Copy Client ID and Client Secret
7. Note: Uses PKCE flow for enhanced security

### LinkedIn

1. Go to https://www.linkedin.com/developers/apps
2. Create a new app
3. Under "Auth" tab, add redirect URL: `http://localhost:5000/api/auth/linkedin/callback`
4. Request "Sign In with LinkedIn using OpenID Connect" product
5. Add scopes: `openid`, `profile`, `email`
6. Copy Client ID and Client Secret

### GitHub

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Set Authorization callback URL: `http://localhost:5000/api/auth/github/callback`
4. Copy Client ID and Client Secret
5. GitHub requires Basic Auth in token exchange

### YouTube (Google)

1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `http://localhost:5000/api/auth/youtube/callback`
4. Enable YouTube Data API v3
5. Add to test users if app is in testing mode
6. Copy Client ID and Client Secret

## Common Issues

### Instagram: "Invalid platform app"
- Make sure you're using the correct Configuration ID
- Verify the redirect URI matches exactly
- Check that Instagram Basic Display is added to your Facebook app

### Twitter: Infinite loading
- Ensure PKCE is properly implemented (already done in code)
- Verify redirect URI is exact match
- Check that all required scopes are requested

### LinkedIn: "Bummer, something went wrong"
- Use OpenID Connect scopes (`openid`, `profile`, `email`)
- Old scopes (`r_liteprofile`) are deprecated
- Verify redirect URI is approved in your app settings

### YouTube: "Error 403: access_denied"
- Add your Google account to test users in OAuth consent screen
- Or publish your app (requires verification for production)
- Make sure YouTube Data API v3 is enabled

### Website: Doesn't show immediately
- Fixed! Now uses query invalidation to refresh the UI automatically
- Toast notification confirms successful addition

## Testing

1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:5000`
3. Click "Connect Social Media Accounts"
4. Test each platform connection
5. Check server console for detailed OAuth logs
