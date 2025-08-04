ALTER TYPE "public"."activity_type" ADD VALUE 'organization_created';--> statement-breakpoint
ALTER TABLE "photos" ALTER COLUMN "friendship_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "photo_path" text NOT NULL;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "description" text;