import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/en";
import {
	Building2,
	Camera,
	Loader2,
	MessageSquare,
	MoreHorizontal,
	Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TimelineActivity } from "@/entities/activity";

// Helper component for user chips
const UserChip = ({
	user,
}: {
	user: { id: string; name: string | null; avatarUrl: string | null };
}) => (
	<Link
		href={`/profile/${user.id}`}
		className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 transition-colors hover:bg-muted/80 sm:gap-2 sm:px-3 sm:py-1.5"
	>
		<Avatar className="h-4 w-4 sm:h-5 sm:w-5">
			<AvatarImage
				src={user.avatarUrl || undefined}
				alt={user.name || "User"}
			/>
			<AvatarFallback className="text-[8px] sm:text-[10px]">
				{user.name?.[0]?.toUpperCase() || "U"}
			</AvatarFallback>
		</Avatar>
		<span className="text-xs sm:text-sm">{user.name || "Unknown"}</span>
	</Link>
);

dayjs.extend(relativeTime);
dayjs.locale("en");

// Helper function to render activity-specific details
const renderActivityDetails = (activity: TimelineActivity) => {
	if (activity.type === "friend_added" && activity.relatedUser) {
		return (
			<>
				{" "}
				<Link
					href={`/profile/${activity.relatedUser.id}`}
					className="inline-flex items-center gap-1 font-medium text-foreground transition-colors hover:text-primary"
				>
					<Avatar className="inline-block h-4 w-4">
						<AvatarImage
							src={activity.relatedUser.avatarUrl || undefined}
							alt={activity.relatedUser.name || "User"}
						/>
						<AvatarFallback className="text-[10px]">
							{activity.relatedUser.name?.[0]?.toUpperCase() || "U"}
						</AvatarFallback>
					</Avatar>
					{activity.relatedUser.name || "Unknown User"}
				</Link>
			</>
		);
	}

	if (
		(activity.type === "joined_organization" ||
			activity.type === "left_organization" ||
			activity.type === "organization_created") &&
		activity.metadata.organizationId
	) {
		return (
			<>
				{" "}
				<Link
					href={`/organizations/${activity.metadata.organizationId}`}
					className="font-medium text-foreground transition-colors hover:text-primary"
				>
					{activity.metadata.organizationName}
				</Link>
			</>
		);
	}

	return null;
};

type TimelineProps = {
	activities: TimelineActivity[];
	hasMore?: boolean;
	isLoading?: boolean;
	onLoadMore?: () => void;
};

const getActivityIcon = (type: TimelineActivity["type"]) => {
	switch (type) {
		case "friend_added":
			return <Users className="h-4 w-4" />;
		case "photo_uploaded":
		case "photo_tagged":
			return <Camera className="h-4 w-4" />;
		case "joined_organization":
		case "left_organization":
		case "organization_created":
			return <Building2 className="h-4 w-4" />;
		case "status_changed":
			return <MessageSquare className="h-4 w-4" />;
	}
};

const getActivityColor = (type: TimelineActivity["type"]) => {
	switch (type) {
		case "friend_added":
			return "text-green-500";
		case "photo_uploaded":
		case "photo_tagged":
			return "text-purple-500";
		case "joined_organization":
		case "organization_created":
			return "text-blue-500";
		case "left_organization":
			return "text-red-500";
		case "status_changed":
			return "text-orange-500";
	}
};

const getStatusColor = (statusType: string) => {
	switch (statusType) {
		case "office":
			return "ring-blue-500";
		case "social":
			return "ring-green-500";
		case "available":
			return "ring-emerald-500";
		case "busy":
			return "ring-orange-500";
		default:
			return "ring-gray-500";
	}
};

