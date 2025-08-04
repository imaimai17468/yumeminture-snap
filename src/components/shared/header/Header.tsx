import Image from "next/image";
import Link from "next/link";
import { fetchCurrentUser } from "@/gateways/user";
import { AuthNavigation } from "./auth-navigation/AuthNavigation";
import { NotificationBell } from "./notification-bell/NotificationBell";

export const Header = async () => {
	const user = await fetchCurrentUser();

	return (
		<header className="fixed top-0 right-0 left-0 z-50 backdrop-blur-md">
			<div className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-6">
				<Link href="/" className="flex items-center gap-3">
					<Image
						src="/app-icon.png"
						alt="Yumeminture Snap"
						width={40}
						height={40}
						className="h-10 w-10 rounded-lg"
					/>
					<div className="hidden sm:block">
						<h1 className="font-medium text-2xl">
							<span>&[🏢]s!:</span>
							<span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
								Snap
							</span>
						</h1>
						<p className="text-gray-400 text-sm">- and Organizations!: Snap</p>
					</div>
				</Link>
				<div className="flex items-center gap-2 sm:gap-3">
					{user && <NotificationBell />}
					<AuthNavigation user={user} />
				</div>
			</div>
		</header>
	);
};
