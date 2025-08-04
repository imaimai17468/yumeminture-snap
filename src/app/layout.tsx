import type { Metadata } from "next";
import "./globals.css";
import { Geist_Mono } from "next/font/google";
import { ClientProviders } from "@/components/providers/ClientProviders";
import { Header } from "@/components/shared/header/Header";
import { Toaster } from "@/components/ui/sonner";
import { fetchCurrentUser } from "@/gateways/user";

const geistMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-geist-mono",
});

export const metadata: Metadata = {
	title: {
		default: "&[🏢]s!:Snap - Connect Across Companies",
		template: "%s | &[🏢]s!:Snap",
	},
	description:
		"Build meaningful professional relationships by connecting with colleagues from different organizations.",
	keywords: [
		"networking",
		"business",
		"connections",
		"organizations",
		"professional",
		"social",
	],
	openGraph: {
		title: "&[🏢]s!:Snap - Connect Across Companies",
		description:
			"Build meaningful professional relationships by connecting with colleagues from different organizations.",
		url: "https://yumeminture-snap.vercel.app",
		siteName: "&[🏢]s!:Snap",
		locale: "en_US",
		type: "website",
		images: [
			{
				url: "/ogp-image.png",
				width: 1200,
				height: 630,
				alt: "&[🏢]s!:Snap - Connect Across Companies",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "&[🏢]s!:Snap - Connect Across Companies",
		description:
			"Build meaningful professional relationships by connecting with colleagues from different organizations.",
		images: ["/ogp-image.png"],
	},
	icons: {
		icon: [
			{ url: "/app-icon.png", sizes: "32x32", type: "image/png" },
			{ url: "/app-icon.png", sizes: "16x16", type: "image/png" },
		],
		apple: [{ url: "/app-icon.png", sizes: "180x180", type: "image/png" }],
	},
	manifest: "/manifest.json",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const user = await fetchCurrentUser();

	return (
		<html lang="en">
			<body className={`dark antialiased ${geistMono.className}`}>
				<ClientProviders userId={user?.id}>
					<div className="relative flex min-h-screen flex-col px-4 py-[10vh]">
						<Header />
						{children}
					</div>
					<Toaster richColors position="top-center" />
				</ClientProviders>
			</body>
		</html>
	);
}
