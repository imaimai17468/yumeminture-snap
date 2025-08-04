import { sql } from "drizzle-orm";
import {
	boolean,
	foreignKey,
	index,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const activityType = pgEnum("activity_type", [
	"friend_added",
	"photo_uploaded",
	"joined_organization",
	"left_organization",
	"status_changed",
	"photo_tagged",
	"organization_created",
]);
export const approvalMethod = pgEnum("approval_method", [
	"manual",
	"auto",
	"domain",
]);
export const communicationStatusType = pgEnum("communication_status_type", [
	"office",
	"social",
	"available",
	"busy",
]);
export const membershipRole = pgEnum("membership_role", ["admin", "member"]);
export const membershipStatus = pgEnum("membership_status", [
	"pending",
	"approved",
	"rejected",
]);
export const notificationType = pgEnum("notification_type", [
	"join_request",
	"join_approved",
	"join_rejected",
	"photo_tagged",
	"new_friend",
	"member_removed",
	"role_changed",
]);

export const users = pgTable("users", {
	id: uuid().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
		.default(sql`timezone('utc'::text, now())`)
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
		.default(sql`timezone('utc'::text, now())`)
		.notNull(),
	name: text(),
	avatarUrl: text("avatar_url"),
});

export const organizations = pgTable(
	"organizations",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		name: varchar({ length: 200 }).notNull(),
		description: text(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.default(sql`timezone('utc'::text, now())`)
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.default(sql`timezone('utc'::text, now())`)
			.notNull(),
		approvalMethod: approvalMethod("approval_method")
			.default("manual")
			.notNull(),
		approvalDomains: jsonb("approval_domains").default([]),
	},
	(table) => [unique("organizations_name_unique").on(table.name)],
);

export const friendships = pgTable(
	"friendships",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		userId1: uuid("user_id_1").notNull(),
		userId2: uuid("user_id_2").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.default(sql`timezone('utc'::text, now())`)
			.notNull(),
	},
	(table) => [
		index("friendships_user_id_1_idx").using(
			"btree",
			table.userId1.asc().nullsLast().op("uuid_ops"),
		),
		index("friendships_user_id_2_idx").using(
			"btree",
			table.userId2.asc().nullsLast().op("uuid_ops"),
		),
		foreignKey({
			columns: [table.userId1],
			foreignColumns: [users.id],
			name: "friendships_user_id_1_users_id_fk",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.userId2],
			foreignColumns: [users.id],
			name: "friendships_user_id_2_users_id_fk",
		}).onDelete("cascade"),
		unique("friendships_user_id_1_user_id_2_unique").on(
			table.userId1,
			table.userId2,
		),
	],
);

export const organizationMemberships = pgTable(
	"organization_memberships",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		userId: uuid("user_id").notNull(),
		organizationId: uuid("organization_id").notNull(),
		role: membershipRole().default("member").notNull(),
		status: membershipStatus().default("pending").notNull(),
		joinedAt: timestamp("joined_at", { withTimezone: true, mode: "string" }),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.default(sql`timezone('utc'::text, now())`)
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.default(sql`timezone('utc'::text, now())`)
			.notNull(),
	},
	(table) => [
		index("organization_memberships_org_role_idx").using(
			"btree",
			table.organizationId.asc().nullsLast().op("enum_ops"),
			table.role.asc().nullsLast().op("uuid_ops"),
		),
		index("organization_memberships_org_status_idx").using(
			"btree",
			table.organizationId.asc().nullsLast().op("enum_ops"),
			table.status.asc().nullsLast().op("uuid_ops"),
		),
		index("organization_memberships_user_id_idx").using(
			"btree",
			table.userId.asc().nullsLast().op("uuid_ops"),
		),
		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "organization_memberships_organization_id_organizations_id_fk",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "organization_memberships_user_id_users_id_fk",
		}).onDelete("cascade"),
		unique("organization_memberships_user_id_unique").on(table.userId),
	],
);