export const Timeline = ({
	activities,
	hasMore,
	isLoading,
	onLoadMore,
}: TimelineProps) => {
	if (activities.length === 0 && !isLoading) {
		return (
			<Card>
				<CardContent className="py-12">
					<div className="space-y-2 text-center">
						<Camera className="mx-auto h-12 w-12 text-muted-foreground" />
						<h3 className="font-semibold text-lg">No activities yet</h3>
						<p className="text-muted-foreground">
							When you or your friends share moments, they'll appear here
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			{activities.map((activity) => (
				<Card key={activity.id} className="overflow-hidden">
					<CardHeader className="p-4 pb-3 sm:p-6 sm:pb-3">
						<div className="flex items-start justify-between">
							<div className="flex items-start gap-2 sm:items-center sm:gap-3">
								<Link
									href={`/profile/${activity.userId}`}
									className="flex-shrink-0 transition-opacity hover:opacity-80"
								>
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Avatar
													className={`h-8 w-8 sm:h-10 sm:w-10 ${
														activity.currentStatus
															? `ring-2 ring-offset-1 ring-offset-background sm:ring-offset-2 ${getStatusColor(activity.currentStatus.statusType)}`
															: ""
													}`}
												>
													<AvatarImage
														src={activity.userAvatar || undefined}
														alt={activity.userName}
													/>
													<AvatarFallback className="text-xs sm:text-base">
														{activity.userName[0]}
													</AvatarFallback>
												</Avatar>
											</TooltipTrigger>
											{activity.currentStatus?.message && (
												<TooltipContent>
													<p>{activity.currentStatus.message}</p>
												</TooltipContent>
											)}
										</Tooltip>
									</TooltipProvider>
								</Link>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-1.5 sm:gap-2">
										<Link
											href={`/profile/${activity.userId}`}
											className="truncate font-semibold text-sm transition-colors hover:text-primary sm:text-base"
										>
											{activity.userName}
										</Link>
										<span
											className={`flex-shrink-0 ${getActivityColor(activity.type)}`}
										>
											{getActivityIcon(activity.type)}
										</span>
									</div>
									<p className="flex flex-wrap items-center gap-x-2 text-muted-foreground text-xs sm:text-sm">
										<span>{activity.description}</span>
										{renderActivityDetails(activity)}
										<span className="whitespace-nowrap">
											• {dayjs(activity.createdAt).fromNow()}
										</span>
									</p>
								</div>
							</div>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 flex-shrink-0"
									>
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem>Hide this activity</DropdownMenuItem>
									<DropdownMenuItem>Report</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</CardHeader>

					{activity.type === "photo_uploaded" && activity.photoUrl ? (
						<CardContent className="space-y-3 p-4 pt-0 sm:space-y-4 sm:p-4">
							<div className="mx-auto w-full sm:max-w-md">
								<div className="relative aspect-square overflow-hidden rounded-lg">
									<Image
										src={activity.photoUrl}
										alt="Uploaded photo"
										fill
										className="object-cover"
									/>
								</div>
							</div>
							{activity.metadata.taggedUsers.length > 0 && (
								<div>
									<p className="mb-1.5 text-muted-foreground text-xs sm:mb-2 sm:text-sm">
										With
									</p>
									<div className="flex flex-wrap gap-1.5 sm:gap-2">
										{activity.metadata.taggedUsers.map((user) => (
											<UserChip key={user.id} user={user} />
										))}
									</div>
								</div>
							)}
						</CardContent>
					) : null}

					{activity.type === "status_changed" ? (
						<CardContent className="p-4 pt-0 sm:p-4">
							<div
								className={`rounded-lg p-3 sm:p-4 ${
									activity.metadata.statusType === "office"
										? "border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
										: activity.metadata.statusType === "social"
											? "border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
											: activity.metadata.statusType === "available"
												? "border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
												: "border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30"
								}`}
							>
								<div className="space-y-1.5 sm:space-y-2">
									<div className="flex items-center gap-2">
										<div
											className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-[10px] sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-xs ${
												activity.metadata.statusType === "office"
													? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
													: activity.metadata.statusType === "social"
														? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
														: activity.metadata.statusType === "available"
															? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
															: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300"
											}`}
										>
											<div
												className={`h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 ${
													activity.metadata.statusType === "office"
														? "bg-blue-500"
														: activity.metadata.statusType === "social"
															? "bg-green-500"
															: activity.metadata.statusType === "available"
																? "bg-emerald-500"
																: "bg-orange-500"
												}`}
											/>
											<span>
												{activity.metadata.statusType === "office" &&
													"In Office"}
												{activity.metadata.statusType === "social" &&
													"At Social Event"}
												{activity.metadata.statusType === "available" &&
													"Available"}
												{activity.metadata.statusType === "busy" && "Busy"}
											</span>
										</div>
									</div>
									{activity.metadata.statusMessage && (
										<p className="text-muted-foreground text-xs sm:text-sm">
											{activity.metadata.statusMessage}
										</p>
									)}
								</div>
							</div>
						</CardContent>
					) : null}
				</Card>
			))}

			{/* Load More Button */}
			{hasMore && (
				<div className="flex justify-center pt-4 pb-8">
					<Button
						onClick={onLoadMore}
						disabled={isLoading}
						variant="outline"
						size="lg"
						className="min-w-[200px]"
					>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Loading...
							</>
						) : (
							"Load more activities"
						)}
					</Button>
				</div>
			)}
		</div>
	);
};
