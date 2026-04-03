import { db } from "./index";
import { suppliers } from "./schema";
import { sql } from "drizzle-orm";

async function migrateScopes() {
  console.log("Starting scopes migration...");

  const allSuppliers = await db
    .select({
      id: suppliers.id,
      category: suppliers.category,
      scopes: suppliers.scopes,
    })
    .from(suppliers);

  console.log(`Found ${allSuppliers.length} suppliers`);

  let migrated = 0;

  for (const supplier of allSuppliers) {
    const currentScopes = supplier.scopes ?? [];
    if (currentScopes.length > 0) {
      console.log(`Skipping ${supplier.id} — already has scopes`);
      continue;
    }

    if (supplier.category && supplier.category.trim()) {
      await db
        .update(suppliers)
        .set({ scopes: [supplier.category.trim()] })
        .where(sql`${suppliers.id} = ${supplier.id}`);

      console.log(`Migrated ${supplier.id}: category="${supplier.category}" → scopes=["${supplier.category.trim()}"]`);
      migrated++;
    } else {
      await db
        .update(suppliers)
        .set({ scopes: [] })
        .where(sql`${suppliers.id} = ${supplier.id}`);

      console.log(`Set empty scopes for ${supplier.id}`);
      migrated++;
    }
  }

  console.log(`Migration complete. Updated ${migrated} suppliers.`);
}

migrateScopes()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
