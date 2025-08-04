import { and, eq, sql } from "drizzle-orm";
import {
	type Activity,
	ActivitySchema,
	type ActivityWithUser,
	ActivityWithUserSchema,
	type CreateActivity,
} from "@/entities/activity";
import { db } from "@/lib/drizzle/db";
import { activities } from "@/lib/drizzle/schema";
import { AppError, tryCatch } from "@/lib/error-handling";
import { createClient } from "@/lib/supabase/server";

// Fetch timeline activities for the current user
export const fetchTimelineActivities = async (
	limit = 20,
	offset = 0,
): Promise<ActivityWithUser[]> => {
	return tryCatch(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new AppError("Authentication required", "unauthorized");
		}

		// Get activities from friends and self
		// 簡略化: 新規ユーザーの場合を考慮して、まず自分のアクティビティだけを取得
		const result = await db.execute<{
			id: string;
			user_id: string;
			type: string;
			related_user_id: string | null;
			related_photo_id: string | null;
			related_organization_id: string | null;
			metadata: Record<string, unknown> | null;
			created_at: Date;
			user_id_full: string;
			user_name: string | null;
			user_avatar_url: string | null;
			related_user_id_full: string | null;
			related_user_name: string | null;
			related_user_avatar_url: string | null;
		}>(sql`
			SELECT 
				a.*,
				u.id as user_id_full,
				u.name as user_name,
				u.avatar_url as user_avatar_url,
				ru.id as related_user_id_full,
				ru.name as related_user_name,
				ru.avatar_url as related_user_avatar_url
			FROM activities a
			INNER JOIN users u ON a.user_id = u.id
			LEFT JOIN users ru ON a.related_user_id = ru.id
			WHERE a.user_id = ${user.id}
				OR a.related_user_id = ${user.id}
				OR a.user_id IN (
					SELECT 
						CASE 
							WHEN user_id_1 = ${user.id} THEN user_id_2
							ELSE user_id_1
						END
					FROM friendships
					WHERE user_id_1 = ${user.id} OR user_id_2 = ${user.id}
				)
			ORDER BY a.created_at DESC
			LIMIT ${limit}
			OFFSET ${offset}
		`);

		if (!result || !Array.isArray(result)) {
			console.error("Unexpected query result:", result);
			return [];
		}

		// If no activities found, return empty array
		if (result.length === 0) {
			return [];
		}

		return result.map((row) => {
			const createdAt =
				row.created_at instanceof Date
					? row.created_at.toISOString()
					: new Date(row.created_at).toISOString();

			return ActivityWithUserSchema.parse({
				id: row.id,
				userId: row.user_id,
				type: row.type,
				relatedUserId: row.related_user_id,
				relatedPhotoId: row.related_photo_id,
				relatedOrganizationId: row.related_organization_id,
				metadata: row.metadata,
				createdAt,
				user: {
					id: row.user_id_full,
					name: row.user_name,
					avatarUrl: row.user_avatar_url,
				},
				relatedUser: row.related_user_id_full
					? {
							id: row.related_user_id_full,
							name: row.related_user_name,
							avatarUrl: row.related_user_avatar_url,
						}
					: null,
			});
		});
	}, "Failed to fetch timeline activities");
};

// Create a new activity
export const createActivity = async (
	data: CreateActivity,
): Promise<{ success: boolean; activity?: Activity; error?: string }> => {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { success: false, error: "Authentication required" };
	}

	try {
		const [newActivity] = await db
			.insert(activities)
			.values({
				userId: user.id,
				type: data.type,
				relatedUserId: data.relatedUserId || null,
				relatedPhotoId: data.relatedPhotoId || null,
				relatedOrganizationId: data.relatedOrganizationId || null,
				metadata: data.metadata || null,
			})
			.returning();

		const activity = ActivitySchema.parse({
			...newActivity,
			createdAt: newActivity.createdAt.toISOString(),
		});

		return { success: true, activity };
	} catch (error) {
		console.error("Activity creation error:", error);
		return { success: false, error: "Failed to create activity" };
	}
};

