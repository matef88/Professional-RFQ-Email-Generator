import { db } from "@/lib/db";
import { rfqs, rfqSuppliers, suppliers, quotes, emails } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import RfqDetailClient from "./rfq-detail-client";

export default async function RfqDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let rfqData: Record<string, unknown> | null = null;
  let supplierLinks: Array<{
    id: string;
    supplierId: string;
    status: string;
    emailSentAt: Date | null;
    viewedAt: Date | null;
    quotedAt: Date | null;
    portalToken: string;
    supplierName: string;
    supplierEmail: string;
  }> = [];
  let quoteResults: Array<{
    id: string;
    supplierId: string;
    coverLetter: string | null;
    totalAmount: string | null;
    currency: string | null;
    deliveryDays: number | null;
    validityDays: number | null;
    status: string;
    submittedAt: Date;
  }> = [];
  let emailHistory: Array<{
    id: string;
    toEmails: string[];
    subject: string;
    bodyText: string | null;
    template: string | null;
    sentAt: Date;
    threadId: string | null;
    messageId: string | null;
    inReplyTo: string | null;
    status: string;
  }> = [];

  try {
    const rfqResult = await db.select().from(rfqs).where(eq(rfqs.id, id)).limit(1);

    if (rfqResult.length === 0) {
      notFound();
    }

    rfqData = rfqResult[0];

    supplierLinks = await db
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

    quoteResults = await db
      .select({
        id: quotes.id,
        supplierId: quotes.supplierId,
        coverLetter: quotes.coverLetter,
        totalAmount: quotes.totalAmount,
        currency: quotes.currency,
        deliveryDays: quotes.deliveryDays,
        validityDays: quotes.validityDays,
        status: quotes.status,
        submittedAt: quotes.submittedAt,
      })
      .from(quotes)
      .where(eq(quotes.rfqId, id));

    emailHistory = await db
      .select({
        id: emails.id,
        toEmails: emails.toEmails,
        subject: emails.subject,
        bodyText: emails.bodyText,
        template: emails.template,
        sentAt: emails.sentAt,
        threadId: emails.threadId,
        messageId: emails.messageId,
        inReplyTo: emails.inReplyTo,
        status: emails.status,
      })
      .from(emails)
      .where(eq(emails.rfqId, id))
      .orderBy(asc(emails.sentAt));
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
  }

  if (!rfqData) {
    notFound();
  }

  return (
    <div>
      <div className="mb-4">
        <a
          href={`/rfq?selected=${id}`}
          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to split view
        </a>
      </div>
      <RfqDetailClient
        rfq={rfqData}
        suppliers={supplierLinks}
        quotes={quoteResults}
        emailHistory={emailHistory}
      />
    </div>
  );
}
