import "dotenv/config";
import { db, pool } from "../server/db";
import { profiles } from "../shared/schema";
import { eq } from "drizzle-orm";

// Script to make a user admin
// Usage: tsx script/make-admin.ts <user-email>

async function makeAdmin(email: string) {
  try {
    // First, get user by email
    const { users } = await import("../shared/models/auth");
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    console.log(`Found user: ${user.email} (ID: ${user.id})`);

    // Check if profile exists
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id));
    
    if (profile) {
      // Update existing profile
      const [updated] = await db
        .update(profiles)
        .set({ role: "admin" })
        .where(eq(profiles.userId, user.id))
        .returning();
      console.log(`✅ Profile updated to admin for user: ${email}`);
      console.log(`   Role: ${updated.role}`);
    } else {
      // Create new profile with admin role
      const [created] = await db
        .insert(profiles)
        .values({ userId: user.id, role: "admin" })
        .returning();
      console.log(`✅ Profile created with admin role for user: ${email}`);
      console.log(`   Role: ${created.role}`);
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: tsx script/make-admin.ts <user-email>");
  console.error("Example: tsx script/make-admin.ts seu@email.com");
  process.exit(1);
}

makeAdmin(email);
