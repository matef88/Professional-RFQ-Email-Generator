"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface RfqRow {
  id: string;
  rfqId: string;
  packageName: string;
  reference: string | null;
  deadline: string | null;
  rfqStatus: string;
  supplierStatus: string;
  portalToken: string;
  emailSentAt: string | null;
}

interface QuoteRow {
  id: string;
  rfqId: string;
  packageName: string;
  totalAmount: string | null;
  currency: string | null;
  deliveryDays: number | null;
  status: string;
  submittedAt: string;
}

interface DashboardData {
  rfqs: RfqRow[];
  recentQuotes: QuoteRow[];
  stats: {
    activeRfqs: number;
    totalQuotes: number;
    pendingResponses: number;
  };
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    pending: "bg-gray-100 text-gray-700",
    viewed: "bg-blue-100 text-blue-700",
    quoted: "bg-green-100 text-green-700",
    draft: "bg-gray-100 text-gray-600",
    sent: "bg-blue-100 text-blue-700",
    open: "bg-green-100 text-green-700",
    closed: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
    </span>
  );
}

export default function DashboardClient({ supplierName }: { supplierName: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/portal/dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load dashboard");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-600">{error || "Failed to load dashboard"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {supplierName}</h1>
          <p className="mt-1 text-sm text-gray-500">Here&apos;s an overview of your activity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Active RFQs
          </p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{data.stats.activeRfqs}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Quotes Submitted
          </p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{data.stats.totalQuotes}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Pending Responses
          </p>
          <p className="mt-1 text-3xl font-bold text-amber-600">
            {data.stats.pendingResponses}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            RFQs Assigned to You
          </h2>
        </div>
        {data.rfqs.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-500">
            No RFQs have been sent to you yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3">Package Name</th>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Deadline</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Sent Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.rfqs.map((rfq) => (
                  <tr key={rfq.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/portal/${rfq.portalToken}`}
                        className="font-medium text-amber-600 hover:text-amber-700"
                      >
                        {rfq.packageName}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {rfq.reference || "\u2014"}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {rfq.deadline
                        ? new Date(rfq.deadline + "T00:00:00").toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short", year: "numeric" },
                          )
                        : "\u2014"}
                    </td>
                    <td className="px-5 py-3">{statusBadge(rfq.supplierStatus)}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {rfq.emailSentAt
                        ? new Date(rfq.emailSentAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "\u2014"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Recent Quotes</h2>
            <Link
              href="/portal/quotes"
              className="text-xs font-medium text-amber-600 hover:text-amber-700"
            >
              View All
            </Link>
          </div>
        </div>
        {data.recentQuotes.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-500">
            No quotes submitted yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.recentQuotes.map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {q.packageName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Submitted{" "}
                    {new Date(q.submittedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {q.totalAmount && (
                    <span className="text-sm font-semibold text-gray-900">
                      {q.currency ?? "USD"}{" "}
                      {Number(q.totalAmount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  )}
                  {statusBadge(q.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
