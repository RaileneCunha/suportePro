import "dotenv/config";
import { db, pool } from "../server/db";
import { profiles } from "../shared/schema";
import { eq, or, like } from "drizzle-orm";

// Script to make a user admin by name
// Usage: tsx script/make-admin-by-name.ts <first-name> <last-name>

async function makeAdminByName(firstName: string, lastName?: string) {
  try {
    // First, get user by name
    const { users } = await import("../shared/models/auth");
    
    let user;
    if (lastName) {
      // Try to find by first and last name
      const allUsers = await db.select().from(users);
      user = allUsers.find(u => 
        u.firstName?.toLowerCase() === firstName.toLowerCase() &&
        u.lastName?.toLowerCase() === lastName.toLowerCase()
      );
    } else {
      // Try to find by first name only
      const allUsers = await db.select().from(users);
      user = allUsers.find(u => 
        u.firstName?.toLowerCase() === firstName.toLowerCase()
      );
    }
    
    if (!user) {
      console.error(`User with name "${firstName} ${lastName || ''}" not found`);
      console.log("\nAvailable users:");
      const allUsers = await db.select().from(users);
      allUsers.forEach(u => {
        console.log(`  - ${u.firstName || ''} ${u.lastName || ''} (${u.email})`);
      });
      process.exit(1);
    }

    console.log(`Found user: ${user.firstName} ${user.lastName || ''} (${user.email}, ID: ${user.id})`);

    // Check if profile exists
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id));
    
    if (profile) {
      // Update existing profile
      const [updated] = await db
        .update(profiles)
        .set({ role: "admin" })
        .where(eq(profiles.userId, user.id))
        .returning();
      console.log(`✅ Profile updated to admin for user: ${user.email}`);
      console.log(`   Role: ${updated.role}`);
    } else {
      // Create new profile with admin role
      const [created] = await db
        .insert(profiles)
        .values({ userId: user.id, role: "admin" })
        .returning();
      console.log(`✅ Profile created with admin role for user: ${user.email}`);
      console.log(`   Role: ${created.role}`);
    }
    
    console.log("\n🎉 Usuário promovido a administrador com sucesso!");
    console.log("   Recarregue a página da aplicação para ver as mudanças.");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const firstName = process.argv[2];
const lastName = process.argv[3];

if (!firstName) {
  console.error("Usage: tsx script/make-admin-by-name.ts <first-name> [last-name]");
  console.error("Example: tsx script/make-admin-by-name.ts railene cunha");
  process.exit(1);
}

makeAdminByName(firstName, lastName);
