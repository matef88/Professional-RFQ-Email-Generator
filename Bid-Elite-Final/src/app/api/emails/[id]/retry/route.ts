import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { emails } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { sendEmail, isSmtpConfigured, getDefaultCc } from "@/lib/email/smtp";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Only admins can retry emails" }, { status: 403 });
    }

    if (!isSmtpConfigured()) {
      return NextResponse.json({ error: "SMTP is not configured" }, { status: 400 });
    }

    const { id } = await params;

    const emailResult = await db.select().from(emails).where(eq(emails.id, id)).limit(1);

    if (emailResult.length === 0) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const emailRecord = emailResult[0];

    if (emailRecord.deliveryStatus !== "failed") {
      return NextResponse.json({ error: "Only failed emails can be retried" }, { status: 400 });
    }

    const defaultCc = getDefaultCc();

    const result = await sendEmail({
      to: emailRecord.toEmails,
      cc: defaultCc.length > 0 ? defaultCc : emailRecord.ccEmails ?? undefined,
      subject: emailRecord.subject,
      text: emailRecord.bodyText ?? "",
      messageId: emailRecord.messageId ?? undefined,
      inReplyTo: emailRecord.inReplyTo ?? undefined,
    });

    if (result.success) {
      await db
        .update(emails)
        .set({
          deliveryStatus: "sent",
          smtpMessageId: result.messageId ?? null,
          errorMessage: null,
          sendMethod: "smtp",
          status: "recorded",
        })
        .where(eq(emails.id, id));

      return NextResponse.json({ success: true, messageId: result.messageId });
    }

    await db
      .update(emails)
      .set({
        deliveryStatus: "failed",
        errorMessage: result.error ?? "Retry failed",
      })
      .where(eq(emails.id, id));

    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  } catch {
    return NextResponse.json({ error: "Failed to retry email" }, { status: 500 });
  }
}
