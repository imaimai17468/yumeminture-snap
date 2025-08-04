import { eq } from "drizzle-orm";
import { db } from "./db";
import {
	type ActivityType,
	activities,
	communicationStatuses,
	friendships,
	organizationMemberships,
	organizations,
	photos,
	photoUsers,
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
			// 追加のユーザー（他の組織用）
			{
				id: "550e8400-e29b-41d4-a716-446655440009",
				name: "木村 拓哉",
				avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=kimura",
			},
			{
				id: "550e8400-e29b-41d4-a716-446655440010",
				name: "小林 由美",
				avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=kobayashi",
			},
			{
				id: "550e8400-e29b-41d4-a716-446655440011",
				name: "加藤 健一",
				avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=kato",
			},
			{
				id: "550e8400-e29b-41d4-a716-446655440012",
				name: "吉田 明美",
				avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=yoshida",
			},
		];

		// ユーザーを挿入（既存の場合はスキップ）
		for (const user of testUsers) {
			await db.insert(users).values(user).onConflictDoNothing();
		}
		console.log("✅ テストユーザーを作成しました");

		// テスト組織を作成（既存の組織を使用）
		const targetOrganizationId = "da6e06e1-a61e-4f84-98fb-956c0b5b1e7d";

		// 既存の組織を使用するため、組織の作成はスキップ
		console.log("✅ 既存の組織を使用します");

		// 現在の日時を基準に様々な参加日時を生成
		const now = new Date();
		const daysAgo = (days: number) =>
			new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

		// 組織メンバーシップを作成（全員を同じ組織に紐付け）
		const memberships = [
			{
				organizationId: targetOrganizationId,
				userId: "147060f0-93e1-4c13-98e3-723ed8cb20ee", // メインユーザー
				role: "admin" as const,
				status: "approved" as const,
				joinedAt: daysAgo(180), // 6ヶ月前から参加
			},
			{
				organizationId: targetOrganizationId,
				userId: "550e8400-e29b-41d4-a716-446655440001",
				role: "member" as const,
				status: "approved" as const,
				joinedAt: daysAgo(150), // 5ヶ月前から参加
			},
			{
				organizationId: targetOrganizationId,
				userId: "550e8400-e29b-41d4-a716-446655440002",
				role: "member" as const,
				status: "approved" as const,
				joinedAt: daysAgo(120), // 4ヶ月前から参加
			},
			{
				organizationId: targetOrganizationId,
				userId: "550e8400-e29b-41d4-a716-446655440003",
				role: "member" as const,
				status: "approved" as const,
				joinedAt: daysAgo(90), // 3ヶ月前から参加
			},
			{
				organizationId: targetOrganizationId,
				userId: "550e8400-e29b-41d4-a716-446655440004",
				role: "member" as const,
				status: "approved" as const,
				joinedAt: daysAgo(60), // 2ヶ月前から参加
			},
			{
				organizationId: targetOrganizationId,
				userId: "550e8400-e29b-41d4-a716-446655440005",
				role: "member" as const,
				status: "approved" as const,
				joinedAt: daysAgo(30), // 1ヶ月前から参加
			},
			{
				organizationId: targetOrganizationId,
				userId: "550e8400-e29b-41d4-a716-446655440006",
				role: "member" as const,
				status: "approved" as const,
				joinedAt: daysAgo(100), // 100日前から参加（低活動）
			},
			{
				organizationId: targetOrganizationId,
				userId: "550e8400-e29b-41d4-a716-446655440007",
				role: "member" as const,
				status: "approved" as const,
				joinedAt: daysAgo(45), // 45日前から参加（非アクティブ）
			},
			{
				organizationId: targetOrganizationId,
				userId: "550e8400-e29b-41d4-a716-446655440008",
				role: "member" as const,
				status: "approved" as const,
				joinedAt: daysAgo(14), // 2週間前から参加
			},
			{
				organizationId: targetOrganizationId,
				userId: "550e8400-e29b-41d4-a716-446655440009",
				role: "admin" as const,
				status: "approved" as const,
				joinedAt: daysAgo(200),
			},
			{
				organizationId: targetOrganizationId,
				userId: "550e8400-e29b-41d4-a716-446655440010",
				role: "member" as const,
				status: "approved" as const,
				joinedAt: daysAgo(150),
			},
			{
				organizationId: targetOrganizationId,
				userId: "550e8400-e29b-41d4-a716-446655440011",
				role: "member" as const,
				status: "approved" as const,
				joinedAt: daysAgo(90),
			},
			{
				organizationId: targetOrganizationId,
				userId: "550e8400-e29b-41d4-a716-446655440012",
				role: "member" as const,
				status: "pending" as const,
				joinedAt: null,
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
				"147060f0-93e1-4c13-98e3-723ed8cb20ee",
				"550e8400-e29b-41d4-a716-446655440001",
			],
			[
				"147060f0-93e1-4c13-98e3-723ed8cb20ee",
				"550e8400-e29b-41d4-a716-446655440002",
			],
			[
				"147060f0-93e1-4c13-98e3-723ed8cb20ee",
				"550e8400-e29b-41d4-a716-446655440003",
			],
			// メインユーザーと高橋、山田も友達
			[
				"147060f0-93e1-4c13-98e3-723ed8cb20ee",
				"550e8400-e29b-41d4-a716-446655440004",
			],
			[
				"147060f0-93e1-4c13-98e3-723ed8cb20ee",
				"550e8400-e29b-41d4-a716-446655440005",
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

		// 友達関係を挿入
		for (const pair of friendshipPairs) {
			const [userId1, userId2] = pair.sort();
			await db
				.insert(friendships)
				.values({
					userId1,
					userId2,
				})
				.onConflictDoNothing();
		}
		console.log("✅ 友達関係を作成しました");

		// 写真データを作成（friendshipIdは実際のDBでは自動生成されるため、ここではnullとする）
		const testPhotos = [
			{
				id: "550e8400-e29b-41d4-a716-446655440201",
				friendshipId: null,
				photoUrl: "https://placehold.co/600x400/EEE/31343C?text=Photo1",
				photoPath: "photos/test1.jpg",
				uploadedBy: "147060f0-93e1-4c13-98e3-723ed8cb20ee",
				description: "チームランチの写真",
				createdAt: daysAgo(5),
			},
			{
				id: "550e8400-e29b-41d4-a716-446655440202",
				friendshipId: null,
				photoUrl: "https://placehold.co/600x400/EEE/31343C?text=Photo2",
				photoPath: "photos/test2.jpg",
				uploadedBy: "550e8400-e29b-41d4-a716-446655440002",
				description: "プロジェクト完了記念",
				createdAt: daysAgo(10),
			},
			{
				id: "550e8400-e29b-41d4-a716-446655440203",
				friendshipId: null,
				photoUrl: "https://placehold.co/600x400/EEE/31343C?text=Photo3",
				photoPath: "photos/test3.jpg",
				uploadedBy: "550e8400-e29b-41d4-a716-446655440001",
				description: "カンファレンス参加",
				createdAt: daysAgo(20),
			},
			{
				id: "550e8400-e29b-41d4-a716-446655440204",
				friendshipId: null,
				photoUrl: "https://placehold.co/600x400/EEE/31343C?text=Photo4",
				photoPath: "photos/test4.jpg",
				uploadedBy: "550e8400-e29b-41d4-a716-446655440004",
				description: "社内イベント",
				createdAt: daysAgo(3),
			},
		];

		// 写真を挿入
		for (const photo of testPhotos) {
			await db.insert(photos).values(photo).onConflictDoNothing();
		}
		console.log("✅ 写真データを作成しました");

		// 写真にタグ付けされたユーザーを追加
		const photoUserPairs = [
			// Photo1: メインユーザーと田中
			{
				photoId: "550e8400-e29b-41d4-a716-446655440201",
				userId: "147060f0-93e1-4c13-98e3-723ed8cb20ee",
			},
			{
				photoId: "550e8400-e29b-41d4-a716-446655440201",
				userId: "550e8400-e29b-41d4-a716-446655440001",
			},
			// Photo2: メインユーザーと佐藤
			{
				photoId: "550e8400-e29b-41d4-a716-446655440202",
				userId: "147060f0-93e1-4c13-98e3-723ed8cb20ee",
			},
			{
				photoId: "550e8400-e29b-41d4-a716-446655440202",
				userId: "550e8400-e29b-41d4-a716-446655440002",
			},
			// Photo3: 田中と佐藤
			{
				photoId: "550e8400-e29b-41d4-a716-446655440203",
				userId: "550e8400-e29b-41d4-a716-446655440001",
			},
			{
				photoId: "550e8400-e29b-41d4-a716-446655440203",
				userId: "550e8400-e29b-41d4-a716-446655440002",
			},
			// Photo4: 高橋、山田、渡辺
			{
				photoId: "550e8400-e29b-41d4-a716-446655440204",
				userId: "550e8400-e29b-41d4-a716-446655440004",
			},
			{
				photoId: "550e8400-e29b-41d4-a716-446655440204",
				userId: "550e8400-e29b-41d4-a716-446655440005",
			},
			{
				photoId: "550e8400-e29b-41d4-a716-446655440204",
				userId: "550e8400-e29b-41d4-a716-446655440006",
			},
		];

		for (const pu of photoUserPairs) {
			await db.insert(photoUsers).values(pu).onConflictDoNothing();
		}
		console.log("✅ 写真のタグ付けデータを作成しました");

		// コミュニケーションステータスを作成
		const testStatuses = [
			{
				userId: "147060f0-93e1-4c13-98e3-723ed8cb20ee",
				statusType: "office" as const,
				message: "オフィスで作業中",
				expiresAt: new Date(now.getTime() + 8 * 60 * 60 * 1000), // 8時間後
				createdAt: daysAgo(0),
				updatedAt: daysAgo(0),
			},
			{
				userId: "550e8400-e29b-41d4-a716-446655440001",
				statusType: "social" as const,
				message: "懇親会参加中",
				expiresAt: new Date(now.getTime() + 3 * 60 * 60 * 1000), // 3時間後
				createdAt: daysAgo(0),
				updatedAt: daysAgo(0),
			},
			{
				userId: "550e8400-e29b-41d4-a716-446655440002",
				statusType: "available" as const,
				message: "話しかけてOK！",
				expiresAt: null,
				createdAt: daysAgo(1),
				updatedAt: daysAgo(1),
			},
			{
				userId: "550e8400-e29b-41d4-a716-446655440003",
				statusType: "busy" as const,
				message: "締切に追われています",
				expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24時間後
				createdAt: daysAgo(0),
				updatedAt: daysAgo(0),
			},
			{
				userId: "550e8400-e29b-41d4-a716-446655440004",
				statusType: "office" as const,
				message: "会議室Aにいます",
				expiresAt: null,
				createdAt: daysAgo(2),
				updatedAt: daysAgo(2),
			},
			// 残りのユーザーはステータスなし（リスク分析用）
		];

		for (const status of testStatuses) {
			await db
				.insert(communicationStatuses)
				.values(status)
				.onConflictDoNothing();
		}
		console.log("✅ コミュニケーションステータスを作成しました");

		// アクティビティデータを作成
		const activityTypes: ActivityType[] = [
			"friend_added",
			"photo_uploaded",
			"joined_organization",
			"status_changed",
			"photo_tagged",
		];
		const testActivities: {
			userId: string;
			type: ActivityType;
			createdAt: Date;
		}[] = [];

		// アクティブなユーザーのアクティビティ
		for (let i = 0; i < 20; i++) {
			testActivities.push({
				userId: "147060f0-93e1-4c13-98e3-723ed8cb20ee",
				type: activityTypes[Math.floor(Math.random() * activityTypes.length)],
				createdAt: daysAgo(Math.floor(Math.random() * 30)),
			});
		}

		for (let i = 0; i < 15; i++) {
			testActivities.push({
				userId: "550e8400-e29b-41d4-a716-446655440001",
				type: activityTypes[Math.floor(Math.random() * activityTypes.length)],
				createdAt: daysAgo(Math.floor(Math.random() * 30)),
			});
		}

		for (let i = 0; i < 12; i++) {
			testActivities.push({
				userId: "550e8400-e29b-41d4-a716-446655440002",
				type: activityTypes[Math.floor(Math.random() * activityTypes.length)],
				createdAt: daysAgo(Math.floor(Math.random() * 45)),
			});
		}

		for (let i = 0; i < 8; i++) {
			testActivities.push({
				userId: "550e8400-e29b-41d4-a716-446655440003",
				type: activityTypes[Math.floor(Math.random() * activityTypes.length)],
				createdAt: daysAgo(Math.floor(Math.random() * 60)),
			});
		}

		// 中程度のアクティビティ
		for (let i = 0; i < 5; i++) {
			testActivities.push({
				userId: "550e8400-e29b-41d4-a716-446655440004",
				type: activityTypes[Math.floor(Math.random() * activityTypes.length)],
				createdAt: daysAgo(Math.floor(Math.random() * 30)),
			});
		}

		// 新規メンバー（高活動）
		for (let i = 0; i < 10; i++) {
			testActivities.push({
				userId: "550e8400-e29b-41d4-a716-446655440005",
				type: activityTypes[Math.floor(Math.random() * activityTypes.length)],
				createdAt: daysAgo(Math.floor(Math.random() * 25)),
			});
		}

		// 低活動メンバー（リスク高）
		testActivities.push({
			userId: "550e8400-e29b-41d4-a716-446655440006",
			type: "joined_organization",
			createdAt: daysAgo(100),
		});
		testActivities.push({
			userId: "550e8400-e29b-41d4-a716-446655440006",
			type: "status_changed",
			createdAt: daysAgo(80),
		});

		// 非アクティブメンバー（リスク高）
		testActivities.push({
			userId: "550e8400-e29b-41d4-a716-446655440007",
			type: "joined_organization",
			createdAt: daysAgo(45),
		});

		// 最近参加したメンバー
		for (let i = 0; i < 3; i++) {
			testActivities.push({
				userId: "550e8400-e29b-41d4-a716-446655440008",
				type: activityTypes[Math.floor(Math.random() * activityTypes.length)],
				createdAt: daysAgo(Math.floor(Math.random() * 10)),
			});
		}

		for (const activity of testActivities) {
			await db.insert(activities).values(activity).onConflictDoNothing();
		}
		console.log("✅ アクティビティデータを作成しました");

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
