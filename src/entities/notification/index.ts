import { z } from "zod";

export const NotificationTypeSchema = z.enum([
	"join_request",
	"join_approved",
	"join_rejected",
	"photo_tagged",
	"new_friend",
	"member_removed",
	"role_changed",
]);

export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationSchema = z.object({
	id: z.string().uuid(),
	userId: z.string().uuid(),
	type: NotificationTypeSchema,
	title: z.string(),
	message: z.string().nullable(),
	relatedUserId: z.string().uuid().nullable(),
	relatedOrganizationId: z.string().uuid().nullable(),
	relatedPhotoId: z.string().uuid().nullable(),
	isRead: z.boolean(),
	createdAt: z.date(),
});

export type Notification = z.infer<typeof NotificationSchema>;

export const NotificationWithRelationsSchema = NotificationSchema.extend({
	relatedUser: z
		.object({
			id: z.string().uuid(),
			name: z.string().nullable(),
			avatarUrl: z.string().nullable(),
		})
		.nullable(),
	relatedOrganization: z
		.object({
			id: z.string().uuid(),
			name: z.string(),
		})
		.nullable(),
	relatedPhoto: z
		.object({
			id: z.string().uuid(),
			photoUrl: z.string(),
		})
		.nullable(),
});

export type NotificationWithRelations = z.infer<
	typeof NotificationWithRelationsSchema
>;
