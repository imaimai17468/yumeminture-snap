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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { UserWithEmail } from "@/entities/user";

type SidebarMenuProps = {
	user: UserWithEmail;
};

export const SidebarMenuComponent = ({ user }: SidebarMenuProps) => {
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
			<SheetContent side="right" className="w-80 p-0">
				<Sidebar className="h-full">
					<SidebarHeader>
						<div className="flex items-center gap-3 px-4 py-6">
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
					</SidebarHeader>
					<Separator />
					<SidebarContent>
						<SidebarGroup>
							<SidebarGroupContent>
								<SidebarMenu>
									<SidebarMenuItem>
										<SidebarMenuButton asChild onClick={handleNavigate}>
											<Link href={`/profile/${user.id}`}>
												<UserIcon className="h-4 w-4" />
												<span>Profile</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton asChild onClick={handleNavigate}>
											<Link href="/organizations">
												<Building2 className="h-4 w-4" />
												<span>Organizations</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton asChild onClick={handleNavigate}>
											<Link href="/settings">
												<SettingsIcon className="h-4 w-4" />
												<span>Settings</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					</SidebarContent>
					<SidebarFooter>
						<Separator className="mb-2" />
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									onClick={() => signOut()}
									className="text-destructive hover:text-destructive"
								>
									<LogOut className="h-4 w-4" />
									<span>Log out</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarFooter>
				</Sidebar>
			</SheetContent>
		</Sheet>
	);
};
