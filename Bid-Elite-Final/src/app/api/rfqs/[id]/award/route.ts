import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rfqs, quotes, suppliers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { logAudit, AUDIT_ACTIONS } from "@/lib/utils/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { supplierId } = body;

    if (!supplierId) {
      return NextResponse.json({ error: "supplierId is required" }, { status: 400 });
    }

    const rfqResult = await db
      .select({
        id: rfqs.id,
        status: rfqs.status,
        packageName: rfqs.packageName,
        awardedSupplierId: rfqs.awardedSupplierId,
      })
      .from(rfqs)
      .where(eq(rfqs.id, id))
      .limit(1);

    if (rfqResult.length === 0) {
      return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
    }

    if (rfqResult[0].awardedSupplierId) {
      return NextResponse.json({ error: "RFQ already awarded" }, { status: 400 });
    }

    const supplierResult = await db
      .select({ id: suppliers.id, name: suppliers.name })
      .from(suppliers)
      .where(eq(suppliers.id, supplierId))
      .limit(1);

    if (supplierResult.length === 0) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const quoteResult = await db
      .select({ id: quotes.id })
      .from(quotes)
      .where(eq(quotes.rfqId, id))
      .limit(1);

    const hasSubmittedQuote = quoteResult.some(
      (q) => q.id !== undefined,
    );

    if (!hasSubmittedQuote) {
      return NextResponse.json(
        { error: "No quotes submitted for this RFQ" },
        { status: 400 },
      );
    }

    const winningQuote = await db
      .select({ id: quotes.id })
      .from(quotes)
      .where(eq(quotes.supplierId, supplierId))
      .limit(1);

    if (winningQuote.length === 0) {
      return NextResponse.json(
        { error: "Selected supplier has not submitted a quote" },
        { status: 400 },
      );
    }

    await db
      .update(rfqs)
      .set({
        awardedSupplierId: supplierId,
        awardedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(rfqs.id, id));

    if (winningQuote[0]) {
      await db
        .update(quotes)
        .set({
          status: "shortlisted",
          reviewedAt: new Date(),
          reviewedBy: userId,
        })
        .where(eq(quotes.id, winningQuote[0].id));
    }

    await logAudit({
      userId,
      action: AUDIT_ACTIONS.RFQ_AWARDED,
      entityType: "rfq",
      entityId: id,
      details: {
        supplierId,
        supplierName: supplierResult[0].name,
        quoteId: winningQuote[0]?.id,
        packageName: rfqResult[0].packageName,
      },
    });

    return NextResponse.json({
      success: true,
      awardedSupplier: supplierResult[0].name,
      awardedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to award supplier" }, { status: 500 });
  }
}
