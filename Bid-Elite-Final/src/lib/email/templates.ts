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

export interface TemplateConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export const TEMPLATES: TemplateConfig[] = [
  { id: "standard", name: "Standard", icon: "📄", color: "#d97706", description: "Default professional RFQ email" },
  { id: "urgent", name: "Urgent", icon: "⚡", color: "#dc2626", description: "Time-sensitive request with priority" },
  { id: "competitive", name: "Competitive", icon: "🏆", color: "#059669", description: "For bidding processes" },
  { id: "bulkOrder", name: "Bulk Order", icon: "📦", color: "#7c3aed", description: "Large-scale project quotations" },
  // ACTION-ONLY TEMPLATES: These are not available for new RFQ creation.
  // They are used as actions on an existing sent RFQ from the detail page.
  // They reference the original sent email thread (inReplyTo, threadId).
  { id: "followUp", name: "Follow Up", icon: "🔄", color: "#0891b2", description: "Follow-up on previous correspondence" },
  { id: "reminder", name: "Reminder", icon: "⏰", color: "#ea580c", description: "Deadline reminder for pending quotes" },
];

export const RFQ_CREATION_TEMPLATES = TEMPLATES.filter((t) => t.id !== "followUp" && t.id !== "reminder");

export function getTemplateById(id: string): TemplateConfig | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function getTemplateColor(id: string | null): string {
  if (!id) return TEMPLATES[0].color;
  return getTemplateById(id)?.color ?? TEMPLATES[0].color;
}

export function getTemplateContent(
  templateId: string,
  company: { name: string; tagline?: string | null; city?: string | null; country?: string | null },
): TemplateContent {
  const companyName = company.name;
  const location = `${company.city ?? "Riyadh"}, ${company.country ?? "Saudi Arabia"}`;

  const templates: Record<string, TemplateContent> = {
    standard: {
      about: `We are ${companyName}, a premium fit-out contractor based in ${location}, specializing in high-quality interior design and construction solutions for commercial and residential projects.`,
      greeting: "Greetings from " + companyName + ".",
      invitation: "We are pleased to invite you to submit your quotation for the following package:",
      confTitle: "CONFIDENTIALITY NOTICE:",
      confText: `This quotation request and all project details are CONFIDENTIAL and proprietary information. All information shared herein is intended solely for the purpose of preparing quotations and should not be disclosed to third parties without explicit written consent from ${companyName}.`,
      body: "We require you to commence quotation submission as per the specifications outlined in the project documentation. Please ensure your pricing aligns with the quality and timeline standards outlined in the specifications.",
      docsIntro: "Before proceeding, please review our corporate legal documents and company details:",
      detLabel: "Project Requirements:",
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
      confTitle: "CONFIDENTIALITY & URGENCY NOTICE:",
      confText: `This quotation request and all project details are CONFIDENTIAL. This is a time-sensitive inquiry requiring IMMEDIATE action. All information is proprietary and should not be disclosed without written consent.`,
      body: "We require IMMEDIATE submission of your detailed quotation with comprehensive pricing breakdown. Please prioritize this request and confirm receipt of this email within 2 hours.",
      docsIntro: "Before proceeding, please review our corporate documents:",
      detLabel: "Critical Requirements:",
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
      detLabel: "Evaluation Criteria & Requirements:",
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
      detLabel: "Project Specifications:",
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
      detLabel: "Follow-up Notes:",
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
      confTitle: "DEADLINE REMINDER:",
      confText: "Please note that the submission deadline is approaching. We encourage you to submit your quotation at your earliest convenience to ensure timely processing.",
      body: "Your quotation is important to us, and we want to ensure you have sufficient time to prepare a comprehensive response. If you anticipate any delays, please inform us immediately.",
      docsIntro: "For your reference:",
      detLabel: "Reminder Details:",
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

  return templates[templateId] ?? templates.standard;
}
