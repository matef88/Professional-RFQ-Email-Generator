ALTER TABLE "quotes" ADD COLUMN "scores" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "total_score" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "rfqs" ADD COLUMN "evaluation_criteria" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "rfqs" ADD COLUMN "awarded_supplier_id" uuid;--> statement-breakpoint
ALTER TABLE "rfqs" ADD COLUMN "awarded_at" timestamp;--> statement-breakpoint
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_awarded_supplier_id_suppliers_id_fk" FOREIGN KEY ("awarded_supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;