import { db } from "@/lib/db";
import { rfqs, quotes, quoteItems, suppliers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ComparePageClient from "./compare-client";
import type { EvaluationCriteria } from "@/lib/db/schema";

export default async function ComparePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let rfqData: {
    packageName: string;
    reference: string | null;
    status: string;
    evaluationCriteria: EvaluationCriteria[] | null;
    awardedSupplierId: string | null;
    awardedAt: Date | null;
  } | null = null;
  let quotesWithItems: Array<{
    id: string;
    supplierId: string;
    supplierName: string;
    totalAmount: string | null;
    currency: string | null;
    deliveryDays: number | null;
    validityDays: number | null;
    status: string;
    notes: string | null;
    scores: Record<string, number> | null;
    totalScore: string | null;
    items: Array<{
      description: string;
      unit: string | null;
      quantity: string | null;
      unitPrice: string | null;
      totalPrice: string | null;
    }>;
  }> = [];

  try {
    const rfqResult = await db
      .select({
        packageName: rfqs.packageName,
        reference: rfqs.reference,
        status: rfqs.status,
        evaluationCriteria: rfqs.evaluationCriteria,
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
        totalAmount: quotes.totalAmount,
        currency: quotes.currency,
        deliveryDays: quotes.deliveryDays,
        validityDays: quotes.validityDays,
        status: quotes.status,
        notes: quotes.notes,
        scores: quotes.scores,
        totalScore: quotes.totalScore,
        supplierName: suppliers.name,
      })
      .from(quotes)
      .innerJoin(suppliers, eq(quotes.supplierId, suppliers.id))
      .where(eq(quotes.rfqId, id))
      .orderBy(quotes.submittedAt);

    quotesWithItems = await Promise.all(
      rawQuotes.map(async (q) => {
        const items = await db
          .select({
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
          id: q.id,
          supplierId: q.supplierId,
          supplierName: q.supplierName,
          totalAmount: q.totalAmount,
          currency: q.currency,
          deliveryDays: q.deliveryDays,
          validityDays: q.validityDays,
          status: q.status,
          notes: q.notes,
          scores: q.scores,
          totalScore: q.totalScore,
          items,
        };
      }),
    );
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
  }

  if (!rfqData) {
    notFound();
  }

  return (
    <ComparePageClient
      rfqId={id}
      rfqData={rfqData}
      suppliers={quotesWithItems}
    />
  );
}
