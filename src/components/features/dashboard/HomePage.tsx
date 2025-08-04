"use client";

import { Bell, Building2, Camera, Home, Network } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { loadMoreActivities } from "@/actions/timeline";
import { NetworkGraph } from "@/components/features/network/NetworkGraph";
import { NotificationList } from "@/components/features/notifications/NotificationList";
import { StatusButton } from "@/components/features/status/StatusButton";
import { Timeline } from "@/components/features/timeline/Timeline";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	type ActivityWithUser,
	convertToTimelineActivity,
	type TimelineActivity,
} from "@/entities/activity";
import type { CommunicationStatus } from "@/entities/communication-status";
import type { Friendship } from "@/entities/friendship";
import type { NotificationWithRelations } from "@/entities/notification";
import type { OrganizationMembership } from "@/entities/organization-membership";
import type { NetworkData } from "@/gateways/friendship/fetch-network-data";

const MobileDock = dynamic(
	() => import("./mobile-dock/MobileDock").then((mod) => mod.MobileDock),
	{
		ssr: false,
		loading: () => <div className="fixed right-0 bottom-0 left-0 z-50 h-20" />,
	},
);

type HomePageProps = {
	userId: string;
	membership: OrganizationMembership | null;
	organizationName: string | null;
	friendships: Friendship[];
	status: CommunicationStatus | null;
	activities: ActivityWithUser[];
	networkData: NetworkData;
	notifications: NotificationWithRelations[];
	notificationPagination: {
		currentPage: number;
		totalPages: number;
		totalCount: number;
	};
};

