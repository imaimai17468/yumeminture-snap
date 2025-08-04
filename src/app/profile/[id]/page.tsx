import { notFound, redirect } from "next/navigation";
import { unfriendAction } from "@/actions/friendship";
import { ProfileDetail } from "@/components/features/profile/ProfileDetail";
import { countUserPhotoUploads } from "@/gateways/activity";
import { fetchUserActivitiesWithStatus } from "@/gateways/activity/fetch-user-with-status";
import {
	countUserFriendships,
	fetchFriendshipWithUser,
} from "@/gateways/friendship";
import { fetchCurrentUser, fetchUserById } from "@/gateways/user";

type PageProps = {
	params: Promise<{ id: string }>;
};

export default async function ProfilePage({ params }: PageProps) {
	const { id } = await params;
	const currentUser = await fetchCurrentUser();

	if (!currentUser) {
		redirect("/login");
	}

	const isCurrentUser = currentUser.id === id;

	const [profileUser, friendship, activities, friendsCount, photosCount] =
		await Promise.all([
			fetchUserById(id),
			isCurrentUser ? Promise.resolve(null) : fetchFriendshipWithUser(id),
			fetchUserActivitiesWithStatus(id),
			countUserFriendships(id),
			countUserPhotoUploads(id),
		]);

	if (!profileUser) {
		notFound();
	}

	// Server Actionをバインド
	const handleUnfriend = friendship
		? unfriendAction.bind(null, friendship.id)
		: async () => {
				"use server";
			};

	return (
		<ProfileDetail
			profileUser={profileUser}
			friendship={friendship}
			activities={activities}
			friendsCount={friendsCount}
			photosCount={photosCount}
			isCurrentUser={isCurrentUser}
			onUnfriend={handleUnfriend}
		/>
	);
}
