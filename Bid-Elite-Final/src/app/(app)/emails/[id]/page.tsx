import { db } from "@/lib/db";
import { emails, rfqs, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import EmailDetailClient from "./email-detail-client";

export const dynamic = "force-dynamic";

export default async function EmailDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let emailData: Record<string, unknown> | null = null;
  let rfqInfo: {
    id: string;
    packageName: string;
    reference: string | null;
    status: string;
  } | null = null;
  let senderName: string | null = null;
  let prevEmail: { id: string; subject: string } | null = null;
  let nextEmail: { id: string; subject: string } | null = null;

  try {
    const emailResult = await db
      .select()
      .from(emails)
      .where(eq(emails.id, id))
      .limit(1);

    if (emailResult.length === 0) {
      notFound();
    }

    emailData = emailResult[0];

    if (emailData.rfqId) {
      const rfqResult = await db
        .select({
          id: rfqs.id,
          packageName: rfqs.packageName,
          reference: rfqs.reference,
          status: rfqs.status,
        })
        .from(rfqs)
        .where(eq(rfqs.id, emailData.rfqId as string))
        .limit(1);

      if (rfqResult.length > 0) {
        rfqInfo = rfqResult[0];
      }
    }

    if (emailData.sentBy) {
      const senderResult = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, emailData.sentBy as string))
        .limit(1);

      senderName = senderResult[0]?.name ?? null;
    }

    if (emailData.threadId) {
      const threadEmails = await db
        .select({
          id: emails.id,
          subject: emails.subject,
          sentAt: emails.sentAt,
        })
        .from(emails)
        .where(eq(emails.threadId, emailData.threadId as string))
        .orderBy(desc(emails.sentAt));

      const currentIndex = threadEmails.findIndex((e) => e.id === id);

      if (currentIndex > 0) {
        nextEmail = { id: threadEmails[currentIndex - 1].id, subject: threadEmails[currentIndex - 1].subject };
      }
      if (currentIndex < threadEmails.length - 1) {
        prevEmail = { id: threadEmails[currentIndex + 1].id, subject: threadEmails[currentIndex + 1].subject };
      }
    }
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
  }

  if (!emailData) {
    notFound();
  }

  return (
    <EmailDetailClient
      email={emailData}
      rfq={rfqInfo}
      senderName={senderName}
      prevEmail={prevEmail}
      nextEmail={nextEmail}
    />
  );
}
