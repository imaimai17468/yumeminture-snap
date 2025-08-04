import { sql } from "drizzle-orm";
import { db } from "./db";
import { friendships } from "./schema";

const cleanupInvalidFriendships = async () => {
	console.log("🧹 不正な友達関係データのクリーンアップを開始します...");

	try {
		// まず全ての友達関係を取得
		const allFriendships = await db.select().from(friendships);
		console.log(`📊 友達関係の総数: ${allFriendships.length}`);

		// UUID形式をチェックする正規表現
		const uuidRegex =
			/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

		// 不正なデータを見つける
		const invalidFriendships = allFriendships.filter((f) => {
			const userId1Valid =
				typeof f.userId1 === "string" && uuidRegex.test(f.userId1);
			const userId2Valid =
				typeof f.userId2 === "string" && uuidRegex.test(f.userId2);
			return !userId1Valid || !userId2Valid;
		});

		console.log(`🚨 不正な友達関係の数: ${invalidFriendships.length}`);

		if (invalidFriendships.length > 0) {
			console.log(
				"不正なデータの例:",
				invalidFriendships.slice(0, 3).map((f) => ({
					id: f.id,
					userId1: f.userId1,
					userId2: f.userId2,
				})),
			);
		}

		// 存在しないユーザーを参照している友達関係を削除
		const _orphanResult = await db.execute(sql`
			DELETE FROM friendships f
			WHERE 
				NOT EXISTS (SELECT 1 FROM users u WHERE u.id = f.user_id_1)
				OR NOT EXISTS (SELECT 1 FROM users u WHERE u.id = f.user_id_2)
		`);

		console.log("✅ 存在しないユーザーを参照している友達関係を削除しました");
		console.log("🎉 クリーンアップが完了しました！");
	} catch (error) {
		console.error("❌ クリーンアップ中にエラーが発生しました:", error);
		throw error;
	}
};

// Bunで直接実行する場合
cleanupInvalidFriendships()
	.then(() => {
		console.log("✨ 完了しました");
		process.exit(0);
	})
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

export { cleanupInvalidFriendships };
