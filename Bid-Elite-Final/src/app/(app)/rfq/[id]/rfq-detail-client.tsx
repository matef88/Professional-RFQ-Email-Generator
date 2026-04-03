"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Modal from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { getTemplateById } from "@/lib/email/templates";

interface RfqData {
  id: string;
  packageName: string;
  reference: string | null;
  deadline: string | null;
  template: string | null;
  status: string;
  details: string | null;
  packageLink: string | null;
  docsLink: string | null;
  awardedSupplierId: string | null;
  awardedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
}

interface SupplierLink {
  id: string;
  supplierId: string;
  status: string;
  emailSentAt: Date | null;
  viewedAt: Date | null;
  quotedAt: Date | null;
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
  submittedAt: Date;
}

interface EmailHistoryEntry {
  id: string;
  toEmails: string[];
  subject: string;
  bodyText: string | null;
  template: string | null;
  sentAt: Date;
  threadId: string | null;
  messageId: string | null;
  inReplyTo: string | null;
  status: string;
}

interface RfqDetailClientProps {
  rfq: Record<string, unknown>;
  suppliers: SupplierLink[];
  quotes: QuoteData[];
  emailHistory: EmailHistoryEntry[];
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

export default function RfqDetailClient({ rfq: rfqRaw, suppliers, quotes, emailHistory }: RfqDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [sendingFollowUp, setSendingFollowUp] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [followUpConfirmOpen, setFollowUpConfirmOpen] = useState(false);
  const [reminderConfirmOpen, setReminderConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [sendMethod, setSendMethod] = useState<"smtp" | "mailto">("mailto");
  const [generatedEmails, setGeneratedEmails] = useState<Array<{
    supplierName: string;
    supplierEmail: string;
    subject: string;
    mailtoUrl: string;
    deliveryStatus?: string;
  }> | null>(null);

  const rfq = rfqRaw as unknown as RfqData;
  const isDraft = rfq.status === "draft";
  const isClosed = rfq.status === "closed";
  const isActive = rfq.status === "sent" || rfq.status === "open";
  const isAwarded = !!rfq.awardedSupplierId;
  const supplierMap = new Map(suppliers.map((s) => [s.supplierId, s.supplierName]));
  const templateInfo = getTemplateById(rfq.template ?? "standard");

  const pendingSuppliers = suppliers.filter((s) => s.status !== "quoted");
  const daysLeft = daysUntilDeadline(rfq.deadline);
  const showFollowUp = isActive && pendingSuppliers.length > 0;
  const showReminder = isActive && rfq.deadline && daysLeft <= 7 && daysLeft >= 0 && pendingSuppliers.length > 0;

  async function handleSend() {
    setSending(true);
    try {
      const res = await fetch(`/api/rfqs/${rfq.id}/send`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast(data.error ?? "Failed to send RFQ", "error");
        return;
      }

      setSendMethod(data.sendMethod || "mailto");
      setGeneratedEmails(data.emails);

      if (data.sendMethod === "smtp") {
        const errorCount = data.emails.filter((e: any) => e.deliveryStatus === "failed").length;
        if (errorCount === 0) {
           toast(`Emails successfully sent to ${data.emailCount} supplier(s)`, "success");
        } else {
           setEmailModalOpen(true);
           toast(`Failed to send ${errorCount} email(s)`, "error");
        }
      } else {
        setEmailModalOpen(true);
        toast(`Emails generated for ${data.emailCount} supplier(s)`, "success");
      }
      router.refresh();
    } catch {
      toast("Failed to send RFQ", "error");
    } finally {
      setSending(false);
    }
  }

  async function handleFollowUp() {
    setSendingFollowUp(true);
    try {
      const res = await fetch(`/api/rfqs/${rfq.id}/followup`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast(data.error ?? "Failed to send follow-ups", "error");
        return;
      }

      setSendMethod(data.sendMethod || "mailto");
      setGeneratedEmails(data.emails);
      setFollowUpConfirmOpen(false);

      if (data.sendMethod === "smtp") {
         const errorCount = data.emails.filter((e: any) => e.deliveryStatus === "failed").length;
         if (errorCount === 0) {
            toast(`Follow-up emails successfully sent to ${data.emailCount} supplier(s)`, "success");
         } else {
            setEmailModalOpen(true);
            toast(`Failed to send ${errorCount} follow-up(s)`, "error");
         }
      } else {
         setEmailModalOpen(true);
         toast(`Follow-up emails generated for ${data.emailCount} supplier(s)`, "success");
      }
      router.refresh();
    } catch {
      toast("Failed to send follow-ups", "error");
    } finally {
      setSendingFollowUp(false);
    }
  }

  async function handleReminder() {
    setSendingReminder(true);
    try {
      const res = await fetch(`/api/rfqs/${rfq.id}/reminder`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast(data.error ?? "Failed to send reminders", "error");
        return;
      }

      setSendMethod(data.sendMethod || "mailto");
      setGeneratedEmails(data.emails);
      setReminderConfirmOpen(false);

      if (data.sendMethod === "smtp") {
         const errorCount = data.emails.filter((e: any) => e.deliveryStatus === "failed").length;
         if (errorCount === 0) {
            toast(`Reminder emails successfully sent to ${data.emailCount} supplier(s)`, "success");
         } else {
            setEmailModalOpen(true);
            toast(`Failed to send ${errorCount} reminder(s)`, "error");
         }
      } else {
         setEmailModalOpen(true);
         toast(`Reminder emails generated for ${data.emailCount} supplier(s)`, "success");
      }
      router.refresh();
    } catch {
      toast("Failed to send reminders", "error");
    } finally {
      setSendingReminder(false);
    }
  }

  async function handleClose() {
    setClosing(true);
    try {
      const res = await fetch(`/api/rfqs/${rfq.id}/close`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast(data.error ?? "Failed to close RFQ", "error");
        return;
      }

      toast("RFQ closed successfully", "success");
      router.refresh();
    } catch {
      toast("Failed to close RFQ", "error");
    } finally {
      setClosing(false);
    }
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "details", label: "Details" },
    { id: "suppliers", label: "Suppliers", count: suppliers.length },
    { id: "quotes", label: "Quotes", count: quotes.length },
    { id: "emails", label: "Emails", count: emailHistory.length },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <Link href="/rfq" className="text-xs text-text-muted hover:text-text-secondary">
              &larr; RFQs
            </Link>
            <div className="mt-1 flex items-center gap-3">
              <h1 className="text-xl font-bold text-text-primary">{rfq.packageName}</h1>
              <Badge variant={statusVariant(rfq.status)}>{rfq.status}</Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted">
              {rfq.reference && <span>Ref: {rfq.reference}</span>}
              {rfq.deadline && (
                <span>
                  Due: {new Date(rfq.deadline).toLocaleDateString()}
                  {isActive && daysLeft <= 7 && daysLeft >= 0 && (
                    <span className="ml-1 text-amber-500">({daysLeft}d left)</span>
                  )}
                </span>
              )}
              {templateInfo && (
                <span style={{ color: templateInfo.color }}>
                  {templateInfo.icon} {templateInfo.name}
                </span>
              )}
              <span>Created: {new Date(rfq.createdAt).toLocaleDateString()}</span>
              {isClosed && rfq.closedAt && (
                <span>Closed: {new Date(rfq.closedAt).toLocaleDateString()}</span>
              )}
            </div>
            {isAwarded && (
              <div className="mt-2 flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-1.5">
                <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5m14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1Z" />
                </svg>
                <span className="text-sm font-medium text-amber-400">
                  Awarded to {supplierMap.get(rfq.awardedSupplierId!) ?? "Unknown"}
                </span>
                {rfq.awardedAt && (
                  <span className="text-xs text-text-dim">
                    on {new Date(rfq.awardedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {!isClosed && (
              <Link href={`/rfq/${rfq.id}/edit`}>
                <Button variant="secondary" size="sm">Edit</Button>
              </Link>
            )}
            {isDraft && suppliers.length > 0 && (
              <Button size="sm" onClick={handleSend} disabled={sending}>
                {sending ? "Generating..." : "Send Emails"}
              </Button>
            )}
            {showFollowUp && (
              <Button variant="secondary" size="sm" onClick={() => setFollowUpConfirmOpen(true)} disabled={sendingFollowUp}>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                </svg>
                Follow Up
              </Button>
            )}
            {showReminder && (
              <Button variant="secondary" size="sm" onClick={() => setReminderConfirmOpen(true)} disabled={sendingReminder}>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                Send Reminder
              </Button>
            )}
            {!isClosed && !isDraft && (
              <Button variant="danger" size="sm" onClick={() => setCloseModalOpen(true)} disabled={closing}>
                Close
              </Button>
            )}
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

        {activeTab === "details" && (
          <div className="space-y-4">
            {rfq.details && (
              <div className="rounded-xl border border-border bg-bg-secondary p-5">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-dim">Requirements</h3>
                <p className="whitespace-pre-wrap text-sm text-text-secondary">{rfq.details}</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {rfq.packageLink && (
                <a
                  href={rfq.packageLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-border bg-bg-secondary p-4 text-sm text-accent hover:border-accent/30"
                >
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
                  className="flex items-center gap-2 rounded-xl border border-border bg-bg-secondary p-4 text-sm text-accent hover:border-accent/30"
                >
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  Company Documents
                </a>
              )}
            </div>

            {!rfq.details && !rfq.packageLink && !rfq.docsLink && (
              <div className="rounded-xl border border-border bg-bg-secondary p-8 text-center text-sm text-text-dim">
                No additional details provided.
              </div>
            )}
          </div>
        )}

        {activeTab === "suppliers" && (
          <div className="rounded-xl border border-border bg-bg-secondary">
            {suppliers.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-text-dim">
                No suppliers assigned. Edit the RFQ to add suppliers.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {suppliers.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                        {s.supplierName}
                        {isAwarded && rfq.awardedSupplierId === s.supplierId && (
                          <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5m14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1Z" />
                          </svg>
                        )}
                      </div>
                      <div className="text-xs text-text-dim">{s.supplierEmail}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={supplierStatusVariant(s.status)}>{s.status}</Badge>
                      {s.emailSentAt && (
                        <span className="text-[10px] text-text-dim">
                          Sent: {new Date(s.emailSentAt).toLocaleDateString()}
                        </span>
                      )}
                      {s.viewedAt && (
                        <span className="text-[10px] text-text-dim">
                          Viewed: {new Date(s.viewedAt).toLocaleDateString()}
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
          <div className="rounded-xl border border-border bg-bg-secondary">
            {quotes.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-text-dim">
                No quotes submitted yet.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {quotes.map((q) => (
                  <div key={q.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-text-primary">
                        {supplierMap.get(q.supplierId) ?? "Unknown Supplier"}
                      </div>
                      <div className="text-xs text-text-dim">
                        {q.deliveryDays && `${q.deliveryDays} days delivery`}
                        {q.validityDays && ` · ${q.validityDays} days validity`}
                        {" · "}Submitted: {new Date(q.submittedAt).toLocaleDateString()}
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
          <div className="rounded-xl border border-border bg-bg-secondary">
            {emailHistory.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-text-dim">
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
                        className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-bg-elevated/30"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={emailTypeVariant(email.template)}>{emailTypeLabel(email.template)}</Badge>
                            <span className="text-sm font-medium text-text-primary truncate">{email.subject}</span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-3 text-xs text-text-dim">
                            <span>{email.toEmails.length} recipient{email.toEmails.length !== 1 ? "s" : ""}</span>
                            <span>{new Date(email.sentAt).toLocaleDateString()} {new Date(email.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            {email.template && (
                              <span>{getTemplateById(email.template)?.icon} {getTemplateById(email.template)?.name}</span>
                            )}
                          </div>
                        </div>
                        <svg
                          className={`h-4 w-4 shrink-0 text-text-dim transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-border/30 bg-bg-tertiary/50 px-5 py-4">
                          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-dim">Email Body</div>
                          <pre className="whitespace-pre-wrap text-xs text-text-secondary max-h-96 overflow-y-auto rounded-lg bg-bg-secondary p-3 font-sans">
                            {email.bodyText ?? "No body content available."}
                          </pre>
                          {email.toEmails.length > 0 && (
                            <div className="mt-2 text-xs text-text-dim">
                              To: {email.toEmails.join(", ")}
                            </div>
                          )}
                          {email.threadId && (
                            <div className="text-xs text-text-dim">
                              Thread: {email.threadId}
                            </div>
                          )}
                          {email.inReplyTo && (
                            <div className="text-xs text-text-dim">
                              In Reply To: {email.inReplyTo}
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

      <Modal open={emailModalOpen} onClose={() => setEmailModalOpen(false)} title={sendMethod === "smtp" ? "Email Delivery Status" : "Emails Generated"}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            {sendMethod === "smtp" 
              ? "Review the status of your sent emails:" 
              : "Click each button to open your email client with the pre-filled RFQ email:"}
          </p>
          {generatedEmails?.map((email, i) => (
            <div key={i} className={`rounded-lg border p-3 ${email.deliveryStatus === 'failed' ? 'border-error/50 bg-error/5' : 'border-border/50'}`}>
              <div className="flex justify-between items-start">
                  <div className="text-sm font-medium text-text-primary">{email.supplierName}</div>
                  {sendMethod === "smtp" && (
                     <Badge variant={email.deliveryStatus === "failed" ? "error" : "success"}>
                        {email.deliveryStatus === "failed" ? "Failed" : "Sent"}
                     </Badge>
                  )}
              </div>
              <div className="text-xs text-text-dim">{email.supplierEmail}</div>
              <div className="mt-1 text-xs text-text-muted">{email.subject}</div>
              {sendMethod === "mailto" && (
                  <a
                    href={email.mailtoUrl}
                    className="mt-2 inline-flex items-center gap-1 rounded-md bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                    Open Email Client
                  </a>
              )}
            </div>
          ))}
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setEmailModalOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>

      <Modal open={closeModalOpen} onClose={() => setCloseModalOpen(false)} title="Close RFQ">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Are you sure you want to close this RFQ? This will prevent any further submissions.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCloseModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleClose} disabled={closing}>
              {closing ? "Closing..." : "Close RFQ"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={followUpConfirmOpen} onClose={() => setFollowUpConfirmOpen(false)} title="Send Follow-Up">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Follow-up emails will be sent to the following suppliers who haven&apos;t quoted yet:
          </p>
          <div className="rounded-lg border border-border/50 bg-bg-secondary p-3">
            <div className="space-y-1.5">
              {pendingSuppliers.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-text-primary">{s.supplierName}</span>
                  <Badge variant={supplierStatusVariant(s.status)}>{s.status}</Badge>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-text-dim">
            {pendingSuppliers.length} supplier{pendingSuppliers.length !== 1 ? "s" : ""} will receive a follow-up email referencing the original communication.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setFollowUpConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleFollowUp} disabled={sendingFollowUp}>
              {sendingFollowUp ? "Sending..." : `Send to ${pendingSuppliers.length} Supplier${pendingSuppliers.length !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={reminderConfirmOpen} onClose={() => setReminderConfirmOpen(false)} title="Send Deadline Reminder">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Reminder emails will be sent to the following suppliers who haven&apos;t quoted yet:
          </p>
          <div className="rounded-lg border border-border/50 bg-bg-secondary p-3">
            <div className="space-y-1.5">
              {pendingSuppliers.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-text-primary">{s.supplierName}</span>
                  <Badge variant={supplierStatusVariant(s.status)}>{s.status}</Badge>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            {daysLeft <= 3
              ? `⚠️ URGENT: Only ${daysLeft} day${daysLeft !== 1 ? "s" : ""} until deadline!`
              : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining until deadline.`}
          </div>
          <p className="text-xs text-text-dim">
            {pendingSuppliers.length} supplier{pendingSuppliers.length !== 1 ? "s" : ""} will receive a reminder email with deadline emphasis.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setReminderConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleReminder} disabled={sendingReminder}>
              {sendingReminder ? "Sending..." : `Send to ${pendingSuppliers.length} Supplier${pendingSuppliers.length !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
