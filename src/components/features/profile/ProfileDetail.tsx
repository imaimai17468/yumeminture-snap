"use client";

import { AlertTriangle, UserCircle } from "lucide-react";
import { useState } from "react";
import { Timeline } from "@/components/features/timeline/Timeline";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
	type ActivityWithUser,
	convertToTimelineActivity,
} from "@/entities/activity";
import type { Friendship } from "@/entities/friendship";
import type { User } from "@/entities/user";
import { formatDistanceToNow } from "@/lib/date";

// Helper component for user avatar
const UserAvatar = ({
	user,
	size = "md",
}: {
	user: User;
	size?: "sm" | "md" | "lg";
}) => {
	const sizeClasses = {
		sm: "h-8 w-8 sm:h-10 sm:w-10",
		md: "h-10 w-10 sm:h-12 sm:w-12",
		lg: "h-16 w-16 sm:h-20 sm:w-20",
	};
	const textSizeClasses = {
		sm: "text-xs sm:text-sm",
		md: "text-base sm:text-lg",
		lg: "text-lg sm:text-xl",
	};

	return (
		<Avatar className={sizeClasses[size]}>
			<AvatarImage
				src={user.avatarUrl || undefined}
				alt={user.name || "User"}
			/>
			<AvatarFallback className={textSizeClasses[size]}>
				{user.name?.[0]?.toUpperCase() || "U"}
			</AvatarFallback>
		</Avatar>
	);
};

type ProfileDetailProps = {
	profileUser: User;
	friendship: Friendship | null;
	activities: ActivityWithUser[];
	friendsCount: number;
	photosCount: number;
	isCurrentUser: boolean;
	onUnfriend?: (friendshipId: string) => void | Promise<void>;
};

export const ProfileDetail = ({
	profileUser,
	friendship,
	activities,
	friendsCount,
	photosCount,
	isCurrentUser,
	onUnfriend,
}: ProfileDetailProps) => {
	const [showUnfriendDialog, setShowUnfriendDialog] = useState(false);
	const isFriend = !!friendship;

	const handleUnfriend = () => {
		if (friendship && onUnfriend) {
			onUnfriend(friendship.id);
			setShowUnfriendDialog(false);
		}
	};

	return (
		<div className="container mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
			{/* Profile Header */}
			<div className="mb-6 sm:mb-8">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="flex items-center gap-3 sm:gap-4">
						<UserAvatar user={profileUser} size="lg" />
						<div>
							<h1 className="font-bold text-xl sm:text-2xl">
								{profileUser.name || "Unknown User"}
							</h1>
							{isFriend && friendship && (
								<p className="mt-0.5 text-muted-foreground text-xs sm:mt-1 sm:text-sm">
									Friends since{" "}
									{formatDistanceToNow(new Date(friendship.createdAt))}
								</p>
							)}
						</div>
					</div>
					{isFriend && friendship && onUnfriend && !isCurrentUser && (
						<Button
							onClick={() => setShowUnfriendDialog(true)}
							variant="outline"
							size="sm"
							className="w-full sm:w-auto"
						>
							Unfriend
						</Button>
					)}
				</div>

				{/* Stats */}
				<div className="mt-4 flex gap-6 sm:mt-6 sm:gap-8">
					<a
						href={`/friends/${profileUser.id}`}
						className="transition-colors hover:text-primary"
					>
						<span className="font-bold text-lg sm:text-xl">{friendsCount}</span>
						<span className="ml-1 text-muted-foreground text-sm sm:text-base">
							friends
						</span>
					</a>
					<div>
						<span className="font-bold text-lg sm:text-xl">{photosCount}</span>
						<span className="ml-1 text-muted-foreground text-sm sm:text-base">
							photos
						</span>
					</div>
				</div>

				{/* Not Friends Message */}
				{!isFriend && !isCurrentUser && (
					<Card className="mt-4 sm:mt-6">
						<CardContent className="flex flex-col items-center py-6 text-center sm:py-8">
							<UserCircle className="mb-3 h-12 w-12 text-muted-foreground sm:mb-4 sm:h-16 sm:w-16" />
							<h3 className="mb-1.5 font-semibold text-base sm:mb-2 sm:text-lg">
								Not Friends Yet
							</h3>
							<p className="text-muted-foreground text-sm sm:text-base">
								Take a photo together to become friends!
							</p>
						</CardContent>
					</Card>
				)}
			</div>

			<Separator className="my-6 sm:my-8" />

			{/* User Activities */}
			{activities.length > 0 && (
				<div className="mt-6 sm:mt-8">
					<h2 className="mb-3 font-semibold text-lg sm:mb-4 sm:text-xl">
						Recent Activities
					</h2>
					<Timeline activities={activities.map(convertToTimelineActivity)} />
				</div>
			)}

			{/* Unfriend Confirmation Dialog */}
			<Dialog open={showUnfriendDialog} onOpenChange={setShowUnfriendDialog}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Unfriend {profileUser.name}?</DialogTitle>
					</DialogHeader>
					<div className="space-y-3 py-3 sm:space-y-4 sm:py-4">
						<Alert className="border-destructive/50 text-destructive">
							<AlertTriangle className="h-4 w-4" />
							<AlertTitle className="text-sm sm:text-base">Warning</AlertTitle>
							<AlertDescription className="text-xs sm:text-sm">
								This action cannot be undone. You'll need to take another photo
								together to become friends again.
							</AlertDescription>
						</Alert>
						<p className="text-muted-foreground text-xs sm:text-sm">
							Are you sure you want to continue?
						</p>
					</div>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							onClick={() => setShowUnfriendDialog(false)}
							className="w-full sm:w-auto"
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleUnfriend}
							className="w-full sm:w-auto"
						>
							Unfriend
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};
