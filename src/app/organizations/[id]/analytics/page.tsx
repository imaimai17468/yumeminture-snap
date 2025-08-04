import { notFound, redirect } from "next/navigation";
import { OrganizationAnalytics } from "@/components/features/organizations/OrganizationAnalytics";
import { fetchOrganizationById } from "@/gateways/organization";
import { fetchOrganizationAnalyticsData } from "@/gateways/organization-membership";
import { fetchCurrentUser } from "@/gateways/user";

type PageProps = {
	params: Promise<{
		id: string;
	}>;
};

export default async function OrganizationAnalyticsPage({ params }: PageProps) {
	const { id } = await params;
	const user = await fetchCurrentUser();

	if (!user) {
		redirect("/login");
	}

	const [organization, analyticsData] = await Promise.all([
		fetchOrganizationById(id),
		fetchOrganizationAnalyticsData(id),
	]);

	if (!organization) {
		notFound();
	}

	// 管理者権限チェック
	const currentUserMember = analyticsData.members.find(
		(member) => member.userId === user.id,
	);

	const isAdmin =
		currentUserMember?.role === "admin" &&
		currentUserMember.status === "approved";

	if (!isAdmin) {
		redirect(`/organizations/${organization.id}`);
	}

	return (
		<div className="container mx-auto max-w-7xl py-8">
			<div className="space-y-6">
				<div>
					<h1 className="font-bold text-3xl">Organization Analytics</h1>
					<p className="mt-2 text-muted-foreground">
						Analyze member engagement and retention risk for {organization.name}
					</p>
				</div>

				<OrganizationAnalytics
					organization={organization}
					analyticsData={analyticsData}
				/>
			</div>
		</div>
	);
}
