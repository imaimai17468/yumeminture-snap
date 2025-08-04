import { redirect } from "next/navigation";
import { StatusList } from "@/components/features/status/StatusList";
import { fetchVisibleStatuses } from "@/gateways/communication-status";
import { fetchCurrentUser } from "@/gateways/user";

export default async function StatusPage() {
	const user = await fetchCurrentUser();

	if (!user) {
		redirect("/login");
	}

	const statuses = await fetchVisibleStatuses();

	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<div className="mb-8">
				<h1 className="font-bold text-3xl">Communication Status</h1>
				<p className="mt-2 text-muted-foreground">
					友達と友達の友達のコミュニケーション状態を確認できます
				</p>
			</div>

			<StatusList statuses={statuses} currentUserId={user.id} />
		</div>
	);
}
