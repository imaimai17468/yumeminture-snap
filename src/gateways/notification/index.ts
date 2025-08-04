import { and, desc, eq, sql } from "drizzle-orm";
import {
	type Notification,
	NotificationSchema,
	type NotificationWithRelations,
	NotificationWithRelationsSchema,
} from "@/entities/notification";
import { db } from "@/lib/drizzle/db";
import {
	notifications,
	organizations,
	photos,
	users,
} from "@/lib/drizzle/schema";
import { AppError, tryCatch } from "@/lib/error-handling";
import { createClient } from "@/lib/supabase/server";

export const fetchUserNotifications = async (
	userId: string,
	page = 1,
	limit = 20,
): Promise<{
	notifications: NotificationWithRelations[];
	totalCount: number;
	currentPage: number;
	totalPages: number;
}> => {
	return tryCatch(async () => {
		// 認証チェック
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new AppError("Authentication required", "unauthorized");
		}

		// 別のユーザーの通知を取得しようとしている場合はエラー
		if (user.id !== userId) {
			throw new AppError("Forbidden", "forbidden");
		}

		const offset = (page - 1) * limit;

		// Get total count
		const [{ count }] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(notifications)
			.where(eq(notifications.userId, userId));

		// Get paginated notifications
		const result = await db
			.select({
				notification: notifications,
				relatedUser: {
					id: users.id,
					name: users.name,
					avatarUrl: users.avatarUrl,
				},
				relatedOrganization: {
					id: organizations.id,
					name: organizations.name,
				},
				relatedPhoto: {
					id: photos.id,
					photoUrl: photos.photoUrl,
				},
			})
			.from(notifications)
			.leftJoin(users, eq(notifications.relatedUserId, users.id))
			.leftJoin(
				organizations,
				eq(notifications.relatedOrganizationId, organizations.id),
			)
			.leftJoin(photos, eq(notifications.relatedPhotoId, photos.id))
			.where(eq(notifications.userId, userId))
			.orderBy(desc(notifications.createdAt))
			.limit(limit)
			.offset(offset);

		const notificationList = result.map((row) =>
			NotificationWithRelationsSchema.parse({
				...row.notification,
				relatedUser: row.relatedUser,
				relatedOrganization: row.relatedOrganization,
				relatedPhoto: row.relatedPhoto,
			}),
		);

		return {
			notifications: notificationList,
			totalCount: count,
			currentPage: page,
			totalPages: Math.ceil(count / limit),
		};
	}, "Failed to fetch user notifications");
};

export const fetchUnreadNotificationCount = async (
	userId: string,
): Promise<number> => {
	return tryCatch(async () => {
		// 認証チェック
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new AppError("Authentication required", "unauthorized");
		}

		// 別のユーザーの通知を取得しようとしている場合はエラー
		if (user.id !== userId) {
			throw new AppError("Forbidden", "forbidden");
		}

		const result = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(notifications)
			.where(
				and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
			);

		return result[0]?.count ?? 0;
	}, "Failed to fetch unread notification count");
};

export const markNotificationAsRead = async (
	notificationId: string,
	userId: string,
): Promise<void> => {
	return tryCatch(async () => {
		// 認証チェック
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new AppError("Authentication required", "unauthorized");
		}

		// 別のユーザーの通知を更新しようとしている場合はエラー
		if (user.id !== userId) {
			throw new AppError("Forbidden", "forbidden");
		}

		await db
			.update(notifications)
			.set({ isRead: true })
			.where(
				and(
					eq(notifications.id, notificationId),
					eq(notifications.userId, userId),
				),
			);
	}, "Failed to mark notification as read");
};

export const markAllNotificationsAsRead = async (
	userId: string,
): Promise<void> => {
	return tryCatch(async () => {
		// 認証チェック
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new AppError("Authentication required", "unauthorized");
		}

		// 別のユーザーの通知を更新しようとしている場合はエラー
		if (user.id !== userId) {
			throw new AppError("Forbidden", "forbidden");
		}

		await db
			.update(notifications)
			.set({ isRead: true })
			.where(
				and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
			);
	}, "Failed to mark all notifications as read");
};

export const fetchLatestNotifications = async (
	userId: string,
	limit = 5,
): Promise<Notification[]> => {
	return tryCatch(async () => {
		// 認証チェック
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new AppError("Authentication required", "unauthorized");
		}

		// 別のユーザーの通知を取得しようとしている場合はエラー
		if (user.id !== userId) {
			throw new AppError("Forbidden", "forbidden");
		}

		const result = await db
			.select()
			.from(notifications)
			.where(eq(notifications.userId, userId))
			.orderBy(desc(notifications.createdAt))
			.limit(limit);

		return result.map((row) => NotificationSchema.parse(row));
	}, "Failed to fetch latest notifications");
};
