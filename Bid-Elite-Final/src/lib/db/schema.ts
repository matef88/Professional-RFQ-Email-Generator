import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  jsonb,
  pgEnum,
  date,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["admin", "member"]);
export const rfqStatusEnum = pgEnum("rfq_status", ["draft", "sent", "open", "closed"]);
export const rfqSupplierStatusEnum = pgEnum("rfq_supplier_status", [
  "pending",
  "viewed",
  "quoted",
  "declined",
]);
export const quoteStatusEnum = pgEnum("quote_status", [
  "submitted",
  "under_review",
  "shortlisted",
  "rejected",
]);
export const emailStatusEnum = pgEnum("email_status", ["opened", "recorded"]);
export const emailDeliveryStatusEnum = pgEnum("email_delivery_status", [
  "pending",
  "sent",
  "delivered",
  "failed",
  "bounced",
]);
export const emailSendMethodEnum = pgEnum("email_send_method", ["smtp", "mailto"]);
export const invitationStatusEnum = pgEnum("invitation_status", ["pending", "viewed", "submitted", "revised"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").default("member").notNull(),
  avatarUrl: text("avatar_url"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});

export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    contactPerson: text("contact_person"),
    address: text("address"),
    category: text("category"),
    scopes: text("scopes").array().default([]),
    notes: text("notes"),
    portalToken: text("portal_token").unique(),
    isActive: boolean("is_active").default(true).notNull(),
    password: text("password"),
    lastLogin: timestamp("last_login"),
    isRegistered: boolean("is_registered").default(false),
    registrationToken: text("registration_token"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => users.id),
  },
  (table) => ({
    emailIdx: uniqueIndex("suppliers_email_idx").on(table.email),
    portalTokenIdx: index("suppliers_portal_token_idx").on(table.portalToken),
  }),
);

export interface EvaluationCriteria {
  name: string;
  weight: number;
  type: "price" | "delivery" | "quality" | "custom";
}

export const rfqs = pgTable("rfqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  packageName: text("package_name").notNull(),
  reference: text("reference"),
  deadline: date("deadline"),
  template: text("template"),
  status: rfqStatusEnum("status").default("draft").notNull(),
  details: text("details"),
  packageLink: text("package_link"),
  docsLink: text("docs_link"),
  evaluationCriteria: jsonb("evaluation_criteria").$type<EvaluationCriteria[]>().default([]),
  awardedSupplierId: uuid("awarded_supplier_id").references(() => suppliers.id),
  awardedAt: timestamp("awarded_at"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
});

export const rfqSuppliers = pgTable(
  "rfq_suppliers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rfqId: uuid("rfq_id").references(() => rfqs.id).notNull(),
    supplierId: uuid("supplier_id").references(() => suppliers.id).notNull(),
    status: rfqSupplierStatusEnum("status").default("pending").notNull(),
    emailSentAt: timestamp("email_sent_at"),
    viewedAt: timestamp("viewed_at"),
    quotedAt: timestamp("quoted_at"),
    portalToken: text("portal_token").notNull().unique(),
  },
  (table) => ({
    rfqIdx: index("rfq_suppliers_rfq_idx").on(table.rfqId),
    supplierIdx: index("rfq_suppliers_supplier_idx").on(table.supplierId),
  }),
);

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rfqId: uuid("rfq_id").references(() => rfqs.id).notNull(),
    supplierId: uuid("supplier_id").references(() => suppliers.id).notNull(),
    coverLetter: text("cover_letter"),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 }),
    currency: text("currency").default("USD"),
    deliveryDays: integer("delivery_days"),
    validityDays: integer("validity_days"),
    status: quoteStatusEnum("status").default("submitted").notNull(),
    attachments: jsonb("attachments").$type<string[]>().default([]),
    scores: jsonb("scores").$type<Record<string, number>>().default({}),
    totalScore: decimal("total_score", { precision: 5, scale: 2 }),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
    reviewedAt: timestamp("reviewed_at"),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    notes: text("notes"),
  },
  (table) => ({
    rfqIdx: index("quotes_rfq_idx").on(table.rfqId),
    supplierIdx: index("quotes_supplier_idx").on(table.supplierId),
  }),
);

export const quoteItems = pgTable("quote_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id").references(() => quotes.id).notNull(),
  description: text("description").notNull(),
  unit: text("unit"),
  quantity: decimal("quantity", { precision: 12, scale: 2 }),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }),
  sortOrder: integer("sort_order").default(0),
});

export const emails = pgTable(
  "emails",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rfqId: uuid("rfq_id").references(() => rfqs.id),
    toEmails: text("to_emails").array().notNull(),
    ccEmails: text("cc_emails").array().default([]),
    subject: text("subject").notNull(),
    bodyText: text("body_text"),
    template: text("template"),
    threadId: text("thread_id"),
    messageId: text("message_id"),
    inReplyTo: text("in_reply_to"),
    mailtoUrl: text("mailto_url"),
    status: emailStatusEnum("status").default("opened").notNull(),
    deliveryStatus: emailDeliveryStatusEnum("delivery_status").default("pending"),
    smtpMessageId: text("smtp_message_id"),
    errorMessage: text("error_message"),
    sendMethod: emailSendMethodEnum("send_method"),
    sentAt: timestamp("sent_at").defaultNow().notNull(),
    sentBy: uuid("sent_by").references(() => users.id),
  },
  (table) => ({
    rfqIdx: index("emails_rfq_idx").on(table.rfqId),
    sentByIdx: index("emails_sent_by_idx").on(table.sentBy),
  }),
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    details: jsonb("details").$type<Record<string, unknown>>(),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("audit_log_user_idx").on(table.userId),
    entityTypeIdx: index("audit_log_entity_type_idx").on(table.entityType),
    createdAtIdx: index("audit_log_created_at_idx").on(table.createdAt),
  }),
);

