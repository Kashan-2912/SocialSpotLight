import { storage } from "./storage";

const DEFAULT_PROFILE_ID = "default-profile";

export async function initializeDefaultProfile() {
  const existingProfile = await storage.getProfile(DEFAULT_PROFILE_ID);

  if (!existingProfile) {
    await storage.createProfile({
      name: "Your Name",
      bio: "Welcome to my link-in-bio page! Connect your social accounts to get started.",
      avatarUrl: null,
    });

    // Set the profile ID manually since we need it to be "default-profile"
    const profile = Array.from((storage as any).profiles.values()).find(
      (p: any) => p.name === "Your Name"
    );

    if (profile) {
      (storage as any).profiles.delete(profile.id);
      (storage as any).profiles.set(DEFAULT_PROFILE_ID, {
        ...profile,
        id: DEFAULT_PROFILE_ID,
      });
    }

    console.log("✅ Default profile initialized");
  }
}
