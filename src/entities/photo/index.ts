import { z } from "zod";

export const PhotoSchema = z.object({
	id: z.string().uuid(),
	friendshipId: z.string().uuid().nullable(),
	photoUrl: z.string().url(),
	photoPath: z.string(),
	uploadedBy: z.string().uuid(),
	description: z.string().nullable(),
	createdAt: z.string(),
});

export type Photo = z.infer<typeof PhotoSchema>;

export const PhotoWithUsersSchema = PhotoSchema.extend({
	uploader: z.object({
		id: z.string().uuid(),
		name: z.string().nullable(),
		avatarUrl: z.string().nullable(),
	}),
	taggedUsers: z.array(
		z.object({
			id: z.string().uuid(),
			name: z.string().nullable(),
			avatarUrl: z.string().nullable(),
		}),
	),
});

export type PhotoWithUsers = z.infer<typeof PhotoWithUsersSchema>;

export const CreatePhotoSchema = z.object({
	uploadedBy: z.string().uuid(),
	photoUrl: z.string().url(),
	photoPath: z.string(),
	description: z.string().nullable().optional(),
	friendshipId: z.string().uuid().optional(),
});

export type CreatePhoto = z.infer<typeof CreatePhotoSchema>;

export const UpdatePhotoSchema = z.object({
	description: z.string().nullable().optional(),
});

export type UpdatePhoto = z.infer<typeof UpdatePhotoSchema>;

export const PhotoUserSchema = z.object({
	id: z.string().uuid(),
	photoId: z.string().uuid(),
	userId: z.string().uuid(),
	createdAt: z.string(),
});

export type PhotoUser = z.infer<typeof PhotoUserSchema>;
