"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import MultiSelect from "@/components/ui/multi-select";
import { useToast } from "@/components/ui/toast";
import { SUPPLIER_SCOPES } from "@/lib/constants/scopes";

export default function NewSupplierPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    contactPerson: "",
    address: "",
    scopes: [] as string[],
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      newErrors.email = "Invalid email format";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error ?? "Failed to create supplier", "error");
        return;
      }

      toast("Supplier created successfully", "success");
      router.push("/suppliers");
    } catch {
      toast("Failed to create supplier", "error");
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/suppliers" className="text-xs text-text-muted hover:text-text-secondary">
          &larr; Suppliers
        </Link>
        <h1 className="mt-1 text-xl font-bold text-text-primary">Add Supplier</h1>
        <p className="text-sm text-text-muted">Create a new supplier contact</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Company Name *"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            error={errors.name}
            placeholder="e.g. Ahmed Trading Co."
          />
          <Input
            label="Email *"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            error={errors.email}
            placeholder="contact@company.com"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="+966 5x xxx xxxx"
          />
          <Input
            label="Contact Person"
            value={form.contactPerson}
            onChange={(e) => updateField("contactPerson", e.target.value)}
            placeholder="Full name"
          />
        </div>

        <Input
          label="Address"
          value={form.address}
          onChange={(e) => updateField("address", e.target.value)}
          placeholder="Street, City, Country"
        />

        <div className="space-y-1">
          <label className="block text-xs font-medium text-text-secondary">Scopes</label>
          <MultiSelect
            options={SUPPLIER_SCOPES}
            selectedValues={form.scopes}
            onChange={(values) => setForm((prev) => ({ ...prev, scopes: values }))}
            placeholder="Select scopes..."
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-text-secondary">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            rows={3}
            placeholder="Internal notes about this supplier..."
            className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder-text-dim transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Link href="/suppliers">
            <Button variant="secondary" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Supplier"}
          </Button>
        </div>
      </form>
    </div>
  );
}
