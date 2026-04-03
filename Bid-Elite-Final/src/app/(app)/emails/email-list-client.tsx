"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/badge";
import Input from "@/components/ui/input"
import { TEMPLATES } from "@/lib/email/templates";
import { formatRelativeTime } from "@/lib/utils/formatting";

interface EmailRow {
  id: string;
  rfqId: string | null;
  toEmails: string[];
  ccEmails: string[] | null;
  subject: string;
  template: string | null;
  threadId: string | null;
  status: string;
  deliveryStatus: string | null;
  sendMethod: string | null;
  errorMessage: string | null;
  sentAt: Date;
  sentBy: string | null;
  packageName: string | null;
  senderName: string | null;
}

interface GroupedEmail {
  threadId: string | null;
  emails: EmailRow[];
}

interface EmailListClientProps {
  emails: GroupedEmail[];
  userMap: Record<string, string>;
}

function statusVariant(status: string): "default" | "success" | "warning" | "error" | "info" {
  if (status === "recorded") return "success";
  if (status === "opened") return "info";
  return "default";
}

function deliveryStatusVariant(status: string | null): "default" | "success" | "warning" | "error" | "info" {
  if (!status || status === "pending") return "default";
  if (status === "sent") return "info";
  if (status === "delivered") return "success";
  if (status === "failed" || status === "bounced") return "error";
  return "default";
}

function getTemplateIcon(templateId: string | null): string {
  if (!templateId) return "\uD83D\uDCC4";
  return TEMPLATES.find((t) => t.id === templateId)?.icon ?? "\uD83D\uDCC4";
}

function getTemplateColor(templateId: string | null): string {
  return TEMPLATES.find((t) => t.id === templateId)?.color ?? "#d97706";
}

export default function EmailListClient({ emails: groupedEmails, userMap }: EmailListClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [templateFilter, setTemplateFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [retrying, setRetrying] = useState<string | null>(null);

  function toggleThread(threadId: string | null) {
    setExpandedThreads((prev) => {
      const next = new Set(prev);
      const key = threadId ?? "_none";
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleRetry(emailId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setRetrying(emailId);
    try {
      const res = await fetch(`/api/emails/${emailId}/retry`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        router.refresh();
      }
    } catch {
      // silent
    } finally {
      setRetrying(null);
    }
  }

  const filteredGroups = groupedEmails.filter((group) => {
    const hasMatchingEmail = group.emails.some((email) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        email.subject?.toLowerCase().includes(q) ||
        email.toEmails?.some((e: string) => e.toLowerCase().includes(q)) ||
        (email.packageName?.toLowerCase().includes(q) ?? false);
      const matchesTemplate = !templateFilter || email.template === templateFilter;
      const matchesDateFrom =
        !dateFrom || new Date(email.sentAt) >= new Date(dateFrom);
      const matchesDateTo =
        !dateTo || new Date(email.sentAt) <= new Date(dateTo + "T23:59:59");
      return matchesSearch && matchesTemplate && matchesDateFrom && matchesDateTo;
    });
    return hasMatchingEmail;
  });

  function renderEmailRow(email: EmailRow) {
    const templateIcon = getTemplateIcon(email.template);
    const templateColor = getTemplateColor(email.template);
    return (
      <div
        key={email.id}
        className="group flex items-center px-5 py-3 transition-colors hover:bg-bg-elevated/50 sm:grid sm:grid-cols-14 sm:gap-4"
        onClick={() => router.push(`/emails/${email.id}`)}
      style={{ cursor: "pointer" }}
      >
        <div className="col-span-3 min-w-0 flex-1 sm:flex-none">
          <div className="truncate text-sm font-medium text-text-primary">{email.subject}</div>
          <div className="truncate text-xs text-text-dim sm:hidden">
            {email.toEmails?.join(", ") ?? "—"}
          </div>
        </div>
        <div className="col-span-2 hidden items-center gap-1.5 text-xs sm:flex">
          <span style={{ color: templateColor }}>{templateIcon}</span>
          <span className="text-text-secondary">
            {email.template
              ? TEMPLATES.find((t) => t.id === email.template)?.name ?? email.template
              : "\u2014"}
          </span>
        </div>
        <div className="col-span-2 hidden truncate text-xs text-text-secondary sm:block">
          {email.packageName || "\u2014"}
        </div>
        <div className="col-span-1 hidden text-xs text-text-secondary sm:block">
          {email.sendMethod?.toUpperCase() ?? "\u2014"}
        </div>
        <div className="col-span-2 hidden text-xs text-text-secondary sm:block">
          {email.senderName ?? userMap[email.sentBy ?? ""] ?? "\u2014"}
        </div>
        <div className="col-span-2 hidden text-xs text-text-dim sm:block">
          <div>{formatRelativeTime(email.sentAt)}</div>
        </div>
        <div className="col-span-1 hidden sm:flex sm:justify-center">
          {email.deliveryStatus && email.deliveryStatus !== "pending" ? (
            <Badge variant={deliveryStatusVariant(email.deliveryStatus)}>{email.deliveryStatus}</Badge>
          ) : (
            <Badge variant={statusVariant(email.status)}>{email.status}</Badge>
          )}
        </div>
        <div className="col-span-1 hidden sm:flex sm:justify-center">
          {email.deliveryStatus === "failed" && (
            <button
              onClick={(e) => handleRetry(email.id, e)}
              disabled={retrying === email.id}
              className="rounded px-2 py-0.5 text-xs font-medium text-accent hover:bg-accent/10 transition-colors disabled:opacity-50"
            >
              {retrying === email.id ? "..." : "Retry"}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 sm:hidden">
          {email.deliveryStatus && email.deliveryStatus !== "pending" ? (
            <Badge variant={deliveryStatusVariant(email.deliveryStatus)}>{email.deliveryStatus}</Badge>
          ) : (
            <Badge variant={statusVariant(email.status)}>{email.status}</Badge>
          )}
          <span className="text-xs text-text-dim">
            {formatRelativeTime(email.sentAt)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder="Search by subject, recipient, or package..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={templateFilter}
            onChange={(e) => setTemplateFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">All Templates</option>
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.icon} {t.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="From"
            className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="To"
            className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="rounded-xl border border-border bg-bg-secondary p-8 text-center text-sm text-text-dim">
          {groupedEmails.length === 0
            ? "No emails yet. Send your first RFQ to get started."
            : "No emails match your filters."}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredGroups.map((group) => {
            const isThread = group.emails.length > 1;
            const isExpanded = expandedThreads.has(group.threadId ?? "_none");
            const firstEmail = group.emails[0];

            return (
              <div key={group.threadId ?? firstEmail.id} className="overflow-hidden rounded-xl border border-border bg-bg-secondary">
                {isThread && (
                  <button
                    onClick={() => toggleThread(group.threadId)}
                    className="flex w-full items-center gap-2 border-b border-border/50 bg-bg-tertiary px-5 py-2 text-xs text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-secondary"
                  >
                    <svg
                      className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.75 4.5 3 9 7.5 3 9" />
                    </svg>
                    <span>Thread ({group.emails.length} emails)</span>
                    {!isExpanded && (
                      <span className="ml-auto text-text-dim">
                        Latest: {firstEmail.subject}
                      </span>
                    )}
                  </button>
                )}
                <div className={isThread && !isExpanded ? "hidden" : ""}>
                  <div className="divide-y divide-border/50">
                    {group.emails.map((email) => renderEmailRow(email))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
