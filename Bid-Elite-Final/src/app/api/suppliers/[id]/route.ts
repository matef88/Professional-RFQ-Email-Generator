import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { suppliers, rfqSuppliers, rfqs, quotes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
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

    const supplierResult = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);

    if (supplierResult.length === 0) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const rfqHistory = await db
      .select({
        id: rfqSuppliers.id,
        rfqId: rfqs.id,
        packageName: rfqs.packageName,
        reference: rfqs.reference,
        deadline: rfqs.deadline,
        rfqStatus: rfqs.status,
        supplierStatus: rfqSuppliers.status,
        emailSentAt: rfqSuppliers.emailSentAt,
        viewedAt: rfqSuppliers.viewedAt,
        quotedAt: rfqSuppliers.quotedAt,
      })
      .from(rfqSuppliers)
      .innerJoin(rfqs, eq(rfqSuppliers.rfqId, rfqs.id))
      .where(eq(rfqSuppliers.supplierId, id))
      .orderBy(desc(rfqSuppliers.emailSentAt));

    const quoteResults = await db
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
      .where(eq(quotes.supplierId, id))
      .orderBy(desc(quotes.submittedAt));

    const rfqIds = [...new Set(quoteResults.map((q) => q.rfqId))];
    const rfqNameMap: Record<string, string> = {};

    if (rfqIds.length > 0) {
      const rfqData = await db
        .select({ id: rfqs.id, packageName: rfqs.packageName })
        .from(rfqs)
        .where(eq(rfqs.id, rfqIds[0]));

      for (const r of rfqData) {
        rfqNameMap[r.id] = r.packageName;
      }

      if (rfqIds.length > 1) {
        for (let i = 1; i < rfqIds.length; i++) {
          const extra = await db
            .select({ id: rfqs.id, packageName: rfqs.packageName })
            .from(rfqs)
            .where(eq(rfqs.id, rfqIds[i]));
          for (const r of extra) {
            rfqNameMap[r.id] = r.packageName;
          }
        }
      }
    }

    return NextResponse.json({
      supplier: supplierResult[0],
      rfqHistory,
      quotes: quoteResults.map((q) => ({
        ...q,
        packageName: rfqNameMap[q.rfqId] ?? "Unknown RFQ",
      })),
      stats: {
        totalRfqs: rfqHistory.length,
        totalQuotes: quoteResults.length,
        averageAmount: quoteResults.length > 0
          ? quoteResults.reduce((sum, q) => sum + (q.totalAmount ? Number(q.totalAmount) : 0), 0) / quoteResults.filter((q) => q.totalAmount).length
          : null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch supplier" }, { status: 500 });
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

    const existing = await db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.email !== undefined) updates.email = body.email.trim();
    if (body.phone !== undefined) updates.phone = body.phone?.trim() || null;
    if (body.contactPerson !== undefined) updates.contactPerson = body.contactPerson?.trim() || null;
    if (body.address !== undefined) updates.address = body.address?.trim() || null;
    if (body.category !== undefined) updates.category = body.category?.trim() || null;
    if (body.scopes !== undefined) updates.scopes = Array.isArray(body.scopes) ? body.scopes : [];
    if (body.notes !== undefined) updates.notes = body.notes?.trim() || null;
    if (body.isActive !== undefined) updates.isActive = body.isActive;

    await db.update(suppliers).set(updates).where(eq(suppliers.id, id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 });
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

    const userRole = session.user.role;
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    await db
      .update(suppliers)
      .set({ isActive: false })
      .where(eq(suppliers.id, id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 });
  }
}
