/**
 * ════════════════════════════════════════════════════════════════
 * AUTOMAIL V2 - UTILITY FUNCTIONS
 * ════════════════════════════════════════════════════════════════
 */

import { COMPANY, getTemplateColor } from "./config";
import { EmailFormData, EmailLine, TemplateContent } from "./types";

// ════════════════════════════════════════════════════════════════
// ID GENERATION
// ════════════════════════════════════════════════════════════════

export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateThreadId = (): string => {
  return `thread_${generateId()}`;
};

export const generateMessageId = (): string => {
  return `<${generateId()}@${COMPANY.email.split("@")[1] || "automail.local"}>`;
};

// ════════════════════════════════════════════════════════════════
// DATE FORMATTING
// ════════════════════════════════════════════════════════════════

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(new Date(timestamp).toISOString().split("T")[0]);
};

// ════════════════════════════════════════════════════════════════
// EMAIL VALIDATION
// ════════════════════════════════════════════════════════════════

const EMAIL_REGEX = /^[\w.+-]+@[\w.-]+\.\w{2,}$/;

export const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email.trim());
};

export const isValidEmailList = (emails: string): boolean => {
  if (!emails.trim()) return true; // Empty is valid (optional)
  return emails.split(",").every((e) => isValidEmail(e));
};

export const parseEmails = (emails: string): string[] => {
  if (!emails.trim()) return [];
  return emails.split(",").map((e) => e.trim()).filter(Boolean);
};

// ════════════════════════════════════════════════════════════════
// SUBJECT GENERATION
// ════════════════════════════════════════════════════════════════

export const buildSubject = (
  template: string,
  packageName: string,
  reference: string,
  deadline: string,
  isFollowUp: boolean = false,
  parentSubject?: string
): string => {
  // For follow-ups, prepend RE: to parent subject
  if (isFollowUp && parentSubject) {
    if (parentSubject.startsWith("RE:")) return parentSubject;
    return `RE: ${parentSubject}`;
  }

  const prefixes: Record<string, string> = {
    standard: "RFQ",
    urgent: "URGENT RFQ",
    competitive: "RFQ Bid",
    bulkOrder: "RFQ Bulk",
    followUp: "Follow-up",
    reminder: "REMINDER",
  };

  const prefix = prefixes[template] || "RFQ";
  const parts: string[] = [prefix];

  if (packageName) parts.push(packageName);
  if (reference) parts.push(`Ref: ${reference}`);
  if (deadline) parts.push(`Due: ${formatDate(deadline)}`);

  return parts.join(" | ");
};

// ════════════════════════════════════════════════════════════════
// TEMPLATE CONTENT
// ════════════════════════════════════════════════════════════════

