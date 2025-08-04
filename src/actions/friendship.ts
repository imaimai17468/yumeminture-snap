"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteFriendship as deleteFriendshipGateway } from "@/gateways/friendship";

export const deleteFriendship = async (formData: FormData) => {
	const friendshipId = formData.get("friendshipId") as string;

	if (!friendshipId) {
		throw new Error("Friendship ID is required");
	}

	const result = await deleteFriendshipGateway(friendshipId);

	if (!result.success) {
		throw new Error(result.error || "Failed to delete friendship");
	}

	revalidatePath("/friends");
	redirect("/friends");
};

export const unfriendAction = async (friendshipId: string) => {
	"use server";
	const formData = new FormData();
	formData.append("friendshipId", friendshipId);
	await deleteFriendship(formData);
};
