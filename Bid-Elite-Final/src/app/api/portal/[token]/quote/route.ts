import { db } from "@/lib/db";
import {
  rfqs,
  rfqSuppliers,
  suppliers,
  quotes,
  quoteItems,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { logAudit, AUDIT_ACTIONS } from "@/lib/utils/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    const rsResult = await db
      .select({
        id: rfqSuppliers.id,
        rfqId: rfqSuppliers.rfqId,
        supplierId: rfqSuppliers.supplierId,
        status: rfqSuppliers.status,
        supplierName: suppliers.name,
        rfqStatus: rfqs.status,
        rfqPackageName: rfqs.packageName,
      })
      .from(rfqSuppliers)
      .innerJoin(rfqs, eq(rfqSuppliers.rfqId, rfqs.id))
      .innerJoin(suppliers, eq(rfqSuppliers.supplierId, suppliers.id))
      .where(eq(rfqSuppliers.portalToken, token))
      .limit(1);

    if (rsResult.length === 0) {
      return NextResponse.json({ error: "Invalid portal link" }, { status: 404 });
    }

    const rs = rsResult[0];

    if (rs.rfqStatus === "closed") {
      return NextResponse.json(
        { error: "This RFQ is no longer accepting quotes" },
        { status: 400 },
      );
    }

    if (rs.status === "quoted") {
      return NextResponse.json(
        { error: "You have already submitted a quote for this RFQ" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const {
      coverLetter,
      totalAmount,
      currency,
      deliveryDays,
      validityDays,
      items,
      attachments,
    } = body;

    if (!totalAmount || Number(totalAmount) <= 0) {
      return NextResponse.json(
        { error: "Total amount is required and must be positive" },
        { status: 400 },
      );
    }

    if (deliveryDays == null || Number(deliveryDays) <= 0) {
      return NextResponse.json(
        { error: "Delivery days is required and must be positive" },
        { status: 400 },
      );
    }

    if (validityDays == null || Number(validityDays) <= 0) {
      return NextResponse.json(
        { error: "Validity days is required and must be positive" },
        { status: 400 },
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one line item is required" },
        { status: 400 },
      );
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.description?.trim()) {
        return NextResponse.json(
          { error: `Item ${i + 1}: Description is required` },
          { status: 400 },
        );
      }
      if (!item.quantity || Number(item.quantity) <= 0) {
        return NextResponse.json(
          { error: `Item ${i + 1}: Quantity must be positive` },
          { status: 400 },
        );
      }
      if (!item.unitPrice || Number(item.unitPrice) < 0) {
        return NextResponse.json(
          { error: `Item ${i + 1}: Unit price must be non-negative` },
          { status: 400 },
        );
      }
    }

    const itemsTotal = items.reduce(
      (sum: number, item: { quantity: string; unitPrice: string }) =>
        sum + Number(item.quantity) * Number(item.unitPrice),
      0,
    );
    const submittedTotal = Number(totalAmount);
    const diff = Math.abs(itemsTotal - submittedTotal) / itemsTotal;
    if (diff > 0.1) {
      return NextResponse.json(
        {
          error: `Total amount (${submittedTotal.toFixed(2)}) differs from line items total (${itemsTotal.toFixed(2)}) by more than 10%. Please verify.`,
        },
        { status: 400 },
      );
    }

    const quoteResult = await db
      .insert(quotes)
      .values({
        rfqId: rs.rfqId,
        supplierId: rs.supplierId,
        coverLetter: coverLetter?.trim() || null,
        totalAmount: String(totalAmount),
        currency: currency || "USD",
        deliveryDays: Number(deliveryDays),
        validityDays: Number(validityDays),
        attachments: attachments ?? [],
      })
      .returning({ id: quotes.id });

    const quoteId = quoteResult[0].id;

    await db.insert(quoteItems).values(
      items.map(
        (
          item: { description: string; unit: string; quantity: string; unitPrice: string },
          index: number,
        ) => ({
          quoteId,
          description: item.description.trim(),
          unit: item.unit?.trim() || "pcs",
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
          totalPrice: String(Number(item.quantity) * Number(item.unitPrice)),
          sortOrder: index,
        }),
      ),
    );

    await db
      .update(rfqSuppliers)
      .set({ status: "quoted", quotedAt: new Date() })
      .where(eq(rfqSuppliers.id, rs.id));

    await logAudit({
      action: AUDIT_ACTIONS.QUOTE_SUBMITTED,
      entityType: "quote",
      entityId: quoteId,
      details: {
        rfqId: rs.rfqId,
        supplierId: rs.supplierId,
        supplierName: rs.supplierName,
        totalAmount: String(totalAmount),
        currency: currency || "USD",
        packageName: rs.rfqPackageName,
      },
    });

    return NextResponse.json(
      {
        quote: {
          id: quoteId,
          totalAmount: String(totalAmount),
          currency: currency || "USD",
          itemCount: items.length,
          submittedAt: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to submit quote" },
      { status: 500 },
    );
  }
}
