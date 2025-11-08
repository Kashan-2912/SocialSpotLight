export interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  authType: 'oauth2' | 'manual';
  scopes?: string[];
  fields?: {
    name: string;
    label: string;
    placeholder: string;
    type: 'text' | 'url';
  }[];
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'FaInstagram',
    color: '#E4405F',
    authType: 'oauth2',
    scopes: ['user_profile', 'user_media'],
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: 'FaTwitter',
    color: '#1DA1F2',
    authType: 'oauth2',
    scopes: ['tweet.read', 'users.read'],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'FaLinkedin',
    color: '#0A66C2',
    authType: 'oauth2',
    scopes: ['r_liteprofile', 'r_emailaddress'],
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: 'FaGithub',
    color: '#181717',
    authType: 'oauth2',
    scopes: ['read:user'],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: 'FaYoutube',
    color: '#FF0000',
    authType: 'oauth2',
    scopes: ['https://www.googleapis.com/auth/youtube.readonly'],
  },
  {
    id: 'website',
    name: 'Website',
    icon: 'FaGlobe',
    color: '#6366F1',
    authType: 'manual',
    fields: [
      {
        name: 'url',
        label: 'Website URL',
        placeholder: 'https://example.com',
        type: 'url',
      },
      {
        name: 'displayText',
        label: 'Display Text',
        placeholder: 'My Website',
        type: 'text',
      },
    ],
  },
];

export function getPlatformById(id: string): SocialPlatform | undefined {
  return SOCIAL_PLATFORMS.find(p => p.id === id);
}
