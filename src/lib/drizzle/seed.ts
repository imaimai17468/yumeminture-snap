import { eq } from "drizzle-orm";
import { db } from "./db";
import {
	friendships,
	organizationMemberships,
	organizations,
	users,
} from "./schema";

const seedData = async () => {
	console.log("🌱 シードデータの投入を開始します...");

	try {
		// テストユーザーを作成（正しいUUID v4形式）
		const testUsers = [
			{
				id: "550e8400-e29b-41d4-a716-446655440001",
				name: "田中 太郎",
				avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=tanaka",
			},
			{
				id: "550e8400-e29b-41d4-a716-446655440002",
				name: "佐藤 花子",
				avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sato",
			},
			{
				id: "550e8400-e29b-41d4-a716-446655440003",
				name: "鈴木 一郎",
				avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=suzuki",
			},
			{
				id: "550e8400-e29b-41d4-a716-446655440004",
				name: "高橋 美咲",
				avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=takahashi",
			},
			{
				id: "550e8400-e29b-41d4-a716-446655440005",
				name: "山田 健太",
				avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=yamada",
			},
			{
				id: "550e8400-e29b-41d4-a716-446655440006",
				name: "渡辺 さくら",
				avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=watanabe",
			},
			{
				id: "550e8400-e29b-41d4-a716-446655440007",
				name: "伊藤 大輔",
				avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ito",
			},
			{
				id: "550e8400-e29b-41d4-a716-446655440008",
				name: "中村 愛",
				avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=nakamura",
			},
		];

		// ユーザーを挿入（既存の場合はスキップ）
		for (const user of testUsers) {
			await db.insert(users).values(user).onConflictDoNothing();
		}
		console.log("✅ テストユーザーを作成しました");

		// テスト組織を作成
		const testOrganizations = [
			{
				id: "550e8400-e29b-41d4-a716-446655440100",
				name: "株式会社テックイノベーション",
				description: "最先端のテクノロジーで社会に貢献する企業です",
			},
		];

		// 組織を挿入（既存の場合はスキップ）
		for (const org of testOrganizations) {
			await db.insert(organizations).values(org).onConflictDoNothing();
		}
		console.log("✅ テスト組織を作成しました");

		// 組織メンバーシップを作成（全員同じ会社）
		const memberships = [
			{
				organizationId: "550e8400-e29b-41d4-a716-446655440100",
				userId: "9ed8cb17-9c74-475f-93d6-3196c5654108", // メインユーザー
				role: "admin" as const,
				status: "approved" as const,
			},
			{
				organizationId: "550e8400-e29b-41d4-a716-446655440100",
				userId: "550e8400-e29b-41d4-a716-446655440001",
				role: "member" as const,
				status: "approved" as const,
			},
			{
				organizationId: "550e8400-e29b-41d4-a716-446655440100",
				userId: "550e8400-e29b-41d4-a716-446655440002",
				role: "member" as const,
				status: "approved" as const,
			},
			{
				organizationId: "550e8400-e29b-41d4-a716-446655440100",
				userId: "550e8400-e29b-41d4-a716-446655440003",
				role: "member" as const,
				status: "approved" as const,
			},
			{
				organizationId: "550e8400-e29b-41d4-a716-446655440100",
				userId: "550e8400-e29b-41d4-a716-446655440004",
				role: "member" as const,
				status: "approved" as const,
			},
			{
				organizationId: "550e8400-e29b-41d4-a716-446655440100",
				userId: "550e8400-e29b-41d4-a716-446655440005",
				role: "member" as const,
				status: "approved" as const,
			},
			{
				organizationId: "550e8400-e29b-41d4-a716-446655440100",
				userId: "550e8400-e29b-41d4-a716-446655440006",
				role: "member" as const,
				status: "approved" as const,
			},
			{
				organizationId: "550e8400-e29b-41d4-a716-446655440100",
				userId: "550e8400-e29b-41d4-a716-446655440007",
				role: "member" as const,
				status: "approved" as const,
			},
			{
				organizationId: "550e8400-e29b-41d4-a716-446655440100",
				userId: "550e8400-e29b-41d4-a716-446655440008",
				role: "member" as const,
				status: "approved" as const,
			},
		];

		// メンバーシップを挿入（既存の場合はスキップ）
		for (const membership of memberships) {
			try {
				await db
					.insert(organizationMemberships)
					.values(membership)
					.onConflictDoNothing();
			} catch (error) {
				console.error(
					`Failed to insert membership for user ${membership.userId} in org ${membership.organizationId}:`,
					error,
				);
				// ユーザーと組織の存在確認
				const [userExists] = await db
					.select()
					.from(users)
					.where(eq(users.id, membership.userId))
					.limit(1);
				const [orgExists] = await db
					.select()
					.from(organizations)
					.where(eq(organizations.id, membership.organizationId))
					.limit(1);
				console.log(`User ${membership.userId} exists:`, !!userExists);
				console.log(
					`Organization ${membership.organizationId} exists:`,
					!!orgExists,
				);
				throw error;
			}
		}
		console.log("✅ 組織メンバーシップを作成しました");

		// 友達関係を作成（メインユーザーと数名を友達に）
		const friendshipPairs = [
			// メインユーザーと田中、佐藤、鈴木が友達
			[
				"9ed8cb17-9c74-475f-93d6-3196c5654108",
				"550e8400-e29b-41d4-a716-446655440001",
			],
			[
				"9ed8cb17-9c74-475f-93d6-3196c5654108",
				"550e8400-e29b-41d4-a716-446655440002",
			],
			[
				"9ed8cb17-9c74-475f-93d6-3196c5654108",
				"550e8400-e29b-41d4-a716-446655440003",
			],
			// 田中と佐藤も友達
			[
				"550e8400-e29b-41d4-a716-446655440001",
				"550e8400-e29b-41d4-a716-446655440002",
			],
			// 高橋と山田が友達
			[
				"550e8400-e29b-41d4-a716-446655440004",
				"550e8400-e29b-41d4-a716-446655440005",
			],
			// 伊藤と中村が友達
			[
				"550e8400-e29b-41d4-a716-446655440007",
				"550e8400-e29b-41d4-a716-446655440008",
			],
		];

		for (const [userId1, userId2] of friendshipPairs) {
			// user_id_1 < user_id_2 になるように正規化
			const [normalizedUserId1, normalizedUserId2] =
				userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

			await db
				.insert(friendships)
				.values({
					userId1: normalizedUserId1,
					userId2: normalizedUserId2,
				})
				.onConflictDoNothing();
		}
		console.log("✅ 友達関係を作成しました");

		console.log("🎉 シードデータの投入が完了しました！");
	} catch (error) {
		console.error("❌ シードデータの投入中にエラーが発生しました:", error);
		throw error;
	}
};

// Bunで直接実行する場合
seedData()
	.then(() => {
		console.log("✨ 完了しました");
		process.exit(0);
	})
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

export { seedData };
