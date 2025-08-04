import { redirect } from "next/navigation";
import HomePage from "@/components/features/dashboard/HomePage";
import { fetchTimelineActivitiesWithStatus } from "@/gateways/activity/fetch-with-status";
import { fetchUserStatus } from "@/gateways/communication-status";
import { fetchUserFriendships } from "@/gateways/friendship";
import { fetchNetworkData } from "@/gateways/friendship/fetch-network-data";
import { fetchUserNotifications } from "@/gateways/notification";
import { fetchUserMembershipWithOrganization } from "@/gateways/organization-membership";
import { fetchCurrentUser } from "@/gateways/user";

export default async function Home({
	searchParams,
}: {
	searchParams: Promise<{ tab?: string; page?: string }>;
}) {
	const user = await fetchCurrentUser();

	if (!user) {
		redirect("/login");
	}

	// Parse page number from search params
	const params = await searchParams;
	const currentPage = Number(params.page) || 1;

	// ユーザーの各種情報を取得
	const [
		membershipData,
		friendships,
		status,
		activities,
		networkData,
		notificationData,
	] = await Promise.all([
		fetchUserMembershipWithOrganization(),
		fetchUserFriendships(),
		fetchUserStatus(),
		fetchTimelineActivitiesWithStatus(20, 0),
		fetchNetworkData(),
		fetchUserNotifications(user.id, currentPage),
	]);

	return (
		<HomePage
			userId={user.id}
			membership={membershipData.membership}
			organizationName={membershipData.organizationName}
			friendships={friendships}
			status={status}
			activities={activities}
			networkData={networkData}
			notifications={notificationData.notifications}
			notificationPagination={{
				currentPage: notificationData.currentPage,
				totalPages: notificationData.totalPages,
				totalCount: notificationData.totalCount,
			}}
		/>
	);
}
