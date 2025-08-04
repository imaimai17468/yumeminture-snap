import {
	AlertCircle,
	Calendar,
	Camera,
	ChevronRight,
	Users,
} from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { FriendshipWithUser } from "@/entities/friendship";
import { formatDistanceToNow } from "@/lib/date";
import { cn } from "@/lib/utils";

type FriendListProps = {
	friendships: FriendshipWithUser[];
	isFriend?: boolean;
};

export const FriendList = ({
	friendships,
	isFriend = true,
}: FriendListProps) => {
	if (friendships.length === 0) {
		return (
			<Card>
				<CardContent className="py-16">
					<div className="space-y-4 text-center">
						<Users className="mx-auto h-12 w-12 text-muted-foreground" />
						<div className="space-y-2">
							<h3 className="font-semibold text-lg">No friends yet</h3>
							<p className="text-muted-foreground">
								Take photos with others to become friends!
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			{!isFriend && (
				<Alert className="mb-6">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Friend access required</AlertTitle>
					<AlertDescription>
						<div>
							<p>
								You can't view this person's friends because you're not
								connected.
							</p>
							<p>Take a photo together to become friends first!</p>
						</div>
						<Button asChild size="sm" className="mt-2">
							<Link href="/photos/upload">
								<Camera className="mr-2 h-4 w-4" />
								Upload a Photo
							</Link>
						</Button>
					</AlertDescription>
				</Alert>
			)}
			<div
				className={cn(
					"divide-y divide-border rounded-lg border",
					!isFriend && "pointer-events-none opacity-50",
				)}
			>
				{friendships.map((friendship) => (
					<Link
						key={friendship.id}
						href={`/profile/${friendship.friend.id}`}
						className="flex items-center justify-between p-4 transition-colors hover:bg-accent"
						tabIndex={!isFriend ? -1 : undefined}
					>
						<div className="flex items-center gap-4">
							<Avatar className="h-12 w-12">
								<AvatarImage
									src={friendship.friend.avatarUrl || undefined}
									alt={friendship.friend.name || "Friend"}
								/>
								<AvatarFallback>
									{friendship.friend.name?.[0]?.toUpperCase() || "U"}
								</AvatarFallback>
							</Avatar>
							<div className="space-y-1">
								<h3 className="font-medium text-base">
									{friendship.friend.name || "Unknown User"}
								</h3>
								<p className="flex items-center gap-1 text-muted-foreground text-sm">
									<Calendar className="h-3 w-3" />
									Friends since{" "}
									{formatDistanceToNow(new Date(friendship.createdAt))}
								</p>
							</div>
						</div>
						<ChevronRight className="h-5 w-5 text-muted-foreground" />
					</Link>
				))}
			</div>
		</>
	);
};
