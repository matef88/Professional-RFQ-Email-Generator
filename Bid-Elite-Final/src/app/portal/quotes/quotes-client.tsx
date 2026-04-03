"use client";

import { useState, useEffect } from "react";

interface QuoteItem {
  id: string;
  description: string;
  unit: string | null;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
}

interface QuoteRow {
  id: string;
  rfqId: string;
  packageName: string;
  coverLetter: string | null;
  totalAmount: string | null;
  currency: string | null;
  deliveryDays: number | null;
  validityDays: number | null;
  status: string;
  submittedAt: string;
  items: QuoteItem[];
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    submitted: "bg-blue-100 text-blue-700",
    under_review: "bg-yellow-100 text-yellow-700",
    shortlisted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")}
    </span>
  );
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "rejected", label: "Rejected" },
];

export default function QuotesClient() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetch("/api/portal/quotes")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load quotes");
        return res.json();
      })
      .then((data) => setQuotes(data.quotes))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = statusFilter
    ? quotes.filter((q) => q.status === statusFilter)
    : quotes;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Quote History</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-500">
          {quotes.length === 0
            ? "No quotes submitted yet."
            : "No quotes match the selected filter."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((quote) => (
            <div key={quote.id} className="rounded-lg border border-gray-200 bg-white">
              <button
                type="button"
                onClick={() =>
                  setExpandedId(expandedId === quote.id ? null : quote.id)
                }
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {quote.packageName}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span>
                      Submitted{" "}
                      {new Date(quote.submittedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {quote.deliveryDays && <span>{quote.deliveryDays} days delivery</span>}
                    {quote.validityDays && <span>{quote.validityDays} days validity</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {quote.totalAmount && (
                    <span className="text-sm font-bold text-gray-900">
                      {quote.currency ?? "USD"}{" "}
                      {Number(quote.totalAmount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  )}
                  {statusBadge(quote.status)}
                  <svg
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      expandedId === quote.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {expandedId === quote.id && (
                <div className="border-t border-gray-100 px-5 py-4">
                  {quote.coverLetter && (
                    <div className="mb-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                        Cover Letter
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                        {quote.coverLetter}
                      </p>
                    </div>
                  )}
                  {quote.items.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            <th className="pb-2 pr-4">Description</th>
                            <th className="pb-2 pr-4">Unit</th>
                            <th className="pb-2 pr-4 text-right">Qty</th>
                            <th className="pb-2 pr-4 text-right">Unit Price</th>
                            <th className="pb-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {quote.items.map((item) => (
                            <tr key={item.id}>
                              <td className="py-2 pr-4 text-gray-900">
                                {item.description}
                              </td>
                              <td className="py-2 pr-4 text-gray-600">
                                {item.unit || "\u2014"}
                              </td>
                              <td className="py-2 pr-4 text-right text-gray-600">
                                {item.quantity}
                              </td>
                              <td className="py-2 pr-4 text-right text-gray-600">
                                {Number(item.unitPrice).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td className="py-2 text-right font-medium text-gray-900">
                                {Number(item.totalPrice).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
