"use server";

import { revalidatePath } from "next/cache";
import { markNotificationAsRead as markAsRead } from "@/gateways/notification";
import { fetchCurrentUser } from "@/gateways/user";

export const markNotificationAsRead = async (notificationId: string) => {
	const user = await fetchCurrentUser();
	if (!user) {
		throw new Error("Unauthorized");
	}

	await markAsRead(notificationId, user.id);
	revalidatePath("/");
};
