"use client";

import {
	Bell,
	Building2,
	Camera,
	Check,
	UserPlus,
	Users,
	X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { markNotificationAsRead } from "@/actions/notification";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import type { NotificationWithRelations } from "@/entities/notification";
import { cn } from "@/lib/utils";

type NotificationListProps = {
	notifications: NotificationWithRelations[];
	pagination?: {
		currentPage: number;
		totalPages: number;
		totalCount: number;
	};
};

const iconMap = {
	join_request: Building2,
	join_approved: Check,
	join_rejected: X,
	photo_tagged: Camera,
	new_friend: UserPlus,
	member_removed: Users,
	role_changed: Users,
};

const typeColors = {
	join_approved:
		"bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
	join_rejected: "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400",
	new_friend:
		"bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
	photo_tagged:
		"bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
	join_request:
		"bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
	member_removed:
		"bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
	role_changed:
		"bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
};

export const NotificationList = ({
	notifications,
	pagination,
}: NotificationListProps) => {
	const router = useRouter();
	const [readNotifications, setReadNotifications] = useState<Set<string>>(
		new Set(),
	);

	const handleNotificationClick = async (
		notification: NotificationWithRelations,
	) => {
		if (!notification.isRead && !readNotifications.has(notification.id)) {
			try {
				await markNotificationAsRead(notification.id);
				setReadNotifications((prev) => new Set([...prev, notification.id]));
			} catch (error) {
				console.error("Failed to mark notification as read:", error);
			}
		}

		if (notification.relatedPhotoId) {
			router.push("/photos");
		} else if (notification.relatedOrganizationId) {
			router.push(`/organizations/${notification.relatedOrganizationId}`);
		} else if (notification.relatedUserId) {
			router.push(`/profile/${notification.relatedUserId}`);
		}
	};

	if (notifications.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center space-y-4 py-16">
				<Bell className="h-12 w-12 text-muted-foreground/50" />
				<div className="text-center">
					<p className="font-medium text-lg text-muted-foreground">
						No notifications yet
					</p>
					<p className="mt-1 text-muted-foreground text-sm">
						You'll see notifications here when there's activity
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{notifications.map((notification) => {
				const Icon = iconMap[notification.type] || Bell;
				const isRead =
					notification.isRead || readNotifications.has(notification.id);

				return (
					<Card
						key={notification.id}
						className={cn(
							"cursor-pointer transition-colors hover:bg-muted/50",
							!isRead && "border-primary/50 bg-muted/20",
						)}
						onClick={() => handleNotificationClick(notification)}
					>
						<CardContent className="flex items-start gap-3 p-3 sm:gap-4 sm:p-4">
							<div
								className={cn(
									"rounded-full p-2 sm:p-2.5",
									typeColors[notification.type] ||
										"bg-muted text-muted-foreground",
								)}
							>
								<Icon className="h-4 w-4 sm:h-5 sm:w-5" />
							</div>
							<div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
								<div className="flex items-start justify-between gap-2 sm:gap-4">
									<div className="min-w-0 space-y-0.5 sm:space-y-1">
										<p className="font-medium text-sm">{notification.title}</p>
										{notification.message && (
											<p className="line-clamp-2 text-muted-foreground text-xs sm:text-sm">
												{notification.message}
											</p>
										)}
									</div>
									{!isRead && (
										<Badge
											variant="default"
											className="shrink-0 text-[10px] sm:text-xs"
										>
											New
										</Badge>
									)}
								</div>
								<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground sm:gap-x-4 sm:text-xs">
									{notification.relatedUser && (
										<Link
											href={`/profile/${notification.relatedUser.id}`}
											className="flex items-center gap-1 hover:text-foreground sm:gap-1.5"
											onClick={(e) => e.stopPropagation()}
										>
											<Avatar className="h-3.5 w-3.5 sm:h-4 sm:w-4">
												<AvatarImage
													src={notification.relatedUser.avatarUrl || undefined}
													alt={notification.relatedUser.name || "User"}
												/>
												<AvatarFallback className="text-[6px] sm:text-[8px]">
													{notification.relatedUser.name?.[0]?.toUpperCase() ||
														"U"}
												</AvatarFallback>
											</Avatar>
											<span className="max-w-[100px] truncate sm:max-w-none">
												{notification.relatedUser.name}
											</span>
										</Link>
									)}
									{notification.relatedOrganization && (
										<Link
											href={`/organizations/${notification.relatedOrganization.id}`}
											className="flex items-center gap-1 hover:text-foreground sm:gap-1.5"
											onClick={(e) => e.stopPropagation()}
										>
											<Building2 className="h-2.5 w-2.5 flex-shrink-0 sm:h-3 sm:w-3" />
											<span className="max-w-[100px] truncate sm:max-w-none">
												{notification.relatedOrganization.name}
											</span>
										</Link>
									)}
									<span className="whitespace-nowrap">
										{new Date(notification.createdAt).toRelativeTime()}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				);
			})}

			{/* Pagination */}
			{pagination && pagination.totalPages > 1 && (
				<div className="mt-6">
					<Pagination>
						<PaginationContent>
							<PaginationItem>
								<PaginationPrevious
									href={`/?tab=notifications&page=${Math.max(1, pagination.currentPage - 1)}`}
									className={
										pagination.currentPage === 1
											? "pointer-events-none opacity-50"
											: ""
									}
								/>
							</PaginationItem>

							{/* Page numbers */}
							{(() => {
								const pages = [];
								const maxVisiblePages = 5;
								let startPage = Math.max(
									1,
									pagination.currentPage - Math.floor(maxVisiblePages / 2),
								);
								const endPage = Math.min(
									pagination.totalPages,
									startPage + maxVisiblePages - 1,
								);

								if (endPage - startPage + 1 < maxVisiblePages) {
									startPage = Math.max(1, endPage - maxVisiblePages + 1);
								}

								// First page + ellipsis
								if (startPage > 1) {
									pages.push(
										<PaginationItem key={1}>
											<PaginationLink
												href="/?tab=notifications&page=1"
												isActive={1 === pagination.currentPage}
											>
												1
											</PaginationLink>
										</PaginationItem>,
									);
									if (startPage > 2) {
										pages.push(
											<PaginationItem key="ellipsis-start">
												<PaginationEllipsis />
											</PaginationItem>,
										);
									}
								}

								// Page numbers
								for (let i = startPage; i <= endPage; i++) {
									pages.push(
										<PaginationItem key={i}>
											<PaginationLink
												href={`/?tab=notifications&page=${i}`}
												isActive={i === pagination.currentPage}
											>
												{i}
											</PaginationLink>
										</PaginationItem>,
									);
								}

								// Ellipsis + last page
								if (endPage < pagination.totalPages) {
									if (endPage < pagination.totalPages - 1) {
										pages.push(
											<PaginationItem key="ellipsis-end">
												<PaginationEllipsis />
											</PaginationItem>,
										);
									}
									pages.push(
										<PaginationItem key={pagination.totalPages}>
											<PaginationLink
												href={`/?tab=notifications&page=${pagination.totalPages}`}
												isActive={
													pagination.totalPages === pagination.currentPage
												}
											>
												{pagination.totalPages}
											</PaginationLink>
										</PaginationItem>,
									);
								}

								return pages;
							})()}

							<PaginationItem>
								<PaginationNext
									href={`/?tab=notifications&page=${Math.min(pagination.totalPages, pagination.currentPage + 1)}`}
									className={
										pagination.currentPage === pagination.totalPages
											? "pointer-events-none opacity-50"
											: ""
									}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				</div>
			)}
		</div>
	);
};

declare global {
	interface Date {
		toRelativeTime(): string;
	}
}

Date.prototype.toRelativeTime = function () {
	const seconds = Math.floor((Date.now() - this.getTime()) / 1000);

	let interval = Math.floor(seconds / 31536000);
	if (interval > 1) return `${interval} years ago`;
	if (interval === 1) return "1 year ago";

	interval = Math.floor(seconds / 2592000);
	if (interval > 1) return `${interval} months ago`;
	if (interval === 1) return "1 month ago";

	interval = Math.floor(seconds / 86400);
	if (interval > 1) return `${interval} days ago`;
	if (interval === 1) return "1 day ago";

	interval = Math.floor(seconds / 3600);
	if (interval > 1) return `${interval} hours ago`;
	if (interval === 1) return "1 hour ago";

	interval = Math.floor(seconds / 60);
	if (interval > 1) return `${interval} minutes ago`;
	if (interval === 1) return "1 minute ago";

	return "Just now";
};
