import { redirect } from "next/navigation";
import { PhotoUploadForm } from "@/components/features/photos/PhotoUploadForm";
import { fetchUserFriendshipsWithUsers } from "@/gateways/friendship";
import { fetchAllUsers, fetchCurrentUser } from "@/gateways/user";

export default async function PhotoUploadPage() {
	const user = await fetchCurrentUser();

	if (!user) {
		redirect("/login");
	}

	const [friendships, allUsers] = await Promise.all([
		fetchUserFriendshipsWithUsers(),
		fetchAllUsers(),
	]);

	return (
		<div className="container mx-auto max-w-2xl py-8">
			<div className="space-y-8">
				<div className="space-y-1">
					<h1 className="font-bold text-3xl">Upload Photo</h1>
					<p className="text-lg text-muted-foreground">
						Share a moment with your friends
					</p>
				</div>

				<PhotoUploadForm
					currentUser={user}
					allUsers={allUsers}
					friendIds={friendships.map((f) => f.friend.id)}
				/>
			</div>
		</div>
	);
}
