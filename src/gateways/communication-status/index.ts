import { and, eq, gte, isNull, or, sql } from "drizzle-orm";
import {
	type CommunicationStatus,
	CommunicationStatusSchema,
	type CommunicationStatusWithUser,
	CommunicationStatusWithUserSchema,
	type CreateCommunicationStatus,
	type UpdateCommunicationStatus,
} from "@/entities/communication-status";
import { createActivity } from "@/gateways/activity";
import { db } from "@/lib/drizzle/db";
import { communicationStatuses } from "@/lib/drizzle/schema";
import { AppError, tryCatch } from "@/lib/error-handling";
import { createClient } from "@/lib/supabase/server";

// Helper function to parse status from database row
const parseStatus = (status: {
	id: string;
	userId: string;
	statusType: "office" | "social" | "available" | "busy";
	message: string | null;
	expiresAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}): CommunicationStatus => {
	return CommunicationStatusSchema.parse({
		...status,
		message: status.message || null,
		expiresAt: status.expiresAt?.toISOString() || null,
		createdAt: status.createdAt.toISOString(),
		updatedAt: status.updatedAt.toISOString(),
	});
};

// Helper function to get current user
const getCurrentUser = async () => {
	return tryCatch(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			throw new AppError("Authentication required", "unauthorized");
		}
		return user;
	}, "Failed to get current user");
};

export const fetchUserStatus =
	async (): Promise<CommunicationStatus | null> => {
		return tryCatch(async () => {
			const user = await getCurrentUser();
			if (!user) {
				throw new AppError("Authentication required", "unauthorized");
			}

			const [status] = await db
				.select()
				.from(communicationStatuses)
				.where(
					and(
						eq(communicationStatuses.userId, user.id),
						or(
							isNull(communicationStatuses.expiresAt),
							gte(communicationStatuses.expiresAt, new Date()),
						),
					),
				)
				.limit(1);

			if (!status) {
				return null;
			}

			return parseStatus(status);
		}, "Failed to fetch user status");
	};

export const fetchVisibleStatuses = async (): Promise<
	CommunicationStatusWithUser[]
> => {
	return tryCatch(async () => {
		const user = await getCurrentUser();
		if (!user) {
			throw new AppError("Authentication required", "unauthorized");
		}

		// Get status of friends and friends of friends
		const visibleStatuses = await db.execute(sql`
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
		),
		visible_users AS (
			SELECT friend_id as user_id FROM direct_friends
			UNION
			SELECT fof_id as user_id FROM friends_of_friends
			UNION
			SELECT ${user.id} as user_id
		)
		SELECT cs.*, u.name as user_name, u.avatar_url as user_avatar_url
		FROM communication_statuses cs
		INNER JOIN visible_users vu ON cs.user_id = vu.user_id
		INNER JOIN users u ON cs.user_id = u.id
		WHERE cs.expires_at IS NULL OR cs.expires_at >= NOW()
		ORDER BY cs.updated_at DESC
	`);

		type StatusRow = {
			id: string;
			user_id: string;
			status_type: string;
			message: string | null;
			expires_at: Date | null;
			created_at: Date;
			updated_at: Date;
			user_name: string | null;
			user_avatar_url: string | null;
		};
		const rows = (visibleStatuses as unknown as { rows: StatusRow[] }).rows;
		return rows.map((status: StatusRow) =>
			CommunicationStatusWithUserSchema.parse({
				id: status.id,
				userId: status.user_id,
				statusType: status.status_type,
				message: status.message,
				expiresAt: status.expires_at?.toISOString() || null,
				createdAt: status.created_at.toISOString(),
				updatedAt: status.updated_at.toISOString(),
				user: {
					id: status.user_id,
					name: status.user_name,
					avatarUrl: status.user_avatar_url,
				},
			}),
		);
	}, "Failed to fetch visible statuses");
};

export const createOrUpdateStatus = async (
	data: CreateCommunicationStatus,
): Promise<{
	success: boolean;
	status?: CommunicationStatus;
	error?: string;
}> => {
	const user = await getCurrentUser();
	if (!user) {
		return { success: false, error: "Authentication required" };
	}

	try {
		// Check existing status
		const [existingStatus] = await db
			.select()
			.from(communicationStatuses)
			.where(eq(communicationStatuses.userId, user.id))
			.limit(1);

		let result: typeof communicationStatuses.$inferSelect;

		if (existingStatus) {
			// Update
			[result] = await db
				.update(communicationStatuses)
				.set({
					statusType: data.statusType,
					message: data.message || null,
					expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
					updatedAt: new Date(),
				})
				.where(eq(communicationStatuses.userId, user.id))
				.returning();
		} else {
			// Create
			[result] = await db
				.insert(communicationStatuses)
				.values({
					userId: user.id,
					statusType: data.statusType,
					message: data.message || null,
					expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
				})
				.returning();
		}

		const status = parseStatus(result);

		// Create activity for status change
		await createActivity({
			type: "status_changed",
			metadata: {
				previousStatus: existingStatus?.statusType,
				newStatus: data.statusType,
				statusMessage: data.message,
				statusType: data.statusType,
			},
		});

		return { success: true, status };
	} catch (error) {
		console.error("Status update error:", error);
		return { success: false, error: "Failed to update status" };
	}
};

export const updateStatus = async (
	data: UpdateCommunicationStatus,
): Promise<{
	success: boolean;
	status?: CommunicationStatus;
	error?: string;
}> => {
	const user = await getCurrentUser();
	if (!user) {
		return { success: false, error: "Authentication required" };
	}

	try {
		const updateData: {
			updatedAt: Date;
			statusType?: "office" | "social" | "available" | "busy";
			message?: string | null;
			expiresAt?: Date | null;
		} = {
			updatedAt: new Date(),
		};

		if (data.statusType !== undefined) {
			updateData.statusType = data.statusType;
		}
		if (data.message !== undefined) {
			updateData.message = data.message;
		}
		if (data.expiresAt !== undefined) {
			updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
		}

		const [result] = await db
			.update(communicationStatuses)
			.set(updateData)
			.where(eq(communicationStatuses.userId, user.id))
			.returning();

		if (!result) {
			return { success: false, error: "Status not found" };
		}

		const status = parseStatus(result);

		return { success: true, status };
	} catch (error) {
		console.error("Status update error:", error);
		return { success: false, error: "Failed to update status" };
	}
};

export const deleteStatus = async (): Promise<{
	success: boolean;
	error?: string;
}> => {
	return tryCatch(async () => {
		const user = await getCurrentUser();
		if (!user) {
			throw new AppError("Authentication required", "unauthorized");
		}

		await db
			.delete(communicationStatuses)
			.where(eq(communicationStatuses.userId, user.id));

		return { success: true };
	}, "Failed to delete status").catch(() => {
		return { success: false, error: "Failed to delete status" };
	});
};
