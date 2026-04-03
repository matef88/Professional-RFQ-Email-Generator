CREATE TYPE "public"."email_delivery_status" AS ENUM('pending', 'sent', 'delivered', 'failed', 'bounced');--> statement-breakpoint
CREATE TYPE "public"."email_send_method" AS ENUM('smtp', 'mailto');--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "delivery_status" "email_delivery_status" DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "smtp_message_id" text;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "error_message" text;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "send_method" "email_send_method";