export const companySettings = pgTable("company_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  tagline: text("tagline"),
  email: text("email"),
  website: text("website"),
  phone: text("phone"),
  city: text("city"),
  country: text("country"),
  docsLink: text("docs_link"),
  logoUrl: text("logo_url"),
  biddingEmail: text("bidding_email"),
  adminEmail: text("admin_email"),
  signatureTeamName: text("signature_team_name"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: uuid("updated_by").references(() => users.id),
});

export interface PackageItem {
  itemNo: string;
  description: string;
  unit: string;
  quantity: number;
  remarks?: string;
}

export interface SubmissionPrice {
  itemNo: string;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export const packages = pgTable("packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  rfqId: uuid("rfq_id").references(() => rfqs.id),
  name: text("name").notNull(),
  description: text("description"),
  items: jsonb("items").$type<PackageItem[]>().default([]),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const packageInvitations = pgTable(
  "package_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    packageId: uuid("package_id").references(() => packages.id).notNull(),
    supplierId: uuid("supplier_id").references(() => suppliers.id).notNull(),
    authCode: text("auth_code").notNull().unique(),
    shareLink: text("share_link").unique(),
    sentAt: timestamp("sent_at"),
    lastAccessedAt: timestamp("last_accessed_at"),
    status: invitationStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    authCodeIdx: uniqueIndex("package_invitations_auth_code_idx").on(table.authCode),
    packageIdx: index("package_invitations_package_idx").on(table.packageId),
    supplierIdx: index("package_invitations_supplier_idx").on(table.supplierId),
  }),
);

export const packageSubmissions = pgTable(
  "package_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invitationId: uuid("invitation_id").references(() => packageInvitations.id).notNull(),
    supplierId: uuid("supplier_id").references(() => suppliers.id).notNull(),
    packageId: uuid("package_id").references(() => packages.id).notNull(),
    revision: integer("revision").default(1).notNull(),
    prices: jsonb("prices").$type<SubmissionPrice[]>().default([]),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 }),
    currency: text("currency").default("SAR"),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    invitationIdx: index("package_submissions_invitation_idx").on(table.invitationId),
    packageIdx: index("package_submissions_package_idx").on(table.packageId),
    supplierIdx: index("package_submissions_supplier_idx").on(table.supplierId),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  rfqs: many(rfqs),
  suppliers: many(suppliers),
  emails: many(emails),
  auditLog: many(auditLog),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [suppliers.createdBy],
    references: [users.id],
  }),
  rfqSuppliers: many(rfqSuppliers),
  quotes: many(quotes),
  packageInvitations: many(packageInvitations),
  packageSubmissions: many(packageSubmissions),
}));

export const rfqsRelations = relations(rfqs, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [rfqs.createdBy],
    references: [users.id],
  }),
  awardedSupplier: one(suppliers, {
    fields: [rfqs.awardedSupplierId],
    references: [suppliers.id],
    relationName: "awardedSupplier",
  }),
  rfqSuppliers: many(rfqSuppliers),
  quotes: many(quotes),
  emails: many(emails),
  packages: many(packages),
}));

export const rfqSuppliersRelations = relations(rfqSuppliers, ({ one }) => ({
  rfq: one(rfqs, {
    fields: [rfqSuppliers.rfqId],
    references: [rfqs.id],
  }),
  supplier: one(suppliers, {
    fields: [rfqSuppliers.supplierId],
    references: [suppliers.id],
  }),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  rfq: one(rfqs, {
    fields: [quotes.rfqId],
    references: [rfqs.id],
  }),
  supplier: one(suppliers, {
    fields: [quotes.supplierId],
    references: [suppliers.id],
  }),
  reviewedByUser: one(users, {
    fields: [quotes.reviewedBy],
    references: [users.id],
  }),
  items: many(quoteItems),
}));

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteItems.quoteId],
    references: [quotes.id],
  }),
}));

export const emailsRelations = relations(emails, ({ one }) => ({
  rfq: one(rfqs, {
    fields: [emails.rfqId],
    references: [rfqs.id],
  }),
  sentByUser: one(users, {
    fields: [emails.sentBy],
    references: [users.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(users, {
    fields: [auditLog.userId],
    references: [users.id],
  }),
}));

export const companySettingsRelations = relations(companySettings, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [companySettings.updatedBy],
    references: [users.id],
  }),
}));

export const packagesRelations = relations(packages, ({ one, many }) => ({
  rfq: one(rfqs, {
    fields: [packages.rfqId],
    references: [rfqs.id],
  }),
  createdByUser: one(users, {
    fields: [packages.createdBy],
    references: [users.id],
  }),
  invitations: many(packageInvitations),
  submissions: many(packageSubmissions),
}));

export const packageInvitationsRelations = relations(packageInvitations, ({ one, many }) => ({
  package: one(packages, {
    fields: [packageInvitations.packageId],
    references: [packages.id],
  }),
  supplier: one(suppliers, {
    fields: [packageInvitations.supplierId],
    references: [suppliers.id],
  }),
  submissions: many(packageSubmissions),
}));

export const packageSubmissionsRelations = relations(packageSubmissions, ({ one }) => ({
  invitation: one(packageInvitations, {
    fields: [packageSubmissions.invitationId],
    references: [packageInvitations.id],
  }),
  supplier: one(suppliers, {
    fields: [packageSubmissions.supplierId],
    references: [suppliers.id],
  }),
  package: one(packages, {
    fields: [packageSubmissions.packageId],
    references: [packages.id],
  }),
}));
