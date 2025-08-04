import { relations, sql } from "drizzle-orm";
import {
	boolean,
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

// Enums
export const membershipRoleEnum = pgEnum("membership_role", [
	"admin",
	"member",
]);
export const membershipStatusEnum = pgEnum("membership_status", [
	"pending",
	"approved",
	"rejected",
]);
export const communicationStatusTypeEnum = pgEnum("communication_status_type", [
	"office",
	"social",
	"available",
	"busy",
]);
export const approvalMethodEnum = pgEnum("approval_method", [
	"manual",
	"auto",
	"domain",
]);

// Supabaseで既に作成されているusersテーブルの定義
export const users = pgTable("users", {
	id: uuid("id").primaryKey(),
	name: text("name"),
	avatarUrl: text("avatar_url"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.default(sql`TIMEZONE('utc', NOW())`),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.default(sql`TIMEZONE('utc', NOW())`),
});

// 組織テーブル
export const organizations = pgTable("organizations", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 200 }).notNull().unique(),
	description: text("description"),
	approvalMethod: approvalMethodEnum("approval_method").default("manual"),
	approvalDomains: jsonb("approval_domains").$type<string[]>().default([]),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.default(sql`TIMEZONE('utc', NOW())`),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.default(sql`TIMEZONE('utc', NOW())`),
});

// 組織メンバーシップテーブル
export const organizationMemberships = pgTable(
	"organization_memberships",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id")
			.notNull()
			.unique()
			.references(() => users.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		role: membershipRoleEnum("role").notNull().default("member"),
		status: membershipStatusEnum("status").notNull().default("pending"),
		joinedAt: timestamp("joined_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.default(sql`TIMEZONE('utc', NOW())`),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.default(sql`TIMEZONE('utc', NOW())`),
	},
	(table) => ({
		userIdIdx: index("organization_memberships_user_id_idx").on(table.userId),
		orgStatusIdx: index("organization_memberships_org_status_idx").on(
			table.organizationId,
			table.status,
		),
		orgRoleIdx: index("organization_memberships_org_role_idx").on(
			table.organizationId,
			table.role,
		),
	}),
);

// 友達関係テーブル
export const friendships = pgTable(
	"friendships",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId1: uuid("user_id_1")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		userId2: uuid("user_id_2")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.default(sql`TIMEZONE('utc', NOW())`),
	},
	(table) => ({
		uniqueFriendship: unique().on(table.userId1, table.userId2),
		userId1Idx: index("friendships_user_id_1_idx").on(table.userId1),
		userId2Idx: index("friendships_user_id_2_idx").on(table.userId2),
	}),
);

// 写真テーブル
export const photos = pgTable(
	"photos",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		friendshipId: uuid("friendship_id").references(() => friendships.id, {
			onDelete: "cascade",
		}),
		photoUrl: text("photo_url").notNull(),
		photoPath: text("photo_path").notNull(),
		uploadedBy: uuid("uploaded_by")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		description: text("description"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.default(sql`TIMEZONE('utc', NOW())`),
	},
	(table) => ({
		friendshipIdIdx: index("photos_friendship_id_idx").on(table.friendshipId),
		uploadedByIdx: index("photos_uploaded_by_idx").on(table.uploadedBy),
		createdAtIdx: index("photos_created_at_idx").on(table.createdAt),
	}),
);

// 写真内のユーザーテーブル（中間テーブル）
export const photoUsers = pgTable(
	"photo_users",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		photoId: uuid("photo_id")
			.notNull()
			.references(() => photos.id, { onDelete: "cascade" }),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.default(sql`TIMEZONE('utc', NOW())`),
	},
	(table) => ({
		uniquePhotoUser: unique().on(table.photoId, table.userId),
		photoIdIdx: index("photo_users_photo_id_idx").on(table.photoId),
		userIdIdx: index("photo_users_user_id_idx").on(table.userId),
	}),
);

// コミュニケーション状態テーブル
export const communicationStatuses = pgTable(
	"communication_statuses",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id")
			.notNull()
			.unique()
			.references(() => users.id, { onDelete: "cascade" }),
		statusType: communicationStatusTypeEnum("status_type").notNull(),
		message: varchar("message", { length: 200 }),
		expiresAt: timestamp("expires_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.default(sql`TIMEZONE('utc', NOW())`),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.default(sql`TIMEZONE('utc', NOW())`),
	},
	(table) => ({
		userIdIdx: index("communication_statuses_user_id_idx").on(table.userId),
		statusTypeExpiresAtIdx: index("communication_statuses_type_expires_idx").on(
			table.statusType,
			table.expiresAt,
		),
	}),
);

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
	organizationMembership: one(organizationMemberships, {
		fields: [users.id],
		references: [organizationMemberships.userId],
	}),
	friendshipsAsUser1: many(friendships, {
		relationName: "friendshipsAsUser1",
	}),
	friendshipsAsUser2: many(friendships, {
		relationName: "friendshipsAsUser2",
	}),
	uploadedPhotos: many(photos),
	photoAppearances: many(photoUsers),
	communicationStatus: one(communicationStatuses, {
		fields: [users.id],
		references: [communicationStatuses.userId],
	}),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
	memberships: many(organizationMemberships),
}));

