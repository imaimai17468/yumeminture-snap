CREATE TYPE "public"."approval_method" AS ENUM('manual', 'auto', 'domain');--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "approval_method" "approval_method" DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "approval_domains" jsonb DEFAULT '[]'::jsonb;