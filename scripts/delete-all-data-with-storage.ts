import { db } from "@/lib/drizzle/db";
import { createClient } from "@/lib/supabase/client";
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
	
	const supabase = createClient();

	try {
		// まず写真のパスを取得（Storage削除のため）
		console.log("📸 削除する写真のパスを取得中...");
		const photosToDelete = await db.select().from(photos);
		const photoPaths = photosToDelete.map(photo => photo.photoPath);
		console.log(`📸 ${photoPaths.length}枚の写真が見つかりました`);

		// トランザクション内でデータベースの削除を実行
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
		});

		// Storageから写真を削除
		if (photoPaths.length > 0) {
			console.log("🗄️  Storageから写真を削除中...");
			const { error: storageError } = await supabase.storage
				.from("photos")
				.remove(photoPaths);

			if (storageError) {
				console.error("⚠️  Storage削除中にエラーが発生しました:", storageError);
				console.log("⚠️  データベースのレコードは削除されましたが、一部のファイルがStorageに残っている可能性があります");
			} else {
				console.log("✅ Storageから写真を削除しました");
			}
		}

		console.log("✅ すべてのデータを正常に削除しました！");
		console.log("📝 注意: テーブル構造はそのまま残っています");
		console.log("📝 注意: usersテーブルはSupabase Authと連携しているため削除していません");
	} catch (error) {
		console.error("❌ データ削除中にエラーが発生しました:", error);
		throw error;
	}
};

// 確認プロンプトを表示
const confirmDeletion = async () => {
	console.log("⚠️  警告: このスクリプトは以下を削除します！");
	console.log("  - すべてのデータベースレコード（usersテーブルを除く）");
	console.log("  - Supabase Storageのすべての写真");
	console.log("⚠️  この操作は元に戻せません！");
	console.log("");
	console.log("実行するには '--confirm' フラグを付けて実行してください:");
	console.log("  bun run scripts/delete-all-data-with-storage.ts --confirm");
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