export const organizationMembershipsRelations = relations(
	organizationMemberships,
	({ one }) => ({
		user: one(users, {
			fields: [organizationMemberships.userId],
			references: [users.id],
		}),
		organization: one(organizations, {
			fields: [organizationMemberships.organizationId],
			references: [organizations.id],
		}),
	}),
);

export const friendshipsRelations = relations(friendships, ({ one, many }) => ({
	user1: one(users, {
		fields: [friendships.userId1],
		references: [users.id],
		relationName: "friendshipsAsUser1",
	}),
	user2: one(users, {
		fields: [friendships.userId2],
		references: [users.id],
		relationName: "friendshipsAsUser2",
	}),
	photos: many(photos),
}));

export const photosRelations = relations(photos, ({ one, many }) => ({
	friendship: one(friendships, {
		fields: [photos.friendshipId],
		references: [friendships.id],
	}),
	uploadedBy: one(users, {
		fields: [photos.uploadedBy],
		references: [users.id],
	}),
	photoUsers: many(photoUsers),
}));

export const photoUsersRelations = relations(photoUsers, ({ one }) => ({
	photo: one(photos, {
		fields: [photoUsers.photoId],
		references: [photos.id],
	}),
	user: one(users, {
		fields: [photoUsers.userId],
		references: [users.id],
	}),
}));

export const communicationStatusesRelations = relations(
	communicationStatuses,
	({ one }) => ({
		user: one(users, {
			fields: [communicationStatuses.userId],
			references: [users.id],
		}),
	}),
);

// Activity types enum
export const activityTypeEnum = pgEnum("activity_type", [
	"friend_added",
	"photo_uploaded",
	"joined_organization",
	"left_organization",
	"status_changed",
	"photo_tagged",
	"organization_created",
]);

// Notification types enum
export const notificationTypeEnum = pgEnum("notification_type", [
	"join_request",
	"join_approved",
	"join_rejected",
	"photo_tagged",
	"new_friend",
	"member_removed",
	"role_changed",
]);

// Activities table
export const activities = pgTable("activities", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	type: activityTypeEnum("type").notNull(),
	relatedUserId: uuid("related_user_id").references(() => users.id, {
		onDelete: "cascade",
	}),
	relatedPhotoId: uuid("related_photo_id").references(() => photos.id, {
		onDelete: "cascade",
	}),
	relatedOrganizationId: uuid("related_organization_id").references(
		() => organizations.id,
		{ onDelete: "cascade" },
	),
	metadata: jsonb("metadata"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.default(sql`TIMEZONE('utc', NOW())`),
});

export const activitiesRelations = relations(activities, ({ one }) => ({
	user: one(users, {
		fields: [activities.userId],
		references: [users.id],
	}),
	relatedUser: one(users, {
		fields: [activities.relatedUserId],
		references: [users.id],
	}),
	relatedPhoto: one(photos, {
		fields: [activities.relatedPhotoId],
		references: [photos.id],
	}),
	relatedOrganization: one(organizations, {
		fields: [activities.relatedOrganizationId],
		references: [organizations.id],
	}),
}));

// Notifications table
export const notifications = pgTable(
	"notifications",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		type: notificationTypeEnum("type").notNull(),
		title: text("title").notNull(),
		message: text("message"),
		relatedUserId: uuid("related_user_id").references(() => users.id, {
			onDelete: "cascade",
		}),
		relatedOrganizationId: uuid("related_organization_id").references(
			() => organizations.id,
			{ onDelete: "cascade" },
		),
		relatedPhotoId: uuid("related_photo_id").references(() => photos.id, {
			onDelete: "cascade",
		}),
		isRead: boolean("is_read").notNull().default(false),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.default(sql`TIMEZONE('utc', NOW())`),
	},
	(table) => ({
		userIdIdx: index("idx_notifications_user_id").on(table.userId),
		createdAtIdx: index("idx_notifications_created_at").on(table.createdAt),
		isReadIdx: index("idx_notifications_is_read").on(table.isRead),
	}),
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id],
	}),
	relatedUser: one(users, {
		fields: [notifications.relatedUserId],
		references: [users.id],
	}),
	relatedOrganization: one(organizations, {
		fields: [notifications.relatedOrganizationId],
		references: [organizations.id],
	}),
	relatedPhoto: one(photos, {
		fields: [notifications.relatedPhotoId],
		references: [photos.id],
	}),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type OrganizationMembership =
	typeof organizationMemberships.$inferSelect;
export type NewOrganizationMembership =
	typeof organizationMemberships.$inferInsert;
export type Friendship = typeof friendships.$inferSelect;
export type NewFriendship = typeof friendships.$inferInsert;
export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;
export type PhotoUser = typeof photoUsers.$inferSelect;
export type NewPhotoUser = typeof photoUsers.$inferInsert;
export type CommunicationStatus = typeof communicationStatuses.$inferSelect;
export type NewCommunicationStatus = typeof communicationStatuses.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

// Enum types
export type ActivityType = (typeof activityTypeEnum.enumValues)[number];
