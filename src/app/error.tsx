"use client";

import { AlertCircle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";

export default function ErrorBoundary({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
						<AlertCircle className="h-8 w-8 text-destructive" />
					</div>
					<h1 className="font-bold text-2xl">Something went wrong</h1>
					<p className="mt-2 text-muted-foreground">
						We encountered an unexpected error. Please try again.
					</p>
				</CardHeader>
				<CardContent>
					{error.message && (
						<div className="rounded-lg bg-muted p-4">
							<p className="text-muted-foreground text-sm">
								Error details: {error.message}
							</p>
						</div>
					)}
				</CardContent>
				<CardFooter className="flex gap-2">
					<Button onClick={reset} className="flex-1" variant="default">
						<RefreshCw className="mr-2 h-4 w-4" />
						Try again
					</Button>
					<Button asChild className="flex-1" variant="outline">
						<Link href="/">
							<Home className="mr-2 h-4 w-4" />
							Go home
						</Link>
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
