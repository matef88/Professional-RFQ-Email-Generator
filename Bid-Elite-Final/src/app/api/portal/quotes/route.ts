import { getPortalSession } from "@/lib/auth/portal-auth";
import { db } from "@/lib/db";
import { rfqs, quotes, quoteItems } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getPortalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quoteRows = await db
      .select({
        id: quotes.id,
        rfqId: quotes.rfqId,
        coverLetter: quotes.coverLetter,
        totalAmount: quotes.totalAmount,
        currency: quotes.currency,
        deliveryDays: quotes.deliveryDays,
        validityDays: quotes.validityDays,
        status: quotes.status,
        submittedAt: quotes.submittedAt,
      })
      .from(quotes)
      .where(eq(quotes.supplierId, session.supplierId))
      .orderBy(desc(quotes.submittedAt));

    const rfqIds = [...new Set(quoteRows.map((q) => q.rfqId))];
    const rfqNameMap: Record<string, string> = {};
    for (const rfqId of rfqIds) {
      const r = await db
        .select({ packageName: rfqs.packageName })
        .from(rfqs)
        .where(eq(rfqs.id, rfqId))
        .limit(1);
      if (r.length > 0) rfqNameMap[rfqId] = r[0].packageName;
    }

    const quotesWithNames = await Promise.all(
      quoteRows.map(async (q) => {
        const items = await db
          .select({
            id: quoteItems.id,
            description: quoteItems.description,
            unit: quoteItems.unit,
            quantity: quoteItems.quantity,
            unitPrice: quoteItems.unitPrice,
            totalPrice: quoteItems.totalPrice,
          })
          .from(quoteItems)
          .where(eq(quoteItems.quoteId, q.id))
          .orderBy(quoteItems.sortOrder);

        return {
          ...q,
          packageName: rfqNameMap[q.rfqId] ?? "Unknown RFQ",
          items,
        };
      }),
    );

    return NextResponse.json({ quotes: quotesWithNames });
  } catch {
    return NextResponse.json({ error: "Failed to load quotes" }, { status: 500 });
  }
}
