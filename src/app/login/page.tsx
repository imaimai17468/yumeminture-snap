import type { Metadata } from "next";
import { FeatureDemo } from "@/components/features/login-page/feature-demo/FeatureDemo";
import { GoogleSignInButton } from "@/components/features/login-page/google-sign-in-button/GoogleSignInButton";
import { LoginBackground } from "@/components/features/login-page/login-background/LoginBackground";

export const metadata: Metadata = {
	title: "&[🏢]s!:Snap - Connect Across Companies",
	description:
		"Build meaningful professional relationships by connecting with colleagues from different organizations.",
};

export default function Home() {
	return (
		<div className="relative min-h-screen bg-background">
			{/* Background */}
			<LoginBackground />

			{/* Hero Section with Feature Demo */}
			<section className="relative z-10 overflow-hidden py-12 sm:py-16 md:py-24">
				<div className="container mx-auto px-4">
					<div className="mx-auto max-w-2xl space-y-12">
						{/* Login Form */}
						<div className="mx-auto w-full max-w-md space-y-6 text-center">
							<div className="space-y-3 sm:space-y-4">
								<h1 className="whitespace-nowrap font-black text-5xl tracking-tighter sm:text-6xl md:text-7xl">
									<span className="text-white">&amp;[🏢]s!:</span>
									<span
										className="inline-block animate-gradient bg-clip-text text-transparent"
										style={{
											backgroundImage:
												"linear-gradient(to right, #00bfff, #a855f7, #00bfff)",
											backgroundSize: "300% 100%",
										}}
									>
										Snap
									</span>
								</h1>
								<p className="text-muted-foreground/80 text-sm">
									- and [Organization]s!:Snap
								</p>
							</div>

							<div className="w-full">
								<GoogleSignInButton />
							</div>
						</div>

						{/* Feature Demo */}
						<div className="animate-fade-in">
							<FeatureDemo />
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="relative z-10 py-12 sm:py-16 md:py-24">
				<div className="container mx-auto px-4 text-center">
					<div className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
						<h2 className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text px-4 font-bold text-3xl text-transparent sm:text-4xl">
							Ready to get started? 🚀
						</h2>
						<div className="mx-auto max-w-sm px-4 sm:px-0">
							<GoogleSignInButton />
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
