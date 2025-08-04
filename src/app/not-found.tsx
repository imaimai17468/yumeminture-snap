import { FileQuestion, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";

export default function NotFound() {
	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
						<FileQuestion className="h-8 w-8 text-muted-foreground" />
					</div>
					<h1 className="font-bold text-6xl">404</h1>
					<h2 className="mt-2 font-semibold text-2xl">Page Not Found</h2>
					<p className="mt-2 text-muted-foreground">
						The page you're looking for doesn't exist or has been moved.
					</p>
				</CardHeader>
				<CardFooter>
					<Button asChild className="w-full">
						<Link href="/">
							<Home className="mr-2 h-4 w-4" />
							Return to Home
						</Link>
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
