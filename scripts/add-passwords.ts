import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../lib/db";
import { accounts, users } from "../lib/db/schema";

const scryptAsync = promisify(scryptCallback);

// Better Auth scrypt config
const config = {
  N: 16_384,
  r: 16,
  p: 1,
  dkLen: 64,
};

async function hashPasswordScrypt(password: string): Promise<string> {
  // Better Auth format: salt:key (both hex)
  // Normalize password using NFKC (same as better-auth)
  const normalizedPassword = password.normalize("NFKC");
  const salt = randomBytes(16).toString("hex");

  // Node.js crypto.scrypt API expects (password, salt, keylen, options)
  const buf = (await scryptAsync(normalizedPassword, salt, config.dkLen, {
    N: config.N,
    r: config.r,
    p: config.p,
    maxmem: 128 * config.N * config.r * 2,
  })) as Buffer;

  return `${salt}:${buf.toString("hex")}`;
}

async function addPasswords() {
  console.log("🔐 Adding passwords to users...");

  // Get all users
  const allUsers = await db.select().from(users);

  for (const user of allUsers) {
    // Check if user already has an account (password)
    const existingAccount = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, user.id))
      .limit(1);

    if (existingAccount.length > 0) {
      console.log(`✓ User ${user.email} already has password`);
      continue;
    }

    // Create password: "senha123" for all test users
    const password = "senha123";
    const hashedPassword = await hashPasswordScrypt(password);

    // Create account entry with providerId = "credential"
    await db.insert(accounts).values({
      id: nanoid(),
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: hashedPassword,
    });

    console.log(`✓ Password added for ${user.email}`);
  }

  console.log("\n✅ All passwords added successfully!");
  console.log("\n📝 Login credentials:");
  console.log("All users: senha123");
  console.log("\nUsers:");
  for (const user of allUsers) {
    console.log(`- ${user.email} (${user.role})`);
  }

  process.exit(0);
}

addPasswords().catch((error) => {
  console.error("❌ Error adding passwords:", error);
  process.exit(1);
});
