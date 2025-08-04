import { inArray, or } from "drizzle-orm";
import { db } from "./db";
import {
	friendships,
	organizationMemberships,
	organizations,
	users,
} from "./schema";

const resetAllTestData = async () => {
	console.log("🗑️  全てのテストデータの削除を開始します...");

	try {
		// 新旧両方のテストユーザーIDを含める
		const allTestUserIds = [
			// 古いUUID形式
			"11111111-1111-1111-1111-111111111111",
			"22222222-2222-2222-2222-222222222222",
			"33333333-3333-3333-3333-333333333333",
			"44444444-4444-4444-4444-444444444444",
			"55555555-5555-5555-5555-555555555555",
			"66666666-6666-6666-6666-666666666666",
			"77777777-7777-7777-7777-777777777777",
			"88888888-8888-8888-8888-888888888888",
			// 新しいUUID形式
			"550e8400-e29b-41d4-a716-446655440001",
			"550e8400-e29b-41d4-a716-446655440002",
			"550e8400-e29b-41d4-a716-446655440003",
			"550e8400-e29b-41d4-a716-446655440004",
			"550e8400-e29b-41d4-a716-446655440005",
			"550e8400-e29b-41d4-a716-446655440006",
			"550e8400-e29b-41d4-a716-446655440007",
			"550e8400-e29b-41d4-a716-446655440008",
		];

		const allTestOrgIds = [
			// 古いUUID形式
			"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
			"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
			"cccccccc-cccc-cccc-cccc-cccccccccccc",
			// 新しいUUID形式
			"550e8400-e29b-41d4-a716-446655440100",
		];

		// テスト組織のメンバーシップを削除
		await db
			.delete(organizationMemberships)
			.where(inArray(organizationMemberships.organizationId, allTestOrgIds));
		console.log("✅ テスト組織のメンバーシップを削除しました");

		// テスト組織を削除
		await db
			.delete(organizations)
			.where(inArray(organizations.id, allTestOrgIds));
		console.log("✅ テスト組織を削除しました");

		// テストユーザーが関わる友達関係を削除
		await db
			.delete(friendships)
			.where(
				or(
					inArray(friendships.userId1, allTestUserIds),
					inArray(friendships.userId2, allTestUserIds),
				),
			);
		console.log("✅ テストユーザーの友達関係を削除しました");

		// テストユーザーを削除
		await db.delete(users).where(inArray(users.id, allTestUserIds));
		console.log("✅ テストユーザーを削除しました");

		console.log("🎉 全てのテストデータの削除が完了しました！");
	} catch (error) {
		console.error("❌ テストデータの削除中にエラーが発生しました:", error);
		throw error;
	}
};

// Bunで直接実行する場合
resetAllTestData()
	.then(() => {
		console.log("✨ 完了しました");
		process.exit(0);
	})
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

export { resetAllTestData };