export const getTemplateContent = (templateId: string): TemplateContent => {
  const companyName = COMPANY.name;
  const tagline = COMPANY.tagline;
  const location = `${COMPANY.address.city}, ${COMPANY.address.country}`;

  const templates: Record<string, TemplateContent> = {
    standard: {
      about: `We are ${companyName}, a premium fit-out contractor based in ${location}, specializing in high-quality interior design and construction solutions for commercial and residential projects.`,
      greeting: "Greetings from " + companyName + ".",
      invitation: "We are pleased to invite you to submit your quotation for the following package:",
      confTitle: "CONFIDENTIALITY NOTICE:",
      confText: `This quotation request and all project details are CONFIDENTIAL and proprietary information. All information shared herein is intended solely for the purpose of preparing quotations and should not be disclosed to third parties without explicit written consent from ${companyName}.`,
      body: "We require you to commence quotation submission as per the specifications outlined in the project documentation. Please ensure your pricing aligns with the quality and timeline standards outlined in the specifications.",
      docsIntro: "Before proceeding, please review our corporate legal documents and company details:",
      detLabel: "📝 Project Requirements:",
      reqIntro: "Please reply with your detailed quotation at your earliest convenience, including:",
      items: [
        "Itemized pricing breakdown",
        "Delivery timeline",
        "Warranty/guarantee terms",
        "Payment terms",
      ],
      discl: "This is a confidential communication. If you are not the intended recipient, please delete this email immediately.",
    },
    urgent: {
      about: `We are ${companyName}, a premium fit-out contractor based in ${location}, specializing in high-quality interior design and construction solutions.`,
      greeting: "Greetings from " + companyName + ".",
      invitation: "We are reaching out with an URGENT quotation request for the following package:",
      confTitle: "⚠️ CONFIDENTIALITY & URGENCY NOTICE:",
      confText: `This quotation request and all project details are CONFIDENTIAL. This is a time-sensitive inquiry requiring IMMEDIATE action. All information is proprietary and should not be disclosed without written consent.`,
      body: "We require IMMEDIATE submission of your detailed quotation with comprehensive pricing breakdown. Please prioritize this request and confirm receipt of this email within 2 hours.",
      docsIntro: "Before proceeding, please review our corporate documents:",
      detLabel: "📝 Critical Requirements:",
      reqIntro: "Please begin quotation preparation IMMEDIATELY and provide:",
      items: [
        "Detailed itemized pricing",
        "Expedited delivery timeline",
        "Quality assurance guarantees",
        "Payment terms",
      ],
      urgNote: "Time is critical. Please confirm receipt and provide preliminary timeline ASAP.",
      discl: "CONFIDENTIAL - Do not distribute without authorization.",
    },
    competitive: {
      about: `We are ${companyName}, a premium fit-out contractor based in ${location}, committed to delivering excellence in interior design and construction.`,
      greeting: "Greetings from " + companyName + ".",
      invitation: "We are conducting a competitive bidding process for the following package and would like to invite your submission:",
      confTitle: "CONFIDENTIALITY NOTICE:",
      confText: `This Request for Quotation (RFQ) and all project specifications are CONFIDENTIAL and proprietary. All information shared is solely for quotation preparation and must not be disclosed to competitors or third parties without written authorization from ${companyName}.`,
      body: "As a valued partner, we believe your expertise and quality standards would be valuable for this competitive project. We require competitive pricing with detailed quotations covering all specifications outlined in the project documentation.",
      docsIntro: "Please review our corporate credentials and legal documents:",
      detLabel: "📋 Evaluation Criteria & Requirements:",
      reqIntro: "Your submission should include:",
      items: [
        "Competitive itemized pricing",
        "Delivery timeline and milestones",
        "Quality certifications and guarantees",
        "Payment and contract terms",
      ],
      discl: "CONFIDENTIAL & PROPRIETARY - Bidding Confidentiality Agreement applies.",
    },
    bulkOrder: {
      about: `We are ${companyName}, a leading fit-out contractor based in ${location}, specializing in large-scale construction and premium interior solutions.`,
      greeting: "Greetings from " + companyName + ".",
      invitation: "We are seeking quotations for the following package:",
      confTitle: "CONFIDENTIALITY & HIGH-VALUE NOTICE:",
      confText: `This quotation request and all associated project details are strictly CONFIDENTIAL. All information must be treated with the highest level of confidentiality and is intended for authorized representatives only.`,
      body: "Given the scale and strategic importance of this project, we are looking for competitive pricing. Your response should reflect the significance of this order.",
      docsIntro: "Please review our corporate documentation and company standing:",
      detLabel: "📊 Project Specifications:",
      reqIntro: "Your quotation must include:",
      items: [
        "Competitive pricing",
        "Delivery options and logistics",
        "Extended warranty and support terms",
        "Flexible payment terms",
        "Long-term partnership opportunities",
      ],
      discl: "CONFIDENTIAL - High-Value Contract Information. Unauthorized disclosure prohibited.",
    },
    followUp: {
      about: `Following up on our previous correspondence regarding the quotation request from ${companyName}.`,
      greeting: "I hope this email finds you well.",
      invitation: "We are writing to follow up on the pending quotation for the following package:",
      confTitle: "REFERENCE:",
      confText: "This email is in reference to our earlier communication regarding the below package. Please treat this as a continuation of the same thread.",
      body: "We would appreciate an update on the status of our quotation request. If you require any additional information or clarification, please do not hesitate to reach out.",
      docsIntro: "For your reference, the original package details can be found at:",
      detLabel: "📝 Follow-up Notes:",
      reqIntro: "We kindly request you to provide:",
      items: [
        "Current status of the quotation",
        "Expected completion timeline",
        "Any clarifications needed",
        "Revised pricing if applicable",
      ],
      discl: "This is a follow-up to previous confidential correspondence.",
    },
    reminder: {
      about: `This is a friendly reminder from ${companyName} regarding the upcoming deadline for your quotation submission.`,
      greeting: "I hope this email finds you well.",
      invitation: "We are writing to remind you that the submission deadline for the following package is approaching:",
      confTitle: "⏰ DEADLINE REMINDER:",
      confText: "Please note that the submission deadline is approaching. We encourage you to submit your quotation at your earliest convenience to ensure timely processing.",
      body: "Your quotation is important to us, and we want to ensure you have sufficient time to prepare a comprehensive response. If you anticipate any delays, please inform us immediately.",
      docsIntro: "For your reference:",
      detLabel: "📋 Reminder Details:",
      reqIntro: "Please ensure your submission includes:",
      items: [
        "Complete quotation documentation",
        "All required certifications",
        "Timeline confirmation",
        "Contact information for queries",
      ],
      urgNote: "Please prioritize this submission to avoid any delays in the evaluation process.",
      discl: "This is an automated reminder for pending quotation submission.",
    },
  };

  return templates[templateId] || templates.standard;
};

