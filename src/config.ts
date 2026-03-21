/**
 * ════════════════════════════════════════════════════════════════
 * AUTOMAIL V2 - APPLICATION CONFIG (DO NOT EDIT)
 * ════════════════════════════════════════════════════════════════
 *
 * This file is the technical backbone of the app.
 * To change your company details, edit:  company-details.ts
 */

import {
  COMPANY_NAME,
  COMPANY_SHORT_NAME,
  COMPANY_TAGLINE,
  COMPANY_EMAIL,
  COMPANY_WEBSITE,
  COMPANY_PHONE,
  COMPANY_CITY,
  COMPANY_COUNTRY,
  COMPANY_DOCS_LINK,
} from "./company-details";

// ════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ════════════════════════════════════════════════════════════════

export interface CompanyConfig {
  name: string;
  shortName: string;
  tagline: string;
  email: string;
  website?: string;
  phone?: string;
  address: {
    city: string;
    country: string;
    full?: string;
  };
  logo?: {
    text: string;
    url?: string;
  };
}

export interface TemplateConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
}

export interface AppConfig {
  company: CompanyConfig;
  templates: TemplateConfig[];
  defaults: {
    emailSignature: string;
    confidentialityNotice: string;
    companyDocsLink: string;
  };
  storage: {
    prefix: string;
    maxHistoryItems: number;
    maxSavedLinks: number;
  };
  features: {
    enableFollowUp: boolean;
    enableThreading: boolean;
    enableLinkStorage: boolean;
    enableHistory: boolean;
    enableExport: boolean;
  };
}

// ════════════════════════════════════════════════════════════════
// COMPANY (built from company-details.ts)
// ════════════════════════════════════════════════════════════════

export const COMPANY: CompanyConfig = {
  name: COMPANY_NAME,
  shortName: COMPANY_SHORT_NAME,
  tagline: COMPANY_TAGLINE,
  email: COMPANY_EMAIL,
  website: COMPANY_WEBSITE,
  phone: COMPANY_PHONE,
  address: {
    city: COMPANY_CITY,
    country: COMPANY_COUNTRY,
    full: `${COMPANY_CITY}, ${COMPANY_COUNTRY}`,
  },
  logo: {
    text: COMPANY_SHORT_NAME,
  },
};

// ════════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ════════════════════════════════════════════════════════════════

export const TEMPLATES: TemplateConfig[] = [
  {
    id: "standard",
    name: "Standard",
    icon: "📄",
    color: "#d97706",
    description: "Default professional RFQ email",
  },
  {
    id: "urgent",
    name: "Urgent",
    icon: "⚡",
    color: "#dc2626",
    description: "Time-sensitive request with priority",
  },
  {
    id: "competitive",
    name: "Competitive",
    icon: "🏆",
    color: "#059669",
    description: "For bidding processes",
  },
  {
    id: "bulkOrder",
    name: "Bulk Order",
    icon: "📦",
    color: "#7c3aed",
    description: "Large-scale project quotations",
  },
  {
    id: "followUp",
    name: "Follow Up",
    icon: "🔄",
    color: "#0891b2",
    description: "Follow-up on previous correspondence",
  },
  {
    id: "reminder",
    name: "Reminder",
    icon: "⏰",
    color: "#ea580c",
    description: "Deadline reminder for pending quotes",
  },
];

// ════════════════════════════════════════════════════════════════
// DEFAULT EMAIL CONTENT
// ════════════════════════════════════════════════════════════════

export const DEFAULT_SIGNATURE = `Best regards,

${COMPANY.name}
${COMPANY.tagline}
${COMPANY.address.city}, ${COMPANY.address.country}`;

export const DEFAULT_CONFIDENTIALITY = `This quotation request and all project details are CONFIDENTIAL and proprietary information. All information shared herein is intended solely for the purpose of preparing quotations and should not be disclosed to third parties without explicit written consent from ${COMPANY.name}.`;

// ════════════════════════════════════════════════════════════════
// APPLICATION CONFIGURATION
// ════════════════════════════════════════════════════════════════

export const APP_CONFIG: AppConfig = {
  company: COMPANY,
  templates: TEMPLATES,
  defaults: {
    emailSignature: DEFAULT_SIGNATURE,
    confidentialityNotice: DEFAULT_CONFIDENTIALITY,
    companyDocsLink: COMPANY_DOCS_LINK,
  },
  storage: {
    prefix: "automail_v2_",
    maxHistoryItems: 100,
    maxSavedLinks: 50,
  },
  features: {
    enableFollowUp: true,
    enableThreading: true,
    enableLinkStorage: true,
    enableHistory: true,
    enableExport: true,
  },
};

// ════════════════════════════════════════════════════════════════
// HELPER EXPORTS
// ════════════════════════════════════════════════════════════════

export const getTemplateById = (id: string): TemplateConfig | undefined => {
  return TEMPLATES.find((t) => t.id === id);
};

export const getTemplateColor = (id: string): string => {
  return getTemplateById(id)?.color || TEMPLATES[0].color;
};

export default APP_CONFIG;
