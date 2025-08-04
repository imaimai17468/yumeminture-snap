"use server";

import { convertToTimelineActivity } from "@/entities/activity";
import { fetchTimelineActivitiesWithStatus } from "@/gateways/activity/fetch-with-status";

export const loadMoreActivities = async (offset: number) => {
	const activities = await fetchTimelineActivitiesWithStatus(20, offset);
	return activities.map(convertToTimelineActivity);
};
