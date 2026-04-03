import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { emails, rfqs, users } from "@/lib/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import EmailListClient from "./email-list-client";

export const dynamic = "force-dynamic";

interface EmailRow {
  id: string;
  rfqId: string | null;
  toEmails: string[];
  ccEmails: string[] | null;
  subject: string;
  template: string | null;
  threadId: string | null;
  status: string;
  deliveryStatus: string | null;
  sendMethod: string | null;
  errorMessage: string | null;
  sentAt: Date;
  sentBy: string | null;
  packageName: string | null;
  senderName: string | null;
}

interface GroupedEmail {
  threadId: string | null;
  emails: EmailRow[];
}

function groupByEmails(emailRows: EmailRow[]): GroupedEmail[] {
  const groups: Record<string, GroupedEmail> = {};

  for (const email of emailRows) {
    const key = email.threadId ?? "_none";
    if (!groups[key]) {
      groups[key] = { threadId: email.threadId, emails: [email] };
    } else {
      groups[key].emails.push(email);
    }
  }

  const sorted = Object.values(groups).sort((a, b) => {
    const aTime = a.emails[0]?.sentAt?.getTime() ?? 0;
    const bTime = b.emails[0]?.sentAt?.getTime() ?? 0;
    return bTime - aTime;
  });

  return sorted;
}

export default async function EmailPage() {
  await getServerSession(authOptions);

  let emailList: EmailRow[] = [];
  let userMap: Record<string, string> = {};

  try {
    emailList = await db
      .select({
        id: emails.id,
        rfqId: emails.rfqId,
        toEmails: emails.toEmails,
        ccEmails: emails.ccEmails,
        subject: emails.subject,
        template: emails.template,
        threadId: emails.threadId,
        status: emails.status,
        deliveryStatus: emails.deliveryStatus,
        sendMethod: emails.sendMethod,
        errorMessage: emails.errorMessage,
        sentAt: emails.sentAt,
        sentBy: emails.sentBy,
        packageName: rfqs.packageName,
        senderName: users.name,
      })
      .from(emails)
      .leftJoin(rfqs, eq(emails.rfqId, rfqs.id))
      .leftJoin(users, eq(emails.sentBy, users.id))
      .orderBy(desc(emails.sentAt));

    const senderIds = [...new Set(emailList.map((e) => e.sentBy).filter(Boolean))] as string[];

    if (senderIds.length > 0) {
      const senders = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, senderIds));

      userMap = Object.fromEntries(senders.map((s) => [s.id, s.name]));
    }
  } catch {
    // DB not connected yet
  }

  const grouped = groupByEmails(emailList);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Emails</h1>
        <p className="text-sm text-text-muted">Email history and correspondence</p>
      </div>

      <EmailListClient emails={grouped} userMap={userMap} />
    </div>
  );
}
