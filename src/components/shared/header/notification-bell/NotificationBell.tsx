import { Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	fetchLatestNotifications,
	fetchUnreadNotificationCount,
} from "@/gateways/notification";
import { fetchCurrentUser } from "@/gateways/user";
import { NotificationItem } from "./NotificationItem";

export const NotificationBell = async () => {
	const user = await fetchCurrentUser();
	if (!user) return null;

	const [unreadCount, recentNotifications] = await Promise.all([
		fetchUnreadNotificationCount(user.id),
		fetchLatestNotifications(user.id, 10),
	]);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="relative">
					<Bell className="h-5 w-5" />
					{unreadCount > 0 && (
						<span className="-top-1 -right-1 absolute flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
							{unreadCount > 9 ? "9+" : unreadCount}
						</span>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" alignOffset={-16} className="w-80">
				<DropdownMenuLabel>Notifications</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{recentNotifications.length === 0 ? (
					<div className="p-4 text-center text-muted-foreground text-sm">
						No notifications
					</div>
				) : (
					<>
						<div className="max-h-[400px] overflow-y-auto">
							{recentNotifications.map((notification) => (
								<NotificationItem
									key={notification.id}
									notification={notification}
								/>
							))}
						</div>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link
								href="/?tab=notifications"
								className="w-full justify-center text-sm"
							>
								View all notifications
							</Link>
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