// Helper function to create friend added activities (for both users)
export const createFriendAddedActivities = async (
	userId1: string,
	userId2: string,
	friendshipId: string,
): Promise<void> => {
	try {
		await db.insert(activities).values([
			{
				userId: userId1,
				type: "friend_added",
				relatedUserId: userId2,
				metadata: { friendshipId },
			},
			{
				userId: userId2,
				type: "friend_added",
				relatedUserId: userId1,
				metadata: { friendshipId },
			},
		]);
	} catch (error) {
		console.error("Failed to create friend added activities:", error);
	}
};

// Delete an activity
export const deleteActivity = async (
	activityId: string,
): Promise<{ success: boolean; error?: string }> => {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { success: false, error: "Authentication required" };
	}

	try {
		await db
			.delete(activities)
			.where(
				and(eq(activities.id, activityId), eq(activities.userId, user.id)),
			);

		return { success: true };
	} catch (error) {
		console.error("Activity deletion error:", error);
		return { success: false, error: "Failed to delete activity" };
	}
};

// Helper function to create organization created activity
export const createOrganizationCreatedActivity = async (
	organizationId: string,
	organizationName: string,
): Promise<void> => {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return;
	}

	try {
		await db.insert(activities).values({
			userId: user.id,
			type: "organization_created",
			relatedOrganizationId: organizationId,
			metadata: { organizationId, organizationName },
		});
	} catch (error) {
		console.error("Failed to create organization created activity:", error);
	}
};

// Count photo uploads for a specific user
export const countUserPhotoUploads = async (
	userId: string,
): Promise<number> => {
	return tryCatch(async () => {
		const result = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(activities)
			.where(
				and(
					eq(activities.userId, userId),
					eq(activities.type, "photo_uploaded"),
				),
			);

		return result[0]?.count || 0;
	}, "Failed to count user photo uploads");
};

// Fetch activities for a specific user
export const fetchUserActivities = async (
	userId: string,
	limit = 20,
	offset = 0,
): Promise<ActivityWithUser[]> => {
	return tryCatch(async () => {
		const result = await db.execute<{
			id: string;
			user_id: string;
			type: string;
			related_user_id: string | null;
			related_photo_id: string | null;
			related_organization_id: string | null;
			metadata: Record<string, unknown> | null;
			created_at: Date;
			user_id_full: string;
			user_name: string | null;
			user_avatar_url: string | null;
			related_user_id_full: string | null;
			related_user_name: string | null;
			related_user_avatar_url: string | null;
		}>(sql`
			SELECT 
				a.*,
				u.id as user_id_full,
				u.name as user_name,
				u.avatar_url as user_avatar_url,
				ru.id as related_user_id_full,
				ru.name as related_user_name,
				ru.avatar_url as related_user_avatar_url
			FROM activities a
			INNER JOIN users u ON a.user_id = u.id
			LEFT JOIN users ru ON a.related_user_id = ru.id
			WHERE a.user_id = ${userId}
			ORDER BY a.created_at DESC
			LIMIT ${limit}
			OFFSET ${offset}
		`);

		if (!result || !Array.isArray(result)) {
			console.error("Unexpected query result:", result);
			return [];
		}

		if (result.length === 0) {
			return [];
		}

		return result.map((row) => {
			const createdAt =
				row.created_at instanceof Date
					? row.created_at.toISOString()
					: new Date(row.created_at).toISOString();

			return ActivityWithUserSchema.parse({
				id: row.id,
				userId: row.user_id,
				type: row.type,
				relatedUserId: row.related_user_id,
				relatedPhotoId: row.related_photo_id,
				relatedOrganizationId: row.related_organization_id,
				metadata: row.metadata,
				createdAt,
				user: {
					id: row.user_id_full,
					name: row.user_name,
					avatarUrl: row.user_avatar_url,
				},
				relatedUser: row.related_user_id_full
					? {
							id: row.related_user_id_full,
							name: row.related_user_name,
							avatarUrl: row.related_user_avatar_url,
						}
					: null,
			});
		});
	}, "Failed to fetch user activities");
};
