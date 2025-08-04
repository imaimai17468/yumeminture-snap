import { sql } from "drizzle-orm";
import type { ActivityType, ActivityWithUser } from "@/entities/activity";
import { ActivityWithUserSchema } from "@/entities/activity";
import { db } from "@/lib/drizzle/db";
import { createClient } from "@/lib/supabase/server";

export const fetchTimelineActivitiesWithStatus = async (
	limit = 20,
	offset = 0,
): Promise<ActivityWithUser[]> => {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return [];
		}

		// Get activities from friends and self with current status
		const result = await db.execute<{
			id: string;
			user_id: string;
			type: ActivityType;
			related_user_id: string | null;
			related_photo_id: string | null;
			related_organization_id: string | null;
			metadata: unknown;
			created_at: Date | string;
			user_id_full: string;
			user_name: string | null;
			user_avatar_url: string | null;
			related_user_id_full: string | null;
			related_user_name: string | null;
			related_user_avatar_url: string | null;
			user_status_type: string | null;
			user_status_message: string | null;
		}>(sql`
			SELECT 
				a.*,
				u.id as user_id_full,
				u.name as user_name,
				u.avatar_url as user_avatar_url,
				ru.id as related_user_id_full,
				ru.name as related_user_name,
				ru.avatar_url as related_user_avatar_url,
				cs.status_type as user_status_type,
				cs.message as user_status_message
			FROM activities a
			INNER JOIN users u ON a.user_id = u.id
			LEFT JOIN users ru ON a.related_user_id = ru.id
			LEFT JOIN communication_statuses cs ON a.user_id = cs.user_id 
				AND (cs.expires_at IS NULL OR cs.expires_at >= NOW())
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
				currentStatus: row.user_status_type
					? {
							statusType: row.user_status_type as
								| "office"
								| "social"
								| "available"
								| "busy",
							message: row.user_status_message,
						}
					: null,
			});
		});
	} catch (error) {
		console.error("Failed to fetch timeline activities with status:", error);
		return [];
	}
};
