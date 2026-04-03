"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Input from "@/components/ui/input";
import MultiSelect from "@/components/ui/multi-select";
import Modal from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { SUPPLIER_SCOPES } from "@/lib/constants/scopes";

interface SupplierData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  contactPerson: string | null;
  address: string | null;
  category: string | null;
  scopes: string[] | null;
  notes: string | null;
  isActive: boolean;
  isRegistered: boolean | null;
  createdAt: Date;
}

interface RfqHistoryItem {
  id: string;
  rfqId: string;
  packageName: string;
  reference: string | null;
  deadline: string | null;
  rfqStatus: string;
  supplierStatus: string;
  emailSentAt: Date | null;
  viewedAt: Date | null;
  quotedAt: Date | null;
}

interface QuoteItem {
  id: string;
  rfqId: string;
  packageName: string;
  coverLetter: string | null;
  totalAmount: string | null;
  currency: string | null;
  deliveryDays: number | null;
  validityDays: number | null;
  status: string;
  submittedAt: Date;
}

interface Stats {
  totalRfqs: number;
  totalQuotes: number;
  averageAmount: number | null;
}

interface SupplierDetailClientProps {
  supplier: Record<string, unknown>;
  rfqHistory: RfqHistoryItem[];
  quotes: QuoteItem[];
  stats: Stats;
}

type Tab = "rfqs" | "quotes";

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

function rfqStatusVariant(status: string): "default" | "success" | "warning" | "error" | "info" {
  if (status === "draft") return "default";
  if (status === "sent") return "info";
  if (status === "open") return "success";
  if (status === "closed") return "warning";
  return "default";
}

function supplierStatusVariant(status: string): "default" | "success" | "warning" | "info" {
  if (status === "pending") return "default";
  if (status === "viewed") return "info";
  if (status === "quoted") return "success";
  if (status === "declined") return "warning";
  return "default";
}

function quoteStatusVariant(status: string): "default" | "success" | "warning" | "error" | "info" {
  if (status === "submitted") return "info";
  if (status === "under_review") return "warning";
  if (status === "shortlisted") return "success";
  if (status === "rejected") return "error";
  return "default";
}

