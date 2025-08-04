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
import { useRouter } from "next/navigation";
import { markNotificationAsRead } from "@/actions/notification";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { Notification } from "@/entities/notification";
import { cn } from "@/lib/utils";

type NotificationItemProps = {
	notification: Notification;
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

export const NotificationItem = ({ notification }: NotificationItemProps) => {
	const router = useRouter();
	const Icon = iconMap[notification.type] || Bell;

	const handleClick = async () => {
		// Mark as read if not already
		if (!notification.isRead) {
			try {
				await markNotificationAsRead(notification.id);
			} catch (error) {
				console.error("Failed to mark notification as read:", error);
			}
		}

		// Navigate to relevant page
		if (notification.relatedPhotoId) {
			router.push("/photos");
		} else if (notification.relatedOrganizationId) {
			router.push(`/organizations/${notification.relatedOrganizationId}`);
		} else if (notification.relatedUserId) {
			router.push(`/profile/${notification.relatedUserId}`);
		}
	};

	return (
		<DropdownMenuItem
			onClick={handleClick}
			className={cn(
				"flex items-start gap-2 p-2.5 sm:gap-3 sm:p-3",
				!notification.isRead && "bg-muted/50",
			)}
		>
			<div
				className={cn(
					"mt-0.5 rounded-full p-1.5 sm:p-2",
					notification.type === "join_approved" &&
						"bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
					notification.type === "join_rejected" &&
						"bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400",
					notification.type === "new_friend" &&
						"bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
					notification.type === "photo_tagged" &&
						"bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
					notification.type === "join_request" &&
						"bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
					!iconMap[notification.type] && "bg-muted text-muted-foreground",
				)}
			>
				<Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
			</div>
			<div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
				<p className="font-medium text-xs leading-none sm:text-sm">
					{notification.title}
				</p>
				{notification.message && (
					<p className="line-clamp-2 text-[11px] text-muted-foreground sm:text-sm">
						{notification.message}
					</p>
				)}
				<p className="text-[10px] text-muted-foreground sm:text-xs">
					{new Date(notification.createdAt).toLocaleDateString()}
				</p>
			</div>
			{!notification.isRead && (
				<div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary sm:mt-2 sm:h-2 sm:w-2" />
			)}
		</DropdownMenuItem>
	);
};
