import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { quotes, quoteItems, suppliers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

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

    const quoteResults = await db
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
        scores: quotes.scores,
        totalScore: quotes.totalScore,
        submittedAt: quotes.submittedAt,
        reviewedAt: quotes.reviewedAt,
        reviewedBy: quotes.reviewedBy,
        notes: quotes.notes,
        supplierName: suppliers.name,
        supplierEmail: suppliers.email,
      })
      .from(quotes)
      .innerJoin(suppliers, eq(quotes.supplierId, suppliers.id))
      .where(eq(quotes.rfqId, id))
      .orderBy(quotes.submittedAt);

    const quotesWithItems = await Promise.all(
      quoteResults.map(async (quote) => {
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
          .where(eq(quoteItems.quoteId, quote.id))
          .orderBy(quoteItems.sortOrder);

        return { ...quote, items };
      }),
    );

    return NextResponse.json({ quotes: quotesWithItems, total: quotesWithItems.length });
  } catch {
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }
}
