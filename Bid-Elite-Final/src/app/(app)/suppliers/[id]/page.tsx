import { db } from "@/lib/db";
import { suppliers, rfqSuppliers, rfqs, quotes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import SupplierDetailClient from "./supplier-detail-client";

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let supplierData: Record<string, unknown> | null = null;
  let rfqHistory: Array<{
    id: string;
    rfqId: string;
    packageName: string;
    reference: string | null;
    deadline: string | null;
    rfqStatus: string;
    supplierStatus: string;
    emailSentAt: Date | null;
    viewedAt: Date | null;
    quotedAt: Date | null;
  }> = [];
  let quoteResults: Array<{
    id: string;
    rfqId: string;
    packageName: string;
    coverLetter: string | null;
    totalAmount: string | null;
    currency: string | null;
    deliveryDays: number | null;
    validityDays: number | null;
    status: string;
    submittedAt: Date;
  }> = [];
  let stats = { totalRfqs: 0, totalQuotes: 0, averageAmount: null as number | null };

  try {
    const supplierResult = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);

    if (supplierResult.length === 0) {
      notFound();
    }

    supplierData = supplierResult[0];

    rfqHistory = await db
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

    const rawQuotes = await db
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

    const rfqIds = [...new Set(rawQuotes.map((q) => q.rfqId))];
    const rfqNameMap: Record<string, string> = {};

    if (rfqIds.length > 0) {
      const rfqData = await db
        .select({ id: rfqs.id, packageName: rfqs.packageName })
        .from(rfqs)
        .where(eq(rfqs.id, rfqIds[0]));

      for (const r of rfqData) {
        rfqNameMap[r.id] = r.packageName;
      }
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

    quoteResults = rawQuotes.map((q) => ({
      ...q,
      packageName: rfqNameMap[q.rfqId] ?? "Unknown RFQ",
    }));

    const quotesWithAmount = rawQuotes.filter((q) => q.totalAmount);
    stats = {
      totalRfqs: rfqHistory.length,
      totalQuotes: rawQuotes.length,
      averageAmount:
        quotesWithAmount.length > 0
          ? quotesWithAmount.reduce((sum, q) => sum + Number(q.totalAmount), 0) /
            quotesWithAmount.length
          : null,
    };
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
  }

  if (!supplierData) {
    notFound();
  }

  return (
    <SupplierDetailClient
      supplier={supplierData}
      rfqHistory={rfqHistory}
      quotes={quoteResults}
      stats={stats}
    />
  );
}
