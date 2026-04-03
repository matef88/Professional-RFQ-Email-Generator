import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rfqs, rfqSuppliers, suppliers, emails, auditLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCompanySettings } from "@/lib/company";
import { buildSubject, generateEmailBody } from "@/lib/email/render";
import { generateMailtoUrl } from "@/lib/email/mailto";
import { isSmtpConfigured, sendEmail, getDefaultCc } from "@/lib/email/smtp";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { id } = await params;

    const rfqResult = await db.select().from(rfqs).where(eq(rfqs.id, id)).limit(1);

    if (rfqResult.length === 0) {
      return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
    }

    const rfq = rfqResult[0];

    if (rfq.status === "closed") {
      return NextResponse.json({ error: "Cannot send a closed RFQ" }, { status: 400 });
    }

    const company = await getCompanySettings();
    if (!company) {
      return NextResponse.json({ error: "Company settings not configured" }, { status: 400 });
    }

    const supplierLinks = await db
      .select({
        supplierId: rfqSuppliers.supplierId,
        portalToken: rfqSuppliers.portalToken,
        supplierEmail: suppliers.email,
        supplierName: suppliers.name,
      })
      .from(rfqSuppliers)
      .innerJoin(suppliers, eq(rfqSuppliers.supplierId, suppliers.id))
      .where(eq(rfqSuppliers.rfqId, id));

    if (supplierLinks.length === 0) {
      return NextResponse.json({ error: "No suppliers assigned to this RFQ" }, { status: 400 });
    }

    const formData = {
      template: rfq.template ?? "standard",
      packageName: rfq.packageName,
      reference: rfq.reference ?? "",
      deadline: rfq.deadline ?? "",
      packageLink: rfq.packageLink ?? "",
      docsLink: rfq.docsLink ?? company.docsLink ?? "",
      details: rfq.details ?? "",
    };

    const portalBase = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const useSmtp = isSmtpConfigured();
    const defaultCc = useSmtp ? getDefaultCc() : [];

    const generatedEmails = [];

    for (const link of supplierLinks) {
      const portalLink = `${portalBase}/portal/${link.portalToken}`;
      const subject = buildSubject(formData.template, formData.packageName, formData.reference, formData.deadline);
      const bodyText = generateEmailBody(formData, company, link.supplierName, portalLink);
      const mailtoUrl = generateMailtoUrl(link.supplierEmail, "", subject, bodyText);
      const messageId = `<rfq-${Date.now()}-${Math.random().toString(36).slice(2)}@${company.email?.split("@")[1] ?? "bid.elite-n.com"}>`;

      let deliveryStatus: "pending" | "sent" | "failed" = "pending";
      let smtpMessageId: string | null = null;
      let errorMessage: string | null = null;

      if (useSmtp) {
        const result = await sendEmail({
          to: [link.supplierEmail],
          cc: defaultCc.length > 0 ? defaultCc : undefined,
          subject,
          text: bodyText,
          messageId,
        });
        if (result.success) {
          deliveryStatus = "sent";
          smtpMessageId = result.messageId ?? null;
        } else {
          deliveryStatus = "failed";
          errorMessage = result.error ?? "Unknown SMTP error";
        }
      }

      await db.insert(emails).values({
        rfqId: id,
        toEmails: [link.supplierEmail],
        ccEmails: defaultCc.length > 0 ? defaultCc : [],
        subject,
        bodyText,
        template: formData.template,
        mailtoUrl,
        status: useSmtp && deliveryStatus === "sent" ? "recorded" : "opened",
        deliveryStatus,
        smtpMessageId,
        errorMessage,
        sendMethod: useSmtp ? "smtp" : "mailto",
        messageId,
        sentBy: userId,
      });

      await db
        .update(rfqSuppliers)
        .set({ emailSentAt: new Date() })
        .where(eq(rfqSuppliers.portalToken, link.portalToken));

      generatedEmails.push({
        supplierId: link.supplierId,
        supplierName: link.supplierName,
        supplierEmail: link.supplierEmail,
        subject,
        mailtoUrl,
        bodyText,
        deliveryStatus,
        sendMethod: useSmtp ? "smtp" : "mailto",
      });
    }

    if (rfq.status === "draft") {
      await db.update(rfqs).set({ status: "sent", updatedAt: new Date() }).where(eq(rfqs.id, id));
    }

    await db.insert(auditLog).values({
      userId,
      action: "rfq.emails_sent",
      entityType: "rfq",
      entityId: id,
      details: {
        supplierCount: generatedEmails.length,
        supplierNames: generatedEmails.map((e) => e.supplierName),
        sendMethod: useSmtp ? "smtp" : "mailto",
      },
    });

    return NextResponse.json({ emails: generatedEmails, emailCount: generatedEmails.length, sendMethod: useSmtp ? "smtp" : "mailto" });
  } catch {
    return NextResponse.json({ error: "Failed to send RFQ" }, { status: 500 });
  }
}
