"use client";

import { Building2, Camera, Network, Radio } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Dynamic import to avoid SSR issues with ReactFlow
const NetworkVisualization = dynamic(
	() =>
		import("./NetworkVisualization").then((mod) => mod.NetworkVisualization),
	{
		ssr: false,
		loading: () => (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
			</div>
		),
	},
);

const features = [
	{
		id: "join-org",
		title: "Join Organization",
		subtitle: "Connect with your company",
		icon: Building2,
		gradient: "from-green-400 to-emerald-400",
	},
	{
		id: "photo-friends",
		title: "Connect with Photos",
		subtitle: "Build relationships from real encounters",
		icon: Camera,
		gradient: "from-cyan-400 to-blue-400",
	},
	{
		id: "network-viz",
		title: "Network Visualization",
		subtitle: "See connections up to friends of friends",
		icon: Network,
		gradient: "from-purple-400 to-pink-400",
	},
	{
		id: "realtime-status",
		title: "Real-time Status",
		subtitle: "Know who's available right now",
		icon: Radio,
		gradient: "from-blue-400 to-purple-400",
	},
];

export const FeatureDemo = () => {
	const [activeTab, setActiveTab] = useState(0);
	const [isAutoRotating, setIsAutoRotating] = useState(true);

	useEffect(() => {
		if (!isAutoRotating) return;

		const interval = setInterval(() => {
			setActiveTab((prev) => (prev + 1) % features.length);
		}, 4000);

		return () => clearInterval(interval);
	}, [isAutoRotating]);

	const handleTabClick = (index: number) => {
		setActiveTab(index);
		setIsAutoRotating(false);
	};

	return (
		<div className="relative w-full overflow-hidden rounded-2xl bg-zinc-900/50 p-8 backdrop-blur-xl">
			{/* Background Effects */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="-top-1/2 -right-1/2 absolute h-full w-full rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-400/20 blur-3xl" />
				<div className="-bottom-1/2 -left-1/2 absolute h-full w-full rounded-full bg-gradient-to-tr from-blue-400/20 to-pink-400/20 blur-3xl" />
			</div>

			{/* Content */}
			<div className="relative z-10">
				{/* Header */}
				<div className="mb-8 text-center">
					<h2 className="mb-2 font-bold text-2xl">
						<span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
							How It Works
						</span>
					</h2>
					<p className="text-gray-400 text-sm">
						Three simple ways to expand your professional network
					</p>
				</div>

				{/* Tabs */}
				<div className="mb-6 flex gap-2">
					{features.map((feature, index) => {
						const Icon = feature.icon;
						return (
							<button
								key={feature.id}
								type="button"
								onClick={() => handleTabClick(index)}
								className={cn(
									"flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 transition-all",
									activeTab === index
										? "bg-white/10 text-white"
										: "text-gray-400 hover:bg-white/5 hover:text-gray-300",
								)}
							>
								<Icon className="h-4 w-4" />
								<span className="hidden font-medium text-xs sm:inline">
									{feature.title}
								</span>
							</button>
						);
					})}
				</div>

				{/* Demo Content */}
				<div className="relative h-72 overflow-hidden rounded-lg bg-black/50">
					{/* Join Organization Demo */}
					{activeTab === 0 && (
						<div className="flex h-full flex-col items-center justify-center p-6">
							<div className="space-y-6">
								<div className="flex justify-center">
									<div className="relative flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
										<Building2 className="h-10 w-10 text-green-400" />
									</div>
								</div>
								<div className="space-y-4 text-center">
									<div className="space-y-2">
										<p className="text-gray-300 text-sm">
											Join or create your organization
										</p>
										<div className="flex flex-wrap justify-center gap-2">
											{["TechCorp", "DesignHub", "StartupX"].map((org) => (
												<div
													key={org}
													className="rounded-full bg-gradient-to-r from-green-400/20 to-emerald-400/20 px-3 py-1 text-green-300 text-xs"
												>
													{org}
												</div>
											))}
										</div>
									</div>
									<p className="text-gray-400 text-xs">
										Connect with your colleagues
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Photo Friends Demo */}
					{activeTab === 1 && (
						<div className="flex h-full flex-col items-center justify-center p-6">
							<div className="relative">
								<div className="flex items-center justify-center">
									<div className="relative">
										<Camera className="h-16 w-16 text-cyan-400" />
										<div className="absolute inset-0 animate-ping">
											<Camera className="h-16 w-16 text-cyan-400 opacity-50" />
										</div>
									</div>
								</div>
								<div className="-space-x-3 mt-8 flex justify-center">
									{[1, 2, 3].map((i) => (
										<div
											key={i}
											className="relative h-12 w-12 overflow-hidden rounded-full bg-gradient-to-br from-cyan-400 to-blue-400 ring-2 ring-black"
											style={{
												animationDelay: `${i * 200}ms`,
												animation: "fade-in 0.5s ease-out forwards",
											}}
										>
											<div className="flex h-full w-full items-center justify-center font-semibold text-white">
												{String.fromCharCode(64 + i)}
											</div>
										</div>
									))}
								</div>
								<p className="mt-4 text-center text-gray-400 text-sm">
									Take a photo to become friends
								</p>
							</div>
						</div>
					)}

					{/* Network Visualization Demo */}
					{activeTab === 2 && (
						<div className="relative h-full">
							<NetworkVisualization />
							<p className="absolute right-0 bottom-6 left-0 text-center text-gray-400 text-sm">
								Expand your network across organizations
							</p>
						</div>
					)}

					{/* Realtime Status Demo */}
					{activeTab === 3 && (
						<div className="flex h-full flex-col justify-between p-6">
							<div className="space-y-3">
								{[
									{ name: "Sarah Chen", status: "In Office", color: "green" },
									{ name: "Alex Kim", status: "At Event", color: "purple" },
									{ name: "Jordan Lee", status: "Online", color: "blue" },
								].map((person, i) => (
									<div
										key={person.name}
										className="flex items-center gap-3 rounded-lg bg-white/5 p-3 backdrop-blur"
										style={{
											animation: `slide-in 0.5s ease-out ${i * 100}ms forwards`,
										}}
									>
										<div className="relative">
											<div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400" />
											<div
												className={cn(
													"-bottom-0.5 -right-0.5 absolute h-3.5 w-3.5 rounded-full ring-2 ring-black",
													person.color === "green" && "bg-green-400",
													person.color === "purple" && "bg-purple-400",
													person.color === "blue" && "bg-blue-400",
												)}
											>
												{person.color === "green" && (
													<div className="absolute inset-0 animate-ping rounded-full bg-green-400" />
												)}
											</div>
										</div>
										<div className="flex-1">
											<p className="font-medium text-sm text-white">
												{person.name}
											</p>
											<p className="text-gray-400 text-xs">{person.status}</p>
										</div>
									</div>
								))}
							</div>
							<p className="text-center text-gray-400 text-sm">
								See who's available in real-time
							</p>
						</div>
					)}
				</div>

				{/* Progress Indicators */}
				<div className="mt-4 flex justify-center gap-1.5">
					{features.map((feature, index) => (
						<button
							key={feature.id}
							type="button"
							onClick={() => handleTabClick(index)}
							className={cn(
								"h-1.5 w-1.5 rounded-full transition-all",
								activeTab === index
									? "w-8 bg-gradient-to-r from-cyan-400 to-purple-400"
									: "bg-gray-600",
							)}
						/>
					))}
				</div>
			</div>
		</div>
	);
};
