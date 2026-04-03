"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface RfqOption {
  id: string;
  packageName: string;
  reference: string | null;
}

interface ItemRow {
  itemNo: string;
  description: string;
  unit: string;
  quantity: string;
  remarks: string;
}

const emptyItem = (): ItemRow => ({
  itemNo: "",
  description: "",
  unit: "pcs",
  quantity: "",
  remarks: "",
});

export default function NewPackagePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [rfqs, setRfqs] = useState<RfqOption[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rfqId, setRfqId] = useState("");
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    fetch("/api/rfqs?limit=100")
      .then((r) => r.json())
      .then((data) => {
        if (data.data) {
          setRfqs(
            data.data.map((r: { id: string; packageName: string; reference: string | null }) => ({
              id: r.id,
              packageName: r.packageName,
              reference: r.reference,
            })),
          );
        }
      })
      .catch(() => {});
  }, []);

  function addRow() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeRow(idx: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof ItemRow, value: string) {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    const rows = text.split("\n").filter((r) => r.trim());

    if (rows.length === 0) return;

    const parsed: ItemRow[] = rows.map((row, idx) => {
      const cols = row.split("\t");
      return {
        itemNo: cols[0]?.trim() || String(idx + 1),
        description: cols[1]?.trim() || "",
        unit: cols[2]?.trim() || "pcs",
        quantity: cols[3]?.trim() || "1",
        remarks: cols[4]?.trim() || "",
      };
    });

    setItems(parsed);
    toast(`Pasted ${parsed.length} items from clipboard`, "success");
  }

  async function handleAIUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/packages/extract-boq", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) {
        toast(data.error || "Failed to extract items", "error");
        return;
      }
      
      if (data.items && data.items.length > 0) {
        const parsed: ItemRow[] = data.items.map((item: any) => ({
          itemNo: item.itemNo || "",
          description: item.description || "",
          unit: item.unit || "pcs",
          quantity: String(item.quantity || "1"),
          remarks: item.remarks || "",
        }));
        setItems(parsed);
        toast(`Extracted ${parsed.length} items successfully`, "success");
      } else {
         toast("No items found in the document", "error");
      }
    } catch (err) {
      toast("Error parsing file", "error");
    } finally {
      setExtracting(false);
      e.target.value = ''; // reset input
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast("Package name is required", "error");
      return;
    }

    const validItems = items.filter((i) => i.description.trim());
    if (validItems.length === 0) {
      toast("At least one item with a description is required", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          rfqId: rfqId || null,
          items: validItems.map((item, idx) => ({
            itemNo: item.itemNo || String(idx + 1),
            description: item.description.trim(),
            unit: item.unit || "pcs",
            quantity: Number(item.quantity) || 1,
            remarks: item.remarks.trim() || undefined,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error ?? "Failed to create package", "error");
        return;
      }

      toast("Package created successfully", "success");
      router.push(`/packages/${data.package.id}`);
    } catch {
      toast("Failed to create package", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/packages" className="text-xs text-text-muted hover:text-text-secondary">
          &larr; Packages
        </Link>
        <h1 className="mt-1 text-xl font-bold text-text-primary">Create Package</h1>
        <p className="text-sm text-text-muted">
          Define BOQ items to share with suppliers for pricing
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Package Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. MEP Works Phase 2"
          />
          <div className="space-y-1">
            <label className="block text-xs font-medium text-text-secondary">
              Link to RFQ (optional)
            </label>
            <select
              value={rfqId}
              onChange={(e) => {
                setRfqId(e.target.value);
                if (e.target.value && !name) {
                  const rfq = rfqs.find((r) => r.id === e.target.value);
                  if (rfq) setName(rfq.packageName);
                }
              }}
              className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">None</option>
              {rfqs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.packageName} {r.reference ? `(${r.reference})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-text-secondary">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Brief description of this package..."
            className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* BOQ Items Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text-secondary">
              BOQ Items
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-text-dim">
                Tip: Paste from Excel (Item No | Desc | Unit | Qty | Remarks)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-dashed border-border bg-bg-secondary p-4">
             <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">AI-Powered BOQ Extraction</p>
                <p className="text-xs text-text-muted">Upload a PDF, Excel, or CSV file to let AI extract line items automatically.</p>
             </div>
             <div>
                <input type="file" id="ai-upload" className="hidden" accept=".pdf,.csv,.xlsx,.xls" onChange={handleAIUpload} disabled={extracting}/>
                <Button type="button" variant="secondary" disabled={extracting} onClick={() => document.getElementById("ai-upload")?.click()}>
                   {extracting ? "Extracting..." : "Upload Document"}
                </Button>
             </div>
          </div>

          {/* Hidden textarea for paste support */}
          <textarea
            className="sr-only"
            id="paste-area"
            onPaste={handlePaste}
            placeholder="Paste from Excel here"
          />
          <button
            type="button"
            onClick={() => document.getElementById("paste-area")?.focus()}
            className="text-xs text-accent hover:underline"
          >
            Click to paste from Excel
          </button>

          <div className="overflow-hidden rounded-xl border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="w-16 px-3 py-2 text-left font-medium text-text-secondary">#</th>
                    <th className="px-3 py-2 text-left font-medium text-text-secondary">Description *</th>
                    <th className="w-24 px-3 py-2 text-left font-medium text-text-secondary">Unit</th>
                    <th className="w-24 px-3 py-2 text-left font-medium text-text-secondary">Qty *</th>
                    <th className="px-3 py-2 text-left font-medium text-text-secondary">Remarks</th>
                    <th className="w-10 px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b border-border last:border-b-0">
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          value={item.itemNo}
                          onChange={(e) => updateItem(idx, "itemNo", e.target.value)}
                          placeholder={String(idx + 1)}
                          className="w-full rounded border border-border bg-bg-primary px-2 py-1 text-xs text-text-primary focus:border-accent focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(idx, "description", e.target.value)}
                          placeholder="Item description"
                          className="w-full rounded border border-border bg-bg-primary px-2 py-1 text-xs text-text-primary focus:border-accent focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => updateItem(idx, "unit", e.target.value)}
                          placeholder="pcs"
                          className="w-full rounded border border-border bg-bg-primary px-2 py-1 text-xs text-text-primary focus:border-accent focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                          placeholder="1"
                          className="w-full rounded border border-border bg-bg-primary px-2 py-1 text-xs text-text-primary focus:border-accent focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          value={item.remarks}
                          onChange={(e) => updateItem(idx, "remarks", e.target.value)}
                          placeholder="Optional"
                          className="w-full rounded border border-border bg-bg-primary px-2 py-1 text-xs text-text-primary focus:border-accent focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <button
                          type="button"
                          onClick={() => removeRow(idx)}
                          disabled={items.length <= 1}
                          className="text-text-dim hover:text-error disabled:opacity-30"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1 text-xs text-accent hover:underline"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Row
          </button>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Link href="/packages">
            <Button variant="secondary" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create Package"}
          </Button>
        </div>
      </form>
    </div>
  );
}
