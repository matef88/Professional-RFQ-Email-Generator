import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { quotes, quoteItems, suppliers, quoteStatusEnum } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { logAudit, AUDIT_ACTIONS } from "@/lib/utils/audit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const quoteResult = await db
      .select({
        id: quotes.id,
        rfqId: quotes.rfqId,
        supplierId: quotes.supplierId,
        coverLetter: quotes.coverLetter,
        totalAmount: quotes.totalAmount,
        currency: quotes.currency,
        deliveryDays: quotes.deliveryDays,
        validityDays: quotes.validityDays,
        status: quotes.status,
        attachments: quotes.attachments,
        submittedAt: quotes.submittedAt,
        reviewedAt: quotes.reviewedAt,
        reviewedBy: quotes.reviewedBy,
        notes: quotes.notes,
        supplierName: suppliers.name,
        supplierEmail: suppliers.email,
      })
      .from(quotes)
      .innerJoin(suppliers, eq(quotes.supplierId, suppliers.id))
      .where(eq(quotes.id, id))
      .limit(1);

    if (quoteResult.length === 0) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const items = await db
      .select({
        id: quoteItems.id,
        description: quoteItems.description,
        unit: quoteItems.unit,
        quantity: quoteItems.quantity,
        unitPrice: quoteItems.unitPrice,
        totalPrice: quoteItems.totalPrice,
        sortOrder: quoteItems.sortOrder,
      })
      .from(quoteItems)
      .where(eq(quoteItems.quoteId, id))
      .orderBy(quoteItems.sortOrder);

    return NextResponse.json({
      quote: { ...quoteResult[0], items },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 });
  }
}

export async function PATCH(
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

    const existing = await db
      .select({ id: quotes.id, status: quotes.status })
      .from(quotes)
      .where(eq(quotes.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      reviewedAt: new Date(),
      reviewedBy: userId,
    };

    if (body.status !== undefined) {
      if (!quoteStatusEnum.enumValues.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updates.status = body.status;
    }

    if (body.notes !== undefined) {
      updates.notes = body.notes;
    }

    await db.update(quotes).set(updates).where(eq(quotes.id, id));

    await logAudit({
      userId,
      action: AUDIT_ACTIONS.QUOTE_REVIEWED,
      entityType: "quote",
      entityId: id,
      details: {
        previousStatus: existing[0].status,
        newStatus: body.status,
        notes: body.notes !== undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update quote" }, { status: 500 });
  }
}
