import { redirect } from "next/navigation";

export class AppError extends Error {
	constructor(
		public message: string,
		public type:
			| "unauthorized"
			| "forbidden"
			| "notfound"
			| "server" = "server",
		public statusCode?: number,
	) {
		super(message);
		this.name = "AppError";
	}
}

export const handleError = (error: unknown): never => {
	console.error("Error occurred:", error);

	if (error instanceof AppError) {
		redirect(
			`/error?type=${error.type}&message=${encodeURIComponent(error.message)}`,
		);
	}

	if (error instanceof Error) {
		// Supabase Auth errors
		if (error.message.includes("JWT")) {
			redirect("/error?type=unauthorized");
		}

		// PostgreSQL errors
		if (
			error.message.includes("permission denied") ||
			error.message.includes("violates row-level security")
		) {
			redirect("/error?type=forbidden");
		}

		// Not found errors
		if (
			error.message.includes("not found") ||
			error.message.includes("does not exist")
		) {
			redirect("/error?type=notfound");
		}

		// Default error
		redirect(`/error?message=${encodeURIComponent(error.message)}`);
	}

	// Unknown error
	redirect("/error");
};

export const requireAuth = async <T>(
	getUserFn: () => Promise<T | null>,
): Promise<T> => {
	try {
		const user = await getUserFn();
		if (!user) {
			throw new AppError("Authentication required", "unauthorized");
		}
		return user;
	} catch (error) {
		handleError(error);
		throw error; // This will never be reached but satisfies TypeScript
	}
};

export const tryCatch = async <T>(
	fn: () => Promise<T>,
	errorMessage?: string,
): Promise<T> => {
	try {
		return await fn();
	} catch (error) {
		if (errorMessage) {
			console.error(errorMessage, error);
		}
		handleError(error);
		throw error; // This will never be reached but satisfies TypeScript
	}
};
