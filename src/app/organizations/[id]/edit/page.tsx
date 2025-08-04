import { notFound, redirect } from "next/navigation";
import { OrganizationEditForm } from "@/components/features/organizations/OrganizationEditForm";
import { fetchOrganizationById } from "@/gateways/organization";
import {
	fetchOrganizationMembers,
	fetchUserMembership,
} from "@/gateways/organization-membership";
import { fetchCurrentUser } from "@/gateways/user";

type PageProps = {
	params: Promise<{
		id: string;
	}>;
};

export default async function OrganizationEditPage({ params }: PageProps) {
	const { id } = await params;
	const user = await fetchCurrentUser();

	if (!user) {
		redirect("/login");
	}

	const [organization, members, currentUserMembership] = await Promise.all([
		fetchOrganizationById(id),
		fetchOrganizationMembers(id),
		fetchUserMembership(),
	]);

	if (!organization) {
		notFound();
	}

	// 管理者権限チェック
	const isAdmin =
		currentUserMembership?.organizationId === organization.id &&
		currentUserMembership.role === "admin" &&
		currentUserMembership.status === "approved";

	if (!isAdmin) {
		redirect(`/organizations/${organization.id}`);
	}

	return (
		<div className="container mx-auto max-w-4xl py-8">
			<div className="space-y-6">
				<div>
					<h1 className="font-bold text-3xl">Edit Organization</h1>
					<p className="mt-2 text-muted-foreground">
						Update your organization's information and manage members.
					</p>
				</div>

				<OrganizationEditForm
					organization={organization}
					members={members}
					currentUserId={user.id}
				/>
			</div>
		</div>
	);
}
