CREATE TYPE "public"."activity_type" AS ENUM('friend_added', 'photo_uploaded', 'joined_organization', 'left_organization', 'status_changed', 'photo_tagged');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "activity_type" NOT NULL,
	"related_user_id" uuid,
	"related_photo_id" uuid,
	"related_organization_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_related_user_id_users_id_fk" FOREIGN KEY ("related_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_related_photo_id_photos_id_fk" FOREIGN KEY ("related_photo_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_related_organization_id_organizations_id_fk" FOREIGN KEY ("related_organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;