"use client";

import {
	Building2,
	LogOut,
	Menu,
	Settings as SettingsIcon,
	User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { signOut } from "@/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import type { UserWithEmail } from "@/entities/user";

type MobileMenuProps = {
	user: UserWithEmail;
};

export const MobileMenu = ({ user }: MobileMenuProps) => {
	const [open, setOpen] = useState(false);
	const avatarUrl = user.avatarUrl;
	const name = user.name || "User";
	const email = user.email;

	const handleNavigate = () => {
		setOpen(false);
	};

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button variant="ghost" size="icon" className="relative">
					<Menu className="h-5 w-5" />
					<span className="sr-only">Open menu</span>
				</Button>
			</SheetTrigger>
			<SheetContent side="right" className="w-80">
				<SheetTitle className="sr-only">Menu</SheetTitle>
				<div className="mt-12 flex flex-col gap-4">
					<div className="flex items-center gap-3 px-4">
						<Avatar className="h-12 w-12">
							<AvatarImage src={avatarUrl || undefined} alt={name} />
							<AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
						</Avatar>
						<div className="flex flex-col">
							<p className="font-medium text-sm">{name}</p>
							{email && (
								<p className="text-muted-foreground text-xs">{email}</p>
							)}
						</div>
					</div>
					<Separator />
					<nav className="flex flex-col gap-2 px-4">
						<Link
							href={`/profile/${user.id}`}
							onClick={handleNavigate}
							className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
						>
							<UserIcon className="h-4 w-4" />
							<span>Profile</span>
						</Link>
						<Link
							href="/organizations"
							onClick={handleNavigate}
							className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
						>
							<Building2 className="h-4 w-4" />
							<span>Organizations</span>
						</Link>
						<Link
							href="/settings"
							onClick={handleNavigate}
							className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
						>
							<SettingsIcon className="h-4 w-4" />
							<span>Settings</span>
						</Link>
					</nav>
					<Separator className="my-2" />
					<div className="px-4">
						<button
							type="button"
							onClick={() => signOut()}
							className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-destructive text-sm transition-colors hover:bg-accent hover:text-destructive"
						>
							<LogOut className="h-4 w-4" />
							<span>Log out</span>
						</button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
};
