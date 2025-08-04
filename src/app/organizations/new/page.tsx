import { redirect } from "next/navigation";
import { CreateOrganizationForm } from "@/components/features/organizations/CreateOrganizationForm";
import { fetchCurrentUser } from "@/gateways/user";

export default async function NewOrganizationPage() {
	const user = await fetchCurrentUser();

	if (!user) {
		redirect("/login");
	}

	return (
		<div className="container mx-auto max-w-2xl py-8">
			<div className="space-y-8">
				<div className="space-y-2">
					<h1 className="font-bold text-3xl">Create Organization</h1>
					<p className="text-lg text-muted-foreground">
						Start your journey by creating your own organization
					</p>
				</div>

				<CreateOrganizationForm />
			</div>
		</div>
	);
}
