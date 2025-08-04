"use client";

import {
	Building2,
	LogOut,
	Settings as SettingsIcon,
	User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "@/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserWithEmail } from "@/entities/user";

type UserMenuProps = {
	user: UserWithEmail;
};

export const UserMenu = ({ user }: UserMenuProps) => {
	const avatarUrl = user.avatarUrl;
	const name = user.name || "User";
	const email = user.email;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
				>
					<Avatar className="h-8 w-8">
						<AvatarImage src={avatarUrl || undefined} alt={name} />
						<AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
					</Avatar>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56" sideOffset={16}>
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="font-medium text-sm leading-none">{name}</p>
						{email && (
							<p className="text-muted-foreground text-xs leading-none">
								{email}
							</p>
						)}
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link href={`/profile/${user.id}`}>
						<UserIcon className="mr-2 h-4 w-4" />
						<span>Profile</span>
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link href="/organizations">
						<Building2 className="mr-2 h-4 w-4" />
						<span>Organizations</span>
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link href="/settings">
						<SettingsIcon className="mr-2 h-4 w-4" />
						<span>Settings</span>
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="text-destructive focus:text-destructive"
					onClick={() => signOut()}
				>
					<LogOut className="mr-2 h-4 w-4" />
					<span>Log out</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
