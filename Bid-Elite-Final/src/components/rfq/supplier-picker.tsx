"use client";

import { useState, useMemo } from "react";
import MultiSelect from "@/components/ui/multi-select";
import Input from "@/components/ui/input";
import { SUPPLIER_SCOPES } from "@/lib/constants/scopes";

interface Supplier {
  id: string;
  name: string;
  email: string;
  scopes?: string[] | null;
}

interface SupplierPickerProps {
  suppliers: Supplier[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onSupplierCreated?: (supplier: Supplier) => void;
}

const SCOPE_COLORS: Record<string, string> = {
  ME: "bg-blue-500/15 text-blue-400",
  EE: "bg-yellow-500/15 text-yellow-400",
  CE: "bg-green-500/15 text-green-400",
  HVAC: "bg-red-500/15 text-red-400",
  Plumbing: "bg-cyan-500/15 text-cyan-400",
  "Fire Fighting": "bg-orange-500/15 text-orange-400",
  Structural: "bg-purple-500/15 text-purple-400",
  Finishing: "bg-pink-500/15 text-pink-400",
  Landscaping: "bg-emerald-500/15 text-emerald-400",
  "IT/ELV": "bg-indigo-500/15 text-indigo-400",
  General: "bg-gray-500/15 text-gray-400",
  Other: "bg-slate-500/15 text-slate-400",
};

function ScopeBadge({ scope }: { scope: string }) {
  const colorClass = SCOPE_COLORS[scope] ?? SCOPE_COLORS.Other;
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${colorClass}`}>
      {scope}
    </span>
  );
}

export default function SupplierPicker({
  suppliers,
  selectedIds,
  onChange,
  onSupplierCreated,
}: SupplierPickerProps) {
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    contactPerson: "",
    scopes: [] as string[],
  });

  const filtered = useMemo(() => {
    return suppliers.filter((s) => {
      if (search) {
        const q = search.toLowerCase();
        const matchesSearch =
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.scopes?.some((sc) => sc.toLowerCase().includes(q)) ?? false);
        if (!matchesSearch) return false;
      }

      if (scopeFilter.length > 0) {
        const hasScope = s.scopes?.some((sc) => scopeFilter.includes(sc)) ?? false;
        if (!hasScope) return false;
      }

      return true;
    });
  }, [suppliers, search, scopeFilter]);

  const hasNoResults = filtered.length === 0 && (search.length > 0 || scopeFilter.length > 0);

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id]
    );
  }

  function removeSelected(id: string) {
    onChange(selectedIds.filter((s) => s !== id));
  }

  async function handleCreateSupplier(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name.trim(),
          email: createForm.email.trim(),
          phone: createForm.phone.trim() || null,
          contactPerson: createForm.contactPerson.trim() || null,
          scopes: createForm.scopes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return;
      }

      const newSupplier: Supplier = {
        id: data.supplier.id,
        name: data.supplier.name,
        email: data.supplier.email,
        scopes: data.supplier.scopes ?? [],
      };

      if (onSupplierCreated) {
        onSupplierCreated(newSupplier);
      }

      onChange([...selectedIds, newSupplier.id]);
      setCreateForm({ name: "", email: "", phone: "", contactPerson: "", scopes: [] });
      setSuccessMsg(`"${newSupplier.name}" created and selected!`);
      setShowCreateForm(false);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
    } finally {
      setCreating(false);
    }
  }

  const selectedSuppliers = suppliers.filter((s) => selectedIds.includes(s.id));

  return (
    <div className="space-y-3">
      {selectedSuppliers.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium uppercase tracking-wider text-text-dim">
            Selected ({selectedSuppliers.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedSuppliers.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent"
              >
                {s.name}
                <button
                  onClick={() => removeSelected(s.id)}
                  className="ml-0.5 text-accent/60 hover:text-accent"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <input
          type="text"
          placeholder="Search by name, email, or scope..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder-text-dim transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <MultiSelect
          options={SUPPLIER_SCOPES}
          selectedValues={scopeFilter}
          onChange={setScopeFilter}
          placeholder="Filter by scope..."
        />
      </div>

      {successMsg && (
        <div className="rounded-lg bg-success/10 px-3 py-2 text-xs font-medium text-success">
          {successMsg}
        </div>
      )}

      <div className="max-h-52 space-y-1 overflow-y-auto">
        {filtered.length === 0 && !hasNoResults && (
          <p className="py-4 text-center text-xs text-text-dim">No suppliers available</p>
        )}
        {hasNoResults && (
          <div className="py-4 text-center">
            <p className="text-xs text-text-dim">No suppliers match your search</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-2 text-xs font-medium text-accent hover:text-accent/80"
            >
              + Create a new supplier
            </button>
          </div>
        )}
        {filtered.map((supplier) => (
          <label
            key={supplier.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/50 px-3 py-2 transition-colors hover:bg-bg-elevated/50"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(supplier.id)}
              onChange={() => toggle(supplier.id)}
              className="h-4 w-4 rounded border-border accent-accent"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-text-primary">{supplier.name}</div>
              <div className="text-xs text-text-dim">{supplier.email}</div>
              {supplier.scopes && supplier.scopes.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {supplier.scopes.map((sc) => (
                    <ScopeBadge key={sc} scope={sc} />
                  ))}
                </div>
              )}
            </div>
          </label>
        ))}
      </div>

      <div className="border-t border-border/50 pt-2">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex w-full items-center justify-between text-xs font-medium text-accent hover:text-accent/80"
        >
          <span>+ Create Fast Supplier</span>
          <span className="text-[10px]">{showCreateForm ? "▲" : "▼"}</span>
        </button>

        {showCreateForm && (
          <form onSubmit={handleCreateSupplier} className="mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
               <Input
                 label="Company Name *"
                 value={createForm.name}
                 onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                 placeholder="e.g. Ahmed Trading Co."
               />
               <Input
                 label="Email *"
                 type="email"
                 value={createForm.email}
                 onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                 placeholder="contact@company.com"
               />
            </div>

            <button
              type="submit"
              disabled={creating || !createForm.name.trim() || !createForm.email.trim()}
              className="w-full rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? "Adding..." : "Add Supplier"}
            </button>
          </form>
        )}
      </div>

      <div className="text-xs text-text-dim">
        {selectedIds.length} supplier{selectedIds.length !== 1 ? "s" : ""} selected
      </div>
    </div>
  );
}
