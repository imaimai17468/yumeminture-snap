"use server";

import { revalidatePath } from "next/cache";
import type { CreateCommunicationStatus } from "@/entities/communication-status";
import {
	createOrUpdateStatus,
	deleteStatus,
} from "@/gateways/communication-status";

export const updateStatusAction = async (data: {
	statusType: "office" | "social" | "available" | "busy";
	message?: string;
	expiresIn?: string;
}) => {
	const statusData: CreateCommunicationStatus = {
		statusType: data.statusType,
		message: data.message,
		expiresAt: data.expiresIn
			? new Date(
					Date.now() + parseInt(data.expiresIn) * 60 * 60 * 1000,
				).toISOString()
			: undefined,
	};

	const result = await createOrUpdateStatus(statusData);

	if (result.success) {
		revalidatePath("/");
	}

	return result;
};

export const clearStatusAction = async () => {
	const result = await deleteStatus();

	if (result.success) {
		revalidatePath("/");
	}

	return result;
};
