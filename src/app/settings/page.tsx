import { redirect } from "next/navigation";
import { SettingsPage } from "@/components/features/settings-page/SettingsPage";
import { fetchCurrentUser } from "@/gateways/user";

export default async function Settings() {
	const user = await fetchCurrentUser();

	if (!user) {
		redirect("/login");
	}

	return <SettingsPage user={user} />;
}
