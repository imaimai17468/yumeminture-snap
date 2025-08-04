"use client";

import { Building2, Home, Menu, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

type MobileMenuProps = {
	userId?: string;
};

export const MobileMenu = ({ userId }: MobileMenuProps) => {
	const [open, setOpen] = useState(false);

	const menuItems = [
		{
			title: "Home",
			href: "/",
			icon: Home,
		},
		{
			title: "Organizations",
			href: "/organizations",
			icon: Building2,
		},
		...(userId
			? [
					{
						title: "Friends",
						href: `/friends/${userId}`,
						icon: Users,
					},
				]
			: []),
	];

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button variant="ghost" size="icon" className="md:hidden">
					<Menu className="h-5 w-5" />
					<span className="sr-only">Open menu</span>
				</Button>
			</SheetTrigger>
			<SheetContent side="left" className="w-[250px] sm:w-[300px]">
				<SheetHeader>
					<SheetTitle>Menu</SheetTitle>
				</SheetHeader>
				<nav className="mt-6 flex flex-col gap-2">
					{menuItems.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							onClick={() => setOpen(false)}
							className="flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
						>
							<item.icon className="h-4 w-4" />
							{item.title}
						</Link>
					))}
				</nav>
			</SheetContent>
		</Sheet>
	);
};
