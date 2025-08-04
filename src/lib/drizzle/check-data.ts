import { db } from "./db";
import { friendships, organizations, users } from "./schema";

const checkData = async () => {
	console.log("📊 データベースの状態を確認します...\n");

	// ユーザー数を確認
	const allUsers = await db.select().from(users);
	console.log(`👥 ユーザー総数: ${allUsers.length}`);
	console.log("ユーザー一覧:");
	allUsers.forEach((user) => {
		console.log(`  - ${user.id}: ${user.name}`);
	});

	console.log("\n");

	// 組織数を確認
	const allOrgs = await db.select().from(organizations);
	console.log(`🏢 組織総数: ${allOrgs.length}`);
	console.log("組織一覧:");
	allOrgs.forEach((org) => {
		console.log(`  - ${org.id}: ${org.name}`);
	});

	console.log("\n");

	// 友達関係を確認
	const allFriendships = await db.select().from(friendships);
	console.log(`🤝 友達関係総数: ${allFriendships.length}`);

	console.log("\n✨ 確認完了");
};

// Bunで直接実行する場合
checkData()
	.then(() => {
		process.exit(0);
	})
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

export { checkData };
