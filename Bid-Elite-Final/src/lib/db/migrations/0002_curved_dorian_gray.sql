ALTER TABLE "suppliers" ADD COLUMN "password" text;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "last_login" timestamp;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "is_registered" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "registration_token" text;