"use client";

import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface RfqData {
  packageName: string;
  reference: string | null;
  status: string;
  awardedSupplierId: string | null;
  awardedAt: Date | null;
}

interface QuoteRow {
  id: string;
  supplierId: string;
  coverLetter: string | null;
  totalAmount: string | null;
  currency: string | null;
  deliveryDays: number | null;
  validityDays: number | null;
  status: string;
  attachments: string[] | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  notes: string | null;
  scores: Record<string, number> | null;
  totalScore: string | null;
  supplierName: string;
  supplierEmail: string;
  itemCount: number;
}

interface QuoteItem {
  id: string;
  description: string;
  unit: string | null;
  quantity: string | null;
  unitPrice: string | null;
  totalPrice: string | null;
  sortOrder: number | null;
}

interface QuotesListClientProps {
  rfqId: string;
  rfqData: RfqData;
  quotes: QuoteRow[];
}

const STATUS_OPTIONS = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "rejected", label: "Rejected" },
];

function rankBadgeClass(rank: number): string {
  if (rank === 1) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  if (rank === 2) return "bg-gray-400/20 text-gray-300 border-gray-400/30";
  if (rank === 3) return "bg-orange-700/20 text-orange-500 border-orange-700/30";
  return "bg-bg-tertiary text-text-dim border-border";
}