// ════════════════════════════════════════════════════════════════
// EMAIL BODY GENERATION
// ════════════════════════════════════════════════════════════════

export const buildEmailLines = (
  formData: EmailFormData,
  parentBody?: string
): EmailLine[] => {
  const template = getTemplateContent(formData.template);
  const lines: EmailLine[] = [];

  const supplierName = formData.supplierName || "[Supplier Name]";
  const packageName = formData.packageName || "[Package Name]";

  // Greeting
  lines.push({ type: "txt", value: `Dear ${supplierName},` });
  lines.push({ type: "g" });
  lines.push({ type: "txt", value: template.greeting });
  lines.push({ type: "g" });

  // About
  lines.push({ type: "txt", value: template.about });
  lines.push({ type: "g" });

  // Invitation
  lines.push({ type: "txt", value: template.invitation });
  lines.push({ type: "g" });

  // Package details
  lines.push({ type: "lbl", value: `📦 Package: ${packageName}` });
  if (formData.reference) {
    lines.push({ type: "lbl", value: `🔖 Reference: ${formData.reference}` });
  }
  if (formData.packageLink) {
    lines.push({
      type: "lnk",
      label: "📎 Download Package Details",
      url: formData.packageLink,
    });
  }
  if (formData.deadline) {
    lines.push({
      type: "lbl",
      value: `📅 Submission Deadline: ${formatDate(formData.deadline)}`,
    });
  }
  lines.push({ type: "g" });

  // Confidentiality
  lines.push({ type: "hd", value: template.confTitle });
  lines.push({ type: "txt", value: template.confText });
  lines.push({ type: "g" });

  // Body
  lines.push({ type: "txt", value: template.body });
  lines.push({ type: "g" });

  // Documents link
  lines.push({ type: "txt", value: template.docsIntro });
  if (formData.docsLink) {
    lines.push({ type: "lnk", label: "📄 Company Documents", url: formData.docsLink });
  }
  lines.push({ type: "g" });

  // Additional details
  if (formData.details) {
    lines.push({ type: "lbl", value: template.detLabel });
    lines.push({ type: "txt", value: formData.details });
    lines.push({ type: "g" });
  }

  // Requirements
  lines.push({ type: "txt", value: template.reqIntro });
  template.items.forEach((item) => {
    lines.push({ type: "bul", value: item });
  });

  // Urgency note (if applicable)
  if (template.urgNote) {
    lines.push({ type: "g" });
    lines.push({ type: "urg", value: template.urgNote });
  }

  // Quoted reply for follow-ups
  if (parentBody && formData.template === "followUp") {
    lines.push({ type: "g" });
    lines.push({ type: "hd", value: "━━━ ORIGINAL MESSAGE ━━━" });
    lines.push({ type: "quote", value: parentBody });
  }

  // Signature
  lines.push({ type: "g" });
  lines.push({
    type: "sig",
    value: `Best regards,\n\n${COMPANY.name}\n${COMPANY.tagline}\n${COMPANY.address.city}, ${COMPANY.address.country}`,
  });

  // Divider and disclaimer
  lines.push({ type: "div", value: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" });
  lines.push({ type: "dis", value: template.discl });

  return lines;
};

// ════════════════════════════════════════════════════════════════
// PLAIN TEXT CONVERSION
// ════════════════════════════════════════════════════════════════

export const linesToPlainText = (lines: EmailLine[]): string => {
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
          return line.value?.split("\n").map((l) => `> ${l}`).join("\n") || "";
        default:
          return line.value;
      }
    })
    .join("\n");
};

