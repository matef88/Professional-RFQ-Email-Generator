CREATE TYPE "public"."email_status" AS ENUM('opened', 'recorded');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('submitted', 'under_review', 'shortlisted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."rfq_status" AS ENUM('draft', 'sent', 'open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."rfq_supplier_status" AS ENUM('pending', 'viewed', 'quoted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'member');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"details" jsonb,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"tagline" text,
	"email" text,
	"website" text,
	"phone" text,
	"city" text,
	"country" text,
	"docs_link" text,
	"logo_url" text,
	"bidding_email" text,
	"admin_email" text,
	"signature_team_name" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfq_id" uuid,
	"to_emails" text[] NOT NULL,
	"cc_emails" text[] DEFAULT '{}',
	"subject" text NOT NULL,
	"body_text" text,
	"template" text,
	"thread_id" text,
	"message_id" text,
	"in_reply_to" text,
	"mailto_url" text,
	"status" "email_status" DEFAULT 'opened' NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"sent_by" uuid
);
--> statement-breakpoint
CREATE TABLE "quote_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"description" text NOT NULL,
	"unit" text,
	"quantity" numeric(12, 2),
	"unit_price" numeric(12, 2),
	"total_price" numeric(12, 2),
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfq_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"cover_letter" text,
	"total_amount" numeric(12, 2),
	"currency" text DEFAULT 'USD',
	"delivery_days" integer,
	"validity_days" integer,
	"status" "quote_status" DEFAULT 'submitted' NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by" uuid,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "rfq_suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfq_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"status" "rfq_supplier_status" DEFAULT 'pending' NOT NULL,
	"email_sent_at" timestamp,
	"viewed_at" timestamp,
	"quoted_at" timestamp,
	"portal_token" text NOT NULL,
	CONSTRAINT "rfq_suppliers_portal_token_unique" UNIQUE("portal_token")
);
--> statement-breakpoint
CREATE TABLE "rfqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_name" text NOT NULL,
	"reference" text,
	"deadline" date,
	"template" text,
	"status" "rfq_status" DEFAULT 'draft' NOT NULL,
	"details" text,
	"package_link" text,
	"docs_link" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"contact_person" text,
	"address" text,
	"category" text,
	"notes" text,
	"portal_token" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "suppliers_portal_token_unique" UNIQUE("portal_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" "user_role" DEFAULT 'member' NOT NULL,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_rfq_id_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfqs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_sent_by_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_rfq_id_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfqs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_suppliers" ADD CONSTRAINT "rfq_suppliers_rfq_id_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfqs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_suppliers" ADD CONSTRAINT "rfq_suppliers_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_user_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_entity_type_idx" ON "audit_log" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "emails_rfq_idx" ON "emails" USING btree ("rfq_id");--> statement-breakpoint
CREATE INDEX "emails_sent_by_idx" ON "emails" USING btree ("sent_by");--> statement-breakpoint
CREATE INDEX "quotes_rfq_idx" ON "quotes" USING btree ("rfq_id");--> statement-breakpoint
CREATE INDEX "quotes_supplier_idx" ON "quotes" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "rfq_suppliers_rfq_idx" ON "rfq_suppliers" USING btree ("rfq_id");--> statement-breakpoint
CREATE INDEX "rfq_suppliers_supplier_idx" ON "rfq_suppliers" USING btree ("supplier_id");--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_email_idx" ON "suppliers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "suppliers_portal_token_idx" ON "suppliers" USING btree ("portal_token");