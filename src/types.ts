/**
 * ════════════════════════════════════════════════════════════════
 * AUTOMAIL V2 - TYPE DEFINITIONS
 * ════════════════════════════════════════════════════════════════
 */

// ════════════════════════════════════════════════════════════════
// FORM DATA
// ════════════════════════════════════════════════════════════════

export interface EmailFormData {
  template: string;
  supplierName: string;
  supplierEmails: string;
  cc: string;
  packageName: string;
  reference: string;
  deadline: string;
  packageLink: string;
  docsLink: string;
  details: string;
  threadId: string;
  parentEmailId: string;
}

export const DEFAULT_FORM_DATA: EmailFormData = {
  template: "standard",
  supplierName: "",
  supplierEmails: "",
  cc: "",
  packageName: "",
  reference: "",
  deadline: "",
  packageLink: "",
  docsLink: "",
  details: "",
  threadId: "",
  parentEmailId: "",
};

// ════════════════════════════════════════════════════════════════
// EMAIL LINE (for rendering email body)
// ════════════════════════════════════════════════════════════════

export interface EmailLine {
  type: "txt" | "g" | "hd" | "lbl" | "lnk" | "bul" | "urg" | "sig" | "div" | "dis" | "quote";
  value?: string;
  label?: string;
  url?: string;
}

// ════════════════════════════════════════════════════════════════
// TEMPLATE CONTENT
// ════════════════════════════════════════════════════════════════

export interface TemplateContent {
  about: string;
  greeting: string;
  invitation: string;
  confTitle: string;
  confText: string;
  body: string;
  docsIntro: string;
  detLabel: string;
  reqIntro: string;
  items: string[];
  urgNote?: string;
  discl: string;
}

// ════════════════════════════════════════════════════════════════
// EMAIL RECORD
// ════════════════════════════════════════════════════════════════

export interface Email {
  id: string;
  timestamp: number;
  formData: EmailFormData;
  subject: string;
  bodyPlain: string;
  status: "draft" | "sent";
  threadId: string;
  parentEmailId?: string;
  replyCount: number;
  mailtoUrl: string;
}

// ════════════════════════════════════════════════════════════════
// EMAIL THREAD
// ════════════════════════════════════════════════════════════════

export interface EmailThread {
  id: string;
  subject: string;
  supplierName: string;
  supplierEmails: string;
  packageName: string;
  emails: Email[];
  lastActivity: number;
  status: "active" | "closed" | "pending";
}

// ════════════════════════════════════════════════════════════════
// SAVED LINK
// ════════════════════════════════════════════════════════════════

export interface SavedLink {
  id: string;
  name: string;
  url: string;
  type: "package" | "docs" | "other";
  packageName?: string;
  tags?: string[];
  usageCount: number;
  lastUsed: number;
  createdAt: number;
}

// ════════════════════════════════════════════════════════════════
// HISTORY ENTRY
// ════════════════════════════════════════════════════════════════

export interface HistoryEntry {
  id: string;
  timestamp: number;
  emailId: string;
  action: string;
}

// ════════════════════════════════════════════════════════════════
// USER SETTINGS
// ════════════════════════════════════════════════════════════════

export interface UserSettings {
  theme: "dark" | "light";
  autoSaveDrafts: boolean;
  defaultTemplate: string;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: "dark",
  autoSaveDrafts: true,
  defaultTemplate: "standard",
};

// ════════════════════════════════════════════════════════════════
// STORAGE / EXPORT
// ════════════════════════════════════════════════════════════════

export interface StorageData {
  emails: Email[];
  threads: EmailThread[];
  links: SavedLink[];
  settings: UserSettings;
}

export interface ExportData {
  emails: Email[];
  threads: EmailThread[];
  links: SavedLink[];
  exportedAt: string;
  version: string;
}
