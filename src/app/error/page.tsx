import { AlertCircle, Home, LogIn, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";

type ErrorPageProps = {
	searchParams: Promise<{
		type?: string;
		message?: string;
	}>;
};

const errorConfigs = {
	unauthorized: {
		icon: LogIn,
		title: "Authentication Required",
		description: "Please log in to access this page.",
		actions: [
			{ label: "Log in", href: "/login", variant: "default" as const },
			{ label: "Go home", href: "/", variant: "outline" as const },
		],
	},
	forbidden: {
		icon: ShieldAlert,
		title: "Access Denied",
		description: "You don't have permission to access this resource.",
		actions: [{ label: "Go home", href: "/", variant: "default" as const }],
	},
	notfound: {
		icon: AlertCircle,
		title: "Resource Not Found",
		description: "The requested resource could not be found.",
		actions: [{ label: "Go home", href: "/", variant: "default" as const }],
	},
	default: {
		icon: AlertCircle,
		title: "Something went wrong",
		description: "An unexpected error occurred. Please try again later.",
		actions: [{ label: "Go home", href: "/", variant: "default" as const }],
	},
};

export default async function ErrorPage({ searchParams }: ErrorPageProps) {
	const params = await searchParams;
	const errorType = params.type || "default";
	const customMessage = params.message;

	// Handle specific redirects
	if (errorType === "404") {
		redirect("/not-found");
	}

	const config =
		errorConfigs[errorType as keyof typeof errorConfigs] ||
		errorConfigs.default;
	const Icon = config.icon;

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
						<Icon className="h-8 w-8 text-destructive" />
					</div>
					<h1 className="font-bold text-2xl">{config.title}</h1>
					<p className="mt-2 text-muted-foreground">
						{customMessage || config.description}
					</p>
				</CardHeader>
				{customMessage && (
					<CardContent>
						<div className="rounded-lg bg-muted p-4">
							<p className="text-muted-foreground text-sm">{customMessage}</p>
						</div>
					</CardContent>
				)}
				<CardFooter className="flex gap-2">
					{config.actions.map((action) => (
						<Button
							key={action.href}
							asChild
							variant={action.variant}
							className="flex-1"
						>
							<Link href={action.href}>
								{action.href === "/" && <Home className="mr-2 h-4 w-4" />}
								{action.href === "/login" && <LogIn className="mr-2 h-4 w-4" />}
								{action.label}
							</Link>
						</Button>
					))}
				</CardFooter>
			</Card>
		</div>
	);
}
