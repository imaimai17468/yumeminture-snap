"use client";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
	AlertTriangle,
	BarChart3,
	Calendar,
	Camera,
	MessageSquare,
	TrendingDown,
	TrendingUp,
	Users,
} from "lucide-react";
import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Organization } from "@/entities/organization";
import { cn } from "@/lib/utils";

dayjs.extend(relativeTime);

type AnalyticsData = {
	members: Array<{
		id: string;
		userId: string;
		organizationId: string;
		role: "admin" | "member";
		status: "pending" | "approved" | "rejected";
		joinedAt: string | null;
		createdAt: string;
		updatedAt: string;
		user: {
			id: string;
			name: string | null;
			avatarUrl: string | null;
			createdAt: string;
			updatedAt: string;
		};
	}>;
	activities: Array<{
		id: string;
		userId: string;
		type: string;
		createdAt: string;
	}>;
	photos: Array<{
		id: string;
		uploadedBy: string;
		createdAt: string;
		taggedUsers: string[];
	}>;
	communicationStatuses: Array<{
		id: string;
		userId: string;
		statusType: string;
		createdAt: string;
		updatedAt: string;
		expiresAt: string | null;
	}>;
	friendships: Array<{
		id: string;
		userId1: string;
		userId2: string;
		createdAt: string;
	}>;
};

type OrganizationAnalyticsProps = {
	organization: Organization;
	analyticsData: AnalyticsData;
};

type MemberAnalytics = {
	userId: string;
	user: AnalyticsData["members"][0]["user"];
	joinedAt: string | null;
	communicationScore: number;
	engagementScore: number;
	retentionRisk: "low" | "medium" | "high";
	lastActiveAt: string | null;
	activityCount: number;
	photoCount: number;
	friendCount: number;
	currentStatus: string | null;
	riskFactors: string[];
};

