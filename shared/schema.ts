import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
});

export const socialLinks = pgTable("social_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull(),
  platform: text("platform").notNull(),
  url: text("url").notNull(),
  displayText: text("display_text").notNull(),
  order: integer("order").notNull().default(0),
  clickCount: integer("click_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
});

export const pageViews = pgTable("page_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull(),
  visitorId: text("visitor_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  country: text("country"),
  city: text("city"),
});

export const linkClicks = pgTable("link_clicks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  linkId: varchar("link_id").notNull(),
  visitorId: text("visitor_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
});

export const connectedAccounts = pgTable("connected_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull(),
  platform: text("platform").notNull(),
  accountId: text("account_id").notNull(),
  username: text("username").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  connectedAt: timestamp("connected_at").notNull().defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
});

export const insertSocialLinkSchema = createInsertSchema(socialLinks).omit({
  id: true,
  clickCount: true,
});

export const insertPageViewSchema = createInsertSchema(pageViews).omit({
  id: true,
  timestamp: true,
});

export const insertLinkClickSchema = createInsertSchema(linkClicks).omit({
  id: true,
  timestamp: true,
});

export const insertConnectedAccountSchema = createInsertSchema(connectedAccounts).omit({
  id: true,
  connectedAt: true,
});

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertSocialLink = z.infer<typeof insertSocialLinkSchema>;
export type SocialLink = typeof socialLinks.$inferSelect;
export type InsertPageView = z.infer<typeof insertPageViewSchema>;
export type PageView = typeof pageViews.$inferSelect;
export type InsertLinkClick = z.infer<typeof insertLinkClickSchema>;
export type LinkClick = typeof linkClicks.$inferSelect;
export type InsertConnectedAccount = z.infer<typeof insertConnectedAccountSchema>;
export type ConnectedAccount = typeof connectedAccounts.$inferSelect;
