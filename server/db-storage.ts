import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { db } from './db';
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
  users,
  profiles,
  socialLinks,
  pageViews,
  linkClicks,
  connectedAccounts,
  followerHistory,
} from '@shared/schema';
import type { IStorage } from './storage';

export class DbStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Profile methods
  async getProfile(id: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    return result[0];
  }

  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    const result = await db.insert(profiles).values(insertProfile).returning();
    return result[0];
  }

  async updateProfile(id: string, updates: Partial<InsertProfile>): Promise<Profile | undefined> {
    const result = await db.update(profiles)
      .set(updates)
      .where(eq(profiles.id, id))
      .returning();
    return result[0];
  }

  // Social Link methods
  async getSocialLinks(profileId: string): Promise<SocialLink[]> {
    return await db.select()
      .from(socialLinks)
      .where(eq(socialLinks.profileId, profileId))
      .orderBy(socialLinks.order);
  }

  async getSocialLink(id: string): Promise<SocialLink | undefined> {
    const result = await db.select().from(socialLinks).where(eq(socialLinks.id, id)).limit(1);
    return result[0];
  }

  async createSocialLink(insertLink: InsertSocialLink): Promise<SocialLink> {
    const result = await db.insert(socialLinks).values(insertLink).returning();
    return result[0];
  }

  async updateSocialLink(id: string, updates: Partial<InsertSocialLink>): Promise<SocialLink | undefined> {
    const result = await db.update(socialLinks)
      .set(updates)
      .where(eq(socialLinks.id, id))
      .returning();
    return result[0];
  }

  async deleteSocialLink(id: string): Promise<void> {
    await db.delete(socialLinks).where(eq(socialLinks.id, id));
  }

  async deleteSocialLinksByPlatform(profileId: string, platform: string): Promise<void> {
    await db.delete(socialLinks)
      .where(and(
        eq(socialLinks.profileId, profileId),
        eq(socialLinks.platform, platform)
      ));
  }

  async incrementLinkClick(linkId: string): Promise<void> {
    const link = await this.getSocialLink(linkId);
    if (link) {
      await db.update(socialLinks)
        .set({ clickCount: link.clickCount + 1 })
        .where(eq(socialLinks.id, linkId));
    }
  }

  // Page View methods
  async createPageView(insertView: InsertPageView): Promise<PageView> {
    const result = await db.insert(pageViews).values(insertView).returning();
    return result[0];
  }

  async getPageViews(profileId: string, startDate?: Date, endDate?: Date): Promise<PageView[]> {
    const conditions = [eq(pageViews.profileId, profileId)];

    if (startDate) {
      conditions.push(gte(pageViews.timestamp, startDate));
    }
    if (endDate) {
      conditions.push(lte(pageViews.timestamp, endDate));
    }

    return await db.select()
      .from(pageViews)
      .where(and(...conditions))
      .orderBy(desc(pageViews.timestamp));
  }

  async getUniqueVisitors(profileId: string, startDate?: Date, endDate?: Date): Promise<number> {
    const views = await this.getPageViews(profileId, startDate, endDate);
    const uniqueVisitors = new Set(views.map(v => v.visitorId));
    return uniqueVisitors.size;
  }

  // Link Click methods
  async createLinkClick(insertClick: InsertLinkClick): Promise<LinkClick> {
    const result = await db.insert(linkClicks).values(insertClick).returning();
    return result[0];
  }

  async getLinkClicks(linkId: string, startDate?: Date, endDate?: Date): Promise<LinkClick[]> {
    const conditions = [eq(linkClicks.linkId, linkId)];

    if (startDate) {
      conditions.push(gte(linkClicks.timestamp, startDate));
    }
    if (endDate) {
      conditions.push(lte(linkClicks.timestamp, endDate));
    }

    return await db.select()
      .from(linkClicks)
      .where(and(...conditions))
      .orderBy(desc(linkClicks.timestamp));
  }

  async getAllLinkClicks(profileId: string, startDate?: Date, endDate?: Date): Promise<LinkClick[]> {
    const links = await this.getSocialLinks(profileId);
    const linkIds = links.map(l => l.id);

    if (linkIds.length === 0) {
      return [];
    }

    const allClicks = await db.select()
      .from(linkClicks)
      .orderBy(desc(linkClicks.timestamp));

    // Filter by linkIds and date range
    return allClicks.filter(click => {
      if (!linkIds.includes(click.linkId)) return false;
      if (startDate && click.timestamp < startDate) return false;
      if (endDate && click.timestamp > endDate) return false;
      return true;
    });
  }

  // Connected Account methods
  async getConnectedAccounts(profileId: string): Promise<ConnectedAccount[]> {
    return await db.select()
      .from(connectedAccounts)
      .where(eq(connectedAccounts.profileId, profileId))
      .orderBy(desc(connectedAccounts.connectedAt));
  }

  async getConnectedAccount(profileId: string, platform: string): Promise<ConnectedAccount | undefined> {
    const result = await db.select()
      .from(connectedAccounts)
      .where(and(
        eq(connectedAccounts.profileId, profileId),
        eq(connectedAccounts.platform, platform)
      ))
      .limit(1);
    return result[0];
  }

  async createConnectedAccount(insertAccount: InsertConnectedAccount): Promise<ConnectedAccount> {
    const result = await db.insert(connectedAccounts).values(insertAccount).returning();
    return result[0];
  }

  async updateConnectedAccount(id: string, updates: Partial<InsertConnectedAccount>): Promise<ConnectedAccount | undefined> {
    const result = await db.update(connectedAccounts)
      .set(updates)
      .where(eq(connectedAccounts.id, id))
      .returning();
    return result[0];
  }

  async deleteConnectedAccount(id: string): Promise<void> {
    await db.delete(connectedAccounts).where(eq(connectedAccounts.id, id));
  }

  // Follower History methods
  async createFollowerHistory(entry: { profileId: string; platform: string; followerCount: number }): Promise<void> {
    await db.insert(followerHistory).values(entry);
  }

  async getLatestFollowerCount(profileId: string, platform: string): Promise<number | null> {
    const result = await db.select()
      .from(followerHistory)
      .where(and(
        eq(followerHistory.profileId, profileId),
        eq(followerHistory.platform, platform)
      ))
      .orderBy(desc(followerHistory.timestamp))
      .limit(1);

    return result.length > 0 ? result[0].followerCount : null;
  }

  async getPreviousFollowerCount(profileId: string, platform: string): Promise<number | null> {
    const result = await db.select()
      .from(followerHistory)
      .where(and(
        eq(followerHistory.profileId, profileId),
        eq(followerHistory.platform, platform)
      ))
      .orderBy(desc(followerHistory.timestamp))
      .limit(2);

    // Return the second most recent entry (if exists)
    return result.length > 1 ? result[1].followerCount : null;
  }
}

export const dbStorage = new DbStorage();
