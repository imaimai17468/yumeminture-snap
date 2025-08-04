"use client";

import { Bell, Camera, Home, Network } from "lucide-react";
import Link from "next/link";
import { StatusButton } from "@/components/features/status/StatusButton";
import GlassSurface from "@/components/ui/Components/GlassSurface/GlassSurface";
import type { CommunicationStatus } from "@/entities/communication-status";

type MobileDockProps = {
	selectedView: "timeline" | "network" | "notifications";
	onViewChange: (view: "timeline" | "network" | "notifications") => void;
	currentStatus: CommunicationStatus | null;
	notificationCount?: number;
};

export const MobileDock = ({
	selectedView,
	onViewChange,
	currentStatus,
	notificationCount = 0,
}: MobileDockProps) => {
	return (
		<div className="fixed right-0 bottom-0 left-0 z-50 p-3">
			<GlassSurface
				width="100%"
				height={80}
				borderRadius={16}
				className="w-full p-0"
			>
				<div className="mx-auto w-full max-w-screen-sm bg-background/50">
					<div className="flex items-center justify-around px-4 py-3">
						{/* Timeline */}
						<button
							type="button"
							onClick={() => onViewChange("timeline")}
							className={`relative p-3 transition-colors ${
								selectedView === "timeline"
									? "text-primary"
									: "text-muted-foreground"
							}`}
							aria-label="Timeline"
						>
							<Home className="h-6 w-6" />
						</button>

						{/* Network */}
						<button
							type="button"
							onClick={() => onViewChange("network")}
							className={`relative p-3 transition-colors ${
								selectedView === "network"
									? "text-primary"
									: "text-muted-foreground"
							}`}
							aria-label="Network"
						>
							<Network className="h-6 w-6" />
						</button>

						{/* Camera - Large center button */}
						<Link
							href="/photos/upload"
							className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl"
						>
							<Camera className="h-7 w-7 text-primary-foreground" />
							<span className="sr-only">Take Photo</span>
						</Link>

						{/* Notifications */}
						<button
							type="button"
							onClick={() => onViewChange("notifications")}
							className={`relative p-3 transition-colors ${
								selectedView === "notifications"
									? "text-primary"
									: "text-muted-foreground"
							}`}
							aria-label="Notifications"
						>
							<Bell className="h-6 w-6" />
							{notificationCount > 0 && (
								<span className="-right-1 -top-1 absolute flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
									{notificationCount > 9 ? "9+" : notificationCount}
								</span>
							)}
						</button>

						{/* Status */}
						<div className="p-3">
							<StatusButton
								currentStatus={currentStatus}
								variant="mobile"
								className="h-6 w-6"
							/>
						</div>
					</div>
				</div>
			</GlassSurface>
		</div>
	);
};
