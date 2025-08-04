import { desc, eq, inArray, or } from "drizzle-orm";
import type { PhotoWithUsers } from "@/entities/photo";
import { db } from "@/lib/drizzle/db";
import { photos, photoUsers, users } from "@/lib/drizzle/schema";

export const fetchUserPhotos = async (
	userId: string,
): Promise<PhotoWithUsers[]> => {
	try {
		// ユーザーがタグ付けされている写真IDを取得
		const taggedPhotoIds = await db
			.select({ photoId: photoUsers.photoId })
			.from(photoUsers)
			.where(eq(photoUsers.userId, userId));

		const photoIds = taggedPhotoIds.map((row) => row.photoId);

		// ユーザーがアップロードした写真、またはタグ付けされた写真を取得
		const userPhotos = await db
			.select({
				photo: photos,
				uploader: users,
			})
			.from(photos)
			.innerJoin(users, eq(photos.uploadedBy, users.id))
			.where(
				photoIds.length > 0
					? or(eq(photos.uploadedBy, userId), inArray(photos.id, photoIds))
					: eq(photos.uploadedBy, userId),
			)
			.orderBy(desc(photos.createdAt));

		// 各写真のタグ付けされたユーザーを取得
		const photosWithUsers = await Promise.all(
			userPhotos.map(async ({ photo, uploader }) => {
				const taggedUsersData = await db
					.select({
						user: users,
					})
					.from(photoUsers)
					.innerJoin(users, eq(photoUsers.userId, users.id))
					.where(eq(photoUsers.photoId, photo.id));

				return {
					id: photo.id,
					uploadedBy: photo.uploadedBy,
					photoUrl: photo.photoUrl,
					photoPath: photo.photoPath,
					description: photo.description,
					createdAt: photo.createdAt.toISOString(),
					friendshipId: photo.friendshipId,
					uploader: {
						id: uploader.id,
						name: uploader.name,
						avatarUrl: uploader.avatarUrl,
					},
					taggedUsers: taggedUsersData.map(({ user }) => ({
						id: user.id,
						name: user.name,
						avatarUrl: user.avatarUrl,
					})),
				};
			}),
		);

		return photosWithUsers;
	} catch (error) {
		console.error("Failed to fetch user photos:", error);
		return [];
	}
};
