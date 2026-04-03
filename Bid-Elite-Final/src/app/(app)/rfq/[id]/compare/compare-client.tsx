"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Modal from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import EvaluationSetup from "@/components/compare/evaluation-setup";
import {
  rankQuotes,
  autoScoreQuotes,
  calculateWeightedTotal,
  DEFAULT_EVALUATION_CRITERIA,
  type QuoteForScoring,
  type QuoteWithRank,
} from "@/lib/utils/scoring";
import { exportToPdf, exportToExcel, type ComparisonData } from "@/lib/utils/export";
import type { EvaluationCriteria } from "@/lib/db/schema";

interface QuoteItem {
  description: string;
  unit: string | null;
  quantity: string | null;
  unitPrice: string | null;
  totalPrice: string | null;
}

interface SupplierQuote {
  id: string;
  supplierId: string;
  supplierName: string;
  totalAmount: string | null;
  currency: string | null;
  deliveryDays: number | null;
  validityDays: number | null;
  status: string;
  notes: string | null;
  scores: Record<string, number> | null;
  totalScore: string | null;
  items: QuoteItem[];
}

interface ComparePageClientProps {
  rfqId: string;
  rfqData: {
    packageName: string;
    reference: string | null;
    status: string;
    evaluationCriteria: EvaluationCriteria[] | null;
    awardedSupplierId: string | null;
    awardedAt: Date | null;
  };
  suppliers: SupplierQuote[];
}

type CompareTab = "overview" | "technical" | "commercial";

