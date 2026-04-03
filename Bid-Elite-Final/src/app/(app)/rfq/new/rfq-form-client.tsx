"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

interface Supplier {
  id: string;
  name: string;
  email: string;
}

interface TemplateConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

interface RfqFormClientProps {
  suppliers: Supplier[];
  templates: TemplateConfig[];
  initialData?: {
    id: string;
    packageName: string;
    reference: string;
    deadline: string;
    template: string;
    details: string;
    packageLink: string;
    docsLink: string;
    supplierIds: string[];
  };
}

export default function RfqFormClient({ suppliers, templates, initialData }: RfqFormClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!initialData;

  const [packageName, setPackageName] = useState(initialData?.packageName ?? "");
  const [reference, setReference] = useState(initialData?.reference ?? "");
  const [deadline, setDeadline] = useState(initialData?.deadline ?? "");
  const [template, setTemplate] = useState(initialData?.template ?? "standard");
  const [details, setDetails] = useState(initialData?.details ?? "");
  const [packageLink, setPackageLink] = useState(initialData?.packageLink ?? "");
  const [docsLink, setDocsLink] = useState(initialData?.docsLink ?? "");
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>(initialData?.supplierIds ?? []);
  const [saving, setSaving] = useState(false);

  function toggleSupplier(id: string) {
    setSelectedSupplierIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!packageName.trim()) {
      toast("Package name is required", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        packageName: packageName.trim(),
        reference: reference.trim(),
        deadline,
        template,
        details: details.trim(),
        packageLink: packageLink.trim(),
        docsLink: docsLink.trim(),
        supplierIds: selectedSupplierIds,
      };

      const url = isEdit ? `/api/rfqs/${initialData!.id}` : "/api/rfqs";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error ?? `Failed to ${isEdit ? "update" : "create"} RFQ`, "error");
        return;
      }

      toast(isEdit ? "RFQ updated successfully" : "RFQ created successfully", "success");
      router.push(isEdit ? `/rfq/${initialData!.id}` : "/rfq");
      router.refresh();
    } catch {
      toast(`Failed to ${isEdit ? "update" : "create"} RFQ`, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-bg-secondary">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-text-primary">RFQ Details</h3>
          </div>
          <div className="space-y-4 p-5">
            <Input
              label="Package Name"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="e.g., HVAC System Package A"
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g., RFQ-2024-001"
              />
              <Input
                label="Deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <Select
              label="Email Template"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              options={templates.map((t) => ({ value: t.id, label: `${t.icon} ${t.name}` }))}
            />
            <div>
              <label className="block text-xs font-medium text-text-secondary">Details</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                placeholder="Additional project details or requirements..."
                className="mt-1 w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder-text-dim transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Package Link"
                value={packageLink}
                onChange={(e) => setPackageLink(e.target.value)}
                placeholder="https://..."
              />
              <Input
                label="Docs Link"
                value={docsLink}
                onChange={(e) => setDocsLink(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-bg-secondary">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-text-primary">
              Suppliers <span className="text-text-dim">({selectedSupplierIds.length} selected)</span>
            </h3>
          </div>
          <div className="p-5">
            {suppliers.length === 0 ? (
              <p className="text-sm text-text-dim">No suppliers available. Add suppliers first.</p>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {suppliers.map((supplier) => (
                  <label
                    key={supplier.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/50 px-3 py-2 transition-colors hover:bg-bg-elevated/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSupplierIds.includes(supplier.id)}
                      onChange={() => toggleSupplier(supplier.id)}
                      className="h-4 w-4 rounded border-border accent-accent"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-text-primary">{supplier.name}</div>
                      <div className="text-xs text-text-dim">{supplier.email}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Update RFQ" : "Create RFQ"}
          </Button>
        </div>
      </div>
    </form>
  );
}
