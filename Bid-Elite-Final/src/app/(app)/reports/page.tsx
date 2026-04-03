"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface Stats {
  totalRfqs: number;
  openRfqs: number;
  closedRfqs: number;
  draftRfqs: number;
  totalSuppliers: number;
  activeSuppliers: number;
  totalQuotes: number;
  pendingQuotes: number;
  reviewedQuotes: number;
  rfqsByTemplate: Array<{ template: string; count: number }>;
  rfqsByMonth: Array<{ month: string; count: number }>;
  averageQuotesPerRfq: number;
  averageQuoteAmount: number;
  topSuppliersByQuotes: Array<{ id: string; name: string; quoteCount: number }>;
  quotesByStatus: Array<{ status: string; count: number }>;
  recentAuditLog: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    createdAt: string;
    userName: string | null;
    details: Record<string, unknown> | null;
  }>;
}

const PIE_COLORS = ["#d97706", "#22c55e", "#0891b2", "#ef4444"];

const TEMPLATE_LABELS: Record<string, string> = {
  standard: "Standard",
  urgent: "Urgent",
  competitive: "Competitive",
  bulkOrder: "Bulk Order",
  followUp: "Follow Up",
  reminder: "Reminder",
};

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
};

function formatMonthLabel(month: string) {
  const [year, m] = month.split("-");
  const date = new Date(parseInt(year), parseInt(m) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function actionLabel(action: string) {
  return action
    .split(".")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function entityTypeIcon(type: string) {
  switch (type) {
    case "rfq":
      return (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      );
    case "quote":
      return (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
        </svg>
      );
    case "supplier":
      return (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      );
    default:
      return (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
        </svg>
      );
  }
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-xs shadow-lg">
        <p className="font-medium text-text-primary">{label}</p>
        <p className="text-accent">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-xs shadow-lg">
        <p className="font-medium text-text-primary">{payload[0].name}</p>
        <p className="text-accent">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/stats")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setStats(data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-text-primary">Reports &amp; Analytics</h1>
        <div className="flex h-64 items-center justify-center text-text-muted">Loading...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-text-primary">Reports &amp; Analytics</h1>
        <div className="flex h-64 items-center justify-center text-text-muted">
          Unable to load statistics.
        </div>
      </div>
    );
  }

  const rfqByMonthData = stats.rfqsByMonth.map((r) => ({
    name: formatMonthLabel(r.month),
    count: r.count,
  }));

  const quotesByStatusData = stats.quotesByStatus.map((r) => ({
    name: STATUS_LABELS[r.status] || r.status,
    value: r.count,
  }));

  const rfqsByTemplateData = stats.rfqsByTemplate
    .map((r) => ({
      name: TEMPLATE_LABELS[r.template] || r.template,
      count: r.count,
    }))
    .sort((a, b) => b.count - a.count);

  const maxTemplateCount = Math.max(...rfqsByTemplateData.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Reports &amp; Analytics</h1>
        <p className="text-sm text-text-muted">Overview of your RFQ and bidding activity</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatBox label="Total RFQs" value={stats.totalRfqs} />
        <StatBox label="Open RFQs" value={stats.openRfqs} accent />
        <StatBox label="Total Quotes" value={stats.totalQuotes} />
        <StatBox label="Pending Quotes" value={stats.pendingQuotes} />
        <StatBox label="Suppliers" value={stats.totalSuppliers} />
        <StatBox label="Active Suppliers" value={stats.activeSuppliers} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-bg-secondary">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-text-primary">Avg Quotes per RFQ</h3>
          </div>
          <div className="p-5">
            <span className="text-3xl font-bold text-accent">
              {stats.averageQuotesPerRfq.toFixed(1)}
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-bg-secondary">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-text-primary">Avg Quote Amount</h3>
          </div>
          <div className="p-5">
            <span className="text-3xl font-bold text-accent">
              {stats.averageQuoteAmount > 0
                ? `$${stats.averageQuoteAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "$0.00"}
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-bg-secondary">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-text-primary">Draft / Closed RFQs</h3>
          </div>
          <div className="p-5">
            <span className="text-3xl font-bold text-text-primary">
              {stats.draftRfqs}
            </span>
            <span className="text-text-dim"> / </span>
            <span className="text-3xl font-bold text-text-secondary">
              {stats.closedRfqs}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-bg-secondary">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-text-primary">RFQs by Month</h3>
          </div>
          <div className="p-5">
            {rfqByMonthData.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-text-dim">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={rfqByMonthData}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    axisLine={{ stroke: "#161620" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    axisLine={{ stroke: "#161620" }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-bg-secondary">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-text-primary">Quotes by Status</h3>
          </div>
          <div className="p-5">
            {quotesByStatusData.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-text-dim">
                No quotes yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={quotesByStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {quotesByStatusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    formatter={(value: string) => (
                      <span style={{ color: "#bfc5d0", fontSize: 12 }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-bg-secondary">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-text-primary">RFQs by Template</h3>
          </div>
          <div className="p-5 space-y-3">
            {rfqsByTemplateData.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-text-dim">
                No data yet
              </div>
            ) : (
              rfqsByTemplateData.map((item) => (
                <div key={item.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-text-secondary">{item.name}</span>
                    <span className="font-medium text-text-primary">{item.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-bg-elevated">
                    <div
                      className="h-2 rounded-full bg-accent"
                      style={{ width: `${(item.count / maxTemplateCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-bg-secondary">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-text-primary">Top Suppliers by Quotes</h3>
          </div>
          <div className="p-5">
            {stats.topSuppliersByQuotes.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-text-dim">
                No quotes yet
              </div>
            ) : (
              <div className="space-y-3">
                {stats.topSuppliersByQuotes.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-text-primary">{s.name}</div>
                    </div>
                    <span className="text-sm font-medium text-accent">{s.quoteCount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-bg-secondary">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-text-primary">Recent Activity</h3>
          <Link
            href="/reports/audit"
            className="text-xs font-medium text-accent hover:text-accent-hover"
          >
            View full audit log
          </Link>
        </div>
        {stats.recentAuditLog.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-text-dim">
            No activity recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {stats.recentAuditLog.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-bg-elevated text-text-muted">
                  {entityTypeIcon(entry.entityType)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-text-primary">
                    <span className="font-medium">{entry.userName ?? "System"}</span>{" "}
                    <span className="text-text-muted">{actionLabel(entry.action)}</span>
                  </div>
                  <div className="text-xs text-text-dim">
                    {new Date(entry.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-4">
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? "text-accent" : "text-text-primary"}`}>
        {value}
      </p>
    </div>
  );
}
