import { and, eq, or } from "drizzle-orm";
import {
	type CreatePhoto,
	type Photo,
	PhotoSchema,
	type PhotoUser,
	PhotoUserSchema,
} from "@/entities/photo";
import { createActivity } from "@/gateways/activity";
import { db } from "@/lib/drizzle/db";
import { friendships, photos, photoUsers } from "@/lib/drizzle/schema";
import { AppError, tryCatch } from "@/lib/error-handling";
import { createClient } from "@/lib/supabase/server";

// Helper function to parse photo from database row
const parsePhoto = (photo: {
	id: string;
	friendshipId: string | null;
	photoUrl: string;
	photoPath: string | null;
	uploadedBy: string;
	description: string | null;
	createdAt: Date;
}): Photo => {
	return PhotoSchema.parse({
		...photo,
		createdAt: photo.createdAt.toISOString(),
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

export { fetchUserPhotos } from "./fetch";

export const fetchFriendshipPhotos = async (
	friendshipId: string,
): Promise<Photo[]> => {
	return tryCatch(async () => {
		const user = await getCurrentUser();
		if (!user) {
			throw new AppError("Authentication required", "unauthorized");
		}

		// Only parties in the friendship can view
		const [friendship] = await db
			.select()
			.from(friendships)
			.where(
				and(
					eq(friendships.id, friendshipId),
					or(
						eq(friendships.userId1, user.id),
						eq(friendships.userId2, user.id),
					),
				),
			)
			.limit(1);

		if (!friendship) {
			throw new AppError("Friendship not found", "notfound");
		}

		const friendshipPhotos = await db
			.select()
			.from(photos)
			.where(eq(photos.friendshipId, friendshipId))
			.orderBy(photos.createdAt);

		return friendshipPhotos.map(parsePhoto);
	}, "Failed to fetch friendship photos");
};

export const fetchPhotoUsers = async (
	photoId: string,
): Promise<PhotoUser[]> => {
	return tryCatch(async () => {
		const photoUsersList = await db
			.select()
			.from(photoUsers)
			.where(eq(photoUsers.photoId, photoId));

		return photoUsersList.map((photoUser) =>
			PhotoUserSchema.parse({
				...photoUser,
				createdAt: photoUser.createdAt.toISOString(),
			}),
		);
	}, "Failed to fetch photo users");
};

export const uploadPhoto = async (
	data: CreatePhoto,
	file: File,
): Promise<{ success: boolean; photo?: Photo; error?: string }> => {
	const user = await getCurrentUser();
	if (!user) {
		return { success: false, error: "Authentication required" };
	}

	const supabase = await createClient();

	// Check if friendshipId is provided and valid
	if (data.friendshipId) {
		const [friendship] = await db
			.select()
			.from(friendships)
			.where(
				and(
					eq(friendships.id, data.friendshipId),
					or(
						eq(friendships.userId1, user.id),
						eq(friendships.userId2, user.id),
					),
				),
			)
			.limit(1);

		if (!friendship) {
			return { success: false, error: "Friendship not found" };
		}
	}

	// For new photo upload action, we don't have userIds in data
	// This will be handled differently in the action

	try {
		// Upload photo to storage
		const fileExt = file.name.split(".").pop();
		const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

		const { error: uploadError } = await supabase.storage
			.from("photos")
			.upload(fileName, file);

		if (uploadError) {
			return { success: false, error: "Failed to upload photo" };
		}

		const {
			data: { publicUrl },
		} = supabase.storage.from("photos").getPublicUrl(fileName);

		// Save photo information to database
		const result = await db.transaction(async (tx) => {
			const [newPhoto] = await tx
				.insert(photos)
				.values({
					friendshipId: data.friendshipId,
					photoUrl: publicUrl,
					photoPath: fileName,
					uploadedBy: user.id,
					description: data.description,
				})
				.returning();

			return newPhoto;
		});

		const photo = parsePhoto(result);

		// Create activity for photo upload
		await createActivity({
			type: "photo_uploaded",
			relatedPhotoId: result.id,
			metadata: {
				photoUrl: publicUrl,
				thumbnailUrl: publicUrl, // TODO: Generate actual thumbnail
			},
		});

		return { success: true, photo };
	} catch (error) {
		console.error("Photo upload error:", error);
		return { success: false, error: "Failed to save photo" };
	}
};

export const deletePhoto = async (
	photoId: string,
): Promise<{ success: boolean; error?: string }> => {
	const user = await getCurrentUser();
	if (!user) {
		return { success: false, error: "Authentication required" };
	}

	const supabase = await createClient();

	// Only the uploader can delete
	const [photo] = await db
		.select()
		.from(photos)
		.where(and(eq(photos.id, photoId), eq(photos.uploadedBy, user.id)))
		.limit(1);

	if (!photo) {
		return { success: false, error: "Photo not found" };
	}

	try {
		// Delete photo from storage
		const fileName = photo.photoUrl.split("/").slice(-2).join("/");
		const { error: deleteError } = await supabase.storage
			.from("photos")
			.remove([fileName]);

		if (deleteError) {
			console.error("Storage deletion error:", deleteError);
		}

		// Delete from database (photoUsers are cascade deleted automatically)
		await db.delete(photos).where(eq(photos.id, photoId));

		return { success: true };
	} catch (error) {
		console.error("Photo deletion error:", error);
		return { success: false, error: "Failed to delete photo" };
	}
};
