"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Input from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { TEMPLATES } from "@/lib/email/templates";

interface RfqItem {
  id: string;
  packageName: string;
  reference: string | null;
  deadline: string | null;
  template: string | null;
  status: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface RfqListClientProps {
  rfqs: RfqItem[];
  creatorMap?: Record<string, string>;
}

function statusVariant(status: string): "default" | "success" | "warning" | "error" | "info" {
  if (status === "draft") return "default";
  if (status === "sent") return "info";
  if (status === "open") return "success";
  if (status === "closed") return "warning";
  return "default";
}

function getTemplateName(id: string | null): string {
  if (!id) return "Standard";
  return TEMPLATES.find((t) => t.id === id)?.name ?? id;
}

function getTemplateIcon(id: string | null): string {
  if (!id) return "\uD83D\uDCC4";
  return TEMPLATES.find((t) => t.id === id)?.icon ?? "\uD83D\uDCC4";
}

export default function RfqListClient({ rfqs: initialRfqs, creatorMap = {} }: RfqListClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [rfqs, setRfqs] = useState(initialRfqs);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState<RfqItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = rfqs.filter((rfq) => {
    const matchesSearch = !search || rfq.packageName.toLowerCase().includes(search.toLowerCase()) || (rfq.reference?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = !statusFilter || rfq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function handleDelete() {
    if (!selectedRfq) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/rfqs/${selectedRfq.id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        toast(data.error ?? "Failed to delete RFQ", "error");
        return;
      }

      setRfqs((prev) => prev.filter((r) => r.id !== selectedRfq.id));
      setDeleteModalOpen(false);
      setSelectedRfq(null);
      toast("RFQ deleted", "success");
    } catch {
      toast("Failed to delete RFQ", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder="Search RFQs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <Link href="/rfq/new">
          <Button>New RFQ</Button>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-bg-secondary p-8 text-center text-sm text-text-dim">
          {rfqs.length === 0 ? "No RFQs yet. Create your first RFQ to get started." : "No RFQs match your search."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-bg-secondary">
          <div className="hidden border-b border-border px-5 py-2.5 sm:grid sm:grid-cols-12 sm:gap-4">
            <div className="col-span-3 text-[11px] font-medium uppercase tracking-wider text-text-dim">Package Name</div>
            <div className="col-span-2 text-[11px] font-medium uppercase tracking-wider text-text-dim">Reference</div>
            <div className="col-span-2 text-[11px] font-medium uppercase tracking-wider text-text-dim">Template</div>
            <div className="col-span-1 text-[11px] font-medium uppercase tracking-wider text-text-dim">Status</div>
            <div className="col-span-2 text-[11px] font-medium uppercase tracking-wider text-text-dim">Deadline</div>
            <div className="col-span-2 text-[11px] font-medium uppercase tracking-wider text-text-dim">Created</div>
          </div>
          <div className="divide-y divide-border/50">
            {filtered.map((rfq) => (
              <div
                key={rfq.id}
                className="group flex items-center px-5 py-3 transition-colors hover:bg-bg-elevated/50 sm:grid sm:grid-cols-12 sm:gap-4"
              >
                <div
                  className="col-span-3 min-w-0 flex-1 cursor-pointer sm:flex-none"
                  onClick={() => router.push(`/rfq/${rfq.id}`)}
                >
                  <div className="truncate text-sm font-medium text-text-primary">{rfq.packageName}</div>
                  <div className="text-xs text-text-dim sm:hidden">
                    {rfq.reference && <span className="mr-2">Ref: {rfq.reference}</span>}
                    <Badge variant={statusVariant(rfq.status)}>{rfq.status}</Badge>
                  </div>
                </div>
                <div className="col-span-2 hidden truncate text-xs text-text-secondary sm:block">
                  {rfq.reference || "\u2014"}
                </div>
                <div className="col-span-2 hidden items-center gap-1.5 text-xs text-text-secondary sm:flex">
                  <span>{getTemplateIcon(rfq.template)}</span>
                  <span>{getTemplateName(rfq.template)}</span>
                </div>
                <div className="col-span-1 hidden sm:block">
                  <Badge variant={statusVariant(rfq.status)}>{rfq.status}</Badge>
                </div>
                <div className="col-span-2 hidden text-xs text-text-dim sm:block">
                  {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString() : "\u2014"}
                </div>
                <div className="col-span-2 hidden text-xs text-text-dim sm:block">
                  <div>{new Date(rfq.createdAt).toLocaleDateString()}</div>
                  {rfq.createdBy && creatorMap[rfq.createdBy] && (
                    <div className="text-[10px] text-text-dim">by {creatorMap[rfq.createdBy]}</div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1 sm:col-span-12 sm:justify-end">
                  <Link
                    href={`/rfq/${rfq.id}/edit`}
                    className="rounded-lg p-1.5 text-text-muted opacity-0 transition-opacity hover:bg-bg-elevated hover:text-text-secondary group-hover:opacity-100"
                    title="Edit"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                  </Link>
                  {rfq.status === "draft" && (
                    <button
                      onClick={() => {
                        setSelectedRfq(rfq);
                        setDeleteModalOpen(true);
                      }}
                      className="rounded-lg p-1.5 text-text-muted opacity-0 transition-opacity hover:bg-error/10 hover:text-error group-hover:opacity-100"
                      title="Delete"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete RFQ">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete <span className="font-semibold text-text-primary">{selectedRfq?.packageName}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
