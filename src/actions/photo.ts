"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { Photo } from "@/entities/photo";
import { PhotoSchema } from "@/entities/photo";
import { createActivity } from "@/gateways/activity";
import { createFriendshipIfNotExists } from "@/gateways/friendship";
import { fetchCurrentUser } from "@/gateways/user";
import { db } from "@/lib/drizzle/db";
import { photos, photoUsers, users } from "@/lib/drizzle/schema";
import { createClient } from "@/lib/supabase/server";

export const uploadPhotoAction = async (
	formData: FormData,
): Promise<{ success: boolean; photo?: Photo; error?: string }> => {
	const currentUser = await fetchCurrentUser();
	if (!currentUser) {
		return { success: false, error: "Authentication required" };
	}

	const file = formData.get("file") as File;
	const description = formData.get("description") as string;
	const taggedUserIdsJson = formData.get("taggedUserIds") as string;

	if (!file || file.size === 0) {
		return { success: false, error: "No file provided" };
	}

	let taggedUserIds: string[] = [];
	try {
		taggedUserIds = JSON.parse(taggedUserIdsJson);
	} catch {
		return { success: false, error: "Invalid tagged users data" };
	}

	// タグ付けされたユーザーに現在のユーザーを追加
	const allUserIds = [...new Set([currentUser.id, ...taggedUserIds])];

	try {
		// Supabase Storageに写真をアップロード
		const supabase = await createClient();
		const fileExt = file.name.split(".").pop();
		const fileName = `${Date.now()}.${fileExt}`;
		const filePath = `${currentUser.id}/${fileName}`;

		const { data: uploadData, error: uploadError } = await supabase.storage
			.from("photos")
			.upload(filePath, file, {
				cacheControl: "3600",
				upsert: false,
			});

		if (uploadError) {
			console.error("Storage upload error:", uploadError);
			return { success: false, error: "Failed to upload photo" };
		}

		const {
			data: { publicUrl },
		} = supabase.storage.from("photos").getPublicUrl(uploadData.path);

		// データベースに写真情報を保存
		const result = await db.transaction(async (tx) => {
			const [newPhoto] = await tx
				.insert(photos)
				.values({
					uploadedBy: currentUser.id,
					photoUrl: publicUrl,
					photoPath: uploadData.path,
					description: description || null,
				})
				.returning();

			// タグ付けされたユーザーを登録
			const photoUserValues = allUserIds.map((userId) => ({
				photoId: newPhoto.id,
				userId,
			}));

			await tx.insert(photoUsers).values(photoUserValues);

			return newPhoto;
		});

		// タグ付けされたユーザー間で友達関係を作成
		// すべてのユーザーペアで友達関係を確立
		for (let i = 0; i < allUserIds.length; i++) {
			for (let j = i + 1; j < allUserIds.length; j++) {
				await createFriendshipIfNotExists(allUserIds[i], allUserIds[j]);
			}
		}

		// タグ付けされたユーザーの情報を取得（アップロードしたユーザーを除く）
		const taggedUsersInfo =
			taggedUserIds.length > 0
				? await db
						.select({
							id: users.id,
							name: users.name,
							avatarUrl: users.avatarUrl,
						})
						.from(users)
						.where(inArray(users.id, taggedUserIds))
				: [];

		// アクティビティを作成
		await createActivity({
			type: "photo_uploaded",
			relatedPhotoId: result.id,
			metadata: {
				photoUrl: publicUrl,
				thumbnailUrl: publicUrl,
				taggedUserCount: taggedUserIds.length,
				taggedUsers: taggedUsersInfo,
			},
		});

		const photo = PhotoSchema.parse({
			...result,
			createdAt: result.createdAt.toISOString(),
		});

		revalidatePath("/photos");
		revalidatePath("/");
		return { success: true, photo };
	} catch (error) {
		console.error("Photo upload error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to upload photo",
		};
	}
};

export const deletePhotoAction = async (
	photoId: string,
): Promise<{ success: boolean; error?: string }> => {
	const currentUser = await fetchCurrentUser();
	if (!currentUser) {
		return { success: false, error: "Authentication required" };
	}

	try {
		// 写真の所有者確認
		const [photo] = await db
			.select()
			.from(photos)
			.where(
				and(eq(photos.id, photoId), eq(photos.uploadedBy, currentUser.id)),
			);

		if (!photo) {
			return { success: false, error: "Photo not found or unauthorized" };
		}

		// Supabase Storageから削除
		const supabase = await createClient();
		const { error: deleteError } = await supabase.storage
			.from("photos")
			.remove([photo.photoPath]);

		if (deleteError) {
			console.error("Storage deletion error:", deleteError);
		}

		// データベースから削除（photoUsersはカスケード削除される）
		await db.delete(photos).where(eq(photos.id, photoId));

		revalidatePath("/photos");
		return { success: true };
	} catch (error) {
		console.error("Photo deletion error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to delete photo",
		};
	}
};
