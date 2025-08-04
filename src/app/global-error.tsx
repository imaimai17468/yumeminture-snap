"use client";

import { AlertTriangle } from "lucide-react";

export default function GlobalError({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="en">
			<body>
				<div className="flex min-h-screen items-center justify-center bg-background p-4">
					<div className="max-w-md text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
							<AlertTriangle className="h-8 w-8 text-red-600" />
						</div>
						<h1 className="mb-2 font-bold text-2xl">Critical Error</h1>
						<p className="mb-6 text-gray-600">
							A critical error occurred. The application needs to restart.
						</p>
						<button
							type="button"
							onClick={reset}
							className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
						>
							Reload Application
						</button>
					</div>
				</div>
			</body>
		</html>
	);
}
