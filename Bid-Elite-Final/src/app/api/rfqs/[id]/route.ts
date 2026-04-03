import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rfqs, rfqSuppliers, suppliers, quotes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const rfqResult = await db.select().from(rfqs).where(eq(rfqs.id, id)).limit(1);

    if (rfqResult.length === 0) {
      return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
    }

    const rfqData = rfqResult[0];

    const supplierLinks = await db
      .select({
        id: rfqSuppliers.id,
        supplierId: rfqSuppliers.supplierId,
        status: rfqSuppliers.status,
        emailSentAt: rfqSuppliers.emailSentAt,
        viewedAt: rfqSuppliers.viewedAt,
        quotedAt: rfqSuppliers.quotedAt,
        portalToken: rfqSuppliers.portalToken,
        supplierName: suppliers.name,
        supplierEmail: suppliers.email,
      })
      .from(rfqSuppliers)
      .innerJoin(suppliers, eq(rfqSuppliers.supplierId, suppliers.id))
      .where(eq(rfqSuppliers.rfqId, id));

    const quoteResults = await db
      .select({
        id: quotes.id,
        supplierId: quotes.supplierId,
        coverLetter: quotes.coverLetter,
        totalAmount: quotes.totalAmount,
        currency: quotes.currency,
        deliveryDays: quotes.deliveryDays,
        validityDays: quotes.validityDays,
        status: quotes.status,
        scores: quotes.scores,
        totalScore: quotes.totalScore,
        submittedAt: quotes.submittedAt,
      })
      .from(quotes)
      .where(eq(quotes.rfqId, id))
      .orderBy(quotes.submittedAt);

    return NextResponse.json({
      rfq: rfqData,
      suppliers: supplierLinks,
      quotes: quoteResults,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch RFQ" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await db.select({ status: rfqs.status }).from(rfqs).where(eq(rfqs.id, id)).limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
    }

    if (existing[0].status === "closed") {
      return NextResponse.json({ error: "Cannot edit a closed RFQ" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (body.packageName !== undefined) updates.packageName = body.packageName.trim();
    if (body.reference !== undefined) updates.reference = body.reference?.trim() || null;
    if (body.deadline !== undefined) updates.deadline = body.deadline || null;
    if (body.template !== undefined) updates.template = body.template;
    if (body.details !== undefined) updates.details = body.details?.trim() || null;
    if (body.packageLink !== undefined) updates.packageLink = body.packageLink?.trim() || null;
    if (body.docsLink !== undefined) updates.docsLink = body.docsLink?.trim() || null;
    if (body.evaluationCriteria !== undefined) updates.evaluationCriteria = body.evaluationCriteria;

    await db.update(rfqs).set(updates).where(eq(rfqs.id, id));

    if (body.supplierIds !== undefined) {
      await db.delete(rfqSuppliers).where(eq(rfqSuppliers.rfqId, id));

      if (body.supplierIds.length > 0) {
        await db.insert(rfqSuppliers).values(
          body.supplierIds.map((supplierId: string) => ({
            rfqId: id,
            supplierId,
            portalToken: crypto.randomUUID(),
          }))
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update RFQ" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await db.select({ status: rfqs.status }).from(rfqs).where(eq(rfqs.id, id)).limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
    }

    if (existing[0].status !== "draft") {
      return NextResponse.json({ error: "Only draft RFQs can be deleted" }, { status: 400 });
    }

    await db.delete(rfqSuppliers).where(eq(rfqSuppliers.rfqId, id));
    await db.delete(rfqs).where(eq(rfqs.id, id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete RFQ" }, { status: 500 });
  }
}
