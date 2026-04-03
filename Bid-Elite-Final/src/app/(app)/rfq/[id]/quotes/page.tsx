import { db } from "@/lib/db";
import { rfqs, quotes, quoteItems, suppliers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import QuotesListClient from "./quotes-list-client";

export default async function QuotesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let rfqData: { packageName: string; reference: string | null; status: string; awardedSupplierId: string | null; awardedAt: Date | null } | null = null;
  let quoteResults: Array<{
    id: string;
    supplierId: string;
    coverLetter: string | null;
    totalAmount: string | null;
    currency: string | null;
    deliveryDays: number | null;
    validityDays: number | null;
    status: string;
    attachments: string[] | null;
    submittedAt: Date;
    reviewedAt: Date | null;
    notes: string | null;
    scores: Record<string, number> | null;
    totalScore: string | null;
    supplierName: string;
    supplierEmail: string;
    itemCount: number;
  }> = [];

  try {
    const rfqResult = await db
      .select({
        packageName: rfqs.packageName,
        reference: rfqs.reference,
        status: rfqs.status,
        awardedSupplierId: rfqs.awardedSupplierId,
        awardedAt: rfqs.awardedAt,
      })
      .from(rfqs)
      .where(eq(rfqs.id, id))
      .limit(1);

    if (rfqResult.length === 0) {
      notFound();
    }

    rfqData = rfqResult[0];

    const rawQuotes = await db
      .select({
        id: quotes.id,
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
        notes: quotes.notes,
        scores: quotes.scores,
        totalScore: quotes.totalScore,
        supplierName: suppliers.name,
        supplierEmail: suppliers.email,
      })
      .from(quotes)
      .innerJoin(suppliers, eq(quotes.supplierId, suppliers.id))
      .where(eq(quotes.rfqId, id))
      .orderBy(desc(quotes.submittedAt));

    quoteResults = rawQuotes.map((q) => ({
      ...q,
      itemCount: 0,
    }));

    const itemCounts = await Promise.all(
      rawQuotes.map(async (q) => {
        const items = await db
          .select({ id: quoteItems.id })
          .from(quoteItems)
          .where(eq(quoteItems.quoteId, q.id));
        return { quoteId: q.id, count: items.length };
      }),
    );

    const countMap = new Map(itemCounts.map((ic) => [ic.quoteId, ic.count]));
    quoteResults = rawQuotes.map((q) => ({
      ...q,
      itemCount: countMap.get(q.id) ?? 0,
    }));
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
  }

  if (!rfqData) {
    notFound();
  }

  return (
    <QuotesListClient
      rfqId={id}
      rfqData={rfqData}
      quotes={quoteResults}
    />
  );
}
