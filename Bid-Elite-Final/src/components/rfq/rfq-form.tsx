"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import TemplateSelector from "./template-selector";
import SupplierPicker from "./supplier-picker";
import EmailPreview from "./email-preview";
import { buildSubject, buildEmailLines, linesToPlainText, type EmailFormData } from "@/lib/email/render";
import { generateEmlContent, generateFilename } from "@/lib/email/mailto";

interface Supplier {
  id: string;
  name: string;
  email: string;
  scopes?: string[] | null;
}

interface CompanyData {
  name: string;
  tagline?: string | null;
  city?: string | null;
  country?: string | null;
  email?: string | null;
}

interface RfqFormProps {
  suppliers: Supplier[];
  company: CompanyData;
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

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function RfqForm({ suppliers: initialSuppliers, company, initialData }: RfqFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!initialData;
  const [suppliers, setSuppliers] = useState(initialSuppliers);

  const [template, setTemplate] = useState(initialData?.template ?? "standard");
  const [packageName, setPackageName] = useState(initialData?.packageName ?? "");
  const [reference, setReference] = useState(initialData?.reference ?? "");
  const [deadline, setDeadline] = useState(initialData?.deadline ?? "");
  const [packageLink, setPackageLink] = useState(initialData?.packageLink ?? "");
  const [docsLink, setDocsLink] = useState(initialData?.docsLink ?? "");
  const [details, setDetails] = useState(initialData?.details ?? "");
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>(initialData?.supplierIds ?? []);
  const [subjectOverride, setSubjectOverride] = useState("");
  const [saving, setSaving] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  const formData: EmailFormData = useMemo(
    () => ({ template, packageName, reference, deadline, packageLink, docsLink, details }),
    [template, packageName, reference, deadline, packageLink, docsLink, details],
  );

  const autoSubject = useMemo(
    () => buildSubject(template, packageName, reference, deadline),
    [template, packageName, reference, deadline],
  );

  const subject = subjectOverride || autoSubject;

  const previewSupplierName = useMemo(() => {
    if (selectedSupplierIds.length === 1) {
      return suppliers.find((s) => s.id === selectedSupplierIds[0])?.name ?? "";
    }
    if (selectedSupplierIds.length > 1) {
      return `${selectedSupplierIds.length} suppliers`;
    }
    return "";
  }, [selectedSupplierIds, suppliers]);

  const emailLines = useMemo(
    () => buildEmailLines(formData, company, previewSupplierName),
    [formData, company, previewSupplierName],
  );

  const plainBody = useMemo(() => linesToPlainText(emailLines), [emailLines]);

  const isValid = packageName.trim().length > 0;

  const handleSupplierCreated = useCallback((newSupplier: Supplier) => {
    setSuppliers((prev) => [...prev, newSupplier]);
  }, []);

  const handleSaveDraft = useCallback(async () => {
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

      toast(isEdit ? "RFQ updated" : "RFQ saved as draft", "success");

      if (!isEdit && data.rfq?.id) {
        router.push(`/rfq/${data.rfq.id}/edit`);
      }
      router.refresh();
    } catch {
      toast(`Failed to ${isEdit ? "update" : "create"} RFQ`, "error");
    } finally {
      setSaving(false);
    }
  }, [packageName, reference, deadline, template, details, packageLink, docsLink, selectedSupplierIds, isEdit, initialData, router, toast]);

