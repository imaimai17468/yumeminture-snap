import { and, eq, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
	type CreateFriendship,
	type Friendship,
	FriendshipSchema,
	type FriendshipWithUser,
	FriendshipWithUserSchema,
} from "@/entities/friendship";
import { createFriendAddedActivities } from "@/gateways/activity";
import { db } from "@/lib/drizzle/db";
import { friendships, users } from "@/lib/drizzle/schema";
import { AppError, tryCatch } from "@/lib/error-handling";
import { createClient } from "@/lib/supabase/server";

export const fetchUserFriendships = async (): Promise<Friendship[]> => {
	return tryCatch(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new AppError("Authentication required", "unauthorized");
		}

		const userFriendships = await db
			.select()
			.from(friendships)
			.where(
				or(eq(friendships.userId1, user.id), eq(friendships.userId2, user.id)),
			);

		return userFriendships.map((friendship) =>
			FriendshipSchema.parse({
				...friendship,
				createdAt: friendship.createdAt.toISOString(),
			}),
		);
	}, "Failed to fetch user friendships");
};

export const fetchFriendshipWithUser = async (
	targetUserId: string,
): Promise<Friendship | null> => {
	return tryCatch(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new AppError("Authentication required", "unauthorized");
		}

		const userId1 = user.id < targetUserId ? user.id : targetUserId;
		const userId2 = user.id < targetUserId ? targetUserId : user.id;

		const [friendship] = await db
			.select()
			.from(friendships)
			.where(
				and(eq(friendships.userId1, userId1), eq(friendships.userId2, userId2)),
			)
			.limit(1);

		if (!friendship) {
			return null;
		}

		return FriendshipSchema.parse({
			...friendship,
			createdAt: friendship.createdAt.toISOString(),
		});
	}, "Failed to fetch friendship with user");
};

export const createFriendship = async (
	data: CreateFriendship,
): Promise<{ success: boolean; friendship?: Friendship; error?: string }> => {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { success: false, error: "Authentication required" };
	}

	if (user.id === data.userId) {
		return { success: false, error: "Cannot be friends with yourself" };
	}

	// Order user IDs
	const userId1 = user.id < data.userId ? user.id : data.userId;
	const userId2 = user.id < data.userId ? data.userId : user.id;

	// Check existing friendship
	const [existingFriendship] = await db
		.select()
		.from(friendships)
		.where(
			and(eq(friendships.userId1, userId1), eq(friendships.userId2, userId2)),
		)
		.limit(1);

	if (existingFriendship) {
		return { success: false, error: "Already friends" };
	}

	try {
		const [newFriendship] = await db
			.insert(friendships)
			.values({
				userId1,
				userId2,
			})
			.returning();

		const friendship = FriendshipSchema.parse({
			...newFriendship,
			createdAt: newFriendship.createdAt.toISOString(),
		});

		// Create activity records for both users
		await createFriendAddedActivities(userId1, userId2, newFriendship.id);

		return { success: true, friendship };
	} catch (error) {
		console.error("Friend creation error:", error);
		return { success: false, error: "Failed to create friendship" };
	}
};

export const deleteFriendship = async (
	friendshipId: string,
): Promise<{ success: boolean; error?: string }> => {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { success: false, error: "Authentication required" };
	}

	// Only parties in the friendship can delete
	const [friendship] = await db
		.select()
		.from(friendships)
		.where(
			and(
				eq(friendships.id, friendshipId),
				or(eq(friendships.userId1, user.id), eq(friendships.userId2, user.id)),
			),
		)
		.limit(1);

	if (!friendship) {
		return { success: false, error: "Friendship not found" };
	}

	try {
		await db.delete(friendships).where(eq(friendships.id, friendshipId));

		return { success: true };
	} catch (error) {
		console.error("Friend deletion error:", error);
		return { success: false, error: "Failed to delete friendship" };
	}
};

export const createFriendshipIfNotExists = async (
	userId1: string,
	userId2: string,
): Promise<{ success: boolean; friendship?: Friendship; error?: string }> => {
	// 同じユーザー同士の友達関係は作成しない
	if (userId1 === userId2) {
		return { success: true };
	}

	// userId1 < userId2 となるように正規化
	const [smallerId, largerId] =
		userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

	try {
		// 既存の友達関係をチェック
		const existing = await db
			.select()
			.from(friendships)
			.where(
				and(
					eq(friendships.userId1, smallerId),
					eq(friendships.userId2, largerId),
				),
			)
			.limit(1);

		if (existing.length > 0) {
			return {
				success: true,
				friendship: FriendshipSchema.parse({
					...existing[0],
					createdAt: existing[0].createdAt.toISOString(),
				}),
			};
		}

		// 新しい友達関係を作成
		const [newFriendship] = await db
			.insert(friendships)
			.values({
				userId1: smallerId,
				userId2: largerId,
			})
			.returning();

		// アクティビティを作成
		await createFriendAddedActivities(smallerId, largerId, newFriendship.id);

		const friendship = FriendshipSchema.parse({
			...newFriendship,
			createdAt: newFriendship.createdAt.toISOString(),
		});

		return { success: true, friendship };
	} catch (error) {
		console.error("Failed to create friendship:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to create friendship",
		};
	}
};

