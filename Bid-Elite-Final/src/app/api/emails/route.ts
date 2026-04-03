import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { emails, rfqs, users } from "@/lib/db/schema";
import { desc, asc, eq, count, and, sql, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rfqId = searchParams.get("rfqId");
    const search = searchParams.get("search");
    const template = searchParams.get("template");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "30");
    const sortDir = searchParams.get("sort") === "asc" ? "asc" : "desc";
    const offset = (page - 1) * limit;

    const conditions = [];

    if (rfqId) conditions.push(eq(emails.rfqId, rfqId));

    if (template) conditions.push(eq(emails.template, template));

    if (dateFrom) conditions.push(gte(emails.sentAt, new Date(dateFrom)));
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setUTCHours(23, 59, 59, 999);
      conditions.push(lte(emails.sentAt, toDate));
    }

    if (search) {
      const q = `%${search}%`;
      conditions.push(
        sql`(${emails.subject} ILIKE ${q} OR ${emails.toEmails}::text ILIKE ${q})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const orderByFn = sortDir === "asc" ? asc : desc;

    const result = await db
      .select({
        id: emails.id,
        rfqId: emails.rfqId,
        toEmails: emails.toEmails,
        ccEmails: emails.ccEmails,
        subject: emails.subject,
        template: emails.template,
        threadId: emails.threadId,
        status: emails.status,
        sentAt: emails.sentAt,
        sentBy: emails.sentBy,
        packageName: rfqs.packageName,
        senderName: users.name,
      })
      .from(emails)
      .leftJoin(rfqs, eq(emails.rfqId, rfqs.id))
      .leftJoin(users, eq(emails.sentBy, users.id))
      .where(whereClause)
      .orderBy(orderByFn(emails.sentAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ value: count() })
      .from(emails)
      .where(whereClause);

    return NextResponse.json({
      emails: result,
      total: countResult[0]?.value ?? 0,
      page,
      limit,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 });
  }
}