export const communicationStatuses = pgTable(
	"communication_statuses",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		userId: uuid("user_id").notNull(),
		statusType: communicationStatusType("status_type").notNull(),
		message: varchar({ length: 200 }),
		expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.default(sql`timezone('utc'::text, now())`)
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.default(sql`timezone('utc'::text, now())`)
			.notNull(),
	},
	(table) => [
		index("communication_statuses_type_expires_idx").using(
			"btree",
			table.statusType.asc().nullsLast().op("timestamptz_ops"),
			table.expiresAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index("communication_statuses_user_id_idx").using(
			"btree",
			table.userId.asc().nullsLast().op("uuid_ops"),
		),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "communication_statuses_user_id_users_id_fk",
		}).onDelete("cascade"),
		unique("communication_statuses_user_id_unique").on(table.userId),
	],
);

export const photoUsers = pgTable(
	"photo_users",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		photoId: uuid("photo_id").notNull(),
		userId: uuid("user_id").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.default(sql`timezone('utc'::text, now())`)
			.notNull(),
	},
	(table) => [
		index("photo_users_photo_id_idx").using(
			"btree",
			table.photoId.asc().nullsLast().op("uuid_ops"),
		),
		index("photo_users_user_id_idx").using(
			"btree",
			table.userId.asc().nullsLast().op("uuid_ops"),
		),
		foreignKey({
			columns: [table.photoId],
			foreignColumns: [photos.id],
			name: "photo_users_photo_id_photos_id_fk",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "photo_users_user_id_users_id_fk",
		}).onDelete("cascade"),
		unique("photo_users_photo_id_user_id_unique").on(
			table.photoId,
			table.userId,
		),
	],
);

export const photos = pgTable(
	"photos",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		friendshipId: uuid("friendship_id"),
		photoUrl: text("photo_url").notNull(),
		uploadedBy: uuid("uploaded_by").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.default(sql`timezone('utc'::text, now())`)
			.notNull(),
		photoPath: text("photo_path").notNull(),
		description: text(),
	},
	(table) => [
		index("photos_created_at_idx").using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index("photos_friendship_id_idx").using(
			"btree",
			table.friendshipId.asc().nullsLast().op("uuid_ops"),
		),
		index("photos_uploaded_by_idx").using(
			"btree",
			table.uploadedBy.asc().nullsLast().op("uuid_ops"),
		),
		foreignKey({
			columns: [table.friendshipId],
			foreignColumns: [friendships.id],
			name: "photos_friendship_id_friendships_id_fk",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [users.id],
			name: "photos_uploaded_by_users_id_fk",
		}).onDelete("cascade"),
	],
);

export const activities = pgTable(
	"activities",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		userId: uuid("user_id").notNull(),
		type: activityType().notNull(),
		relatedUserId: uuid("related_user_id"),
		relatedPhotoId: uuid("related_photo_id"),
		relatedOrganizationId: uuid("related_organization_id"),
		metadata: jsonb(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.default(sql`timezone('utc'::text, now())`)
			.notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.relatedOrganizationId],
			foreignColumns: [organizations.id],
			name: "activities_related_organization_id_organizations_id_fk",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.relatedPhotoId],
			foreignColumns: [photos.id],
			name: "activities_related_photo_id_photos_id_fk",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.relatedUserId],
			foreignColumns: [users.id],
			name: "activities_related_user_id_users_id_fk",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "activities_user_id_users_id_fk",
		}).onDelete("cascade"),
	],
);

export const notifications = pgTable(
	"notifications",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		userId: uuid("user_id").notNull(),
		type: notificationType().notNull(),
		title: text().notNull(),
		message: text(),
		relatedUserId: uuid("related_user_id"),
		relatedOrganizationId: uuid("related_organization_id"),
		relatedPhotoId: uuid("related_photo_id"),
		isRead: boolean("is_read").default(false).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.default(sql`timezone('utc'::text, now())`)
			.notNull(),
	},
	(table) => [
		index("idx_notifications_created_at").using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index("idx_notifications_is_read").using(
			"btree",
			table.isRead.asc().nullsLast().op("bool_ops"),
		),
		index("idx_notifications_user_id").using(
			"btree",
			table.userId.asc().nullsLast().op("uuid_ops"),
		),
		foreignKey({
			columns: [table.relatedOrganizationId],
			foreignColumns: [organizations.id],
			name: "notifications_related_organization_id_organizations_id_fk",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.relatedPhotoId],
			foreignColumns: [photos.id],
			name: "notifications_related_photo_id_photos_id_fk",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.relatedUserId],
			foreignColumns: [users.id],
			name: "notifications_related_user_id_users_id_fk",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_users_id_fk",
		}).onDelete("cascade"),
	],
);