export default function HomePage({
	membership,
	activities,
	status,
	networkData,
	notifications,
	notificationPagination,
}: HomePageProps) {
	const searchParams = useSearchParams();
	const tabParam = searchParams.get("tab");
	const [selectedView, setSelectedView] = useState<
		"timeline" | "network" | "notifications"
	>("timeline");

	// Timeline state
	const [timelineActivities, setTimelineActivities] = useState<
		TimelineActivity[]
	>(activities.map(convertToTimelineActivity));
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [hasMoreActivities, setHasMoreActivities] = useState(
		activities.length >= 20,
	);

	useEffect(() => {
		if (tabParam === "notifications") {
			setSelectedView("notifications");
		} else if (tabParam === "network") {
			setSelectedView("network");
		} else {
			setSelectedView("timeline");
		}
	}, [tabParam]);

	const handleLoadMore = useCallback(async () => {
		setIsLoadingMore(true);
		try {
			const newActivities = await loadMoreActivities(timelineActivities.length);
			setTimelineActivities((prev) => [...prev, ...newActivities]);
			// If we get less than 20 activities, there are no more
			setHasMoreActivities(newActivities.length >= 20);
		} catch (error) {
			console.error("Failed to load more activities:", error);
		} finally {
			setIsLoadingMore(false);
		}
	}, [timelineActivities.length]);

	// 未読通知数を計算
	const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

	return (
		<div className="min-h-screen">
			{/* Desktop Layout */}
			<div className="mx-auto hidden max-w-6xl grid-cols-[280px_1fr] gap-6 p-6 md:grid">
				{/* Left Sidebar */}
				<aside className="space-y-6">
					<div className="sticky top-[15%] space-y-6">
						{/* Upload Photo Button */}
						<div className="space-y-3">
							<div className="text-center">
								<p className="text-muted-foreground text-xs">
									Take photos and make new friends!
								</p>
							</div>
							<Button
								asChild
								className="group relative w-full overflow-hidden bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg transition-all hover:from-primary/90 hover:to-primary/70 hover:shadow-xl"
								size="lg"
							>
								<Link
									href="/photos/upload"
									className="flex items-center justify-center gap-2 py-4"
								>
									<Camera className="h-5 w-5 transition-transform group-hover:scale-110" />
									<span className="font-medium">Upload Photo</span>
								</Link>
							</Button>
						</div>

						{/* Navigation */}
						<nav className="space-y-1">
							<button
								type="button"
								onClick={() => setSelectedView("timeline")}
								className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-sm transition-all hover:bg-muted/50 ${
									selectedView === "timeline"
										? "bg-muted text-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{selectedView === "timeline" && (
									<div className="absolute inset-y-0 left-0 w-1 rounded-full bg-primary" />
								)}
								<Home className="h-5 w-5 shrink-0" />
								<span>Timeline</span>
							</button>
							<button
								type="button"
								onClick={() => setSelectedView("network")}
								className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-sm transition-all hover:bg-muted/50 ${
									selectedView === "network"
										? "bg-muted text-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{selectedView === "network" && (
									<div className="absolute inset-y-0 left-0 w-1 rounded-full bg-primary" />
								)}
								<Network className="h-5 w-5 shrink-0" />
								<span>Network</span>
							</button>
							<button
								type="button"
								onClick={() => setSelectedView("notifications")}
								className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-sm transition-all hover:bg-muted/50 ${
									selectedView === "notifications"
										? "bg-muted text-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{selectedView === "notifications" && (
									<div className="absolute inset-y-0 left-0 w-1 rounded-full bg-primary" />
								)}
								<Bell className="h-5 w-5 shrink-0" />
								<span>Notifications</span>
							</button>
						</nav>

						<Separator className="my-4" />

						{/* Status Button */}
						<StatusButton currentStatus={status} />
					</div>
				</aside>

				{/* Main Content */}
				<main className="min-h-screen">
					<div className="rounded-2xl shadow-sm">
						{selectedView === "timeline" ? (
							<div className="p-6">
								<div className="mb-6">
									<h1 className="font-semibold text-2xl">Timeline</h1>
									<p className="mt-1 text-muted-foreground">
										See what's happening in your network
									</p>
								</div>

								{(!membership || membership.status !== "approved") && (
									<Alert className="mb-6">
										<Building2 className="h-4 w-4" />
										<AlertTitle>Join an organization first</AlertTitle>
										<AlertDescription>
											To see activities in your timeline, you need to be part of
											an organization.{" "}
											<Link
												href="/organizations"
												className="font-medium underline underline-offset-2"
											>
												Browse organizations
											</Link>
										</AlertDescription>
									</Alert>
								)}

								<div className="divide-y divide-border/50">
									<Timeline
										activities={timelineActivities}
										hasMore={hasMoreActivities}
										isLoading={isLoadingMore}
										onLoadMore={handleLoadMore}
									/>
								</div>
							</div>
						) : selectedView === "network" ? (
							<div className="p-6">
								<div className="mb-6">
									<h1 className="font-semibold text-2xl">Your Network</h1>
									<p className="mt-1 text-muted-foreground">
										Visualize your connections
									</p>
								</div>
								<div className="rounded-xl bg-background/50 p-6">
									<NetworkGraph networkData={networkData} />
								</div>
							</div>
						) : (
							<div className="p-6">
								<div className="mb-6">
									<h1 className="font-semibold text-2xl">Notifications</h1>
									<p className="mt-1 text-muted-foreground">
										Stay updated with your network activity
									</p>
								</div>
								<NotificationList
									notifications={notifications}
									pagination={notificationPagination}
								/>
							</div>
						)}
					</div>
				</main>
			</div>

			{/* Mobile Layout */}
			<div className="md:hidden">
				{/* Mobile Content - Full width */}
				<main className="min-h-screen pb-20">
					<div className="max-w-2xl">
						{selectedView === "timeline" ? (
							<>
								<div className="mb-4">
									<h1 className="font-semibold text-xl">Timeline</h1>
									<p className="text-muted-foreground text-sm">
										What's happening
									</p>
								</div>

								{(!membership || membership.status !== "approved") && (
									<Alert className="mb-4">
										<Building2 className="h-4 w-4" />
										<AlertTitle>Join an organization first</AlertTitle>
										<AlertDescription>
											To see activities in your timeline, you need to be part of
											an organization.{" "}
											<Link
												href="/organizations"
												className="font-medium underline underline-offset-2"
											>
												Browse organizations
											</Link>
										</AlertDescription>
									</Alert>
								)}

								<div className="divide-y divide-border/50">
									<Timeline
										activities={timelineActivities}
										hasMore={hasMoreActivities}
										isLoading={isLoadingMore}
										onLoadMore={handleLoadMore}
									/>
								</div>
							</>
						) : selectedView === "network" ? (
							<>
								<div className="mb-4">
									<h1 className="font-semibold text-xl">Your Network</h1>
									<p className="text-muted-foreground text-sm">
										Your connections
									</p>
								</div>
								<div className="rounded-xl bg-background/50 p-4">
									<NetworkGraph networkData={networkData} />
								</div>
							</>
						) : (
							<>
								<div className="mb-4">
									<h1 className="font-semibold text-xl">Notifications</h1>
									<p className="text-muted-foreground text-sm">Stay updated</p>
								</div>
								<NotificationList
									notifications={notifications}
									pagination={notificationPagination}
								/>
							</>
						)}
					</div>
				</main>

				{/* Mobile Dock */}
				<MobileDock
					selectedView={selectedView}
					onViewChange={setSelectedView}
					currentStatus={status}
					notificationCount={unreadNotificationCount}
				/>
			</div>
		</div>
	);
}
