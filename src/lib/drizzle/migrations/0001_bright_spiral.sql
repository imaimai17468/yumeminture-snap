CREATE TYPE "public"."communication_status_type" AS ENUM('office', 'social', 'available', 'busy');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "communication_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status_type" "communication_status_type" NOT NULL,
	"message" varchar(200),
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
	CONSTRAINT "communication_statuses_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id_1" uuid NOT NULL,
	"user_id_2" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
	CONSTRAINT "friendships_user_id_1_user_id_2_unique" UNIQUE("user_id_1","user_id_2")
);
--> statement-breakpoint
CREATE TABLE "organization_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"role" "membership_role" DEFAULT 'member' NOT NULL,
	"status" "membership_status" DEFAULT 'pending' NOT NULL,
	"joined_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
	CONSTRAINT "organization_memberships_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
	CONSTRAINT "organizations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "photo_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"photo_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
	CONSTRAINT "photo_users_photo_id_user_id_unique" UNIQUE("photo_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"friendship_id" uuid NOT NULL,
	"photo_url" text NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "communication_statuses" ADD CONSTRAINT "communication_statuses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_id_1_users_id_fk" FOREIGN KEY ("user_id_1") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_id_2_users_id_fk" FOREIGN KEY ("user_id_2") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photo_users" ADD CONSTRAINT "photo_users_photo_id_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photo_users" ADD CONSTRAINT "photo_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_friendship_id_friendships_id_fk" FOREIGN KEY ("friendship_id") REFERENCES "public"."friendships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "communication_statuses_user_id_idx" ON "communication_statuses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "communication_statuses_type_expires_idx" ON "communication_statuses" USING btree ("status_type","expires_at");--> statement-breakpoint
CREATE INDEX "friendships_user_id_1_idx" ON "friendships" USING btree ("user_id_1");--> statement-breakpoint
CREATE INDEX "friendships_user_id_2_idx" ON "friendships" USING btree ("user_id_2");--> statement-breakpoint
CREATE INDEX "organization_memberships_user_id_idx" ON "organization_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organization_memberships_org_status_idx" ON "organization_memberships" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "organization_memberships_org_role_idx" ON "organization_memberships" USING btree ("organization_id","role");--> statement-breakpoint
CREATE INDEX "photo_users_photo_id_idx" ON "photo_users" USING btree ("photo_id");--> statement-breakpoint
CREATE INDEX "photo_users_user_id_idx" ON "photo_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "photos_friendship_id_idx" ON "photos" USING btree ("friendship_id");--> statement-breakpoint
CREATE INDEX "photos_uploaded_by_idx" ON "photos" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "photos_created_at_idx" ON "photos" USING btree ("created_at");