export const fetchFriendships = fetchUserFriendships;

export const fetchFriendsOfFriends = async (): Promise<string[]> => {
	return tryCatch(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new AppError("Authentication required", "unauthorized");
		}

		// Query to get friends of friends
		const friendsOfFriends = await db.execute(sql`
		WITH direct_friends AS (
			SELECT 
				CASE 
					WHEN user_id_1 = ${user.id} THEN user_id_2
					ELSE user_id_1
				END as friend_id
			FROM friendships
			WHERE user_id_1 = ${user.id} OR user_id_2 = ${user.id}
		),
		friends_of_friends AS (
			SELECT DISTINCT
				CASE 
					WHEN f.user_id_1 = df.friend_id THEN f.user_id_2
					ELSE f.user_id_1
				END as fof_id
			FROM friendships f
			INNER JOIN direct_friends df ON (f.user_id_1 = df.friend_id OR f.user_id_2 = df.friend_id)
			WHERE 
				CASE 
					WHEN f.user_id_1 = df.friend_id THEN f.user_id_2
					ELSE f.user_id_1
				END != ${user.id}
		)
		SELECT fof_id 
		FROM friends_of_friends 
		WHERE fof_id NOT IN (SELECT friend_id FROM direct_friends)
	`);

		type FriendRow = { fof_id: string };
		const rows = (friendsOfFriends as unknown as { rows: FriendRow[] }).rows;
		return rows.map((row: FriendRow) => row.fof_id);
	}, "Failed to fetch friends of friends");
};

export const fetchUserFriendshipsWithUsers = async (): Promise<
	FriendshipWithUser[]
> => {
	return tryCatch(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new AppError("Authentication required", "unauthorized");
		}

		const user1 = alias(users, "user1");
		const user2 = alias(users, "user2");

		const result = await db
			.select({
				friendship: friendships,
				user1: user1,
				user2: user2,
			})
			.from(friendships)
			.innerJoin(user1, eq(friendships.userId1, user1.id))
			.innerJoin(user2, eq(friendships.userId2, user2.id))
			.where(
				or(eq(friendships.userId1, user.id), eq(friendships.userId2, user.id)),
			);

		return result.map((row) => {
			const isFriendUser1 = row.friendship.userId1 !== user.id;
			const friendUser = isFriendUser1 ? row.user1 : row.user2;

			return FriendshipWithUserSchema.parse({
				id: row.friendship.id,
				userId1: row.friendship.userId1,
				userId2: row.friendship.userId2,
				createdAt: row.friendship.createdAt.toISOString(),
				friend: {
					id: friendUser.id,
					name: friendUser.name,
					avatarUrl: friendUser.avatarUrl,
				},
			});
		});
	}, "Failed to fetch user friendships with users");
};

// Count friendships for a specific user
export const countUserFriendships = async (userId: string): Promise<number> => {
	return tryCatch(async () => {
		const result = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(friendships)
			.where(
				or(eq(friendships.userId1, userId), eq(friendships.userId2, userId)),
			);

		return result[0]?.count || 0;
	}, "Failed to count user friendships");
};

// Fetch friendships for a specific user
export const fetchFriendshipsForUser = async (
	userId: string,
): Promise<FriendshipWithUser[]> => {
	return tryCatch(async () => {
		const user1 = alias(users, "user1");
		const user2 = alias(users, "user2");

		const result = await db
			.select({
				friendship: friendships,
				user1: user1,
				user2: user2,
			})
			.from(friendships)
			.innerJoin(user1, eq(friendships.userId1, user1.id))
			.innerJoin(user2, eq(friendships.userId2, user2.id))
			.where(
				or(eq(friendships.userId1, userId), eq(friendships.userId2, userId)),
			);

		return result.map((row) => {
			const isFriendUser1 = row.friendship.userId1 !== userId;
			const friendUser = isFriendUser1 ? row.user1 : row.user2;

			return FriendshipWithUserSchema.parse({
				id: row.friendship.id,
				userId1: row.friendship.userId1,
				userId2: row.friendship.userId2,
				createdAt: row.friendship.createdAt.toISOString(),
				friend: {
					id: friendUser.id,
					name: friendUser.name,
					avatarUrl: friendUser.avatarUrl,
				},
			});
		});
	}, "Failed to fetch user friendships with users");
};
