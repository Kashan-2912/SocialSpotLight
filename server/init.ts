import { eq } from "drizzle-orm";
import { db } from "./db";
import { profiles } from "@shared/schema";

const DEFAULT_PROFILE_ID = "default-profile";

export async function initializeDefaultProfile() {
  try {
    // Check if default profile exists
    const existingProfile = await db.select()
      .from(profiles)
      .where(eq(profiles.id, DEFAULT_PROFILE_ID))
      .limit(1);

    if (existingProfile.length === 0) {
      // Create default profile with specific ID
      await db.insert(profiles).values({
        id: DEFAULT_PROFILE_ID,
        name: "Your Name",
        bio: "Welcome to my link-in-bio page! Connect your social accounts to get started.",
        avatarUrl: null,
      });

      console.log("✅ Default profile initialized with ID:", DEFAULT_PROFILE_ID);
    }
  } catch (error) {
    console.error("❌ Error initializing default profile:", error);
  }
}
