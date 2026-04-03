import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { suppliers: importList } = await request.json();

    if (!Array.isArray(importList) || importList.length === 0) {
      return NextResponse.json({ error: "No valid suppliers provided" }, { status: 400 });
    }

    const batch = importList.map((s: any) => ({
      name: s.name?.trim(),
      email: s.email?.trim().toLowerCase(),
      phone: s.phone?.trim() || null,
      contactPerson: s.contactPerson?.trim() || null,
      category: s.category?.trim() || null,
      scopes: Array.isArray(s.scopes) ? s.scopes : [],
      portalToken: randomUUID(),
      createdBy: userId,
    })).filter((s) => !!s.name && !!s.email);

    if (batch.length === 0) {
       return NextResponse.json({ error: "No valid suppliers found after validation" }, { status: 400 });
    }

    const uniqueBatchMap = new Map();
    for (const b of batch) {
       uniqueBatchMap.set(b.email, b);
    }
    const finalBatch = Array.from(uniqueBatchMap.values());

    let importedCount = 0;
    let updatedCount = 0;

    await db.transaction(async (tx) => {
      const existingList = await tx.select({ email: suppliers.email }).from(suppliers);
      const existingEmails = new Set(existingList.map(e => e.email.toLowerCase()));

      for (const item of finalBatch) {
         if (existingEmails.has(item.email)) {
            await tx.update(suppliers).set({
               name: item.name,
               phone: item.phone,
               contactPerson: item.contactPerson,
               category: item.category,
               scopes: item.scopes,
            }).where(eq(suppliers.email, item.email));
            updatedCount++;
         } else {
            await tx.insert(suppliers).values({ ...item, isActive: true });
            importedCount++;
         }
      }
    });

    return NextResponse.json({ 
      success: true, 
      imported: importedCount, 
      updated: updatedCount, 
      totalProcessed: finalBatch.length 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ error: "Failed to perform bulk import. Ensure the data matches expected formats." }, { status: 500 });
  }
}