  const handleSendEmail = useCallback(async () => {
    if (!isEdit || !initialData) {
      toast("Save the RFQ first before sending", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/rfqs/${initialData.id}/send`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast(data.error ?? "Failed to send RFQ", "error");
        return;
      }

      if (data.emails?.length > 0) {
        for (const email of data.emails) {
          window.open(email.mailtoUrl, "_blank");
        }
      }

      toast(`Emails opened for ${data.emailCount} supplier(s)`, "success");
      router.push(`/rfq/${initialData.id}`);
      router.refresh();
    } catch {
      toast("Failed to send RFQ", "error");
    } finally {
      setSaving(false);
    }
  }, [isEdit, initialData, router, toast]);

  const handleCopyBody = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(plainBody);
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2500);
      toast("Body copied to clipboard", "success");
    } catch {
      toast("Failed to copy", "error");
    }
  }, [plainBody, toast]);

  const handleDownloadTxt = useCallback(() => {
    const header = `SUBJECT: ${subject}\n\n`;
    downloadFile(header + plainBody, generateFilename(packageName, "txt"), "text/plain");
  }, [subject, plainBody, packageName]);

  const handleDownloadEml = useCallback(() => {
    const messageId = `<${Date.now()}_${Math.random().toString(36).slice(2)}@${company.email?.split("@")[1] ?? "bid.elite-n.com"}>`;
    const eml = generateEmlContent(
      company.name,
      company.email ?? "",
      previewSupplierName,
      "",
      subject,
      plainBody,
      messageId,
    );
    downloadFile(eml, generateFilename(packageName, "eml"), "message/rfc822");
  }, [company, previewSupplierName, subject, plainBody, packageName]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-bg-secondary">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-text-primary">Template</h3>
          </div>
          <div className="p-4">
            <TemplateSelector value={template} onChange={setTemplate} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-bg-secondary">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-text-primary">Package & Reference</h3>
          </div>
          <div className="space-y-4 p-5">
            <Input
              label="Package Name"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="e.g., MEP Works Phase 2"
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Reference / Project No."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g., EN-RFQ-2026-045"
              />
              <Input
                label="Submission Deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-bg-secondary">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-text-primary">Links</h3>
          </div>
          <div className="space-y-4 p-5">
            <Input
              label="Package Details Link"
              value={packageLink}
              onChange={(e) => setPackageLink(e.target.value)}
              placeholder="https://..."
            />
            <Input
              label="Company Documents Link"
              value={docsLink}
              onChange={(e) => setDocsLink(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-bg-secondary">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-text-primary">
              Suppliers <span className="text-text-dim">({selectedSupplierIds.length} selected)</span>
            </h3>
          </div>
          <div className="p-5">
            <SupplierPicker
              suppliers={suppliers}
              selectedIds={selectedSupplierIds}
              onChange={setSelectedSupplierIds}
              onSupplierCreated={handleSupplierCreated}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-bg-secondary">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-text-primary">Additional Details</h3>
          </div>
          <div className="p-5">
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              placeholder="Project requirements, scope notes, conditions..."
              className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder-text-dim transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={handleSendEmail} disabled={saving || !isValid || !isEdit}>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            Send Email
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSaveDraft} disabled={saving}>
            {saving ? "Saving..." : "Save Draft"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopyBody} disabled={!isValid}>
            {copiedBody ? "Copied" : "Copy Body"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownloadTxt} disabled={!isValid}>
            .txt
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownloadEml} disabled={!isValid}>
            .eml
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-bg-tertiary px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[10px] uppercase tracking-wider text-text-dim">Subject</span>
            <input
              type="text"
              value={subjectOverride || autoSubject}
              onChange={(e) => setSubjectOverride(e.target.value)}
              placeholder={autoSubject || "Fill package name..."}
              className="flex-1 bg-transparent text-xs text-text-primary placeholder-text-dim focus:outline-none"
            />
            {subjectOverride && (
              <button onClick={() => setSubjectOverride("")} className="shrink-0 text-[10px] text-text-dim hover:text-text-muted">
                reset
              </button>
            )}
          </div>
        </div>

        <EmailPreview
          lines={emailLines}
          templateId={template}
          fromName={company.name}
          toName={previewSupplierName}
          subject={subject}
        />

        {!isEdit && (
          <p className="text-[11px] text-text-dim">
            Save as draft first to enable email sending. The preview shows how the email will look.
          </p>
        )}
      </div>
    </div>
  );
}
