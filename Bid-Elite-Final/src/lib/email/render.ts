import { getTemplateContent } from "./templates";

export interface EmailLine {
  type: "txt" | "g" | "hd" | "lbl" | "lnk" | "bul" | "urg" | "sig" | "div" | "dis" | "quote";
  value?: string;
  label?: string;
  url?: string;
}

export interface EmailFormData {
  template: string;
  packageName: string;
  reference: string;
  deadline: string;
  packageLink: string;
  docsLink: string;
  details: string;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export interface OriginalEmail {
  subject: string;
  bodyText: string;
  sentAt: Date;
  messageId: string | null;
  threadId: string | null;
  packageName: string;
  reference: string | null;
  deadline: string | null;
}

export function buildFollowUpSubject(originalSubject: string): string {
  return `Re: ${originalSubject}`;
}

export function buildReminderSubject(originalSubject: string): string {
  return `REMINDER: ${originalSubject}`;
}

export function buildFollowUpEmailLines(
  formData: EmailFormData,
  company: CompanyInfo,
  supplierName: string,
  portalLink: string | undefined,
  originalEmail: OriginalEmail,
): EmailLine[] {
  const template = getTemplateContent("followUp", company);
  const lines: EmailLine[] = [];
  const packageName = formData.packageName || "[Package Name]";

  lines.push({ type: "txt", value: `Dear ${supplierName || "[Supplier Name]"},` });
  lines.push({ type: "g" });
  lines.push({ type: "txt", value: template.greeting });
  lines.push({ type: "g" });
  lines.push({ type: "txt", value: template.about });
  lines.push({ type: "g" });
  lines.push({ type: "txt", value: template.invitation });
  lines.push({ type: "g" });

  lines.push({ type: "lbl", value: `Package: ${packageName}` });
  if (formData.reference) {
    lines.push({ type: "lbl", value: `Reference: ${formData.reference}` });
  }
  if (formData.deadline) {
    lines.push({ type: "lbl", value: `Submission Deadline: ${formatDate(formData.deadline)}` });
  }
  lines.push({ type: "g" });

  if (portalLink) {
    lines.push({ type: "txt", value: "You can submit your quotation online at:" });
    lines.push({ type: "lnk", label: "Submit Quote", url: portalLink });
    lines.push({ type: "g" });
  }

  lines.push({ type: "txt", value: template.body });
  lines.push({ type: "g" });

  lines.push({ type: "txt", value: template.reqIntro });
  for (const item of template.items) {
    lines.push({ type: "bul", value: item });
  }
  lines.push({ type: "g" });

  lines.push({ type: "div", value: "--- Original Message ---" });
  lines.push({ type: "quote", value: `Subject: ${originalEmail.subject}` });
  if (originalEmail.sentAt) {
    lines.push({ type: "quote", value: `Date: ${new Date(originalEmail.sentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` });
  }
  lines.push({ type: "quote", value: `Package: ${originalEmail.packageName}` });
  if (originalEmail.reference) {
    lines.push({ type: "quote", value: `Reference: ${originalEmail.reference}` });
  }
  if (originalEmail.deadline) {
    lines.push({ type: "quote", value: `Deadline: ${formatDate(originalEmail.deadline)}` });
  }
  lines.push({ type: "g" });

  const sigTeamName = company.signatureTeamName || "Bidding Team";
  const sigLines = [
    "Best regards,",
    "",
    sigTeamName,
    company.name,
    company.city ?? "",
    company.website ?? "",
    company.biddingEmail ?? "",
    company.adminEmail ?? "",
  ].filter((line) => line !== "");
  lines.push({ type: "sig", value: sigLines.join("\n") });

  lines.push({ type: "div", value: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" });
  lines.push({ type: "dis", value: template.discl });

  return lines;
}

function daysUntilDeadline(deadline: string): number {
  if (!deadline) return Infinity;
  const deadlineDate = new Date(deadline + "T23:59:59");
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function buildReminderEmailLines(
  formData: EmailFormData,
  company: CompanyInfo,
  supplierName: string,
  portalLink: string | undefined,
  originalEmail: OriginalEmail,
  deadline: string,
): EmailLine[] {
  const template = getTemplateContent("reminder", company);
  const lines: EmailLine[] = [];
  const packageName = formData.packageName || "[Package Name]";
  const daysLeft = daysUntilDeadline(deadline);

  lines.push({ type: "txt", value: `Dear ${supplierName || "[Supplier Name]"},` });
  lines.push({ type: "g" });
  lines.push({ type: "txt", value: template.greeting });
  lines.push({ type: "g" });
  lines.push({ type: "txt", value: template.about });
  lines.push({ type: "g" });
  lines.push({ type: "txt", value: template.invitation });
  lines.push({ type: "g" });

  lines.push({ type: "lbl", value: `Package: ${packageName}` });
  if (formData.reference) {
    lines.push({ type: "lbl", value: `Reference: ${formData.reference}` });
  }
  if (deadline) {
    lines.push({ type: "lbl", value: `Submission Deadline: ${formatDate(deadline)}` });
    if (daysLeft <= 7 && daysLeft >= 0) {
      lines.push({ type: "urg", value: `⏰ Only ${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining until the submission deadline!` });
    }
  }
  if (daysLeft <= 3 && daysLeft >= 0) {
    lines.push({ type: "urg", value: "⚠️ URGENT: This is the final reminder. Please submit your quotation immediately to ensure it is considered in the evaluation." });
  }
  lines.push({ type: "g" });

  if (portalLink) {
    lines.push({ type: "txt", value: "Submit your quotation online now:" });
    lines.push({ type: "lnk", label: "Submit Quote", url: portalLink });
    lines.push({ type: "g" });
  }

  lines.push({ type: "txt", value: template.body });
  lines.push({ type: "g" });

  lines.push({ type: "txt", value: template.reqIntro });
  for (const item of template.items) {
    lines.push({ type: "bul", value: item });
  }
  lines.push({ type: "g" });

  if (template.urgNote) {
    lines.push({ type: "urg", value: template.urgNote });
    lines.push({ type: "g" });
  }

  lines.push({ type: "txt", value: "This is a follow-up to our original communication:" });
  lines.push({ type: "quote", value: `Subject: ${originalEmail.subject}` });
  if (originalEmail.sentAt) {
    lines.push({ type: "quote", value: `Date: ${new Date(originalEmail.sentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` });
  }
  lines.push({ type: "quote", value: `Package: ${originalEmail.packageName}` });
  if (originalEmail.reference) {
    lines.push({ type: "quote", value: `Reference: ${originalEmail.reference}` });
  }
  lines.push({ type: "g" });

  const sigTeamName = company.signatureTeamName || "Bidding Team";
  const sigLines = [
    "Best regards,",
    "",
    sigTeamName,
    company.name,
    company.city ?? "",
    company.website ?? "",
    company.biddingEmail ?? "",
    company.adminEmail ?? "",
  ].filter((line) => line !== "");
  lines.push({ type: "sig", value: sigLines.join("\n") });

  lines.push({ type: "div", value: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" });
  lines.push({ type: "dis", value: template.discl });

  return lines;
}

export function buildSubject(
  template: string,
  packageName: string,
  reference: string,
  deadline: string,
): string {
  const prefixes: Record<string, string> = {
    standard: "RFQ",
    urgent: "URGENT RFQ",
    competitive: "RFQ Bid",
    bulkOrder: "RFQ Bulk",
    followUp: "Follow-up",
    reminder: "REMINDER",
  };

  const prefix = prefixes[template] ?? "RFQ";
  const parts: string[] = [prefix];

  if (packageName) parts.push(packageName);
  if (reference) parts.push(`Ref: ${reference}`);
  if (deadline) parts.push(`Due: ${formatDate(deadline)}`);

  return parts.join(" | ");
}

export type CompanyInfo = {
  name: string;
  tagline?: string | null;
  city?: string | null;
  country?: string | null;
  email?: string | null;
  website?: string | null;
  biddingEmail?: string | null;
  adminEmail?: string | null;
  signatureTeamName?: string | null;
};

export function buildEmailLines(
  formData: EmailFormData,
  company: CompanyInfo,
  supplierName: string,
  portalLink?: string,
): EmailLine[] {
  const template = getTemplateContent(formData.template, company);
  const lines: EmailLine[] = [];

  const packageName = formData.packageName || "[Package Name]";

  lines.push({ type: "txt", value: `Dear ${supplierName || "[Supplier Name]"},` });
  lines.push({ type: "g" });
  lines.push({ type: "txt", value: template.greeting });
  lines.push({ type: "g" });
  lines.push({ type: "txt", value: template.about });
  lines.push({ type: "g" });
  lines.push({ type: "txt", value: template.invitation });
  lines.push({ type: "g" });

  lines.push({ type: "lbl", value: `Package: ${packageName}` });
  if (formData.reference) {
    lines.push({ type: "lbl", value: `Reference: ${formData.reference}` });
  }
  if (formData.packageLink) {
    lines.push({ type: "lnk", label: "Download Package Details", url: formData.packageLink });
  }
  if (formData.deadline) {
    lines.push({ type: "lbl", value: `Submission Deadline: ${formatDate(formData.deadline)}` });
  }
  lines.push({ type: "g" });

  if (portalLink) {
    lines.push({ type: "txt", value: "You can submit your quotation online at:" });
    lines.push({ type: "lnk", label: "Submit Quote", url: portalLink });
    lines.push({ type: "g" });
  }

  lines.push({ type: "hd", value: template.confTitle });
  lines.push({ type: "txt", value: template.confText });
  lines.push({ type: "g" });

  lines.push({ type: "txt", value: template.body });
  lines.push({ type: "g" });

  lines.push({ type: "txt", value: template.docsIntro });
  if (formData.docsLink) {
    lines.push({ type: "lnk", label: "Company Documents", url: formData.docsLink });
  }
  lines.push({ type: "g" });

  if (formData.details) {
    lines.push({ type: "lbl", value: template.detLabel });
    lines.push({ type: "txt", value: formData.details });
    lines.push({ type: "g" });
  }

  lines.push({ type: "txt", value: template.reqIntro });
  for (const item of template.items) {
    lines.push({ type: "bul", value: item });
  }

  if (template.urgNote) {
    lines.push({ type: "g" });
    lines.push({ type: "urg", value: template.urgNote });
  }

  lines.push({ type: "g" });
  const sigTeamName = company.signatureTeamName || "Bidding Team";
  const sigLines = [
    "Best regards,",
    "",
    sigTeamName,
    company.name,
    company.city ?? "",
    company.website ?? "",
    company.biddingEmail ?? "",
    company.adminEmail ?? "",
  ].filter((line) => line !== "");
  lines.push({
    type: "sig",
    value: sigLines.join("\n"),
  });

  lines.push({ type: "div", value: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" });
  lines.push({ type: "dis", value: template.discl });

  return lines;
}

export function linesToPlainText(lines: EmailLine[]): string {
  return lines
    .map((line) => {
      switch (line.type) {
        case "g":
          return "";
        case "bul":
          return `• ${line.value}`;
        case "lnk":
          return `${line.label}: ${line.url}`;
        case "quote":
          return line.value?.split("\n").map((l) => `> ${l}`).join("\n") ?? "";
        default:
          return line.value;
      }
    })
    .join("\n");
}

export function generateEmailBody(
  formData: EmailFormData,
  company: CompanyInfo,
  supplierName: string,
  portalLink?: string,
): string {
  const lines = buildEmailLines(formData, company, supplierName, portalLink);
  return linesToPlainText(lines);
}

export function generateFollowUpEmailBody(
  formData: EmailFormData,
  company: CompanyInfo,
  supplierName: string,
  portalLink: string | undefined,
  originalEmail: OriginalEmail,
): string {
  const lines = buildFollowUpEmailLines(formData, company, supplierName, portalLink, originalEmail);
  return linesToPlainText(lines);
}

export function generateReminderEmailBody(
  formData: EmailFormData,
  company: CompanyInfo,
  supplierName: string,
  portalLink: string | undefined,
  originalEmail: OriginalEmail,
  deadline: string,
): string {
  const lines = buildReminderEmailLines(formData, company, supplierName, portalLink, originalEmail, deadline);
  return linesToPlainText(lines);
}
