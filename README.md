# Link-in-Bio Application

A beautiful, feature-rich link-in-bio application similar to Linktree with advanced analytics, animations, and customization options.

## Features

### ✅ Implemented Features

1. **Profile Management**
   - Custom profile with name, bio, and avatar
   - Multiple social media links with platform-specific icons
   - Responsive design with dark mode support

2. **Analytics Dashboard**
   - Real-time click tracking for each link
   - Page view tracking with unique visitor detection
   - Comprehensive charts and visualizations:
     - Views & clicks over time (last 7 days)
     - Peak activity times by hour
     - Engagement metrics (click rate, average clicks per visitor)
   - Session-based visitor tracking

3. **Link Features**
   - Click counters on each social link
   - Link expiration functionality (links automatically hide when expired)
   - Multiple platform support (Instagram, Twitter, LinkedIn, GitHub, YouTube, TikTok, Spotify, and custom websites)

4. **QR Code Generation**
   - Generate QR codes for the profile page
   - Download QR codes as PNG images
   - High-quality QR codes with error correction

5. **Visual Enhancements**
   - Animated background with floating gradient shapes
   - Smooth transitions and hover effects
   - Modern, clean UI with shadcn components
   - Fully responsive design

### 🚧 Future Features

**Social Media Live Stats**
- The application includes a social media stats component in demo mode
- Currently displays sample follower data
- **Why not implemented:** Major social media platforms (Instagram, Twitter, YouTube, TikTok) have strict API access requirements:
  - OAuth authentication flows required
  - Most require paid API access or special approval
  - Rate limits and restrictions on follower count endpoints
  - Many platforms have deprecated public APIs
- **To implement in the future:**
  1. Obtain API keys/tokens from desired platforms
  2. Implement OAuth flows for authentication
  3. Create backend service to fetch and cache follower counts
  4. Update frontend to consume live data with loading/error states

## Tech Stack

- **Frontend:** React, TypeScript, TailwindCSS, shadcn/ui
- **Backend:** Express.js, Node.js
- **Charts:** Recharts
- **Animations:** Framer Motion
- **QR Codes:** qrcode.react
- **Storage:** In-memory storage (MemStorage)

## Architecture

### Data Flow
1. User visits the profile page → Page view is tracked
2. User clicks a social link → Click is tracked, counter updates
3. Analytics dashboard aggregates data by day/hour
4. QR code is generated on-demand from current URL

### Key Components

**Backend:**
- `server/storage.ts` - In-memory data storage with interfaces
- `server/routes.ts` - API endpoints for profiles, links, and analytics
- `server/init-data.ts` - Demo data initialization

**Frontend:**
- `pages/Home.tsx` - Main profile page with social links
- `pages/Analytics.tsx` - Analytics dashboard with charts
- `components/SocialLinkCard.tsx` - Individual link card with click tracking
- `components/QRCodeDialog.tsx` - QR code generation and download
- `components/AnimatedBackground.tsx` - Floating gradient animations
- `components/SocialStats.tsx` - Social media stats display (demo mode)

## API Endpoints

- `GET /api/profile/:profileId` - Get profile data
- `GET /api/profile/:profileId/links` - Get all social links
- `POST /api/track/page-view` - Track a page view
- `POST /api/track/link-click` - Track a link click
- `GET /api/analytics/profile/:profileId` - Get aggregated analytics

## Running the Application

The application is already configured and running. Simply:
1. Visit the home page to see the link-in-bio profile
2. Click on social links to track clicks
3. Navigate to analytics dashboard to view insights
4. Generate QR codes to share your profile

## Future Enhancements

1. **Database Integration**
   - Replace in-memory storage with PostgreSQL for persistence
   - Implement data migrations

2. **Authentication**
   - User accounts and multi-profile support
   - Profile editing interface

3. **Social Media APIs**
   - Integrate with platform APIs when access is available
   - Real-time follower count updates
   - Post/content integration

4. **Advanced Analytics**
   - Geographic data (requires IP geolocation service)
   - Device/browser tracking
   - Referrer tracking
   - Custom date range selection

5. **Customization**
   - Theme customization (colors, fonts)
   - Custom backgrounds and images
   - Link scheduling
   - Priority/featured links
