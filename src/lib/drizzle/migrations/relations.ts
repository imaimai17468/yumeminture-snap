import { relations } from "drizzle-orm/relations";
import {
	activities,
	communicationStatuses,
	friendships,
	notifications,
	organizationMemberships,
	organizations,
	photos,
	photoUsers,
	users,
} from "./schema";

export const friendshipsRelations = relations(friendships, ({ one, many }) => ({
	user_userId1: one(users, {
		fields: [friendships.userId1],
		references: [users.id],
		relationName: "friendships_userId1_users_id",
	}),
	user_userId2: one(users, {
		fields: [friendships.userId2],
		references: [users.id],
		relationName: "friendships_userId2_users_id",
	}),
	photos: many(photos),
}));

export const usersRelations = relations(users, ({ many }) => ({
	friendships_userId1: many(friendships, {
		relationName: "friendships_userId1_users_id",
	}),
	friendships_userId2: many(friendships, {
		relationName: "friendships_userId2_users_id",
	}),
	organizationMemberships: many(organizationMemberships),
	communicationStatuses: many(communicationStatuses),
	photoUsers: many(photoUsers),
	photos: many(photos),
	activities_relatedUserId: many(activities, {
		relationName: "activities_relatedUserId_users_id",
	}),
	activities_userId: many(activities, {
		relationName: "activities_userId_users_id",
	}),
	notifications_relatedUserId: many(notifications, {
		relationName: "notifications_relatedUserId_users_id",
	}),
	notifications_userId: many(notifications, {
		relationName: "notifications_userId_users_id",
	}),
}));

export const organizationMembershipsRelations = relations(
	organizationMemberships,
	({ one }) => ({
		organization: one(organizations, {
			fields: [organizationMemberships.organizationId],
			references: [organizations.id],
		}),
		user: one(users, {
			fields: [organizationMemberships.userId],
			references: [users.id],
		}),
	}),
);

export const organizationsRelations = relations(organizations, ({ many }) => ({
	organizationMemberships: many(organizationMemberships),
	activities: many(activities),
	notifications: many(notifications),
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

export const photosRelations = relations(photos, ({ one, many }) => ({
	photoUsers: many(photoUsers),
	friendship: one(friendships, {
		fields: [photos.friendshipId],
		references: [friendships.id],
	}),
	user: one(users, {
		fields: [photos.uploadedBy],
		references: [users.id],
	}),
	activities: many(activities),
	notifications: many(notifications),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
	organization: one(organizations, {
		fields: [activities.relatedOrganizationId],
		references: [organizations.id],
	}),
	photo: one(photos, {
		fields: [activities.relatedPhotoId],
		references: [photos.id],
	}),
	user_relatedUserId: one(users, {
		fields: [activities.relatedUserId],
		references: [users.id],
		relationName: "activities_relatedUserId_users_id",
	}),
	user_userId: one(users, {
		fields: [activities.userId],
		references: [users.id],
		relationName: "activities_userId_users_id",
	}),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
	organization: one(organizations, {
		fields: [notifications.relatedOrganizationId],
		references: [organizations.id],
	}),
	photo: one(photos, {
		fields: [notifications.relatedPhotoId],
		references: [photos.id],
	}),
	user_relatedUserId: one(users, {
		fields: [notifications.relatedUserId],
		references: [users.id],
		relationName: "notifications_relatedUserId_users_id",
	}),
	user_userId: one(users, {
		fields: [notifications.userId],
		references: [users.id],
		relationName: "notifications_userId_users_id",
	}),
}));
