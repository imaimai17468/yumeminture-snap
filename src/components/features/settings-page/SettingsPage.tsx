import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { UserWithEmail } from "@/entities/user";
import { ProfileForm } from "./profile-form/ProfileForm";

type SettingsPageProps = {
	user: UserWithEmail;
};

export const SettingsPage = ({ user }: SettingsPageProps) => {
	return (
		<div className="container mx-auto flex min-h-screen max-w-2xl flex-col sm:items-center sm:justify-center sm:px-6 sm:py-8">
			<h1 className="mb-6 text-2xl sm:mb-8 sm:text-3xl">Settings</h1>

			<div className="w-full space-y-4 sm:space-y-6">
				<Card>
					<CardHeader className="space-y-1">
						<CardTitle className="text-lg sm:text-xl">
							Basic Information
						</CardTitle>
						<CardDescription className="text-sm">
							You can set your profile image and name
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ProfileForm user={user} />
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="space-y-1">
						<CardTitle className="text-lg sm:text-xl">
							Account Information
						</CardTitle>
						<CardDescription className="text-sm">
							Basic account information
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 sm:space-y-4">
						<div>
							<p className="text-muted-foreground text-xs sm:text-sm">
								Email Address
							</p>
							<p className="break-all font-medium text-sm sm:text-base">
								{user.email}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground text-xs sm:text-sm">
								Registration Date
							</p>
							<p className="font-medium text-sm sm:text-base">
								{new Date(user.createdAt).toLocaleDateString("ja-JP")}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};