export const OrganizationAnalytics = ({
	organization,
	analyticsData,
}: OrganizationAnalyticsProps) => {
	const memberAnalytics = useMemo<MemberAnalytics[]>(() => {
		return analyticsData.members.map((member) => {
			// メンバーのアクティビティ
			const memberActivities = analyticsData.activities.filter(
				(a) => a.userId === member.userId,
			);

			// メンバーがアップロードした写真
			const memberPhotos = analyticsData.photos.filter(
				(p) => p.uploadedBy === member.userId,
			);

			// メンバーがタグ付けされた写真
			const taggedInPhotos = analyticsData.photos.filter((p) =>
				p.taggedUsers.includes(member.userId),
			);

			// メンバーの友達関係
			const memberFriendships = analyticsData.friendships.filter(
				(f) => f.userId1 === member.userId || f.userId2 === member.userId,
			);

			// メンバーの友達のユーザーID
			const friendIds = memberFriendships.map((f) =>
				f.userId1 === member.userId ? f.userId2 : f.userId1,
			);

			// 組織内の友達数
			const orgFriendCount = friendIds.filter((friendId) =>
				analyticsData.members.some((m) => m.userId === friendId),
			).length;

			// 現在のステータス
			const currentStatus = analyticsData.communicationStatuses.find(
				(cs) => cs.userId === member.userId,
			);

			// 最終アクティビティ日時
			const lastActivityDates = [
				...memberActivities.map((a) => new Date(a.createdAt)),
				...memberPhotos.map((p) => new Date(p.createdAt)),
				currentStatus ? new Date(currentStatus.updatedAt) : null,
			].filter(Boolean) as Date[];

			const lastActiveAt = lastActivityDates.length
				? new Date(
						Math.max(...lastActivityDates.map((d) => d.getTime())),
					).toISOString()
				: member.joinedAt;

			// コミュニケーションスコアの計算（0-100）
			// 要素: 写真の数、タグ付け頻度、友達の数、ステータス更新頻度
			const photoScore = Math.min(memberPhotos.length * 5, 25); // 最大25点
			const taggedScore = Math.min(taggedInPhotos.length * 3, 25); // 最大25点
			const friendScore = Math.min(orgFriendCount * 10, 25); // 最大25点
			const statusScore = currentStatus ? 25 : 0; // 最大25点
			const communicationScore =
				photoScore + taggedScore + friendScore + statusScore;

			// エンゲージメントスコアの計算（0-100）
			// 要素: アクティビティ頻度、最終活動からの経過日数
			const daysSinceJoined = lastActiveAt
				? dayjs().diff(dayjs(member.joinedAt), "days")
				: 1;
			const activityFrequency =
				memberActivities.length / Math.max(daysSinceJoined, 1);
			const daysSinceLastActive = lastActiveAt
				? dayjs().diff(dayjs(lastActiveAt), "days")
				: 999;

			const activityScore = Math.min(activityFrequency * 100, 50); // 最大50点
			const recencyScore = Math.max(50 - daysSinceLastActive * 2, 0); // 最大50点
			const engagementScore = activityScore + recencyScore;

			// リスク要因の分析
			const riskFactors: string[] = [];

			// 30日以上活動なし
			if (daysSinceLastActive > 30) {
				riskFactors.push("No activity for over 30 days");
			}

			// 友達が少ない（2人以下）
			if (orgFriendCount <= 2) {
				riskFactors.push("Few connections within organization");
			}

			// 写真投稿なし
			if (memberPhotos.length === 0) {
				riskFactors.push("No photos shared");
			}

			// ステータス未設定
			if (!currentStatus) {
				riskFactors.push("Communication status not set");
			}

			// 参加から90日以上経過しているが活動が少ない
			if (daysSinceJoined > 90 && memberActivities.length < 10) {
				riskFactors.push("Low activity despite long membership");
			}

			// 離職リスクの判定
			let retentionRisk: "low" | "medium" | "high" = "low";
			if (engagementScore < 20 || riskFactors.length >= 3) {
				retentionRisk = "high";
			} else if (engagementScore < 50 || riskFactors.length >= 2) {
				retentionRisk = "medium";
			}

			return {
				userId: member.userId,
				user: member.user,
				joinedAt: member.joinedAt,
				communicationScore,
				engagementScore,
				retentionRisk,
				lastActiveAt,
				activityCount: memberActivities.length,
				photoCount: memberPhotos.length,
				friendCount: orgFriendCount,
				currentStatus: currentStatus?.statusType || null,
				riskFactors,
			};
		});
	}, [analyticsData]);

	// 集計データ
	const summary = useMemo(() => {
		const avgCommunicationScore =
			memberAnalytics.reduce((sum, m) => sum + m.communicationScore, 0) /
			memberAnalytics.length;
		const avgEngagementScore =
			memberAnalytics.reduce((sum, m) => sum + m.engagementScore, 0) /
			memberAnalytics.length;
		const highRiskCount = memberAnalytics.filter(
			(m) => m.retentionRisk === "high",
		).length;
		const mediumRiskCount = memberAnalytics.filter(
			(m) => m.retentionRisk === "medium",
		).length;
		const activeInLast7Days = memberAnalytics.filter(
			(m) => m.lastActiveAt && dayjs().diff(dayjs(m.lastActiveAt), "days") <= 7,
		).length;

		return {
			avgCommunicationScore,
			avgEngagementScore,
			highRiskCount,
			mediumRiskCount,
			activeInLast7Days,
			activeRate: (activeInLast7Days / memberAnalytics.length) * 100,
		};
	}, [memberAnalytics]);

	return (
		<div className="space-y-6">
			{/* 組織情報ヘッダー */}
			<div className="space-y-1">
				<h1 className="font-bold text-2xl">{organization.name} Analytics</h1>
				<p className="text-muted-foreground">
					Member engagement and retention analysis
				</p>
			</div>

			{/* サマリーカード */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Communication Score
						</CardTitle>
						<MessageSquare className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{summary.avgCommunicationScore.toFixed(1)}
						</div>
						<p className="text-muted-foreground text-xs">
							Average score out of 100
						</p>
						<Progress
							value={summary.avgCommunicationScore}
							className="mt-2 h-2"
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Engagement Score
						</CardTitle>
						<BarChart3 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{summary.avgEngagementScore.toFixed(1)}
						</div>
						<p className="text-muted-foreground text-xs">
							Average score out of 100
						</p>
						<Progress value={summary.avgEngagementScore} className="mt-2 h-2" />
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Retention Risk
						</CardTitle>
						<AlertTriangle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="flex items-baseline gap-2">
							<span className="font-bold text-2xl text-red-600">
								{summary.highRiskCount}
							</span>
							<span className="text-muted-foreground text-sm">high risk</span>
						</div>
						<p className="text-muted-foreground text-xs">
							{summary.mediumRiskCount} medium risk members
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Active Rate</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{summary.activeRate.toFixed(0)}%
						</div>
						<p className="text-muted-foreground text-xs">
							Active in last 7 days
						</p>
						<Progress value={summary.activeRate} className="mt-2 h-2" />
					</CardContent>
				</Card>
			</div>

			{/* メンバー詳細テーブル */}
			<Card>
				<CardHeader>
					<CardTitle>Member Analytics</CardTitle>
					<CardDescription>
						Detailed analysis of each member's engagement and retention risk
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Member</TableHead>
								<TableHead>Joined</TableHead>
								<TableHead>Last Active</TableHead>
								<TableHead className="text-center">Communication</TableHead>
								<TableHead className="text-center">Engagement</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Risk</TableHead>
								<TableHead className="text-right">Details</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{memberAnalytics
								.sort((a, b) => {
									// リスクの高い順にソート
									const riskOrder = { high: 0, medium: 1, low: 2 };
									return (
										riskOrder[a.retentionRisk] - riskOrder[b.retentionRisk]
									);
								})
								.map((member) => (
									<TableRow key={member.userId}>
										<TableCell>
											<div className="flex items-center gap-2">
												<Avatar className="h-8 w-8">
													<AvatarImage
														src={member.user.avatarUrl || undefined}
														alt={member.user.name || "User"}
													/>
													<AvatarFallback>
														{member.user.name?.[0]?.toUpperCase() || "U"}
													</AvatarFallback>
												</Avatar>
												<span className="font-medium">
													{member.user.name || "Unknown"}
												</span>
											</div>
										</TableCell>
										<TableCell>
											{member.joinedAt
												? dayjs(member.joinedAt).format("MMM D, YYYY")
												: "-"}
										</TableCell>
										<TableCell>
											{member.lastActiveAt ? (
												<span
													className={cn(
														"text-sm",
														dayjs().diff(dayjs(member.lastActiveAt), "days") >
															7 && "text-muted-foreground",
													)}
												>
													{dayjs(member.lastActiveAt).fromNow()}
												</span>
											) : (
												"-"
											)}
										</TableCell>
										<TableCell className="text-center">
											<div className="flex flex-col items-center gap-1">
												<span className="font-medium">
													{member.communicationScore}
												</span>
												<Progress
													value={member.communicationScore}
													className="h-1.5 w-16"
												/>
											</div>
										</TableCell>
										<TableCell className="text-center">
											<div className="flex flex-col items-center gap-1">
												<span className="font-medium">
													{member.engagementScore.toFixed(0)}
												</span>
												<Progress
													value={member.engagementScore}
													className="h-1.5 w-16"
												/>
											</div>
										</TableCell>
										<TableCell>
											{member.currentStatus ? (
												<Badge variant="outline" className="capitalize">
													{member.currentStatus}
												</Badge>
											) : (
												<span className="text-muted-foreground text-sm">
													Not set
												</span>
											)}
										</TableCell>
										<TableCell>
											<Badge
												variant={
													member.retentionRisk === "high"
														? "destructive"
														: member.retentionRisk === "medium"
															? "secondary"
															: "default"
												}
												className="capitalize"
											>
												{member.retentionRisk === "high" ? (
													<TrendingDown className="mr-1 h-3 w-3" />
												) : member.retentionRisk === "low" ? (
													<TrendingUp className="mr-1 h-3 w-3" />
												) : null}
												{member.retentionRisk}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex items-center justify-end gap-3 text-muted-foreground text-xs">
												<span className="flex items-center gap-1">
													<Camera className="h-3 w-3" />
													{member.photoCount}
												</span>
												<span className="flex items-center gap-1">
													<Users className="h-3 w-3" />
													{member.friendCount}
												</span>
												<span className="flex items-center gap-1">
													<Calendar className="h-3 w-3" />
													{member.activityCount}
												</span>
											</div>
										</TableCell>
									</TableRow>
								))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* リスク要因の詳細 */}
			{memberAnalytics.filter((m) => m.retentionRisk !== "low").length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Risk Factors</CardTitle>
						<CardDescription>
							Detailed breakdown of retention risk factors for at-risk members
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{memberAnalytics
								.filter((m) => m.retentionRisk !== "low")
								.map((member) => (
									<div
										key={member.userId}
										className="space-y-2 rounded-lg border p-4"
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Avatar className="h-6 w-6">
													<AvatarImage
														src={member.user.avatarUrl || undefined}
														alt={member.user.name || "User"}
													/>
													<AvatarFallback className="text-xs">
														{member.user.name?.[0]?.toUpperCase() || "U"}
													</AvatarFallback>
												</Avatar>
												<span className="font-medium text-sm">
													{member.user.name || "Unknown"}
												</span>
											</div>
											<Badge
												variant={
													member.retentionRisk === "high"
														? "destructive"
														: "secondary"
												}
												className="text-xs capitalize"
											>
												{member.retentionRisk} risk
											</Badge>
										</div>
										<div className="space-y-1">
											{member.riskFactors.map((factor) => (
												<div
													key={`${member.userId}-${factor}`}
													className="flex items-center gap-2 text-muted-foreground text-xs"
												>
													<AlertTriangle className="h-3 w-3" />
													<span>{factor}</span>
												</div>
											))}
										</div>
									</div>
								))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
};
