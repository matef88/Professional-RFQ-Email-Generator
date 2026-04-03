"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import type { PackageItem, SubmissionPrice } from "@/lib/db/schema";

interface Invitation {
  id: string;
  authCode: string;
  shareLink: string | null;
  status: string;
  sentAt: string | null;
  lastAccessedAt: string | null;
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
}

interface Submission {
  id: string;
  invitationId: string;
  supplierId: string;
  supplierName: string;
  revision: number;
  prices: SubmissionPrice[];
  totalAmount: string | null;
  currency: string | null;
  submittedAt: string;
}

interface PackageDetail {
  package: {
    id: string;
    name: string;
    description: string | null;
    items: PackageItem[];
    rfqId: string | null;
    rfqPackageName: string | null;
    rfqReference: string | null;
    createdAt: string;
    updatedAt: string;
  };
  invitations: Invitation[];
  submissions: Submission[];
}

interface SupplierOption {
  id: string;
  name: string;
  email: string;
}

export default function PackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [data, setData] = useState<PackageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/packages/${id}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch {
      toast("Failed to load package", "error");
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetch("/api/suppliers?limit=200")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setSuppliers(
            d.data.map((s: { id: string; name: string; email: string }) => ({
              id: s.id,
              name: s.name,
              email: s.email,
            })),
          );
        }
      })
      .catch(() => {});
  }, []);

  async function handleSendInvitations() {
    if (selectedSuppliers.length === 0) {
      toast("Select at least one supplier", "error");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`/api/packages/${id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierIds: selectedSuppliers }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast(result.error ?? "Failed to send invitations", "error");
        return;
      }

      toast(`Invitations sent to ${selectedSuppliers.length} supplier(s)`, "success");
      setSelectedSuppliers([]);
      setShowInvite(false);
      fetchData();
    } catch {
      toast("Failed to send invitations", "error");
    } finally {
      setSending(false);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast("Code copied to clipboard", "success");
  }

  function copyLink(code: string) {
    const baseUrl = window.location.origin;
    navigator.clipboard.writeText(`${baseUrl}/portal/pricing?code=${code}`);
    toast("Link copied to clipboard", "success");
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "submitted":
      case "revised":
        return <Badge variant="success">{status}</Badge>;
      case "viewed":
        return <Badge variant="info">{status}</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-bg-secondary" />
        <div className="h-64 animate-pulse rounded-xl bg-bg-secondary" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-text-muted">Package not found.</p>;
  }

  const pkg = data.package;
  const alreadyInvited = new Set(data.invitations.map((i) => i.supplierId));
  const availableSuppliers = suppliers.filter((s) => !alreadyInvited.has(s.id));

  // Group submissions by supplier, keep latest revision
  const latestBySupplier = new Map<string, Submission>();
  for (const sub of data.submissions) {
    const existing = latestBySupplier.get(sub.supplierId);
    if (!existing || sub.revision > existing.revision) {
      latestBySupplier.set(sub.supplierId, sub);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/packages" className="text-xs text-text-muted hover:text-text-secondary">
          &larr; Packages
        </Link>
        <h1 className="mt-1 text-xl font-bold text-text-primary">{pkg.name}</h1>
        {pkg.rfqReference && (
          <p className="text-sm text-text-muted">
            RFQ: {pkg.rfqPackageName} ({pkg.rfqReference})
          </p>
        )}
        {pkg.description && (
          <p className="mt-1 text-sm text-text-secondary">{pkg.description}</p>
        )}
      </div>

      {/* BOQ Items */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-text-primary">BOQ Items ({pkg.items.length})</h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-secondary">
                <th className="px-4 py-2 text-left font-medium text-text-secondary">#</th>
                <th className="px-4 py-2 text-left font-medium text-text-secondary">Description</th>
                <th className="px-4 py-2 text-left font-medium text-text-secondary">Unit</th>
                <th className="px-4 py-2 text-right font-medium text-text-secondary">Qty</th>
                <th className="px-4 py-2 text-left font-medium text-text-secondary">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {pkg.items.map((item) => (
                <tr key={item.itemNo} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-2 text-text-dim">{item.itemNo}</td>
                  <td className="px-4 py-2 text-text-primary">{item.description}</td>
                  <td className="px-4 py-2 text-text-muted">{item.unit}</td>
                  <td className="px-4 py-2 text-right text-text-primary">{item.quantity}</td>
                  <td className="px-4 py-2 text-text-dim">{item.remarks || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Share with Suppliers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Share with Suppliers</h2>
          <Button
            type="button"
            onClick={() => setShowInvite(!showInvite)}
            disabled={availableSuppliers.length === 0}
          >
            {showInvite ? "Cancel" : "Invite Suppliers"}
          </Button>
        </div>

        {showInvite && (
          <div className="rounded-xl border border-border bg-bg-secondary p-4 space-y-3">
            <p className="text-xs text-text-muted">Select suppliers to invite:</p>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {availableSuppliers.map((s) => (
                <label key={s.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-bg-elevated cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSuppliers.includes(s.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSuppliers((prev) => [...prev, s.id]);
                      } else {
                        setSelectedSuppliers((prev) => prev.filter((id) => id !== s.id));
                      }
                    }}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-text-primary">{s.name}</span>
                  <span className="text-xs text-text-dim">{s.email}</span>
                </label>
              ))}
            </div>
            <Button
              type="button"
              onClick={handleSendInvitations}
              disabled={sending || selectedSuppliers.length === 0}
            >
              {sending
                ? "Sending..."
                : `Generate Codes & Send (${selectedSuppliers.length})`}
            </Button>
          </div>
        )}
      </div>

      {/* Invitations Table */}
      {data.invitations.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-text-primary">
            Invitations ({data.invitations.length})
          </h2>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-4 py-2 text-left font-medium text-text-secondary">Supplier</th>
                  <th className="px-4 py-2 text-left font-medium text-text-secondary">Auth Code</th>
                  <th className="px-4 py-2 text-left font-medium text-text-secondary">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-text-secondary">Sent</th>
                  <th className="px-4 py-2 text-left font-medium text-text-secondary">Last Access</th>
                  <th className="px-4 py-2 text-left font-medium text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.invitations.map((inv) => (
                  <tr key={inv.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-2">
                      <span className="text-text-primary">{inv.supplierName}</span>
                      <span className="ml-1 text-xs text-text-dim">{inv.supplierEmail}</span>
                    </td>
                    <td className="px-4 py-2">
                      <code className="rounded bg-bg-elevated px-2 py-0.5 font-mono text-xs text-accent">
                        {inv.authCode}
                      </code>
                    </td>
                    <td className="px-4 py-2">{statusBadge(inv.status)}</td>
                    <td className="px-4 py-2 text-xs text-text-dim">
                      {inv.sentAt
                        ? new Date(inv.sentAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-xs text-text-dim">
                      {inv.lastAccessedAt
                        ? new Date(inv.lastAccessedAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyCode(inv.authCode)}
                          className="text-xs text-accent hover:underline"
                        >
                          Copy Code
                        </button>
                        <button
                          onClick={() => copyLink(inv.authCode)}
                          className="text-xs text-accent hover:underline"
                        >
                          Copy Link
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submissions / Price Comparison */}
      {data.submissions.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-text-primary">
            Submitted Prices ({latestBySupplier.size} supplier{latestBySupplier.size !== 1 ? "s" : ""})
          </h2>
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="sticky left-0 z-10 bg-bg-secondary px-4 py-2 text-left font-medium text-text-secondary">
                      Item
                    </th>
                    {[...latestBySupplier.values()].map((sub) => (
                      <th
                        key={sub.supplierId}
                        className="px-4 py-2 text-right font-medium text-text-secondary"
                      >
                        {sub.supplierName}
                        {sub.revision > 1 && (
                          <span className="ml-1 text-[10px] text-accent">
                            (Rev {sub.revision})
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pkg.items.map((item) => (
                    <tr key={item.itemNo} className="border-b border-border last:border-b-0">
                      <td className="sticky left-0 z-10 bg-bg-primary px-4 py-2 text-text-primary">
                        <span className="text-text-dim mr-2">{item.itemNo}.</span>
                        {item.description}
                      </td>
                      {[...latestBySupplier.values()].map((sub) => {
                        const price = sub.prices?.find(
                          (p) => p.itemNo === item.itemNo,
                        );
                        return (
                          <td
                            key={sub.supplierId}
                            className="whitespace-nowrap px-4 py-2 text-right text-text-primary"
                          >
                            {price
                              ? Number(price.unitPrice).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })
                              : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-bg-secondary">
                    <td className="sticky left-0 z-10 bg-bg-secondary px-4 py-2 font-semibold text-text-primary">
                      Total
                    </td>
                    {[...latestBySupplier.values()].map((sub) => (
                      <td
                        key={sub.supplierId}
                        className="whitespace-nowrap px-4 py-2 text-right font-bold text-text-primary"
                      >
                        {sub.currency || "SAR"}{" "}
                        {Number(sub.totalAmount || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
