import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertProfileSchema,
  insertSocialLinkSchema,
  insertPageViewSchema,
  insertLinkClickSchema,
} from "@shared/schema";
import { randomUUID } from "crypto";
import oauthRoutes from "./oauth-routes";

function getVisitorId(req: Request): string {
  let visitorId = req.cookies?.visitorId;
  if (!visitorId) {
    visitorId = randomUUID();
  }
  return visitorId;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Register OAuth routes
  app.use('/api', oauthRoutes);

  app.get("/api/profile/:id", async (req, res) => {
    try {
      const profile = await storage.getProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.post("/api/profile", async (req, res) => {
    try {
      const validatedData = insertProfileSchema.parse(req.body);
      const profile = await storage.createProfile(validatedData);
      res.status(201).json(profile);
    } catch (error) {
      res.status(400).json({ error: "Invalid profile data" });
    }
  });

  app.patch("/api/profile/:id", async (req, res) => {
    try {
      const profile = await storage.updateProfile(req.params.id, req.body);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(400).json({ error: "Failed to update profile" });
    }
  });

  app.get("/api/profile/:id/links", async (req, res) => {
    try {
      const links = await storage.getSocialLinks(req.params.id);
      const now = new Date();
      const activeLinks = links.filter((link) => {
        if (!link.expiresAt) return true;
        return new Date(link.expiresAt) > now;
      });
      res.json(activeLinks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch links" });
    }
  });

  app.post("/api/links", async (req, res) => {
    try {
      const validatedData = insertSocialLinkSchema.parse(req.body);
      const link = await storage.createSocialLink(validatedData);
      res.status(201).json(link);
    } catch (error) {
      res.status(400).json({ error: "Invalid link data" });
    }
  });

  app.patch("/api/links/:id", async (req, res) => {
    try {
      const link = await storage.updateSocialLink(req.params.id, req.body);
      if (!link) {
        return res.status(404).json({ error: "Link not found" });
      }
      res.json(link);
    } catch (error) {
      res.status(400).json({ error: "Failed to update link" });
    }
  });

  app.post("/api/track/page-view", async (req, res) => {
    try {
      const visitorId = getVisitorId(req);
      const ipAddress = getClientIp(req);
      const userAgent = req.headers["user-agent"] || null;

      const validatedData = insertPageViewSchema.parse({
        ...req.body,
        visitorId,
        ipAddress,
        userAgent,
      });

      const pageView = await storage.createPageView(validatedData);
      
      res.cookie("visitorId", visitorId, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      });
      
      res.status(201).json(pageView);
    } catch (error) {
      res.status(400).json({ error: "Failed to track page view" });
    }
  });

  app.post("/api/track/link-click", async (req, res) => {
    try {
      const visitorId = getVisitorId(req);
      const ipAddress = getClientIp(req);
      const userAgent = req.headers["user-agent"] || null;

      const { linkId } = req.body;
      
      const link = await storage.getSocialLink(linkId);
      if (!link) {
        return res.status(404).json({ error: "Link not found" });
      }

      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        return res.status(410).json({ error: "Link has expired" });
      }

      await storage.incrementLinkClick(linkId);

      const validatedData = insertLinkClickSchema.parse({
        linkId,
        visitorId,
        ipAddress,
        userAgent,
      });

      const linkClick = await storage.createLinkClick(validatedData);
      
      res.status(201).json(linkClick);
    } catch (error) {
      res.status(400).json({ error: "Failed to track link click" });
    }
  });

  app.get("/api/analytics/profile/:id", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const pageViews = await storage.getPageViews(req.params.id, start, end);
      const uniqueVisitors = await storage.getUniqueVisitors(req.params.id, start, end);
      const linkClicks = await storage.getAllLinkClicks(req.params.id, start, end);

      const clicksByHour = new Array(24).fill(0);
      linkClicks.forEach((click) => {
        const hour = new Date(click.timestamp).getHours();
        clicksByHour[hour]++;
      });

      const viewsByDay: Record<string, number> = {};
      pageViews.forEach((view) => {
        const day = new Date(view.timestamp).toISOString().split("T")[0];
        viewsByDay[day] = (viewsByDay[day] || 0) + 1;
      });

      const clicksByDay: Record<string, number> = {};
      linkClicks.forEach((click) => {
        const day = new Date(click.timestamp).toISOString().split("T")[0];
        clicksByDay[day] = (clicksByDay[day] || 0) + 1;
      });

      res.json({
        totalViews: pageViews.length,
        uniqueVisitors,
        totalClicks: linkClicks.length,
        clicksByHour,
        viewsByDay,
        clicksByDay,
        recentViews: pageViews.slice(0, 100),
        recentClicks: linkClicks.slice(0, 100),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/analytics/link/:id", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const clicks = await storage.getLinkClicks(req.params.id, start, end);

      const clicksByDay: Record<string, number> = {};
      clicks.forEach((click) => {
        const day = new Date(click.timestamp).toISOString().split("T")[0];
        clicksByDay[day] = (clicksByDay[day] || 0) + 1;
      });

      res.json({
        totalClicks: clicks.length,
        clicksByDay,
        recentClicks: clicks.slice(0, 50),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch link analytics" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
