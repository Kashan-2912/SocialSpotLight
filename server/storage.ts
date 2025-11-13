import {
  type User,
  type InsertUser,
  type Profile,
  type InsertProfile,
  type SocialLink,
  type InsertSocialLink,
  type PageView,
  type InsertPageView,
  type LinkClick,
  type InsertLinkClick,
  type ConnectedAccount,
  type InsertConnectedAccount,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getProfile(id: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: string, profile: Partial<InsertProfile>): Promise<Profile | undefined>;

  getSocialLinks(profileId: string): Promise<SocialLink[]>;
  getSocialLink(id: string): Promise<SocialLink | undefined>;
  createSocialLink(link: InsertSocialLink): Promise<SocialLink>;
  updateSocialLink(id: string, link: Partial<InsertSocialLink>): Promise<SocialLink | undefined>;
  deleteSocialLink(id: string): Promise<void>;
  deleteSocialLinksByPlatform(profileId: string, platform: string): Promise<void>;
  incrementLinkClick(linkId: string): Promise<void>;

  createPageView(view: InsertPageView): Promise<PageView>;
  getPageViews(profileId: string, startDate?: Date, endDate?: Date): Promise<PageView[]>;
  getUniqueVisitors(profileId: string, startDate?: Date, endDate?: Date): Promise<number>;

  createLinkClick(click: InsertLinkClick): Promise<LinkClick>;
  getLinkClicks(linkId: string, startDate?: Date, endDate?: Date): Promise<LinkClick[]>;
  getAllLinkClicks(profileId: string, startDate?: Date, endDate?: Date): Promise<LinkClick[]>;

  getConnectedAccounts(profileId: string): Promise<ConnectedAccount[]>;
  getConnectedAccount(profileId: string, platform: string): Promise<ConnectedAccount | undefined>;
  createConnectedAccount(account: InsertConnectedAccount): Promise<ConnectedAccount>;
  updateConnectedAccount(id: string, account: Partial<InsertConnectedAccount>): Promise<ConnectedAccount | undefined>;
  deleteConnectedAccount(id: string): Promise<void>;

  // Follower history methods
  createFollowerHistory(entry: { profileId: string; platform: string; followerCount: number }): Promise<void>;
  getLatestFollowerCount(profileId: string, platform: string): Promise<number | null>;
  getPreviousFollowerCount(profileId: string, platform: string): Promise<number | null>;
}

interface FollowerHistoryEntry {
  id: string;
  profileId: string;
  platform: string;
  followerCount: number;
  timestamp: Date;
}

export class MemStorage implements IStorage {
  public users: Map<string, User>;
  public profiles: Map<string, Profile>;
  public socialLinks: Map<string, SocialLink>;
  public pageViews: Map<string, PageView>;
  public linkClicks: Map<string, LinkClick>;
  public connectedAccounts: Map<string, ConnectedAccount>;
  public followerHistory: Map<string, FollowerHistoryEntry>;

  constructor() {
    this.users = new Map();
    this.profiles = new Map();
    this.socialLinks = new Map();
    this.pageViews = new Map();
    this.linkClicks = new Map();
    this.connectedAccounts = new Map();
    this.followerHistory = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getProfile(id: string): Promise<Profile | undefined> {
    return this.profiles.get(id);
  }

  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    const id = randomUUID();
    const profile: Profile = { 
      ...insertProfile, 
      id,
      bio: insertProfile.bio ?? null,
      avatarUrl: insertProfile.avatarUrl ?? null,
    };
    this.profiles.set(id, profile);
    return profile;
  }

  async updateProfile(id: string, updates: Partial<InsertProfile>): Promise<Profile | undefined> {
    const profile = this.profiles.get(id);
    if (!profile) return undefined;
    const updated = { ...profile, ...updates };
    this.profiles.set(id, updated);
    return updated;
  }

  async getSocialLinks(profileId: string): Promise<SocialLink[]> {
    return Array.from(this.socialLinks.values())
      .filter((link) => link.profileId === profileId)
      .sort((a, b) => a.order - b.order);
  }

  async getSocialLink(id: string): Promise<SocialLink | undefined> {
    return this.socialLinks.get(id);
  }

  async createSocialLink(insertLink: InsertSocialLink): Promise<SocialLink> {
    const id = randomUUID();
    const link: SocialLink = { 
      ...insertLink, 
      id,
      order: insertLink.order ?? 0,
      clickCount: 0,
      expiresAt: insertLink.expiresAt ?? null,
    };
    this.socialLinks.set(id, link);
    return link;
  }

  async updateSocialLink(id: string, updates: Partial<InsertSocialLink>): Promise<SocialLink | undefined> {
    const link = this.socialLinks.get(id);
    if (!link) return undefined;
    const updated = { ...link, ...updates };
    this.socialLinks.set(id, updated);
    return updated;
  }

  async deleteSocialLink(id: string): Promise<void> {
    this.socialLinks.delete(id);
  }