function rankBadge(rank: number): { label: string; className: string } {
  if (rank === 1) return { label: "1st", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
  if (rank === 2) return { label: "2nd", className: "bg-gray-400/20 text-gray-300 border-gray-400/30" };
  if (rank === 3) return { label: "3rd", className: "bg-orange-700/20 text-orange-500 border-orange-700/30" };
  return { label: `${rank}th`, className: "bg-bg-tertiary text-text-dim border-border" };
}

function statusVariant(status: string): "default" | "success" | "warning" | "error" | "info" {
  if (status === "shortlisted") return "success";
  if (status === "rejected") return "error";
  if (status === "under_review") return "info";
  return "default";
}

export default function ComparePageClient({ rfqId, rfqData, suppliers }: ComparePageClientProps) {
  const { toast } = useToast();
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>(
    rfqData.evaluationCriteria && rfqData.evaluationCriteria.length > 0
      ? rfqData.evaluationCriteria
      : DEFAULT_EVALUATION_CRITERIA,
  );
  const [activeTab, setActiveTab] = useState<CompareTab>("overview");
  const [customScores, setCustomScores] = useState<Record<string, Record<string, number>>>({});
  const [awarding, setAwarding] = useState(false);
  const [awardConfirmOpen, setAwardConfirmOpen] = useState(false);
  const [selectedAwardSupplier, setSelectedAwardSupplier] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const isAwarded = !!rfqData.awardedSupplierId;

  const quotesForScoring: QuoteForScoring[] = useMemo(
    () =>
      suppliers.map((s) => ({
        id: s.id,
        supplierId: s.supplierId,
        totalAmount: s.totalAmount,
        deliveryDays: s.deliveryDays,
        scores: { ...(s.scores ?? {}), ...(customScores[s.id] ?? {}) },
        totalScore: s.totalScore,
      })),
    [suppliers, customScores],
  );

  const ranked: QuoteWithRank[] = useMemo(
    () => rankQuotes(quotesForScoring, criteria),
    [quotesForScoring, criteria],
  );

  const rankMap = useMemo(() => {
    const map = new Map<string, QuoteWithRank>();
    for (const q of ranked) {
      map.set(q.id, q);
    }
    return map;
  }, [ranked]);

  const allDescriptions = useMemo(
    () => Array.from(new Set(suppliers.flatMap((s) => s.items.map((i) => i.description)))),
    [suppliers],
  );

  const numericAmounts = suppliers
    .map((s) => (s.totalAmount ? Number(s.totalAmount) : null))
    .filter((a): a is number => a !== null);
  const lowestAmount = numericAmounts.length > 0 ? Math.min(...numericAmounts) : null;

  const numericDelivery = suppliers
    .map((s) => s.deliveryDays)
    .filter((d): d is number => d !== null);
  const shortestDelivery = numericDelivery.length > 0 ? Math.min(...numericDelivery) : null;

  function handleAutoScore() {
    const scored = autoScoreQuotes(quotesForScoring, criteria);
    const newCustomScores: Record<string, Record<string, number>> = {};
    scored.forEach((scores, quoteId) => {
      newCustomScores[quoteId] = scores;
    });
    setCustomScores(newCustomScores);
    toast("Auto-scores calculated for Price and Delivery criteria", "success");
  }

  function handleCustomScoreChange(quoteId: string, criterionName: string, value: number) {
    setCustomScores((prev) => ({
      ...prev,
      [quoteId]: {
        ...(prev[quoteId] ?? {}),
        [criterionName]: Math.max(0, Math.min(100, value)),
      },
    }));
  }

  async function handleSaveAllScores() {
    try {
      const promises = suppliers.map(async (s) => {
        const mergedScores = { ...(s.scores ?? {}), ...(customScores[s.id] ?? {}) };
        const total = calculateWeightedTotal(mergedScores, criteria);

        const res = await fetch(`/api/quotes/${s.id}/score`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scores: mergedScores, totalScore: total }),
        });
        if (!res.ok) throw new Error("Failed to save scores");
        return { id: s.id, scores: mergedScores, totalScore: total };
      });

      await Promise.all(promises);
      toast("All scores saved successfully", "success");
      setCustomScores({});
    } catch {
      toast("Failed to save some scores", "error");
    }
  }

  const saveNote = useCallback(
    async (supplierId: string, quoteId: string) => {
      const notes = editingNotes[supplierId];
      if (notes === undefined) return;
      setSavingNotes((prev) => ({ ...prev, [supplierId]: true }));
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
        toast("Notes saved", "success");
      } catch {
        toast("Failed to save notes", "error");
      } finally {
        setSavingNotes((prev) => ({ ...prev, [supplierId]: false }));
      }
    },
    [editingNotes, toast],
  );

  async function handleAward() {
    if (!selectedAwardSupplier) return;
    setAwarding(true);
    try {
      const res = await fetch(`/api/rfqs/${rfqId}/award`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId: selectedAwardSupplier }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast(data.error ?? "Failed to award", "error");
        return;
      }
      toast("Supplier awarded successfully", "success");
      setAwardConfirmOpen(false);
    } catch {
      toast("Failed to award supplier", "error");
    } finally {
      setAwarding(false);
    }
  }

  function handleExportPdf() {
    const data: ComparisonData = {
      rfqName: rfqData.packageName,
      rfqReference: rfqData.reference,
      suppliers: suppliers.map((s) => ({
        id: s.id,
        supplierName: s.supplierName,
        totalAmount: s.totalAmount,
        currency: s.currency,
        deliveryDays: s.deliveryDays,
        validityDays: s.validityDays,
        status: s.status,
        notes: s.notes,
        items: s.items,
        scores: { ...(s.scores ?? {}), ...(customScores[s.id] ?? {}) },
        totalScore: rankMap.get(s.id)?.calculatedTotalScore ?? null,
        rank: rankMap.get(s.id)?.rank ?? null,
      })),
      allItemDescriptions: allDescriptions,
      evaluationCriteria: criteria,
    };
    exportToPdf(data, `${rfqData.reference ?? "comparison"}.pdf`);
  }

  function handleExportExcel() {
    const data: ComparisonData = {
      rfqName: rfqData.packageName,
      rfqReference: rfqData.reference,
      suppliers: suppliers.map((s) => ({
        id: s.id,
        supplierName: s.supplierName,
        totalAmount: s.totalAmount,
        currency: s.currency,
        deliveryDays: s.deliveryDays,
        validityDays: s.validityDays,
        status: s.status,
        notes: s.notes,
        items: s.items,
        scores: { ...(s.scores ?? {}), ...(customScores[s.id] ?? {}) },
        totalScore: rankMap.get(s.id)?.calculatedTotalScore ?? null,
        rank: rankMap.get(s.id)?.rank ?? null,
      })),
      allItemDescriptions: allDescriptions,
      evaluationCriteria: criteria,
    };
    exportToExcel(data, `${rfqData.reference ?? "comparison"}.xlsx`);
  }

  function toggleItems(quoteId: string) {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(quoteId)) {
        next.delete(quoteId);
      } else {
        next.add(quoteId);
      }
      return next;
    });
  }

  if (suppliers.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <Link href={`/rfq/${rfqId}/quotes`} className="text-xs text-text-muted hover:text-text-secondary">
            &larr; Back to Quotes
          </Link>
          <h1 className="mt-1 text-xl font-bold text-text-primary">{rfqData.packageName}</h1>
          <p className="mt-1 text-sm text-text-dim">No quotes to compare.</p>
        </div>
      </div>
    );
  }

  const topRanked = ranked[0];

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/rfq/${rfqId}/quotes`} className="text-xs text-text-muted hover:text-text-secondary">
          &larr; Back to Quotes
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-xl font-bold text-text-primary">{rfqData.packageName}</h1>
          {rfqData.reference && (
            <span className="text-sm text-text-muted">Ref: {rfqData.reference}</span>
          )}
        </div>
        <p className="mt-1 text-sm text-text-dim">
          Weighted comparison of {suppliers.length} quote{suppliers.length !== 1 ? "s" : ""}
        </p>
      </div>

      <EvaluationSetup
        rfqId={rfqId}
        criteria={criteria}
        onCriteriaSaved={setCriteria}
      />

      {ranked.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ranked.slice(0, 3).map((q) => {
            const supplier = suppliers.find((s) => s.id === q.id);
            const badge = rankBadge(q.rank);
            return (
              <div
                key={q.id}
                className={`rounded-xl border p-4 ${
                  q.rank === 1
                    ? "border-amber-500/40 bg-amber-500/5"
                    : "border-border bg-bg-secondary"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold ${badge.className}`}>
                    {badge.label}
                  </span>
                  <span className="text-lg font-bold text-text-primary">
                    {q.calculatedTotalScore.toFixed(1)}
                  </span>
                </div>
                <div className="mt-2 text-sm font-medium text-text-primary">
                  {supplier?.supplierName ?? "Unknown"}
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-text-dim">
                  <span>
                    {supplier?.totalAmount
                      ? `${supplier.currency ?? "USD"} ${Number(supplier.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                      : "No amount"}
                  </span>
                  {supplier?.deliveryDays != null && <span>{supplier.deliveryDays} days</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-border">
        {(["overview", "technical", "commercial"] as CompareTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
              activeTab === tab ? "text-accent" : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleAutoScore}>
            Auto-Score
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSaveAllScores}>
            Save Scores
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportPdf}>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            PDF
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportExcel}>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v1.5m0-1.5c0-.621.504-1.125 1.125-1.125m0 0h7.5" />
            </svg>
            Excel
          </Button>
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-tertiary">
                <th className="sticky left-0 z-10 bg-bg-tertiary px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">
                  Criteria
                </th>
                {suppliers.map((s) => {
                  const r = rankMap.get(s.id);
                  const badge = r ? rankBadge(r.rank) : null;
                  return (
                    <th key={s.id} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-dim min-w-[180px]">
                      <div className="flex items-center justify-center gap-2">
                        <span>{s.supplierName}</span>
                        {badge && (
                          <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${badge.className}`}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <Badge variant={statusVariant(s.status)}>{s.status.replace(/_/g, " ")}</Badge>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="sticky left-0 z-10 bg-bg-secondary px-4 py-3 text-xs font-medium text-text-dim">
                  Total Amount
                </td>
                {suppliers.map((s) => {
                  const amount = s.totalAmount ? Number(s.totalAmount) : null;
                  const isLowest = amount !== null && lowestAmount !== null && amount === lowestAmount;
                  return (
                    <td key={s.id} className={`px-4 py-3 text-center text-sm font-semibold ${isLowest ? "text-success" : "text-text-primary"}`}>
                      {amount !== null
                        ? `${s.currency ?? "USD"} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "-"}
                      {isLowest && <span className="ml-1 text-[10px] text-success">lowest</span>}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-b border-border/50">
                <td className="sticky left-0 z-10 bg-bg-secondary px-4 py-3 text-xs font-medium text-text-dim">
                  Delivery Days
                </td>
                {suppliers.map((s) => {
                  const isShortest = s.deliveryDays !== null && shortestDelivery !== null && s.deliveryDays === shortestDelivery;
                  return (
                    <td key={s.id} className={`px-4 py-3 text-center text-sm font-medium ${isShortest ? "text-success" : "text-text-primary"}`}>
                      {s.deliveryDays != null ? `${s.deliveryDays} days` : "-"}
                      {isShortest && <span className="ml-1 text-[10px] text-success">fastest</span>}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-b border-border/50">
                <td className="sticky left-0 z-10 bg-bg-secondary px-4 py-3 text-xs font-medium text-text-dim">
                  Validity Days
                </td>
                {suppliers.map((s) => (
                  <td key={s.id} className="px-4 py-3 text-center text-sm text-text-primary">
                    {s.validityDays != null ? `${s.validityDays} days` : "-"}
                  </td>
                ))}
              </tr>

              {criteria.length > 0 && (
                <tr className="border-b border-border bg-bg-tertiary/50">
                  <td colSpan={suppliers.length + 1} className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-dim">
                    Evaluation Scores
                  </td>
                </tr>
              )}

              {criteria.map((criterion) => (
                <tr key={criterion.name} className="border-b border-border/50">
                  <td className="sticky left-0 z-10 bg-bg-secondary px-4 py-2.5 text-xs font-medium text-text-dim">
                    {criterion.name} ({criterion.weight}%)
                  </td>
                  {suppliers.map((s) => {
                    const mergedScores = { ...(s.scores ?? {}), ...(customScores[s.id] ?? {}) };
                    const score = mergedScores[criterion.name];
                    const isAuto = criterion.type === "price" || criterion.type === "delivery";

                    if (isAuto) {
                      return (
                        <td key={s.id} className="px-4 py-2.5 text-center">
                          {score !== undefined ? (
                            <div className="flex flex-col items-center">
                              <span className={`text-sm font-semibold ${score >= 80 ? "text-success" : score >= 50 ? "text-amber-400" : "text-error"}`}>
                                {score}
                              </span>
                              <div className="mt-1 h-1 w-16 rounded-full bg-bg-tertiary">
                                <div
                                  className={`h-1 rounded-full ${score >= 80 ? "bg-success" : score >= 50 ? "bg-amber-400" : "bg-error"}`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-text-dim">-</span>
                          )}
                        </td>
                      );
                    }

                    return (
                      <td key={s.id} className="px-4 py-2.5 text-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={score ?? ""}
                          onChange={(e) => handleCustomScoreChange(s.id, criterion.name, Number(e.target.value))}
                          className="w-16 rounded-md border border-border/50 bg-bg-secondary px-2 py-1 text-center text-sm text-text-primary focus:border-accent focus:outline-none"
                          placeholder="-"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}

              {criteria.length > 0 && (
                <tr className="border-b border-border bg-bg-tertiary/30">
                  <td className="sticky left-0 z-10 bg-bg-tertiary px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-dim">
                    Total Score
                  </td>
                  {suppliers.map((s) => {
                    const r = rankMap.get(s.id);
                    const total = r?.calculatedTotalScore ?? 0;
                    return (
                      <td key={s.id} className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-base font-bold text-accent">{total.toFixed(1)}</span>
                          <div className="mt-1 h-1.5 w-24 rounded-full bg-bg-tertiary">
                            <div
                              className="h-1.5 rounded-full bg-accent"
                              style={{ width: `${total}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              )}

              {allDescriptions.length > 0 && (
                <tr className="border-b border-border bg-bg-tertiary/50">
                  <td colSpan={suppliers.length + 1} className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-dim">
                    Line Items
                  </td>
                </tr>
              )}

              {allDescriptions.map((desc, idx) => (
                <tr key={desc} className={idx % 2 === 0 ? "border-b border-border/30" : "border-b border-border/30 bg-bg-elevated/30"}>
                  <td className="sticky left-0 z-10 bg-bg-secondary px-4 py-2.5 text-xs text-text-secondary max-w-[200px] truncate">
                    {desc}
                  </td>
                  {suppliers.map((s) => {
                    const item = s.items.find((i) => i.description === desc);
                    return (
                      <td key={s.id} className="px-4 py-2.5 text-center text-xs text-text-primary">
                        {item?.totalPrice
                          ? Number(item.totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : "-"}
                      </td>
                    );
                  })}
                </tr>
              ))}

              <tr className="border-t border-border bg-bg-tertiary/50">
                <td className="sticky left-0 z-10 bg-bg-tertiary px-4 py-3 text-xs font-medium text-text-dim">
                  Internal Notes
                </td>
                {suppliers.map((s) => (
                  <td key={s.id} className="px-3 py-2">
                    <textarea
                      value={editingNotes[s.id] ?? s.notes ?? ""}
                      onChange={(e) =>
                        setEditingNotes((prev) => ({ ...prev, [s.id]: e.target.value }))
                      }
                      onBlur={() => saveNote(s.id, s.id)}
                      placeholder="Add notes..."
                      rows={2}
                      className="w-full rounded border border-border/50 bg-bg-secondary px-2 py-1 text-xs text-text-primary placeholder:text-text-dim focus:border-accent focus:outline-none"
                    />
                    {savingNotes[s.id] && (
                      <span className="text-[10px] text-text-dim">Saving...</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "technical" && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-tertiary">
                <th className="sticky left-0 z-10 bg-bg-tertiary px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">
                  Technical Criteria
                </th>
                {suppliers.map((s) => (
                  <th key={s.id} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-dim min-w-[180px]">
                    {s.supplierName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criteria
                .filter((c) => c.type === "quality" || c.type === "custom")
                .map((criterion) => (
                  <tr key={criterion.name} className="border-b border-border/50">
                    <td className="sticky left-0 z-10 bg-bg-secondary px-4 py-3 text-xs font-medium text-text-dim">
                      {criterion.name} ({criterion.weight}%)
                    </td>
                    {suppliers.map((s) => {
                      const mergedScores = { ...(s.scores ?? {}), ...(customScores[s.id] ?? {}) };
                      const score = mergedScores[criterion.name];
                      return (
                        <td key={s.id} className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={score ?? ""}
                            onChange={(e) => handleCustomScoreChange(s.id, criterion.name, Number(e.target.value))}
                            className="w-20 rounded-md border border-border/50 bg-bg-secondary px-2 py-1.5 text-center text-sm text-text-primary focus:border-accent focus:outline-none"
                            placeholder="-"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              <tr className="border-b border-border/50">
                <td className="sticky left-0 z-10 bg-bg-secondary px-4 py-3 text-xs font-medium text-text-dim">
                  Delivery Capability
                </td>
                {suppliers.map((s) => (
                  <td key={s.id} className="px-4 py-3 text-center text-sm text-text-primary">
                    {s.deliveryDays != null ? `${s.deliveryDays} days` : "-"}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border/50">
                <td className="sticky left-0 z-10 bg-bg-secondary px-4 py-3 text-xs font-medium text-text-dim">
                  Validity Period
                </td>
                {suppliers.map((s) => (
                  <td key={s.id} className="px-4 py-3 text-center text-sm text-text-primary">
                    {s.validityDays != null ? `${s.validityDays} days` : "-"}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border/50">
                <td className="sticky left-0 z-10 bg-bg-secondary px-4 py-3 text-xs font-medium text-text-dim">
                  Cover Letter
                </td>
                {suppliers.map((s) => (
                  <td key={s.id} className="px-4 py-3 text-center text-xs text-text-secondary max-w-[200px]">
                    {s.notes ? (
                      <span className="line-clamp-2">{s.notes}</span>
                    ) : (
                      <span className="text-text-dim">-</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "commercial" && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-tertiary">
                <th className="sticky left-0 z-10 bg-bg-tertiary px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">
                  Commercial Details
                </th>
                {suppliers.map((s) => {
                  const r = rankMap.get(s.id);
                  const badge = r ? rankBadge(r.rank) : null;
                  return (
                    <th key={s.id} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-dim min-w-[180px]">
                      <div className="flex items-center justify-center gap-2">
                        <span>{s.supplierName}</span>
                        {badge && (
                          <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${badge.className}`}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="sticky left-0 z-10 bg-bg-secondary px-4 py-3 text-xs font-medium text-text-dim">
                  Total Amount
                </td>
                {suppliers.map((s) => {
                  const amount = s.totalAmount ? Number(s.totalAmount) : null;
                  const isLowest = amount !== null && lowestAmount !== null && amount === lowestAmount;
                  return (
                    <td key={s.id} className={`px-4 py-3 text-center text-sm font-semibold ${isLowest ? "text-success" : "text-text-primary"}`}>
                      {amount !== null
                        ? `${s.currency ?? "USD"} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "-"}
                      {isLowest && <span className="ml-1 text-[10px] text-success">lowest</span>}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-b border-border/50">
                <td className="sticky left-0 z-10 bg-bg-secondary px-4 py-3 text-xs font-medium text-text-dim">
                  Currency
                </td>
                {suppliers.map((s) => (
                  <td key={s.id} className="px-4 py-3 text-center text-sm text-text-primary">
                    {s.currency ?? "-"}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border/50">
                <td className="sticky left-0 z-10 bg-bg-secondary px-4 py-3 text-xs font-medium text-text-dim">
                  Delivery
                </td>
                {suppliers.map((s) => (
                  <td key={s.id} className="px-4 py-3 text-center text-sm text-text-primary">
                    {s.deliveryDays != null ? `${s.deliveryDays} days` : "-"}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border/50">
                <td className="sticky left-0 z-10 bg-bg-secondary px-4 py-3 text-xs font-medium text-text-dim">
                  Validity
                </td>
                {suppliers.map((s) => (
                  <td key={s.id} className="px-4 py-3 text-center text-sm text-text-primary">
                    {s.validityDays != null ? `${s.validityDays} days` : "-"}
                  </td>
                ))}
              </tr>

              {criteria.filter((c) => c.type === "price").map((criterion) => (
                <tr key={criterion.name} className="border-b border-border/50">
                  <td className="sticky left-0 z-10 bg-bg-secondary px-4 py-3 text-xs font-medium text-text-dim">
                    {criterion.name} Score ({criterion.weight}%)
                  </td>
                  {suppliers.map((s) => {
                    const mergedScores = { ...(s.scores ?? {}), ...(customScores[s.id] ?? {}) };
                    const score = mergedScores[criterion.name];
                    return (
                      <td key={s.id} className="px-4 py-3 text-center">
                        {score !== undefined ? (
                          <span className={`text-sm font-semibold ${score >= 80 ? "text-success" : score >= 50 ? "text-amber-400" : "text-error"}`}>
                            {score}/100
                          </span>
                        ) : (
                          <span className="text-xs text-text-dim">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {allDescriptions.length > 0 && (
                <>
                  <tr className="border-b border-border bg-bg-tertiary/50">
                    <td colSpan={suppliers.length + 1} className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-dim">
                      Price Breakdown
                    </td>
                  </tr>
                  {allDescriptions.map((desc, idx) => (
                    <tr key={desc} className={idx % 2 === 0 ? "border-b border-border/30" : "border-b border-border/30 bg-bg-elevated/30"}>
                      <td className="sticky left-0 z-10 bg-bg-secondary px-4 py-2.5 text-xs text-text-secondary max-w-[200px] truncate">
                        {desc}
                      </td>
                      {suppliers.map((s) => {
                        const item = s.items.find((i) => i.description === desc);
                        return (
                          <td key={s.id} className="px-4 py-2.5 text-center text-xs text-text-primary">
                            {item?.totalPrice
                              ? Number(item.totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              : "-"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl border border-border bg-bg-secondary p-5">
        <h3 className="text-sm font-semibold text-text-primary">Award Decision</h3>
        {isAwarded ? (
          <div className="mt-3 flex items-center gap-3">
            <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5m14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1Z" />
            </svg>
            <span className="text-sm text-text-secondary">
              Awarded to {suppliers.find((s) => s.supplierId === rfqData.awardedSupplierId)?.supplierName ?? "Unknown"}
              {rfqData.awardedAt && (
                <span className="text-text-dim"> on {new Date(rfqData.awardedAt).toLocaleDateString()}</span>
              )}
            </span>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-text-dim">
              {topRanked
                ? `Recommended: ${suppliers.find((s) => s.id === topRanked.id)?.supplierName ?? "Unknown"} (${topRanked.calculatedTotalScore.toFixed(1)} points)`
                : "Score quotes to generate a recommendation."}
            </p>
            <div className="flex items-center gap-3">
              <select
                value={selectedAwardSupplier ?? ""}
                onChange={(e) => setSelectedAwardSupplier(e.target.value)}
                className="rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary"
              >
                <option value="">Select supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.supplierId} value={s.supplierId}>
                    {s.supplierName}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={() => setAwardConfirmOpen(true)}
                disabled={!selectedAwardSupplier}
              >
                Award Supplier
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal open={awardConfirmOpen} onClose={() => setAwardConfirmOpen(false)} title="Confirm Award">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Are you sure you want to award <strong className="text-text-primary">{rfqData.packageName}</strong> to{" "}
            <strong className="text-text-primary">{suppliers.find((s) => s.supplierId === selectedAwardSupplier)?.supplierName ?? "Unknown"}</strong>?
          </p>
          <div className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            This action will mark the RFQ as awarded and set the winning quote as shortlisted.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAwardConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleAward} disabled={awarding}>
              {awarding ? "Awarding..." : "Confirm Award"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