export default function QuotesListClient({ rfqId, rfqData, quotes: initialQuotes }: QuotesListClientProps) {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState(initialQuotes);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<QuoteItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<Record<string, boolean>>({});
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState("submitted_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    setQuotes(initialQuotes);
  }, [initialQuotes]);

  const rankedQuotes = useMemo(() => {
    return quotes
      .filter((q) => q.totalScore !== null)
      .sort((a, b) => Number(b.totalScore ?? 0) - Number(a.totalScore ?? 0));
  }, [quotes]);

  const rankMap = useMemo(() => {
    const map = new Map<string, number>();
    let rank = 1;
    for (const q of rankedQuotes) {
      map.set(q.id, rank++);
    }
    return map;
  }, [rankedQuotes]);

  const sortedQuotes = [...quotes].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case "total_amount": {
        const aVal = a.totalAmount ? Number(a.totalAmount) : 0;
        const bVal = b.totalAmount ? Number(b.totalAmount) : 0;
        cmp = aVal - bVal;
        break;
      }
      case "delivery_days":
        cmp = (a.deliveryDays ?? 999) - (b.deliveryDays ?? 999);
        break;
      case "score":
        cmp = Number(a.totalScore ?? 0) - Number(b.totalScore ?? 0);
        break;
      case "submitted_at":
      default:
        cmp = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    }
    return sortOrder === "asc" ? cmp : -cmp;
  });

  async function toggleExpand(quoteId: string) {
    if (expandedId === quoteId) {
      setExpandedId(null);
      setExpandedItems([]);
      return;
    }

    setLoadingItems(true);
    try {
      const res = await fetch(`/api/quotes/${quoteId}`);
      if (!res.ok) {
        toast("Failed to load quote items", "error");
        return;
      }
      const data = await res.json();
      setExpandedItems(data.quote?.items ?? []);
      setExpandedId(quoteId);
    } catch {
      toast("Failed to load quote items", "error");
    } finally {
      setLoadingItems(false);
    }
  }

  async function updateStatus(quoteId: string, newStatus: string) {
    setUpdatingStatus((prev) => ({ ...prev, [quoteId]: true }));
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        toast("Failed to update status", "error");
        return;
      }
      setQuotes((prev) =>
        prev.map((q) => (q.id === quoteId ? { ...q, status: newStatus } : q)),
      );
      toast("Status updated", "success");
    } catch {
      toast("Failed to update status", "error");
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [quoteId]: false }));
    }
  }

  const saveNotes = useCallback(
    async (quoteId: string) => {
      const notes = editingNotes[quoteId];
      if (notes === undefined) return;

      setSavingNotes((prev) => ({ ...prev, [quoteId]: true }));
      try {
        const res = await fetch(`/api/quotes/${quoteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes }),
        });
        if (!res.ok) {
          toast("Failed to save notes", "error");
          return;
        }
        setQuotes((prev) =>
          prev.map((q) => (q.id === quoteId ? { ...q, notes } : q)),
        );
        toast("Notes saved", "success");
      } catch {
        toast("Failed to save notes", "error");
      } finally {
        setSavingNotes((prev) => ({ ...prev, [quoteId]: false }));
      }
    },
    [editingNotes, toast],
  );

  function handleNoteChange(quoteId: string, value: string) {
    setEditingNotes((prev) => ({ ...prev, [quoteId]: value }));
  }

  function handleNoteBlur(quoteId: string) {
    saveNotes(quoteId);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/rfq/${rfqId}`} className="text-xs text-text-muted hover:text-text-secondary">
          &larr; Back to RFQ
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-xl font-bold text-text-primary">{rfqData.packageName}</h1>
          {rfqData.reference && (
            <span className="text-sm text-text-muted">Ref: {rfqData.reference}</span>
          )}
          {rfqData.awardedSupplierId && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5m14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1Z" />
              </svg>
              Awarded
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-xs text-text-primary"
          >
            <option value="submitted_at">Sort by Date</option>
            <option value="total_amount">Sort by Amount</option>
            <option value="delivery_days">Sort by Delivery</option>
            <option value="score">Sort by Score</option>
          </select>
          <button
            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="rounded-lg border border-border bg-bg-secondary px-2 py-1.5 text-xs text-text-secondary hover:bg-bg-elevated"
          >
            {sortOrder === "asc" ? "ASC" : "DESC"}
          </button>
        </div>

        {quotes.length > 1 && (
          <Link href={`/rfq/${rfqId}/compare`}>
            <Button size="sm">
              Compare All ({quotes.length})
            </Button>
          </Link>
        )}
      </div>

      {quotes.length === 0 ? (
        <div className="rounded-xl border border-border bg-bg-secondary p-8 text-center text-sm text-text-dim">
          No quotes submitted yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-tertiary">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">Supplier</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-dim">Rank</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-dim">Total Amount</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-dim">Currency</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-dim">Delivery</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-dim">Validity</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-dim">Items</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-dim">Score</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-dim">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {sortedQuotes.map((q) => {
                const rank = rankMap.get(q.id);
                const isAwarded = rfqData.awardedSupplierId === q.supplierId;
                return (
                  <Fragment key={q.id}>
                    <tr
                      onClick={() => toggleExpand(q.id)}
                      className={`cursor-pointer border-b border-border/30 transition-colors hover:bg-bg-elevated/50 ${
                        isAwarded ? "bg-amber-500/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">{q.supplierName}</span>
                          {isAwarded && (
                            <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5m14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1Z" />
                            </svg>
                          )}
                        </div>
                        <div className="text-xs text-text-dim">{q.supplierEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {rank ? (
                          <span className={`inline-flex items-center justify-center rounded-md border px-1.5 py-0.5 text-xs font-bold ${rankBadgeClass(rank)}`}>
                            {rank === 1 ? "1st" : rank === 2 ? "2nd" : rank === 3 ? "3rd" : `${rank}th`}
                          </span>
                        ) : (
                          <span className="text-xs text-text-dim">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {q.totalAmount ? (
                          <span className="font-semibold text-accent">
                            {Number(q.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-text-dim">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-text-secondary">{q.currency ?? "-"}</td>
                      <td className="px-4 py-3 text-center text-text-secondary">
                        {q.deliveryDays != null ? `${q.deliveryDays}d` : "-"}
                      </td>
                      <td className="px-4 py-3 text-center text-text-secondary">
                        {q.validityDays != null ? `${q.validityDays}d` : "-"}
                      </td>
                      <td className="px-4 py-3 text-center text-text-secondary">{q.itemCount}</td>
                      <td className="px-4 py-3 text-center">
                        {q.totalScore ? (
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-semibold text-accent">{Number(q.totalScore).toFixed(1)}</span>
                            <div className="mt-0.5 h-1 w-12 rounded-full bg-bg-tertiary">
                              <div
                                className="h-1 rounded-full bg-accent"
                                style={{ width: `${Math.min(Number(q.totalScore), 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-text-dim">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={q.status}
                          onChange={(e) => updateStatus(q.id, e.target.value)}
                          disabled={updatingStatus[q.id]}
                          className={`rounded-md border px-2 py-1 text-xs font-medium ${
                            q.status === "shortlisted"
                              ? "border-success/30 bg-success/10 text-success"
                              : q.status === "rejected"
                                ? "border-error/30 bg-error/10 text-error"
                                : q.status === "under_review"
                                  ? "border-info/30 bg-info/10 text-info"
                                  : "border-border bg-bg-secondary text-text-secondary"
                          }`}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-bg-secondary text-text-primary">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted">
                        {new Date(q.submittedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>

                    {expandedId === q.id && (
                      <tr className="border-b border-border/30 bg-bg-tertiary/30">
                        <td colSpan={10} className="px-6 py-4">
                          {loadingItems ? (
                            <div className="text-xs text-text-dim">Loading items...</div>
                          ) : (
                            <div className="space-y-4">
                              {q.coverLetter && (
                                <div>
                                  <div className="text-[10px] uppercase tracking-wider text-text-dim">Cover Letter</div>
                                  <p className="mt-1 text-xs text-text-secondary whitespace-pre-wrap">{q.coverLetter}</p>
                                </div>
                              )}

                              {expandedItems.length > 0 && (
                                <div>
                                  <div className="text-[10px] uppercase tracking-wider text-text-dim">Itemized Breakdown</div>
                                  <table className="mt-2 w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-border/50 text-left text-[10px] uppercase tracking-wider text-text-dim">
                                        <th className="pb-1.5 pr-3">Description</th>
                                        <th className="pb-1.5 pr-3">Unit</th>
                                        <th className="pb-1.5 pr-3 text-right">Qty</th>
                                        <th className="pb-1.5 pr-3 text-right">Unit Price</th>
                                        <th className="pb-1.5 text-right">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {expandedItems.map((item) => (
                                        <tr key={item.id} className="border-b border-border/20">
                                          <td className="py-1.5 pr-3 text-text-primary">{item.description}</td>
                                          <td className="py-1.5 pr-3 text-text-muted">{item.unit ?? "-"}</td>
                                          <td className="py-1.5 pr-3 text-right text-text-secondary">{item.quantity ?? "-"}</td>
                                          <td className="py-1.5 pr-3 text-right text-text-secondary">
                                            {item.unitPrice ? Number(item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}
                                          </td>
                                          <td className="py-1.5 text-right font-medium text-text-primary">
                                            {item.totalPrice ? Number(item.totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {q.attachments && q.attachments.length > 0 && (
                                <div>
                                  <div className="text-[10px] uppercase tracking-wider text-text-dim">Attachments</div>
                                  <div className="mt-1 flex flex-wrap gap-2">
                                    {q.attachments.map((url, idx) => (
                                      <a
                                        key={idx}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 rounded-md border border-border/50 px-2 py-1 text-xs text-accent hover:border-accent/30"
                                      >
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                                        </svg>
                                        File {idx + 1}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-text-dim">Internal Notes</div>
                                <textarea
                                  value={editingNotes[q.id] ?? q.notes ?? ""}
                                  onChange={(e) => handleNoteChange(q.id, e.target.value)}
                                  onBlur={() => handleNoteBlur(q.id)}
                                  placeholder="Add internal review notes..."
                                  rows={2}
                                  className="mt-1 w-full rounded-lg border border-border/50 bg-bg-secondary px-3 py-2 text-xs text-text-primary placeholder:text-text-dim focus:border-accent focus:outline-none"
                                />
                                {savingNotes[q.id] && (
                                  <span className="text-[10px] text-text-dim">Saving...</span>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
