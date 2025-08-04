import { inArray, or } from "drizzle-orm";
import { db } from "./db";
import {
	friendships,
	organizationMemberships,
	organizations,
	users,
} from "./schema";

const resetData = async () => {
	console.log("🗑️  テストデータの削除を開始します...");

	try {
		// 固定IDのテストデータのみ削除
		const testUserIds = [
			"550e8400-e29b-41d4-a716-446655440001",
			"550e8400-e29b-41d4-a716-446655440002",
			"550e8400-e29b-41d4-a716-446655440003",
			"550e8400-e29b-41d4-a716-446655440004",
			"550e8400-e29b-41d4-a716-446655440005",
			"550e8400-e29b-41d4-a716-446655440006",
			"550e8400-e29b-41d4-a716-446655440007",
			"550e8400-e29b-41d4-a716-446655440008",
		];

		const testOrgIds = ["550e8400-e29b-41d4-a716-446655440100"];

		// テスト組織のメンバーシップを削除
		await db
			.delete(organizationMemberships)
			.where(inArray(organizationMemberships.organizationId, testOrgIds));
		console.log("✅ テスト組織のメンバーシップを削除しました");

		// テスト組織を削除
		await db.delete(organizations).where(inArray(organizations.id, testOrgIds));
		console.log("✅ テスト組織を削除しました");

		// テストユーザーが関わる友達関係を削除
		await db
			.delete(friendships)
			.where(
				or(
					inArray(friendships.userId1, testUserIds),
					inArray(friendships.userId2, testUserIds),
				),
			);
		console.log("✅ テストユーザーの友達関係を削除しました");

		// テストユーザーを削除
		await db.delete(users).where(inArray(users.id, testUserIds));
		console.log("✅ テストユーザーを削除しました");

		console.log("🎉 テストデータの削除が完了しました！");
	} catch (error) {
		console.error("❌ テストデータの削除中にエラーが発生しました:", error);
		throw error;
	}
};

// Bunで直接実行する場合
resetData()
	.then(() => {
		console.log("✨ 完了しました");
		process.exit(0);
	})
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

export { resetData };
