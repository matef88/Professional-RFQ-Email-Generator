import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { users, companySettings } from "./schema";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

async function seed() {
  const db = drizzle(sql);

  const hashedPassword = await hash("admin123", 12);

  const usersToSeed = [
    {
      name: "Admin",
      email: "admin@elite-n.com",
      password: hashedPassword,
      role: "admin" as const,
    },
    {
      name: "A. Taky",
      email: "a.taky@elite-n.com",
      password: hashedPassword,
      role: "admin" as const,
    },
    {
      name: "M. Ali",
      email: "m.ali@elite-n.com",
      password: hashedPassword,
      role: "admin" as const,
    },
    {
      name: "M. Atef",
      email: "m.atef@elite-n.com",
      password: hashedPassword,
      role: "admin" as const,
    }
  ];

  for (const u of usersToSeed) {
    const existing = await db.select().from(users).where(eq(users.email, u.email));
    if (existing.length === 0) {
      await db.insert(users).values(u);
      console.log(`Created user: ${u.email}`);
    } else {
      console.log(`User already exists: ${u.email}`);
    }
  }

  const existingAdmin = await db.select().from(users).where(eq(users.email, "admin@elite-n.com"));
  if (existingAdmin.length > 0) {
    const existingSettings = await db.select().from(companySettings).limit(1);
    if (existingSettings.length === 0) {
      await db.insert(companySettings).values({
        name: "Elite Nexus",
        shortName: "EN",
        tagline: "Premium Fit-Out & Technical Solutions",
        city: "Riyadh",
        country: "Saudi Arabia",
        email: "info@elite-n.com",
        website: "elite-n.com",
        biddingEmail: "bidding@elite-n.com",
        adminEmail: "info@elite-n.com",
        signatureTeamName: "Bidding Team",
        updatedBy: existingAdmin[0].id,
      });
      console.log("Created default company settings");
    } else {
      console.log("Company settings already exist");
    }
  }

  console.log("Seed complete");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
