import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { quotes, quoteItems, suppliers, quoteStatusEnum } from "@/lib/db/schema";
import { eq, and, desc, asc, count } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rfqId = searchParams.get("rfqId");
    const status = searchParams.get("status");
    const sortBy = searchParams.get("sortBy") ?? "submitted_at";
    const sortOrder = searchParams.get("sortOrder") ?? "desc";

    if (!rfqId) {
      return NextResponse.json({ error: "rfqId is required" }, { status: 400 });
    }

    const conditions = [eq(quotes.rfqId, rfqId)];

    if (status && quoteStatusEnum.enumValues.includes(status as typeof quoteStatusEnum.enumValues[number])) {
      conditions.push(eq(quotes.status, status as typeof quoteStatusEnum.enumValues[number]));
    }

    const whereClause = and(...conditions);

    const orderColumn = (() => {
      switch (sortBy) {
        case "total_amount":
          return quotes.totalAmount;
        case "delivery_days":
          return quotes.deliveryDays;
        case "submitted_at":
        default:
          return quotes.submittedAt;
      }
    })();

    const orderFn = sortOrder === "asc" ? asc : desc;

    const result = await db
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
        itemCount: count(quoteItems.id),
      })
      .from(quotes)
      .innerJoin(suppliers, eq(quotes.supplierId, suppliers.id))
      .leftJoin(quoteItems, eq(quotes.id, quoteItems.quoteId))
      .where(whereClause)
      .groupBy(quotes.id, suppliers.id)
      .orderBy(orderFn(orderColumn));

    return NextResponse.json({ quotes: result, total: result.length });
  } catch {
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }
}