// ════════════════════════════════════════════════════════════════
// EML FILE GENERATION
// ════════════════════════════════════════════════════════════════

export const generateEmlContent = (
  to: string,
  cc: string,
  subject: string,
  body: string,
  messageId: string,
  references?: string[],
  inReplyTo?: string
): string => {
  const lines: string[] = [
    `From: ${COMPANY.name} <${COMPANY.email}>`,
    `To: ${to}`,
  ];

  if (cc) lines.push(`Cc: ${cc}`);
  
  lines.push(`Subject: ${subject}`);
  lines.push(`Date: ${new Date().toUTCString()}`);
  lines.push(`Message-ID: ${messageId}`);
  
  // Threading headers
  if (inReplyTo) {
    lines.push(`In-Reply-To: ${inReplyTo}`);
  }
  if (references && references.length > 0) {
    lines.push(`References: ${references.join(" ")}`);
  }
  
  lines.push("MIME-Version: 1.0");
  lines.push("Content-Type: text/plain; charset=UTF-8");
  lines.push("");
  lines.push(body);

  return lines.join("\r\n");
};

// ════════════════════════════════════════════════════════════════
// MAILTO URL GENERATION
// ════════════════════════════════════════════════════════════════

export const generateMailtoUrl = (
  to: string,
  cc: string,
  subject: string,
  body: string
): string => {
  let url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  if (cc) {
    url += `&cc=${encodeURIComponent(cc)}`;
  }
  return url;
};

// ════════════════════════════════════════════════════════════════
// FILE DOWNLOAD HELPERS
// ════════════════════════════════════════════════════════════════

export const downloadFile = (
  content: string,
  filename: string,
  mimeType: string
): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const generateFilename = (
  supplierName: string,
  extension: string
): string => {
  const safeName = (supplierName || "draft").replace(/[^a-zA-Z0-9]/g, "_");
  const date = new Date().toISOString().split("T")[0];
  return `RFQ_${safeName}_${date}.${extension}`;
};

// ════════════════════════════════════════════════════════════════
// CLIPBOARD HELPERS
// ════════════════════════════════════════════════════════════════

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
};

// ════════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ════════════════════════════════════════════════════════════════

export const validateForm = (
  formData: EmailFormData
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!formData.supplierName.trim()) {
    errors.supplierName = "Supplier name is required";
  }

  if (!formData.packageName.trim()) {
    errors.packageName = "Package name is required";
  }

  if (formData.supplierEmails && !isValidEmailList(formData.supplierEmails)) {
    errors.supplierEmails = "Invalid email format";
  }

  if (formData.cc && !isValidEmailList(formData.cc)) {
    errors.cc = "Invalid email format";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// ════════════════════════════════════════════════════════════════
// URL HELPERS
// ════════════════════════════════════════════════════════════════

export const isValidUrl = (url: string): boolean => {
  if (!url.trim()) return true; // Empty is valid
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isSharePointUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.includes("sharepoint.com") ||
      parsed.hostname.includes("sharepoint.")
    );
  } catch {
    return false;
  }
};
