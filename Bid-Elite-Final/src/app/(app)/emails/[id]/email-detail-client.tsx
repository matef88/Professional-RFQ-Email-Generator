"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/utils/formatting";
import { TEMPLATES } from "@/lib/email/templates";
import { generateEmlContent, generateFilename } from "@/lib/email/mailto";

import type { EmailLine } from "@/lib/email/render";
import { getTemplateColor } from "@/lib/email/templates";

interface EmailData {
  id: string;
  rfqId: string | null;
  toEmails: string[];
  ccEmails: string[] | null;
  subject: string;
  bodyText: string | null;
  template: string | null;
  threadId: string | null;
  messageId: string | null;
  inReplyTo: string | null;
  mailtoUrl: string | null;
  status: string;
  sentAt: Date;
  sentBy: string | null;
}

interface RfqInfo {
  id: string;
  packageName: string;
  reference: string | null;
  status: string;
}

interface ThreadNav {
  id: string;
  subject: string;
}

interface EmailDetailClientProps {
  email: Record<string, unknown>;
  rfq: RfqInfo | null;
  senderName: string | null;
  prevEmail: ThreadNav | null;
  nextEmail: ThreadNav | null;
}

function statusVariant(status: string): "default" | "success" | "warning" | "error" | "info" {
  if (status === "recorded") return "success";
  if (status === "opened") return "info";
  return "default";
}

function getTemplateIcon(templateId: string | null): string {
  if (!templateId) return "\uD83D\uDCC4";
  return TEMPLATES.find((t) => t.id === templateId)?.icon ?? "\uD83D\uDCC4";
}

