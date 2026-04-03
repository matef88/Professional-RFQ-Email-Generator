import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rfqs, rfqSuppliers, suppliers, quotes, emails } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
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
        submittedAt: quotes.submittedAt,
      })
      .from(quotes)
      .where(eq(quotes.rfqId, id))
      .orderBy(quotes.submittedAt);

    const emailHistory = await db
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

    return NextResponse.json({
      rfq: rfqResult[0],
      suppliers: supplierLinks,
      quotes: quoteResults,
      emails: emailHistory,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch RFQ summary" }, { status: 500 });
  }
}
