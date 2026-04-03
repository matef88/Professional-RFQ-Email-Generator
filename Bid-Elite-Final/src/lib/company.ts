import { db } from "@/lib/db";
import { companySettings } from "@/lib/db/schema";

export async function getCompanySettings() {
  const rows = await db.select().from(companySettings).limit(1);
  return rows[0] ?? null;
}
