"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Modal from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { getTemplateById } from "@/lib/email/templates";

interface SupplierLink {
  id: string;
  supplierId: string;
  status: string;
  emailSentAt: string | null;
  viewedAt: string | null;
  quotedAt: string | null;
  portalToken: string;
  supplierName: string;
  supplierEmail: string;
}

interface QuoteData {
  id: string;
  supplierId: string;
  coverLetter: string | null;
  totalAmount: string | null;
  currency: string | null;
  deliveryDays: number | null;
  validityDays: number | null;
  status: string;
  submittedAt: string;
}

interface EmailHistoryEntry {
  id: string;
  toEmails: string[];
  subject: string;
  bodyText: string | null;
  template: string | null;
  sentAt: string;
  threadId: string | null;
  messageId: string | null;
  inReplyTo: string | null;
  status: string;
}

interface RfqDetail {
  id: string;
  packageName: string;
  reference: string | null;
  deadline: string | null;
  template: string | null;
  status: string;
  details: string | null;
  packageLink: string | null;
  docsLink: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

interface SummaryData {
  rfq: RfqDetail;
  suppliers: SupplierLink[];
  quotes: QuoteData[];
  emails: EmailHistoryEntry[];
}

function statusVariant(status: string): "default" | "success" | "warning" | "error" | "info" {
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

function emailTypeLabel(template: string | null): string {
  if (template === "followUp") return "Follow-Up";
  if (template === "reminder") return "Reminder";
  return "Initial";
}

function emailTypeVariant(template: string | null): "default" | "info" | "warning" {
  if (template === "followUp") return "info";
  if (template === "reminder") return "warning";
  return "default";
}

function daysUntilDeadline(deadline: string | null): number {
  if (!deadline) return Infinity;
  const deadlineDate = new Date(deadline + "T23:59:59");
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

type Tab = "details" | "suppliers" | "quotes" | "emails";

interface RfqDetailPanelProps {
  rfqId: string | null;
  onBackToList: () => void;
}

export default function RfqDetailPanel({ rfqId, onBackToList }: RfqDetailPanelProps) {
  const { toast } = useToast();
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [sendingFollowUp, setSendingFollowUp] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [followUpConfirmOpen, setFollowUpConfirmOpen] = useState(false);
  const [reminderConfirmOpen, setReminderConfirmOpen] = useState(false);
  const [generatedEmails, setGeneratedEmails] = useState<Array<{
    supplierName: string;
    supplierEmail: string;
    subject: string;
    mailtoUrl: string;
  }> | null>(null);

  const fetchSummary = useCallback(async (id: string) => {
    setLoading(true);
    setActiveTab("details");
    setExpandedEmailId(null);
    try {
      const res = await fetch(`/api/rfqs/${id}/summary`);
      if (!res.ok) {
        toast("Failed to load RFQ details", "error");
        setData(null);
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      toast("Failed to load RFQ details", "error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (rfqId) {
      fetchSummary(rfqId);
    } else {
      setData(null);
    }
  }, [rfqId, fetchSummary]);

  const rfq = data?.rfq;
  const suppliers = data?.suppliers ?? [];
  const quotes = data?.quotes ?? [];
  const emailHistory = data?.emails ?? [];

  if (!rfqId) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <svg className="mx-auto h-16 w-16 text-text-dim/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <h3 className="mt-4 text-sm font-medium text-text-secondary">Select an RFQ from the list</h3>
          <p className="mt-1 text-xs text-text-dim">View details, suppliers, quotes, and emails</p>
        </div>
      </div>
    );
  }

  if (loading || !rfq) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
          <p className="mt-3 text-xs text-text-dim">Loading RFQ details...</p>
        </div>
      </div>
    );
  }

  const isDraft = rfq.status === "draft";
  const isClosed = rfq.status === "closed";
  const isActive = rfq.status === "sent" || rfq.status === "open";
  const supplierMap = new Map(suppliers.map((s) => [s.supplierId, s.supplierName]));
  const templateInfo = getTemplateById(rfq.template ?? "standard");
  const pendingSuppliers = suppliers.filter((s) => s.status !== "quoted");
  const daysLeft = daysUntilDeadline(rfq.deadline);
  const showFollowUp = isActive && pendingSuppliers.length > 0;
  const showReminder = isActive && rfq.deadline && daysLeft <= 7 && daysLeft >= 0 && pendingSuppliers.length > 0;

  async function handleSend() {
    if (!rfq) return;
    setSending(true);
    try {
      const res = await fetch(`/api/rfqs/${rfq.id}/send`, { method: "POST" });
      const result = await res.json();
      if (!res.ok) { toast(result.error ?? "Failed to send RFQ", "error"); return; }
      setGeneratedEmails(result.emails);
      setEmailModalOpen(true);
      toast(`Emails generated for ${result.emailCount} supplier(s)`, "success");
      fetchSummary(rfq.id);
    } catch { toast("Failed to send RFQ", "error"); } finally { setSending(false); }
  }

  async function handleFollowUp() {
    if (!rfq) return;
    setSendingFollowUp(true);
    try {
      const res = await fetch(`/api/rfqs/${rfq.id}/followup`, { method: "POST" });
      const result = await res.json();
      if (!res.ok) { toast(result.error ?? "Failed to send follow-ups", "error"); return; }
      setGeneratedEmails(result.emails);
      setEmailModalOpen(true);
      setFollowUpConfirmOpen(false);
      toast(`Follow-up emails generated for ${result.emailCount} supplier(s)`, "success");
      fetchSummary(rfq.id);
    } catch { toast("Failed to send follow-ups", "error"); } finally { setSendingFollowUp(false); }
  }

  async function handleReminder() {
    if (!rfq) return;
    setSendingReminder(true);
    try {
      const res = await fetch(`/api/rfqs/${rfq.id}/reminder`, { method: "POST" });
      const result = await res.json();
      if (!res.ok) { toast(result.error ?? "Failed to send reminders", "error"); return; }
      setGeneratedEmails(result.emails);
      setEmailModalOpen(true);
      setReminderConfirmOpen(false);
      toast(`Reminder emails generated for ${result.emailCount} supplier(s)`, "success");
      fetchSummary(rfq.id);
    } catch { toast("Failed to send reminders", "error"); } finally { setSendingReminder(false); }
  }

  async function handleClose() {
    if (!rfq) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/rfqs/${rfq.id}/close`, { method: "POST" });
      const result = await res.json();
      if (!res.ok) { toast(result.error ?? "Failed to close RFQ", "error"); return; }
      toast("RFQ closed successfully", "success");
      fetchSummary(rfq.id);
    } catch { toast("Failed to close RFQ", "error"); } finally { setClosing(false); }
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "details", label: "Details" },
    { id: "suppliers", label: "Suppliers", count: suppliers.length },
    { id: "quotes", label: "Quotes", count: quotes.length },
    { id: "emails", label: "Emails", count: emailHistory.length },
  ];

  const quotedCount = suppliers.filter((s) => s.status === "quoted").length;
  const pendingCount = suppliers.filter((s) => s.status === "pending").length;

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={onBackToList}
              className="rounded-lg p-1 text-text-muted hover:bg-bg-elevated hover:text-text-secondary"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <span className="text-xs text-text-muted">Back to list</span>
          </div>

          <div className="mt-1 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-base font-bold text-text-primary">{rfq.packageName}</h2>
                <Badge variant={statusVariant(rfq.status)}>{rfq.status}</Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-text-muted">
                {rfq.reference && <span>Ref: {rfq.reference}</span>}
                {rfq.deadline && (
                  <span>
                    Due: {new Date(rfq.deadline).toLocaleDateString()}
                    {isActive && daysLeft <= 7 && daysLeft >= 0 && (
                      <span className="ml-0.5 text-amber-500">({daysLeft}d left)</span>
                    )}
                  </span>
                )}
                {templateInfo && (
                  <span style={{ color: templateInfo.color }}>
                    {templateInfo.icon} {templateInfo.name}
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Link href={`/rfq/${rfq.id}`} className="hidden lg:block">
                <Button variant="ghost" size="sm" title="Full page view">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </Button>
              </Link>
              {!isClosed && (
                <Link href={`/rfq/${rfq.id}/edit`}>
                  <Button variant="secondary" size="sm">Edit</Button>
                </Link>
              )}
              {isDraft && suppliers.length > 0 && (
                <Button size="sm" onClick={handleSend} disabled={sending}>
                  {sending ? "Generating..." : "Send"}
                </Button>
              )}
              {showFollowUp && (
                <Button variant="secondary" size="sm" onClick={() => setFollowUpConfirmOpen(true)} disabled={sendingFollowUp}>
                  Follow Up
                </Button>
              )}
              {showReminder && (
                <Button variant="secondary" size="sm" onClick={() => setReminderConfirmOpen(true)} disabled={sendingReminder}>
                  Remind
                </Button>
              )}
              {!isClosed && !isDraft && (
                <Button variant="danger" size="sm" onClick={() => setCloseModalOpen(true)} disabled={closing}>
                  Close
                </Button>
              )}
            </div>
          </div>

          {suppliers.length > 0 && (
            <div className="mt-3 flex gap-3">
              <div className="rounded-md bg-bg-tertiary px-2.5 py-1 text-[10px]">
                <span className="text-text-dim">Suppliers:</span>{" "}
                <span className="font-medium text-text-secondary">{suppliers.length}</span>
              </div>
              <div className="rounded-md bg-bg-tertiary px-2.5 py-1 text-[10px]">
                <span className="text-text-dim">Quotes:</span>{" "}
                <span className="font-medium text-text-secondary">{quotedCount}</span>
              </div>
              <div className="rounded-md bg-bg-tertiary px-2.5 py-1 text-[10px]">
                <span className="text-text-dim">Pending:</span>{" "}
                <span className="font-medium text-text-secondary">{pendingCount}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === tab.id ? "text-accent" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1 text-[10px] text-text-dim">({tab.count})</span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "details" && (
            <div className="space-y-3">
              {rfq.details && (
                <div className="rounded-lg border border-border bg-bg-secondary p-4">
                  <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-dim">Requirements</h3>
                  <p className="whitespace-pre-wrap text-xs text-text-secondary">{rfq.details}</p>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                {rfq.packageLink && (
                  <a
                    href={rfq.packageLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-border bg-bg-secondary p-3 text-xs text-accent hover:border-accent/30"
                  >
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                    </svg>
                    Package Details
                  </a>
                )}
                {rfq.docsLink && (
                  <a
                    href={rfq.docsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-border bg-bg-secondary p-3 text-xs text-accent hover:border-accent/30"
                  >
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    Company Documents
                  </a>
                )}
              </div>

              {!rfq.details && !rfq.packageLink && !rfq.docsLink && (
                <div className="rounded-lg border border-border bg-bg-secondary p-6 text-center text-xs text-text-dim">
                  No additional details provided.
                </div>
              )}
            </div>
          )}

          {activeTab === "suppliers" && (
            <div className="rounded-lg border border-border bg-bg-secondary">
              {suppliers.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-text-dim">
                  No suppliers assigned. Edit the RFQ to add suppliers.
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {suppliers.map((s) => (
                    <div key={s.id} className="flex items-center justify-between px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-text-primary">{s.supplierName}</div>
                        <div className="text-[10px] text-text-dim">{s.supplierEmail}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={supplierStatusVariant(s.status)}>{s.status}</Badge>
                        {s.emailSentAt && (
                          <span className="text-[9px] text-text-dim">
                            {new Date(s.emailSentAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "quotes" && (
            <div className="rounded-lg border border-border bg-bg-secondary">
              {quotes.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-text-dim">
                  No quotes submitted yet.
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {quotes.map((q) => (
                    <div key={q.id} className="flex items-center justify-between px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-text-primary">
                          {supplierMap.get(q.supplierId) ?? "Unknown Supplier"}
                        </div>
                        <div className="text-[10px] text-text-dim">
                          {q.deliveryDays && `${q.deliveryDays}d delivery`}
                          {q.validityDays && ` · ${q.validityDays}d validity`}
                          {" · "}{new Date(q.submittedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-right">
                        {q.totalAmount ? (
                          <div className="text-xs font-semibold text-accent">
                            {q.currency ?? "USD"} {Number(q.totalAmount).toLocaleString()}
                          </div>
                        ) : (
                          <span className="text-[10px] text-text-dim">No amount</span>
                        )}
                        <Badge variant={q.status === "shortlisted" ? "success" : q.status === "rejected" ? "error" : "default"}>
                          {q.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "emails" && (
            <div className="rounded-lg border border-border bg-bg-secondary">
              {emailHistory.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-text-dim">
                  No emails sent yet. Send the RFQ to generate emails.
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {emailHistory.map((email) => {
                    const isExpanded = expandedEmailId === email.id;
                    return (
                      <div key={email.id}>
                        <button
                          type="button"
                          onClick={() => setExpandedEmailId(isExpanded ? null : email.id)}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-bg-elevated/30"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <Badge variant={emailTypeVariant(email.template)}>{emailTypeLabel(email.template)}</Badge>
                              <span className="truncate text-xs font-medium text-text-primary">{email.subject}</span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-text-dim">
                              <span>{email.toEmails.length} recipient{email.toEmails.length !== 1 ? "s" : ""}</span>
                              <span>{new Date(email.sentAt).toLocaleDateString()} {new Date(email.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                          </div>
                          <svg
                            className={`h-3.5 w-3.5 shrink-0 text-text-dim transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>
                        {isExpanded && (
                          <div className="border-t border-border/30 bg-bg-tertiary/50 px-4 py-3">
                            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-dim">Email Body</div>
                            <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg bg-bg-secondary p-2.5 font-sans text-[11px] text-text-secondary">
                              {email.bodyText ?? "No body content available."}
                            </pre>
                            {email.toEmails.length > 0 && (
                              <div className="mt-1.5 text-[10px] text-text-dim">
                                To: {email.toEmails.join(", ")}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal open={emailModalOpen} onClose={() => setEmailModalOpen(false)} title="Emails Generated">
        <div className="space-y-3">
          <p className="text-xs text-text-secondary">
            Click each button to open your email client with the pre-filled RFQ email:
          </p>
          {generatedEmails?.map((email, i) => (
            <div key={i} className="rounded-lg border border-border/50 p-3">
              <div className="text-xs font-medium text-text-primary">{email.supplierName}</div>
              <div className="text-[10px] text-text-dim">{email.supplierEmail}</div>
              <div className="mt-0.5 text-[10px] text-text-muted">{email.subject}</div>
              <a
                href={email.mailtoUrl}
                className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent hover:bg-accent/20"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                Open Email Client
              </a>
            </div>
          ))}
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setEmailModalOpen(false)} size="sm">Done</Button>
          </div>
        </div>
      </Modal>

      <Modal open={closeModalOpen} onClose={() => setCloseModalOpen(false)} title="Close RFQ">
        <div className="space-y-3">
          <p className="text-xs text-text-secondary">
            Are you sure you want to close this RFQ? This will prevent any further submissions.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCloseModalOpen(false)} size="sm">Cancel</Button>
            <Button variant="danger" onClick={handleClose} disabled={closing} size="sm">
              {closing ? "Closing..." : "Close RFQ"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={followUpConfirmOpen} onClose={() => setFollowUpConfirmOpen(false)} title="Send Follow-Up">
        <div className="space-y-3">
          <p className="text-xs text-text-secondary">
            Follow-up emails will be sent to the following suppliers who haven&apos;t quoted yet:
          </p>
          <div className="rounded-lg border border-border/50 bg-bg-secondary p-3">
            <div className="space-y-1">
              {pendingSuppliers.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <span className="text-text-primary">{s.supplierName}</span>
                  <Badge variant={supplierStatusVariant(s.status)}>{s.status}</Badge>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setFollowUpConfirmOpen(false)} size="sm">Cancel</Button>
            <Button onClick={handleFollowUp} disabled={sendingFollowUp} size="sm">
              {sendingFollowUp ? "Sending..." : `Send to ${pendingSuppliers.length}`}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={reminderConfirmOpen} onClose={() => setReminderConfirmOpen(false)} title="Send Deadline Reminder">
        <div className="space-y-3">
          <p className="text-xs text-text-secondary">
            Reminder emails will be sent to the following suppliers who haven&apos;t quoted yet:
          </p>
          <div className="rounded-lg border border-border/50 bg-bg-secondary p-3">
            <div className="space-y-1">
              {pendingSuppliers.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <span className="text-text-primary">{s.supplierName}</span>
                  <Badge variant={supplierStatusVariant(s.status)}>{s.status}</Badge>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-md bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-400">
            {daysLeft <= 3
              ? `URGENT: Only ${daysLeft} day${daysLeft !== 1 ? "s" : ""} until deadline!`
              : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining until deadline.`}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setReminderConfirmOpen(false)} size="sm">Cancel</Button>
            <Button onClick={handleReminder} disabled={sendingReminder} size="sm">
              {sendingReminder ? "Sending..." : `Send to ${pendingSuppliers.length}`}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
