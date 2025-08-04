import { Building2, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { OrganizationWithStats } from "@/entities/organization";
import type { OrganizationMembership } from "@/entities/organization-membership";

type OrganizationListProps = {
	organizations: OrganizationWithStats[];
	userMembership: OrganizationMembership | null;
	isSearching?: boolean;
};

export const OrganizationList = ({
	organizations,
	userMembership,
	isSearching = false,
}: OrganizationListProps) => {
	if (organizations.length === 0) {
		return (
			<Card>
				<CardContent className="py-12 sm:py-16">
					<div className="space-y-3 text-center sm:space-y-4">
						<Building2 className="mx-auto h-10 w-10 text-muted-foreground sm:h-12 sm:w-12" />
						<div className="space-y-1.5 sm:space-y-2">
							<h3 className="font-semibold text-base sm:text-lg">
								{isSearching
									? "No organizations found"
									: "No organizations yet"}
							</h3>
							<p className="text-muted-foreground text-sm">
								{isSearching
									? "Try adjusting your search query"
									: "Be the first to create an organization!"}
							</p>
						</div>
						{userMembership?.status !== "approved" && !isSearching && (
							<div className="pt-3 sm:pt-4">
								<Link href="/organizations/new">
									<Button
										size="default"
										className="w-full sm:size-lg sm:w-auto"
									>
										Create Organization
									</Button>
								</Link>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
			{organizations.map((org) => (
				<Card
					key={org.id}
					className="transition-all hover:bg-accent hover:shadow-md"
				>
					<Link href={`/organizations/${org.id}`}>
						<CardHeader className="space-y-2 sm:space-y-3">
							<div className="flex items-start justify-between">
								<Building2 className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
								{userMembership?.organizationId === org.id &&
									userMembership?.status === "approved" && (
										<span className="rounded-full bg-primary px-2 py-0.5 font-medium text-primary-foreground text-xs sm:px-3 sm:py-1">
											Your Org
										</span>
									)}
							</div>
							<div className="space-y-1 sm:space-y-1.5">
								<CardTitle className="line-clamp-1 text-base sm:text-lg">
									{org.name}
								</CardTitle>
								<CardDescription className="line-clamp-2 text-xs sm:text-sm">
									{org.description || "No description provided"}
								</CardDescription>
							</div>
						</CardHeader>
						<CardContent className="pt-1 pb-3 sm:pt-2 sm:pb-4">
							<div className="flex items-center gap-4 text-muted-foreground text-xs sm:text-sm">
								<div className="flex items-center gap-1 sm:gap-1.5">
									<Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
									<span>{org.memberCount || 0} members</span>
								</div>
							</div>
						</CardContent>
					</Link>
				</Card>
			))}
		</div>
	);
};
