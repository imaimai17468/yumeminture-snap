import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
	type UpdateUser,
	type User,
	UserSchema,
	type UserWithEmail,
	UserWithEmailSchema,
} from "@/entities/user";
import { db } from "@/lib/drizzle/db";
import { users } from "@/lib/drizzle/schema";
import { AppError, tryCatch } from "@/lib/error-handling";
import { createClient } from "@/lib/supabase/server";

export const fetchCurrentUser = async (): Promise<UserWithEmail | null> => {
	try {
		const supabase = await createClient();

		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return null;
		}

		const profile = await db
			.select()
			.from(users)
			.where(eq(users.id, authUser.id))
			.limit(1);

		if (!profile.length) {
			// 初回ログイン時: ユーザープロファイルが存在しない場合は作成
			try {
				const newProfile = await db
					.insert(users)
					.values({
						id: authUser.id,
						name:
							authUser.user_metadata?.name ||
							authUser.user_metadata?.full_name ||
							null,
						avatarUrl: authUser.user_metadata?.avatar_url || null,
					})
					.returning();

				if (newProfile.length > 0) {
					const rawUser = {
						id: newProfile[0].id,
						name: newProfile[0].name,
						avatarUrl: newProfile[0].avatarUrl,
						createdAt: newProfile[0].createdAt.toISOString(),
						updatedAt: newProfile[0].updatedAt.toISOString(),
						email: authUser.email,
					};

					return UserWithEmailSchema.parse(rawUser);
				}
			} catch (insertError) {
				console.error("Failed to create user profile:", insertError);
				// プロファイル作成に失敗しても、認証ユーザーの基本情報を返す
				return {
					id: authUser.id,
					name:
						authUser.user_metadata?.name ||
						authUser.email?.split("@")[0] ||
						"User",
					avatarUrl: authUser.user_metadata?.avatar_url || null,
					email: authUser.email || "",
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};
			}
		}

		const rawUser = {
			id: profile[0].id,
			name: profile[0].name,
			avatarUrl: profile[0].avatarUrl,
			createdAt: profile[0].createdAt.toISOString(),
			updatedAt: profile[0].updatedAt.toISOString(),
			email: authUser.email,
		};

		return UserWithEmailSchema.parse(rawUser);
	} catch (error) {
		console.error("Failed to fetch current user:", error);
		return null;
	}
};

export const updateUser = async (
	userId: string,
	data: UpdateUser,
): Promise<{ success: boolean; error?: string }> => {
	try {
		await db
			.update(users)
			.set({
				name: data.name,
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId));

		revalidatePath("/profile");
		return { success: true };
	} catch (_error) {
		return { success: false, error: "Failed to update profile" };
	}
};

export const updateUserAvatar = async (
	userId: string,
	file: File,
): Promise<{ success: boolean; error?: string; avatarUrl?: string }> => {
	const supabase = await createClient();

	const fileExt = file.name.split(".").pop();
	const fileName = `${userId}/avatar.${fileExt}`;

	const { error: uploadError } = await supabase.storage
		.from("avatars")
		.upload(fileName, file, {
			upsert: true,
		});

	if (uploadError) {
		return { success: false, error: "Failed to upload avatar" };
	}

	const {
		data: { publicUrl },
	} = supabase.storage.from("avatars").getPublicUrl(fileName);

	try {
		await db
			.update(users)
			.set({
				avatarUrl: publicUrl,
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId));

		revalidatePath("/profile");
		return { success: true, avatarUrl: publicUrl };
	} catch (_error) {
		return { success: false, error: "Failed to update profile" };
	}
};

export const fetchUserById = async (userId: string): Promise<User> => {
	return tryCatch(async () => {
		const profile = await db
			.select()
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		if (!profile.length) {
			throw new AppError("User not found", "notfound");
		}

		const rawUser = {
			id: profile[0].id,
			name: profile[0].name,
			avatarUrl: profile[0].avatarUrl,
			createdAt: profile[0].createdAt.toISOString(),
			updatedAt: profile[0].updatedAt.toISOString(),
		};

		return UserSchema.parse(rawUser);
	}, "Failed to fetch user by id");
};

export const fetchAllUsers = async (): Promise<User[]> => {
	return tryCatch(async () => {
		const allUsers = await db.select().from(users).orderBy(users.name);

		const parsedUsers = allUsers.map((user) => {
			const rawUser = {
				id: user.id,
				name: user.name,
				avatarUrl: user.avatarUrl,
				createdAt: user.createdAt.toISOString(),
				updatedAt: user.updatedAt.toISOString(),
			};
			return UserSchema.parse(rawUser);
		});

		return parsedUsers;
	}, "Failed to fetch all users");
};
