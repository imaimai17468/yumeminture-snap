import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { UserWithEmail } from "@/entities/user";
import { MobileMenu } from "../mobile-menu/MobileMenu";

type AuthNavigationProps = {
	user: UserWithEmail | null;
};

export const AuthNavigation = ({ user }: AuthNavigationProps) => {
	if (user) {
		return <MobileMenu user={user} />;
	}

	return (
		<Button asChild size="sm" className="text-sm">
			<Link href="/login">Sign In</Link>
		</Button>
	);
};
