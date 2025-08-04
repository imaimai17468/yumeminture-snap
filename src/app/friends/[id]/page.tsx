import { notFound, redirect } from "next/navigation";
import { FriendList } from "@/components/features/friends/FriendList";
import {
	fetchFriendshipsForUser,
	fetchFriendshipWithUser,
} from "@/gateways/friendship";
import { fetchCurrentUser, fetchUserById } from "@/gateways/user";

type PageProps = {
	params: Promise<{ id: string }>;
};

export default async function FriendsPage({ params }: PageProps) {
	const { id } = await params;
	const currentUser = await fetchCurrentUser();

	if (!currentUser) {
		redirect("/login");
	}

	const isCurrentUser = currentUser.id === id;

	const [profileUser, friendships, friendship] = await Promise.all([
		fetchUserById(id),
		fetchFriendshipsForUser(id),
		isCurrentUser ? Promise.resolve(null) : fetchFriendshipWithUser(id),
	]);

	if (!profileUser) {
		notFound();
	}

	const isFriend = !!friendship || isCurrentUser;

	return (
		<div className="container mx-auto max-w-6xl py-8">
			<div className="space-y-8">
				<div className="space-y-1">
					<h1 className="font-bold text-3xl">
						{isCurrentUser
							? "Your Friends"
							: `${profileUser.name || "User"}'s Friends`}
					</h1>
					<p className="text-lg text-muted-foreground">
						{isCurrentUser
							? "Your connections across organizations"
							: `Connections of ${profileUser.name || "this user"}`}
					</p>
				</div>

				<FriendList friendships={friendships} isFriend={isFriend} />
			</div>
		</div>
	);
}
