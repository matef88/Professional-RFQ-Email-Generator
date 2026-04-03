import { getPortalSession } from "@/lib/auth/portal-auth";
import { db } from "@/lib/db";
import { rfqSuppliers, rfqs, quotes, quoteItems } from "@/lib/db/schema";
import { eq, desc, and, ne } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getPortalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rfqRows = await db
      .select({
        id: rfqSuppliers.id,
        rfqId: rfqSuppliers.rfqId,
        packageName: rfqs.packageName,
        reference: rfqs.reference,
        deadline: rfqs.deadline,
        rfqStatus: rfqs.status,
        supplierStatus: rfqSuppliers.status,
        portalToken: rfqSuppliers.portalToken,
        emailSentAt: rfqSuppliers.emailSentAt,
        viewedAt: rfqSuppliers.viewedAt,
        quotedAt: rfqSuppliers.quotedAt,
      })
      .from(rfqSuppliers)
      .innerJoin(rfqs, eq(rfqSuppliers.rfqId, rfqs.id))
      .where(eq(rfqSuppliers.supplierId, session.supplierId))
      .orderBy(desc(rfqSuppliers.emailSentAt));

    const quoteRows = await db
      .select({
        id: quotes.id,
        rfqId: quotes.rfqId,
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

    const quotesWithNames = quoteRows.map((q) => ({
      ...q,
      packageName: rfqNameMap[q.rfqId] ?? "Unknown RFQ",
    }));

    const activeRfqs = rfqRows.filter(
      (r) => r.rfqStatus === "sent" || r.rfqStatus === "open",
    ).length;
    const pendingResponses = rfqRows.filter(
      (r) => r.supplierStatus === "pending" || r.supplierStatus === "viewed",
    ).length;
    const recentQuotes = quotesWithNames.slice(0, 5);

    return NextResponse.json({
      rfqs: rfqRows,
      quotes: quotesWithNames,
      recentQuotes,
      stats: {
        activeRfqs,
        totalQuotes: quoteRows.length,
        pendingResponses,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