function getTemplateName(templateId: string | null): string {
  if (!templateId) return "Standard";
  return TEMPLATES.find((t) => t.id === templateId)?.name ?? templateId;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function EmailLineRenderer({ line, accentColor }: { line: EmailLine; accentColor: string }) {
  switch (line.type) {
    case "g":
      return <div className="h-2" />;
    case "txt":
      return <div className="whitespace-pre-wrap text-xs leading-relaxed text-text-secondary">{line.value}</div>;
    case "hd":
      return <div className="text-xs font-bold uppercase tracking-wide text-text-primary">{line.value}</div>;
    case "lbl":
      return <div className="text-xs font-semibold text-text-primary">{line.value}</div>;
    case "lnk":
      return (
        <div className="text-xs">
          <span className="text-text-muted">{line.label}: </span>
          <span style={{ color: accentColor }}>{line.url}</span>
        </div>
      );
    case "bul":
      return (
        <div className="flex gap-2 text-xs text-text-secondary">
          <span className="text-text-dim">&bull;</span>
          <span>{line.value}</span>
        </div>
      );
    case "urg":
      return (
        <div className="rounded border border-warning/20 bg-warning/5 px-3 py-2 text-xs font-medium text-warning">
          {line.value}
        </div>
      );
    case "sig":
      return <div className="whitespace-pre-wrap text-xs text-text-muted">{line.value}</div>;
    case "div":
      return <div className="border-t border-border py-1 text-[8px] text-text-dim">{line.value}</div>;
    case "dis":
      return <div className="text-[10px] italic text-text-dim">{line.value}</div>;
    default:
      return <div className="whitespace-pre-wrap text-xs text-text-secondary">{line.value}</div>;
  }
}

export default function EmailDetailClient({
  email: emailRaw,
  rfq,
  senderName,
  prevEmail,
  nextEmail,
}: EmailDetailClientProps) {
  const { toast } = useToast();
  const [copyingSubject, setCopyingSubject] = useState(false);
  const [copyingBody, setCopyingBody] = useState(false);

  const email = emailRaw as unknown as EmailData;

  const templateIcon = getTemplateIcon(email.template);
  const templateName = getTemplateName(email.template);
  const templateColor = getTemplateColor(email.template);

  async function copyToClipboard(text: string, type: "subject" | "body") {
    const setCopying = type === "subject" ? setCopyingSubject : setCopyingBody;
    try {
      setCopying(true);
      await navigator.clipboard.writeText(text);
      toast(`${type === "subject" ? "Subject" : "Body"} copied`, "success");
    } catch {
      toast("Failed to copy", "error");
    } finally {
      setCopying(false);
    }
  }

  function handleDownloadTxt() {
    if (!email.bodyText) return;
    const filename = generateFilename(
      email.toEmails?.[0] ?? "email",
      "txt"
    );
    downloadFile(email.bodyText, filename, "text/plain");
  }

  function handleDownloadEml() {
    if (!email.bodyText) return;
    const messageId = email.messageId ?? `<${crypto.randomUUID()}@bid.elite-n.com>`;
    const emlContent = generateEmlContent(
      senderName ?? "Unknown",
      "noreply@elite-n.com",
      email.toEmails?.join(", ") ?? "",
      email.ccEmails?.join(", ") ?? "",
      email.subject,
      email.bodyText,
      messageId
    );
    const filename = generateFilename(
      email.toEmails?.[0] ?? "email",
      "eml"
    );
    downloadFile(emlContent, filename, "message/rfc822");
  }

  const lines: EmailLine[] = email.bodyText
    ? email.bodyText.split("\n").map((line) => ({
        type: (line.trim() === "" ? "g" : line.startsWith("\u2022") ? "bul" : line.startsWith(">") ? "quote" : line.startsWith("\u2501") ? "div" : "txt") as EmailLine["type"],
        value: line.replace(/^[\u2022>]/, "").trim() || undefined,
      }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/emails" className="text-xs text-text-muted hover:text-text-secondary">
          &larr; Emails
        </Link>
        <div className="mt-1 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary">{email.subject}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted">
              <span style={{ color: templateColor }}>
                {templateIcon} {templateName}
              </span>
              <Badge variant={statusVariant(email.status)}>{email.status}</Badge>
              <span>{formatDateTime(email.sentAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="border-b border-border bg-bg-tertiary px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-text-dim">From</div>
                  <div className="text-xs font-medium text-text-primary">
                    {senderName ?? "Unknown"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-text-dim">To</div>
                  <div className="text-xs text-text-secondary">
                    {email.toEmails?.join(", ") ?? "\u2014"}
                  </div>
                </div>
              </div>
              {email.ccEmails && email.ccEmails.length > 0 && (
                <div className="mt-1 text-right">
                  <div className="text-[10px] uppercase tracking-wider text-text-dim">CC</div>
                  <div className="text-xs text-text-secondary">{email.ccEmails.join(", ")}</div>
                </div>
              )}
              <div
                className="mt-2 rounded-md border px-3 py-1.5"
                style={{
                  borderColor: `${templateColor}25`,
                  background: `${templateColor}08`,
                }}
              >
                <div className="text-[10px] uppercase tracking-wider" style={{ color: `${templateColor}80` }}>
                  Subject
                </div>
                <div className="text-xs font-medium" style={{ color: templateColor }}>
                  {email.subject}
                </div>
              </div>
            </div>
            <div className="max-h-[calc(100vh-400px)] space-y-1.5 overflow-y-auto bg-bg-secondary p-4">
              {lines.length === 0 ? (
                <div className="py-8 text-center text-xs text-text-dim">
                  No body content available
                </div>
              ) : (
                lines.map((line, i) => (
                  <EmailLineRenderer key={i} line={line} accentColor={templateColor} />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-bg-secondary p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Status</span>
                <Badge variant={statusVariant(email.status)}>{email.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Template</span>
                <span className="text-text-secondary" style={{ color: templateColor }}>
                  {templateIcon} {templateName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Sent By</span>
                <span className="text-text-secondary">{senderName ?? "\u2014"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Sent At</span>
                <span className="text-text-secondary">{formatDateTime(email.sentAt)}</span>
              </div>
              {email.threadId && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Thread</span>
                  <span className="text-text-secondary font-mono text-xs">{email.threadId}</span>
                </div>
              )}
            </div>
          </div>

          {rfq && (
            <Link
              href={`/rfq/${rfq.id}`}
              className="block rounded-xl border border-border bg-bg-secondary p-4 transition-colors hover:border-accent/30"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim">Linked RFQ</h3>
              <div className="mt-2 text-sm font-medium text-text-primary">{rfq.packageName}</div>
              {rfq.reference && (
                <div className="text-xs text-text-muted">Ref: {rfq.reference}</div>
              )}
              <div className="mt-1">
                <Badge variant={rfq.status === "open" ? "success" : rfq.status === "closed" ? "warning" : "default"}>
                  {rfq.status}
                </Badge>
              </div>
            </Link>
          )}

          <div className="rounded-xl border border-border bg-bg-secondary p-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim">Actions</h3>
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => copyToClipboard(email.subject, "subject")}
                disabled={copyingSubject}
              >
                {copyingSubject ? "Copying..." : "Copy Subject"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => copyToClipboard(email.bodyText ?? "", "body")}
                disabled={copyingBody}
              >
                {copyingBody ? "Copying..." : "Copy Body"}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDownloadTxt}>
                Download .txt
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDownloadEml}>
                Download .eml
              </Button>
            </div>
          </div>

          {(prevEmail || nextEmail) && (
            <div className="rounded-xl border border-border bg-bg-secondary p-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim">Thread</h3>
              <div className="flex flex-col gap-2">
                {prevEmail && (
                  <Link
                    href={`/emails/${prevEmail.id}`}
                    className="text-xs text-accent hover:underline"
                  >
                    &larr; {prevEmail.subject}
                  </Link>
                )}
                {nextEmail && (
                  <Link
                    href={`/emails/${nextEmail.id}`}
                    className="text-xs text-accent hover:underline"
                  >
                    {nextEmail.subject} &rarr;
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
