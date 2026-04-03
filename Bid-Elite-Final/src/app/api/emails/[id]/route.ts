import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { emails, rfqs, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
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

    const emailResult = await db
      .select({
        id: emails.id,
        rfqId: emails.rfqId,
        toEmails: emails.toEmails,
        ccEmails: emails.ccEmails,
        subject: emails.subject,
        bodyText: emails.bodyText,
        template: emails.template,
        threadId: emails.threadId,
        messageId: emails.messageId,
        inReplyTo: emails.inReplyTo,
        mailtoUrl: emails.mailtoUrl,
        status: emails.status,
        sentAt: emails.sentAt,
        sentBy: emails.sentBy,
      })
      .from(emails)
      .where(eq(emails.id, id))
      .limit(1);

    if (emailResult.length === 0) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const emailData = emailResult[0];

    let rfqInfo: { id: string; packageName: string; reference: string | null; status: string } | null = null;
    if (emailData.rfqId) {
      const rfqResult = await db
        .select({
          id: rfqs.id,
          packageName: rfqs.packageName,
          reference: rfqs.reference,
          status: rfqs.status,
        })
        .from(rfqs)
        .where(eq(rfqs.id, emailData.rfqId))
        .limit(1);

      if (rfqResult.length > 0) {
        rfqInfo = rfqResult[0];
      }
    }

    let senderName: string | null = null;
    if (emailData.sentBy) {
      const senderResult = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, emailData.sentBy))
        .limit(1);

      senderName = senderResult[0]?.name ?? null;
    }

    let prevEmail: { id: string; subject: string } | null = null;
    let nextEmail: { id: string; subject: string } | null = null;

    if (emailData.threadId) {
      const threadEmails = await db
        .select({
          id: emails.id,
          subject: emails.subject,
          sentAt: emails.sentAt,
        })
        .from(emails)
        .where(eq(emails.threadId, emailData.threadId))
        .orderBy(desc(emails.sentAt));

      const currentIndex = threadEmails.findIndex((e) => e.id === id);

      if (currentIndex > 0) {
        nextEmail = { id: threadEmails[currentIndex - 1].id, subject: threadEmails[currentIndex - 1].subject };
      }
      if (currentIndex < threadEmails.length - 1) {
        prevEmail = { id: threadEmails[currentIndex + 1].id, subject: threadEmails[currentIndex + 1].subject };
      }
    }

    return NextResponse.json({
      email: emailData,
      rfq: rfqInfo,
      senderName,
      prevEmail,
      nextEmail,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch email" }, { status: 500 });
  }
}
