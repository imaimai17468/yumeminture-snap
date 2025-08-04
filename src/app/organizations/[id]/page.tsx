import { notFound, redirect } from "next/navigation";
import { OrganizationDetail } from "@/components/features/organizations/OrganizationDetail";
import { fetchOrganizationById } from "@/gateways/organization";
import { fetchOrganizationMembers } from "@/gateways/organization-membership";
import { fetchCurrentUser } from "@/gateways/user";

type PageProps = {
	params: Promise<{
		id: string;
	}>;
};

export default async function OrganizationDetailPage({ params }: PageProps) {
	const { id } = await params;
	const user = await fetchCurrentUser();

	if (!user) {
		redirect("/login");
	}

	const [organization, members] = await Promise.all([
		fetchOrganizationById(id),
		fetchOrganizationMembers(id),
	]);

	if (!organization) {
		notFound();
	}

	const currentUserMember = members.find((member) => member.userId === user.id);

	return (
		<div className="container mx-auto max-w-6xl py-6 sm:py-8">
			<OrganizationDetail
				organization={organization}
				members={members}
				currentUserMember={currentUserMember || null}
			/>
		</div>
	);
}
