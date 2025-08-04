import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
	const { supabase, response } = createClient(request);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");
	const isLoginPage = request.nextUrl.pathname === "/login";

	if (!user && !isAuthRoute && !isLoginPage) {
		const redirectUrl = request.nextUrl.clone();
		redirectUrl.pathname = "/login";
		return NextResponse.redirect(redirectUrl);
	}

	if (user && isLoginPage) {
		const redirectUrl = request.nextUrl.clone();
		redirectUrl.pathname = "/";
		return NextResponse.redirect(redirectUrl);
	}

	return response;
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
