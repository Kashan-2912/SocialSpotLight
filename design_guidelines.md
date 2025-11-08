# Link-in-Bio App Design Guidelines

## Design Approach
**Reference-Based**: Drawing inspiration from Linktree and Beacons for layout structure, Instagram for profile presentation, and modern portfolio aesthetics for card design. This creates a personal brand showcase that feels polished and contemporary.

## Layout Architecture

### Single-Page Vertical Flow
- Centered container with max-width of 600px for optimal mobile/desktop experience
- Consistent horizontal padding: px-6 on mobile, px-8 on desktop
- Vertical rhythm using py-8 spacing between major sections

### Section Structure (Top to Bottom)
1. **Profile Header** - Profile image, name, bio (py-12)
2. **Social Links Grid** - Main content area with link cards (py-8)
3. **Footer** - Minimal branding/credits (py-6)

## Typography System

### Hierarchy
- **Profile Name**: 2xl to 3xl, bold weight (font-bold), tight line height
- **Bio Text**: Base size, regular weight, relaxed line height for readability
- **Link Titles**: lg size, medium weight (font-medium)
- **Link Descriptions**: sm size, regular weight (subtle, secondary text)

### Font Selection
- Use Google Fonts: "Inter" for clean modern aesthetic throughout
- Single font family maintains cohesion

## Spacing System
**Consistent Tailwind Units**: 2, 4, 6, 8, 12, 16
- Card gaps: gap-4
- Internal card padding: p-6
- Section spacing: py-8 to py-12
- Element margins: mb-4, mb-6, mb-8

## Component Library

### Profile Section
- **Profile Image**: 120px circular avatar (w-30 h-30), centered, with subtle border
- **Name**: Centered below image with mb-4
- **Bio**: Centered, max 2-3 lines, mb-8

### Social Link Cards
- **Card Container**: Full-width rounded cards (rounded-2xl), subtle elevation shadow
- **Layout**: Flex row with icon left, content center, chevron/arrow right
- **Icon Area**: 48px square container (w-12 h-12) with platform icon
- **Content**: Title and optional subtitle/description stacked
- **Interaction**: Entire card is clickable with smooth hover lift effect (transform scale)
- **Spacing**: gap-4 between cards in vertical stack

### Platform Icons
- **Library**: Use Heroicons or Font Awesome via CDN
- **Size**: 24px (w-6 h-6) for social platform icons
- **Treatment**: Icons appear in their native style within circular or square containers

### Link Types Supported
- Primary social links (Instagram, Twitter, LinkedIn, TikTok, YouTube)
- Professional links (GitHub, Portfolio, Website)
- Contact methods (Email, Phone)
- Custom links with generic link icon

### Interaction States
- **Hover**: Cards lift slightly (translate-y-1), shadow intensifies
- **Active/Click**: Subtle scale down (scale-95) for tactile feedback
- **Focus**: Keyboard navigation with visible outline rings

## Visual Treatments

### Card Design Pattern
- Subtle background with soft transparency
- Border radius: rounded-2xl for modern feel
- Shadow: Layered shadows (small base + medium on hover)
- No harsh borders - rely on shadow for definition

### Profile Picture Treatment
- Subtle ring/border around avatar
- Slight shadow for depth
- Centered positioning with generous breathing room

## Responsive Behavior

### Mobile (Default)
- Full-width cards with px-6 container padding
- Single column layout
- Profile image 96px (w-24 h-24)
- Touch-friendly card heights (min-h-20)

### Desktop (md: breakpoint)
- Maintain centered 600px max-width
- Profile image scales to 120px (w-30 h-30)
- Increased vertical spacing (py-12 vs py-8)
- Cards maintain clickable areas with hover states

## Special Features

### Copy Link Functionality
- Small copy icon button on each card's right side
- Toast notification appears on successful copy
- Icon changes momentarily to checkmark for feedback

### Edit Mode (Admin View)
- Toggle to show drag handles on left of each card
- Reorder functionality with visual dragging state
- Add/Remove buttons appear on cards
- Edit icon opens modal for link customization

## Page Background
- Subtle gradient or solid treatment
- Maintains readability and doesn't compete with cards
- Creates depth without distraction

## Images
- **Profile Picture**: Random placeholder avatar (via placeholder service or library)
- **Platform Icons**: Use icon library, not custom images
- **No hero image**: This is a profile page, not a landing page

## Accessibility
- Semantic HTML with proper heading hierarchy
- ARIA labels on all interactive elements
- Keyboard navigation through all links
- Focus indicators on all interactive elements
- Sufficient contrast ratios throughout