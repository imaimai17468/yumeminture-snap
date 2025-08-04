import { z } from "zod";

export const FriendshipSchema = z.object({
	id: z.string().uuid(),
	userId1: z.string().uuid(),
	userId2: z.string().uuid(),
	createdAt: z.string(),
});

export type Friendship = z.infer<typeof FriendshipSchema>;

export const FriendshipWithUserSchema = FriendshipSchema.extend({
	friend: z.object({
		id: z.string().uuid(),
		name: z.string().nullable(),
		avatarUrl: z.string().nullable(),
	}),
});

export type FriendshipWithUser = z.infer<typeof FriendshipWithUserSchema>;

export const CreateFriendshipSchema = z.object({
	userId: z.string().uuid(),
});

export type CreateFriendship = z.infer<typeof CreateFriendshipSchema>;
