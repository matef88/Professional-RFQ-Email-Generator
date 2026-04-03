"use client";

import { useState } from "react";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { exportToPdf, exportToExcel, type ComparisonData } from "@/lib/utils/export";

interface QuoteItem {
  description: string;
  unit: string | null;
  quantity: string | null;
  unitPrice: string | null;
  totalPrice: string | null;
}

interface SupplierQuote {
  id: string;
  supplierName: string;
  totalAmount: string | null;
  currency: string | null;
  deliveryDays: number | null;
  validityDays: number | null;
  status: string;
  notes: string | null;
  items: QuoteItem[];
}

interface QuoteComparisonTableProps {
  rfqName: string;
  rfqReference: string | null;
  suppliers: SupplierQuote[];
}

function statusVariant(status: string): "default" | "success" | "warning" | "error" | "info" {
  if (status === "shortlisted") return "success";
  if (status === "rejected") return "error";
  if (status === "under_review") return "info";
  return "default";
}

export default function QuoteComparisonTable({
  rfqName,
  rfqReference,
  suppliers,
}: QuoteComparisonTableProps) {
  const { toast } = useToast();
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<Record<string, boolean>>({});

  const allDescriptions = Array.from(
    new Set(suppliers.flatMap((s) => s.items.map((i) => i.description))),
  );

  const numericAmounts = suppliers
    .map((s) => (s.totalAmount ? Number(s.totalAmount) : null))
    .filter((a): a is number => a !== null);
  const lowestAmount = numericAmounts.length > 0 ? Math.min(...numericAmounts) : null;

  const numericDelivery = suppliers
    .map((s) => s.deliveryDays)
    .filter((d): d is number => d !== null);
  const shortestDelivery = numericDelivery.length > 0 ? Math.min(...numericDelivery) : null;

  function handleNoteChange(supplierId: string, value: string) {
    setEditingNotes((prev) => ({ ...prev, [supplierId]: value }));
  }

  async function saveNote(supplierId: string, quoteId: string) {
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
  }

  function handleExportPdf() {
    const data: ComparisonData = {
      rfqName,
      rfqReference,
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
      })),
      allItemDescriptions: allDescriptions,
    };
    exportToPdf(data, `${rfqReference ?? "comparison"}.pdf`);
  }

  function handleExportExcel() {
    const data: ComparisonData = {
      rfqName,
      rfqReference,
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
      })),
      allItemDescriptions: allDescriptions,
    };
    exportToExcel(data, `${rfqReference ?? "comparison"}.xlsx`);
  }

  if (suppliers.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-bg-secondary p-8 text-center text-sm text-text-dim">
        No quotes to compare.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
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

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-tertiary">
              <th className="sticky left-0 z-10 bg-bg-tertiary px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">
                Criteria
              </th>
              {suppliers.map((s) => (
                <th key={s.id} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-dim min-w-[160px]">
                  <div>{s.supplierName}</div>
                  <div className="mt-1">
                    <Badge variant={statusVariant(s.status)}>{s.status.replace(/_/g, " ")}</Badge>
                  </div>
                </th>
              ))}
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
                    {isLowest && (
                      <span className="ml-1 text-[10px] text-success">lowest</span>
                    )}
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
                    {isShortest && (
                      <span className="ml-1 text-[10px] text-success">fastest</span>
                    )}
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

            {allDescriptions.length > 0 && (
              <tr className="border-b border-border bg-bg-tertiary/50">
                <td
                  colSpan={suppliers.length + 1}
                  className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-dim"
                >
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
                    onChange={(e) => handleNoteChange(s.id, e.target.value)}
                    onBlur={() => saveNote(s.id, s.id)}
                    onBlurCapture={() => {}}
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
    </div>
  );
}