  async deleteSocialLinksByPlatform(profileId: string, platform: string): Promise<void> {
    const links = await this.getSocialLinks(profileId);
    const platformLinks = links.filter(link => link.platform === platform);
    platformLinks.forEach(link => this.socialLinks.delete(link.id));
  }

  async incrementLinkClick(linkId: string): Promise<void> {
    const link = this.socialLinks.get(linkId);
    if (link) {
      link.clickCount += 1;
      this.socialLinks.set(linkId, link);
    }
  }

  async createPageView(insertView: InsertPageView): Promise<PageView> {
    const id = randomUUID();
    const view: PageView = { 
      ...insertView, 
      id,
      timestamp: new Date(),
      userAgent: insertView.userAgent ?? null,
      ipAddress: insertView.ipAddress ?? null,
      country: insertView.country ?? null,
      city: insertView.city ?? null,
    };
    this.pageViews.set(id, view);
    return view;
  }

  async getPageViews(profileId: string, startDate?: Date, endDate?: Date): Promise<PageView[]> {
    return Array.from(this.pageViews.values())
      .filter((view) => {
        if (view.profileId !== profileId) return false;
        if (startDate && view.timestamp < startDate) return false;
        if (endDate && view.timestamp > endDate) return false;
        return true;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getUniqueVisitors(profileId: string, startDate?: Date, endDate?: Date): Promise<number> {
    const views = await this.getPageViews(profileId, startDate, endDate);
    const uniqueVisitors = new Set(views.map(v => v.visitorId));
    return uniqueVisitors.size;
  }

  async createLinkClick(insertClick: InsertLinkClick): Promise<LinkClick> {
    const id = randomUUID();
    const click: LinkClick = { 
      ...insertClick, 
      id,
      timestamp: new Date(),
      userAgent: insertClick.userAgent ?? null,
      ipAddress: insertClick.ipAddress ?? null,
    };
    this.linkClicks.set(id, click);
    return click;
  }

  async getLinkClicks(linkId: string, startDate?: Date, endDate?: Date): Promise<LinkClick[]> {
    return Array.from(this.linkClicks.values())
      .filter((click) => {
        if (click.linkId !== linkId) return false;
        if (startDate && click.timestamp < startDate) return false;
        if (endDate && click.timestamp > endDate) return false;
        return true;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getAllLinkClicks(profileId: string, startDate?: Date, endDate?: Date): Promise<LinkClick[]> {
    const links = await this.getSocialLinks(profileId);
    const linkIds = new Set(links.map(l => l.id));

    return Array.from(this.linkClicks.values())
      .filter((click) => {
        if (!linkIds.has(click.linkId)) return false;
        if (startDate && click.timestamp < startDate) return false;
        if (endDate && click.timestamp > endDate) return false;
        return true;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getConnectedAccounts(profileId: string): Promise<ConnectedAccount[]> {
    return Array.from(this.connectedAccounts.values())
      .filter((account) => account.profileId === profileId)
      .sort((a, b) => b.connectedAt.getTime() - a.connectedAt.getTime());
  }

  async getConnectedAccount(profileId: string, platform: string): Promise<ConnectedAccount | undefined> {
    return Array.from(this.connectedAccounts.values())
      .find((account) => account.profileId === profileId && account.platform === platform);
  }

  async createConnectedAccount(insertAccount: InsertConnectedAccount): Promise<ConnectedAccount> {
    const id = randomUUID();
    const account: ConnectedAccount = {
      ...insertAccount,
      id,
      refreshToken: insertAccount.refreshToken ?? null,
      tokenExpiresAt: insertAccount.tokenExpiresAt ?? null,
      connectedAt: new Date(),
    };
    this.connectedAccounts.set(id, account);
    return account;
  }

  async updateConnectedAccount(id: string, updates: Partial<InsertConnectedAccount>): Promise<ConnectedAccount | undefined> {
    const account = this.connectedAccounts.get(id);
    if (!account) return undefined;
    const updated = { ...account, ...updates };
    this.connectedAccounts.set(id, updated);
    return updated;
  }

  async deleteConnectedAccount(id: string): Promise<void> {
    this.connectedAccounts.delete(id);
  }

  // Follower history methods
  async createFollowerHistory(entry: { profileId: string; platform: string; followerCount: number }): Promise<void> {
    const id = randomUUID();
    const historyEntry: FollowerHistoryEntry = {
      ...entry,
      id,
      timestamp: new Date(),
    };
    this.followerHistory.set(id, historyEntry);
  }

  async getLatestFollowerCount(profileId: string, platform: string): Promise<number | null> {
    const entries = Array.from(this.followerHistory.values())
      .filter((entry) => entry.profileId === profileId && entry.platform === platform)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return entries.length > 0 ? entries[0].followerCount : null;
  }

  async getPreviousFollowerCount(profileId: string, platform: string): Promise<number | null> {
    const entries = Array.from(this.followerHistory.values())
      .filter((entry) => entry.profileId === profileId && entry.platform === platform)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Return the second most recent entry (if exists)
    return entries.length > 1 ? entries[1].followerCount : null;
  }
}

export const storage = new MemStorage();
