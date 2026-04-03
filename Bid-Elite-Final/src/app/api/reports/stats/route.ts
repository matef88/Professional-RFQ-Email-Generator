import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rfqs, quotes, suppliers, users, auditLog } from "@/lib/db/schema";
import { eq, count, sql, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalRfqsResult,
      openRfqsResult,
      closedRfqsResult,
      draftRfqsResult,
      totalSuppliersResult,
      activeSuppliersResult,
      totalQuotesResult,
      pendingQuotesResult,
      reviewedQuotesResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(rfqs),
      db.select({ count: count() }).from(rfqs).where(eq(rfqs.status, "open")),
      db.select({ count: count() }).from(rfqs).where(eq(rfqs.status, "closed")),
      db.select({ count: count() }).from(rfqs).where(eq(rfqs.status, "draft")),
      db.select({ count: count() }).from(suppliers),
      db.select({ count: count() }).from(suppliers).where(eq(suppliers.isActive, true)),
      db.select({ count: count() }).from(quotes),
      db.select({ count: count() }).from(quotes).where(eq(quotes.status, "submitted")),
      db.select({ count: count() }).from(quotes).where(eq(quotes.status, "under_review")),
    ]);

    const rfqsByTemplateResult = await db
      .select({
        template: rfqs.template,
        count: count(),
      })
      .from(rfqs)
      .groupBy(rfqs.template);

    const rfqsByMonthResult = await db.execute(sql`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') AS month,
        COUNT(*)::int AS count
      FROM rfqs
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month ASC
    `);

    const avgQuotesResult = await db.execute(sql`
      SELECT COALESCE(AVG(quote_count), 0)::numeric(10,2) AS avg_quotes_per_rfq
      FROM (
        SELECT r.id, COUNT(q.id) AS quote_count
        FROM rfqs r
        LEFT JOIN quotes q ON q.rfq_id = r.id
        GROUP BY r.id
      ) sub
    `);

    const avgAmountResult = await db.execute(sql`
      SELECT COALESCE(AVG(total_amount), 0)::numeric(12,2) AS avg_amount
      FROM quotes
      WHERE total_amount IS NOT NULL
    `);

    const topSuppliersResult = await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        quoteCount: count(),
      })
      .from(suppliers)
      .innerJoin(quotes, eq(quotes.supplierId, suppliers.id))
      .groupBy(suppliers.id, suppliers.name)
      .orderBy(desc(count()))
      .limit(5);

    const quotesByStatusResult = await db
      .select({
        status: quotes.status,
        count: count(),
      })
      .from(quotes)
      .groupBy(quotes.status);

    const recentAuditResult = await db
      .select({
        id: auditLog.id,
        userId: auditLog.userId,
        action: auditLog.action,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        details: auditLog.details,
        createdAt: auditLog.createdAt,
        userName: users.name,
      })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.userId, users.id))
      .orderBy(desc(auditLog.createdAt))
      .limit(10);

    return NextResponse.json({
      totalRfqs: totalRfqsResult[0]?.count ?? 0,
      openRfqs: openRfqsResult[0]?.count ?? 0,
      closedRfqs: closedRfqsResult[0]?.count ?? 0,
      draftRfqs: draftRfqsResult[0]?.count ?? 0,
      totalSuppliers: totalSuppliersResult[0]?.count ?? 0,
      activeSuppliers: activeSuppliersResult[0]?.count ?? 0,
      totalQuotes: totalQuotesResult[0]?.count ?? 0,
      pendingQuotes: pendingQuotesResult[0]?.count ?? 0,
      reviewedQuotes: reviewedQuotesResult[0]?.count ?? 0,
      rfqsByTemplate: rfqsByTemplateResult.map((r) => ({
        template: r.template ?? "standard",
        count: r.count,
      })),
      rfqsByMonth: rfqsByMonthResult.rows.map((r) => ({
        month: r.month as string,
        count: Number(r.count),
      })),
      averageQuotesPerRfq: Number(avgQuotesResult.rows[0]?.avg_quotes_per_rfq ?? 0),
      averageQuoteAmount: Number(avgAmountResult.rows[0]?.avg_amount ?? 0),
      topSuppliersByQuotes: topSuppliersResult.map((s) => ({
        id: s.id,
        name: s.name,
        quoteCount: s.quoteCount,
      })),
      quotesByStatus: quotesByStatusResult.map((s) => ({
        status: s.status,
        count: Number(s.count),
      })),
      recentAuditLog: recentAuditResult.map((a) => ({
        id: a.id,
        userId: a.userId,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        details: a.details,
        createdAt: a.createdAt,
        userName: a.userName,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
