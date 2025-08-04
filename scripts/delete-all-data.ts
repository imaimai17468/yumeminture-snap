import { db } from "@/lib/drizzle/db";
import {
	notifications,
	activities,
	communicationStatuses,
	photoUsers,
	photos,
	friendships,
	organizationMemberships,
	organizations,
} from "@/lib/drizzle/schema";

const deleteAllData = async () => {
	console.log("🗑️  データ削除を開始します...");

	try {
		// トランザクション内で削除を実行（外部キー制約の順序を考慮）
		await db.transaction(async (tx) => {
			// 1. 通知を削除
			console.log("📧 通知を削除中...");
			await tx.delete(notifications);
			console.log("✅ 通知を削除しました");

			// 2. アクティビティを削除
			console.log("📊 アクティビティを削除中...");
			await tx.delete(activities);
			console.log("✅ アクティビティを削除しました");

			// 3. コミュニケーション状態を削除
			console.log("💬 コミュニケーション状態を削除中...");
			await tx.delete(communicationStatuses);
			console.log("✅ コミュニケーション状態を削除しました");

			// 4. 写真内のユーザーを削除
			console.log("👥 写真内のユーザー情報を削除中...");
			await tx.delete(photoUsers);
			console.log("✅ 写真内のユーザー情報を削除しました");

			// 5. 写真を削除
			console.log("📸 写真を削除中...");
			await tx.delete(photos);
			console.log("✅ 写真を削除しました");

			// 6. 友達関係を削除
			console.log("🤝 友達関係を削除中...");
			await tx.delete(friendships);
			console.log("✅ 友達関係を削除しました");

			// 7. 組織メンバーシップを削除
			console.log("👥 組織メンバーシップを削除中...");
			await tx.delete(organizationMemberships);
			console.log("✅ 組織メンバーシップを削除しました");

			// 8. 組織を削除
			console.log("🏢 組織を削除中...");
			await tx.delete(organizations);
			console.log("✅ 組織を削除しました");

			// 注意: usersテーブルはSupabase Authと連携しているため削除しません
			console.log("⚠️  usersテーブルはSupabase Authと連携しているため削除しません");
		});

		console.log("✅ すべてのデータを正常に削除しました！");
		console.log("📝 注意: テーブル構造はそのまま残っています");
	} catch (error) {
		console.error("❌ データ削除中にエラーが発生しました:", error);
		throw error;
	}
};

// 確認プロンプトを表示
const confirmDeletion = async () => {
	console.log("⚠️  警告: このスクリプトはすべてのデータを削除します！");
	console.log("⚠️  （ただし、usersテーブルは除く）");
	console.log("⚠️  この操作は元に戻せません！");
	console.log("");
	console.log("実行するには '--confirm' フラグを付けて実行してください:");
	console.log("  bun run scripts/delete-all-data.ts --confirm");
};

// メイン処理
const main = async () => {
	const args = process.argv.slice(2);
	const isConfirmed = args.includes("--confirm");

	if (!isConfirmed) {
		await confirmDeletion();
		process.exit(0);
	}

	try {
		await deleteAllData();
		process.exit(0);
	} catch (error) {
		console.error("スクリプトの実行に失敗しました:", error);
		process.exit(1);
	}
};

// スクリプトを実行
main();