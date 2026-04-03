"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import type { PackageItem, SubmissionPrice } from "@/lib/db/schema";

interface PricingData {
  invitation: {
    id: string;
    status: string;
    supplierName: string;
    supplierEmail: string;
  };
  package: {
    id: string;
    name: string;
    description: string | null;
    items: PackageItem[];
  };
  submissions: {
    id: string;
    revision: number;
    prices: SubmissionPrice[];
    totalAmount: string | null;
    currency: string | null;
    submittedAt: string;
  }[];
  currentRevision: number;
}

export default function PricingFormPage() {
  const { invitationId } = useParams<{ invitationId: string }>();
  const [data, setData] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [currency, setCurrency] = useState("SAR");
  const [prices, setPrices] = useState<
    { itemNo: string; unitPrice: string; totalPrice: number; notes: string }[]
  >([]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/portal/pricing/${invitationId}`);
      if (!res.ok) {
        setError("Failed to load pricing data");
        setLoading(false);
        return;
      }
      const result: PricingData = await res.json();
      setData(result);

      // Initialize prices from package items
      const initialPrices = result.package.items.map((item) => ({
        itemNo: item.itemNo,
        unitPrice: "",
        totalPrice: 0,
        notes: "",
      }));
      setPrices(initialPrices);

      if (result.submissions.length > 0) {
        setCurrency(result.submissions[0].currency || "SAR");
      }
    } catch {
      setError("Failed to load pricing data");
    } finally {
      setLoading(false);
    }
  }, [invitationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function updatePrice(index: number, unitPrice: string) {
    setPrices((prev) => {
      const next = [...prev];
      const qty = data?.package.items[index]?.quantity || 0;
      const up = parseFloat(unitPrice) || 0;
      next[index] = {
        ...next[index],
        unitPrice,
        totalPrice: up * qty,
      };
      return next;
    });
  }

  function updateNotes(index: number, notes: string) {
    setPrices((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], notes };
      return next;
    });
  }

  const grandTotal = prices.reduce((sum, p) => sum + p.totalPrice, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const incomplete = prices.some((p) => !p.unitPrice || parseFloat(p.unitPrice) <= 0);
    if (incomplete) {
      setError("Please fill in all unit prices before submitting");
      return;
    }

    const confirmed = window.confirm(
      `Submit prices for "${data?.package.name}"?\n\nTotal: ${currency} ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    );
    if (!confirmed) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/portal/pricing/${invitationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prices: prices.map((p) => ({
            itemNo: p.itemNo,
            unitPrice: parseFloat(p.unitPrice),
            totalPrice: p.totalPrice,
            notes: p.notes || undefined,
          })),
          currency,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to submit prices");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">Loading pricing form...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <a href="/portal/pricing" className="mt-2 inline-block text-sm text-amber-600 hover:underline">
            Go back
          </a>
        </div>
      </div>
    );
  }

  if (!data) return null;

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white shadow-sm">
          <div className="mx-auto max-w-4xl px-6 py-4">
            <h1 className="text-lg font-bold text-gray-900">{data.package.name}</h1>
          </div>
        </header>
        <main className="mx-auto max-w-lg px-6 py-16 text-center">
          <div className="rounded-xl border border-green-200 bg-green-50 p-8">
            <svg
              className="mx-auto h-12 w-12 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-green-700">
              Prices Submitted Successfully
            </h2>
            <p className="mt-2 text-sm text-green-600">
              Your pricing for &quot;{data.package.name}&quot; has been received.
              {data.currentRevision > 0 && (
                <span> This is revision {data.currentRevision + 1}.</span>
              )}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Total: {currency} {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="mt-4 text-xs text-gray-400">
              You can use the same access code to submit revised pricing.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const latestSubmission = data.submissions.length > 0 ? data.submissions[0] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{data.package.name}</h1>
            <p className="text-sm text-gray-500">
              Supplier: <span className="font-medium text-gray-700">{data.invitation.supplierName}</span>
              {data.currentRevision > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  Rev {data.currentRevision}
                </span>
              )}
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-600 text-xs font-bold text-white">
            EN
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-6">
        {data.package.description && (
          <p className="mb-4 rounded-lg bg-white p-4 text-sm text-gray-600 shadow-sm">
            {data.package.description}
          </p>
        )}

        {latestSubmission && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            You have a previous submission (Rev {latestSubmission.revision}, total:{" "}
            {latestSubmission.currency || "SAR"}{" "}
            {Number(latestSubmission.totalAmount || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
            ). Submitting will create a new revision.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-gray-600">
                      #
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-gray-600">
                      Description
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-gray-600">
                      Unit
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-600">
                      Qty
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-600">
                      Unit Price
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-600">
                      Total
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-gray-600">
                      Notes
                    </th>
                    {latestSubmission && (
                      <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-400">
                        Prev Price
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.package.items.map((item, idx) => {
                    const prevPrice = latestSubmission?.prices?.find(
                      (p) => p.itemNo === item.itemNo,
                    );
                    return (
                      <tr
                        key={item.itemNo}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                          {item.itemNo}
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          {item.description}
                          {item.remarks && (
                            <span className="block text-xs text-gray-400">
                              {item.remarks}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                          {item.unit}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={prices[idx]?.unitPrice || ""}
                            onChange={(e) => updatePrice(idx, e.target.value)}
                            placeholder="0.00"
                            className="w-28 rounded border border-gray-300 px-2 py-1.5 text-right text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-900">
                          {prices[idx]?.totalPrice
                            ? prices[idx].totalPrice.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={prices[idx]?.notes || ""}
                            onChange={(e) => updateNotes(idx, e.target.value)}
                            placeholder="Optional"
                            className="w-32 rounded border border-gray-200 px-2 py-1.5 text-sm text-gray-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                        {latestSubmission && (
                          <td className="whitespace-nowrap px-4 py-3 text-right text-gray-400">
                            {prevPrice
                              ? Number(prevPrice.unitPrice).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })
                              : "—"}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td
                      colSpan={latestSubmission ? 5 : 4}
                      className="px-4 py-3 text-right font-semibold text-gray-700"
                    >
                      Grand Total
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-base font-bold text-gray-900">
                      {grandTotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td colSpan={latestSubmission ? 2 : 1} className="px-4 py-3">
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:border-amber-500 focus:outline-none"
                      >
                        <option value="SAR">SAR</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="AED">AED</option>
                      </select>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <a
              href="/portal/pricing"
              className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-amber-600 px-8 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Prices"}
            </button>
          </div>
        </form>
      </main>

      <footer className="mt-12 border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-500">
        Powered by Elite Nexus
      </footer>
    </div>
  );
}
