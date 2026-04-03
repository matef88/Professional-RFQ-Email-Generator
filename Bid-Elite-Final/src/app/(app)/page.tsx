import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rfqs, quotes, suppliers, auditLog, users } from "@/lib/db/schema";
import { desc, eq, count, inArray, and, sql, lte, gte } from "drizzle-orm";
import StatsCard from "@/components/dashboard/stats-cards";
import RecentRfqs from "@/components/dashboard/recent-rfqs";
import PendingQuotes from "@/components/dashboard/pending-quotes";
import QuickActions from "@/components/dashboard/quick-actions";
import ApproachingDeadlines from "@/components/dashboard/approaching-deadlines";
import RecentActivity from "@/components/dashboard/recent-activity";

interface DashboardStats {
  totalRfqs: number;
  openRfqs: number;
  closedRfqs: number;
  draftRfqs: number;
  totalSuppliers: number;
  activeSuppliers: number;
  totalQuotes: number;
  pendingQuotes: number;
  reviewedQuotes: number;
}

async function getStats(): Promise<DashboardStats> {
  const defaults: DashboardStats = {
    totalRfqs: 0,
    openRfqs: 0,
    closedRfqs: 0,
    draftRfqs: 0,
    totalSuppliers: 0,
    activeSuppliers: 0,
    totalQuotes: 0,
    pendingQuotes: 0,
    reviewedQuotes: 0,
  };

  try {
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

    return {
      totalRfqs: totalRfqsResult[0]?.count ?? 0,
      openRfqs: openRfqsResult[0]?.count ?? 0,
      closedRfqs: closedRfqsResult[0]?.count ?? 0,
      draftRfqs: draftRfqsResult[0]?.count ?? 0,
      totalSuppliers: totalSuppliersResult[0]?.count ?? 0,
      activeSuppliers: activeSuppliersResult[0]?.count ?? 0,
      totalQuotes: totalQuotesResult[0]?.count ?? 0,
      pendingQuotes: pendingQuotesResult[0]?.count ?? 0,
      reviewedQuotes: reviewedQuotesResult[0]?.count ?? 0,
    };
  } catch {
    return defaults;
  }
}

async function getRecentRfqs() {
  try {
    return await db
      .select({
        id: rfqs.id,
        packageName: rfqs.packageName,
        status: rfqs.status,
        deadline: rfqs.deadline,
        createdAt: rfqs.createdAt,
        createdBy: rfqs.createdBy,
      })
      .from(rfqs)
      .orderBy(desc(rfqs.createdAt))
      .limit(5);
  } catch {
    return [];
  }
}

async function getPendingQuotes() {
  try {
    const submittedQuotes = await db
      .select({
        id: quotes.id,
        rfqId: quotes.rfqId,
        supplierId: quotes.supplierId,
        totalAmount: quotes.totalAmount,
        currency: quotes.currency,
        submittedAt: quotes.submittedAt,
      })
      .from(quotes)
      .where(eq(quotes.status, "submitted"))
      .orderBy(desc(quotes.submittedAt))
      .limit(5);

    if (submittedQuotes.length === 0) return [];

    const uniqueRfqIds = [...new Set(submittedQuotes.map((q) => q.rfqId))];
    const uniqueSupplierIds = [...new Set(submittedQuotes.map((q) => q.supplierId))];

    const rfqData = await db
      .select({ id: rfqs.id, packageName: rfqs.packageName })
      .from(rfqs)
      .where(inArray(rfqs.id, uniqueRfqIds));
    const supplierData = await db
      .select({ id: suppliers.id, name: suppliers.name })
      .from(suppliers)
      .where(inArray(suppliers.id, uniqueSupplierIds));

    const rfqMap = new Map(rfqData.map((r) => [r.id, r.packageName]));
    const supplierMap = new Map(supplierData.map((s) => [s.id, s.name]));

    return submittedQuotes.map((q) => ({
      id: q.id,
      packageName: rfqMap.get(q.rfqId) ?? "Unknown RFQ",
      supplierName: supplierMap.get(q.supplierId) ?? "Unknown Supplier",
      totalAmount: q.totalAmount,
      currency: q.currency,
      submittedAt: q.submittedAt,
    }));
  } catch {
    return [];
  }
}

async function getApproachingDeadlines() {
  try {
    // In PostgreSQL, CURRENT_DATE + INTERVAL '7 days' works for dates.
    // For Drizzle + Pg array, it returns a string for dates like "2024-05-15".
    const data = await db
      .select({
        id: rfqs.id,
        packageName: rfqs.packageName,
        deadline: rfqs.deadline,
        status: rfqs.status,
      })
      .from(rfqs)
      .where(
        and(
          inArray(rfqs.status, ["open", "sent"]),
          lte(rfqs.deadline, sql`(CURRENT_DATE + INTERVAL '7 days')::date`),
          gte(rfqs.deadline, sql`CURRENT_DATE`)
        )
      )
      .orderBy(rfqs.deadline)
      .limit(5);
    return data;
  } catch {
    return [];
  }
}

async function getRecentActivity() {
  try {
    return await db
      .select({
        id: auditLog.id,
        action: auditLog.action,
        entityType: auditLog.entityType,
        createdAt: auditLog.createdAt,
        userName: users.name,
      })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.userId, users.id))
      .orderBy(desc(auditLog.createdAt))
      .limit(10);
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  const [stats, recentRfqList, pendingQuoteList, approachingDeadlines, recentActivity] = await Promise.all([
    getStats(),
    getRecentRfqs(),
    getPendingQuotes(),
    getApproachingDeadlines(),
    getRecentActivity()
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-muted">Welcome back, {session?.user?.name ?? "User"}</p>
        </div>
      </div>
      
      <QuickActions />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total RFQs"
          value={stats.totalRfqs}
          trend={{ value: 12, label: "vs last month" }}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          }
        />
        <StatsCard
          title="Open RFQs"
          value={stats.openRfqs}
          trend={{ value: 5, label: "vs last month" }}
          accent
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
        <StatsCard
          title="Pending Quotes"
          value={stats.pendingQuotes}
          trend={{ value: -2, label: "vs last month" }}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
            </svg>
          }
        />
        <StatsCard
          title="Total Suppliers"
          value={stats.totalSuppliers}
          trend={{ value: 8, label: "vs last month" }}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RecentRfqs rfqs={recentRfqList} />
        <ApproachingDeadlines rfqs={approachingDeadlines} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PendingQuotes quotes={pendingQuoteList} />
        <RecentActivity activities={recentActivity} />
      </div>
    </div>
  );
}