export default function SupplierDetailClient({
  supplier: supplierRaw,
  rfqHistory,
  quotes,
  stats,
}: SupplierDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("rfqs");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const supplier = supplierRaw as unknown as SupplierData;

  const [editForm, setEditForm] = useState({
    name: supplier.name ?? "",
    email: supplier.email ?? "",
    phone: supplier.phone ?? "",
    contactPerson: supplier.contactPerson ?? "",
    address: supplier.address ?? "",
    scopes: (supplier.scopes ?? []) as string[],
    notes: supplier.notes ?? "",
  });

  async function handleSaveEdit() {
    setSaving(true);
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        const data = await res.json();
        toast(data.error ?? "Failed to update supplier", "error");
        return;
      }

      toast("Supplier updated successfully", "success");
      setEditModalOpen(false);
      router.refresh();
    } catch {
      toast("Failed to update supplier", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleInvite() {
    setInviteLoading(true);
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}/invite`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Failed to generate invitation", "error");
        return;
      }
      setInviteLink(data.registrationUrl);
    } catch {
      toast("Failed to generate invitation", "error");
    } finally {
      setInviteLoading(false);
    }
  }

  function handleCopyLink() {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "rfqs", label: "RFQ History", count: rfqHistory.length },
    { id: "quotes", label: "Quotes", count: quotes.length },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <Link href="/suppliers" className="text-xs text-text-muted hover:text-text-secondary">
              &larr; Suppliers
            </Link>
            <div className="mt-1 flex items-center gap-3">
              <h1 className="text-xl font-bold text-text-primary">{supplier.name}</h1>
              <Badge variant={supplier.isActive ? "success" : "default"}>
                {supplier.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted">
              <span>{supplier.email}</span>
              {supplier.phone && <span>{supplier.phone}</span>}
              {supplier.contactPerson && <span>Contact: {supplier.contactPerson}</span>}
            </div>
            {supplier.address && (
              <div className="mt-1 text-sm text-text-muted">{supplier.address}</div>
            )}
            {(supplier.scopes && supplier.scopes.length > 0) && (
              <div className="mt-2 flex flex-wrap gap-1">
                {supplier.scopes.map((sc) => (
                  <ScopeBadge key={sc} scope={sc} />
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Badge variant={supplier.isRegistered ? "success" : "default"}>
                {supplier.isRegistered ? "Portal Registered" : "Not Registered"}
              </Badge>
              <Button variant="secondary" size="sm" onClick={() => setEditModalOpen(true)}>
                Edit
              </Button>
            </div>
            {!supplier.isRegistered && !inviteLink && (
              <Button
                variant="ghost"
                size="sm"
                disabled={inviteLoading}
                onClick={handleInvite}
              >
                {inviteLoading ? "Generating..." : "Invite to Portal"}
              </Button>
            )}
            {inviteLink && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-tertiary p-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="w-64 bg-transparent text-xs text-text-secondary focus:outline-none"
                />
                <Button size="sm" onClick={handleCopyLink}>
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            )}
          </div></div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-bg-secondary p-4">
            <p className="text-xs font-medium text-text-muted">Total RFQs Received</p>
            <p className="mt-1 text-2xl font-bold text-text-primary">{stats.totalRfqs}</p>
          </div>
          <div className="rounded-xl border border-border bg-bg-secondary p-4">
            <p className="text-xs font-medium text-text-muted">Total Quotes Submitted</p>
            <p className="mt-1 text-2xl font-bold text-text-primary">{stats.totalQuotes}</p>
          </div>
          <div className="rounded-xl border border-border bg-bg-secondary p-4">
            <p className="text-xs font-medium text-text-muted">Average Quote Amount</p>
            <p className="mt-1 text-2xl font-bold text-accent">
              {stats.averageAmount !== null
                ? `$${stats.averageAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "\u2014"}
            </p>
          </div>
        </div>

        <div className="flex gap-1 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-accent"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 text-xs text-text-dim">({tab.count})</span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
              )}
            </button>
          ))}
        </div>

        {activeTab === "rfqs" && (
          <div className="rounded-xl border border-border bg-bg-secondary">
            {rfqHistory.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-text-dim">
                No RFQs have been sent to this supplier yet.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {rfqHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-text-primary">
                        {item.packageName}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-text-dim">
                        {item.reference && <span>Ref: {item.reference}</span>}
                        {item.deadline && <span>Due: {new Date(item.deadline).toLocaleDateString()}</span>}
                        {item.emailSentAt && <span>Sent: {new Date(item.emailSentAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={rfqStatusVariant(item.rfqStatus)}>{item.rfqStatus}</Badge>
                      <Badge variant={supplierStatusVariant(item.supplierStatus)}>{item.supplierStatus}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "quotes" && (
          <div className="rounded-xl border border-border bg-bg-secondary">
            {quotes.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-text-dim">
                No quotes submitted by this supplier yet.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {quotes.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-text-primary">
                        {q.packageName}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-text-dim">
                        {q.deliveryDays && <span>{q.deliveryDays} days delivery</span>}
                        {q.validityDays && <span>{q.validityDays} days validity</span>}
                        <span>Submitted: {new Date(q.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      {q.totalAmount ? (
                        <div className="text-sm font-semibold text-accent">
                          {q.currency ?? "USD"} {Number(q.totalAmount).toLocaleString()}
                        </div>
                      ) : (
                        <span className="text-xs text-text-dim">No amount</span>
                      )}
                      <Badge variant={quoteStatusVariant(q.status)}>{q.status.replace("_", " ")}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Supplier">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Company Name *"
              value={editForm.name}
              onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
            />
            <Input
              label="Email *"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Phone"
              value={editForm.phone}
              onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
            />
            <Input
              label="Contact Person"
              value={editForm.contactPerson}
              onChange={(e) => setEditForm((p) => ({ ...p, contactPerson: e.target.value }))}
            />
          </div>
          <Input
            label="Address"
            value={editForm.address}
            onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
          />
          <div className="space-y-1">
            <label className="block text-xs font-medium text-text-secondary">Scopes</label>
            <MultiSelect
              options={SUPPLIER_SCOPES}
              selectedValues={editForm.scopes}
              onChange={(values) => setEditForm((p) => ({ ...p, scopes: values }))}
              placeholder="Select scopes..."
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-text-secondary">Notes</label>
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder-text-dim focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
