import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OrganizationList } from "@/components/features/organizations/OrganizationList";
import { OrganizationSearchForm } from "@/components/features/organizations/OrganizationSearchForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { searchOrganizations } from "@/gateways/organization";
import { fetchUserMembership } from "@/gateways/organization-membership";
import { fetchCurrentUser } from "@/gateways/user";

type PageProps = {
	searchParams: Promise<{ q?: string }>;
};

export default async function OrganizationsPage({ searchParams }: PageProps) {
	const params = await searchParams;
	const user = await fetchCurrentUser();

	if (!user) {
		redirect("/login");
	}

	const searchQuery = params.q || "";

	const [organizations, userMembership] = await Promise.all([
		searchOrganizations(searchQuery),
		fetchUserMembership(),
	]);

	return (
		<div className="container mx-auto max-w-6xl py-6 sm:py-8">
			<div className="space-y-6 sm:space-y-8">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="space-y-1">
						<h1 className="font-bold text-2xl sm:text-3xl">Organizations</h1>
						<p className="text-base text-muted-foreground sm:text-lg">
							Discover and join organizations
						</p>
					</div>
					{userMembership?.status === "approved" ? (
						<div className="flex flex-col items-end gap-1">
							<Button size="sm" className="w-full sm:w-auto" disabled>
								<Plus className="h-4 w-4" />
								Create
							</Button>
							<p className="text-muted-foreground text-xs">Already a member</p>
						</div>
					) : (
						<Link href="/organizations/new">
							<Button size="sm" className="w-full sm:size-default sm:w-auto">
								<Plus className="h-4 w-4" />
								Create
							</Button>
						</Link>
					)}
				</div>

				<Alert>
					<AlertDescription>
						<strong>Alpha Notice:</strong> Currently in alpha with limited
						organizations.
						<br />
						Auto-approval is enabled to encourage participation.
						<br />
						Organizations will switch to manual approval once proper admins are
						assigned.
					</AlertDescription>
				</Alert>

				<OrganizationSearchForm defaultValue={searchQuery} />

				<div className="space-y-3 sm:space-y-4">
					{searchQuery && (
						<p className="text-muted-foreground text-xs sm:text-sm">
							Found {organizations.length} organization
							{organizations.length !== 1 ? "s" : ""} matching "{searchQuery}"
						</p>
					)}
					<OrganizationList
						organizations={organizations}
						userMembership={userMembership}
						isSearching={!!searchQuery}
					/>
				</div>
			</div>
		</div>
	);
}
