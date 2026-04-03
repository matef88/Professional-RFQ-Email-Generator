import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rfqs, rfqSuppliers, suppliers, emails, auditLog } from "@/lib/db/schema";
import { eq, and, ne, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCompanySettings } from "@/lib/company";
import { buildSubject, generateReminderEmailBody, buildReminderSubject, type OriginalEmail } from "@/lib/email/render";
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

    if (rfq.status !== "sent" && rfq.status !== "open") {
      return NextResponse.json({ error: "RFQ must be sent or open to send reminders" }, { status: 400 });
    }

    const company = await getCompanySettings();
    if (!company) {
      return NextResponse.json({ error: "Company settings not configured" }, { status: 400 });
    }

    const originalEmailResult = await db
      .select()
      .from(emails)
      .where(and(eq(emails.rfqId, id), ne(emails.template, "followUp"), ne(emails.template, "reminder")))
      .orderBy(asc(emails.sentAt))
      .limit(1);

    if (originalEmailResult.length === 0) {
      return NextResponse.json({ error: "No original sent email found for this RFQ" }, { status: 400 });
    }

    const originalEmailRecord = originalEmailResult[0];

    const originalEmail: OriginalEmail = {
      subject: originalEmailRecord.subject,
      bodyText: originalEmailRecord.bodyText ?? "",
      sentAt: originalEmailRecord.sentAt,
      messageId: originalEmailRecord.messageId ?? null,
      threadId: originalEmailRecord.threadId ?? null,
      packageName: rfq.packageName,
      reference: rfq.reference,
      deadline: rfq.deadline,
    };

    const threadId = originalEmail.threadId ?? originalEmail.messageId ?? `thread-${rfq.id}-${Date.now()}`;

    const pendingSupplierLinks = await db
      .select({
        supplierId: rfqSuppliers.supplierId,
        portalToken: rfqSuppliers.portalToken,
        supplierEmail: suppliers.email,
        supplierName: suppliers.name,
        status: rfqSuppliers.status,
      })
      .from(rfqSuppliers)
      .innerJoin(suppliers, eq(rfqSuppliers.supplierId, suppliers.id))
      .where(and(eq(rfqSuppliers.rfqId, id), ne(rfqSuppliers.status, "quoted")));

    if (pendingSupplierLinks.length === 0) {
      return NextResponse.json({ error: "All suppliers have already quoted" }, { status: 400 });
    }

    const formData = {
      template: "reminder",
      packageName: rfq.packageName,
      reference: rfq.reference ?? "",
      deadline: rfq.deadline ?? "",
      packageLink: rfq.packageLink ?? "",
      docsLink: rfq.docsLink ?? company.docsLink ?? "",
      details: rfq.details ?? "",
    };

    const portalBase = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const originalSubject = buildSubject(rfq.template ?? "standard", rfq.packageName, rfq.reference ?? "", rfq.deadline ?? "");
    const reminderSubject = buildReminderSubject(originalSubject);
    const useSmtp = isSmtpConfigured();
    const defaultCc = useSmtp ? getDefaultCc() : [];

    const generatedEmails = [];

    for (const link of pendingSupplierLinks) {
      const portalLink = `${portalBase}/portal/${link.portalToken}`;
      const bodyText = generateReminderEmailBody(formData, company, link.supplierName, portalLink, originalEmail, rfq.deadline ?? "");
      const mailtoUrl = generateMailtoUrl(link.supplierEmail, "", reminderSubject, bodyText);
      const messageId = `<reminder-${Date.now()}-${Math.random().toString(36).slice(2)}@${company.email?.split("@")[1] ?? "bid.elite-n.com"}>`;

      let deliveryStatus: "pending" | "sent" | "failed" = "pending";
      let smtpMessageId: string | null = null;
      let errorMessage: string | null = null;

      if (useSmtp) {
        const result = await sendEmail({
          to: [link.supplierEmail],
          cc: defaultCc.length > 0 ? defaultCc : undefined,
          subject: reminderSubject,
          text: bodyText,
          messageId,
          inReplyTo: originalEmail.messageId ?? undefined,
          references: [originalEmail.messageId, messageId].filter(Boolean) as string[],
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
        subject: reminderSubject,
        bodyText,
        template: "reminder",
        threadId,
        messageId,
        inReplyTo: originalEmail.messageId ?? undefined,
        mailtoUrl,
        status: useSmtp && deliveryStatus === "sent" ? "recorded" : "opened",
        deliveryStatus,
        smtpMessageId,
        errorMessage,
        sendMethod: useSmtp ? "smtp" : "mailto",
        sentBy: userId,
      });

      generatedEmails.push({
        supplierId: link.supplierId,
        supplierName: link.supplierName,
        supplierEmail: link.supplierEmail,
        subject: reminderSubject,
        mailtoUrl,
        bodyText,
        deliveryStatus,
        sendMethod: useSmtp ? "smtp" : "mailto",
      });
    }

    await db.insert(auditLog).values({
      userId,
      action: "rfq.reminder_sent",
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
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 });
  }
}
