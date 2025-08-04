"use client";

import {
	Building2,
	Coffee,
	MessageSquare,
	Settings,
	UserCheck,
} from "lucide-react";
import { useState } from "react";
import { updateStatusAction } from "@/actions/status";
import { Button } from "@/components/ui/button";
import type { CommunicationStatus } from "@/entities/communication-status";
import { StatusDialog } from "./StatusDialog";

const statusConfig = {
	office: {
		icon: Building2,
		label: "In Office",
		color: "text-blue-500",
		bgColor: "bg-blue-500/10 hover:bg-blue-500/20",
	},
	social: {
		icon: Coffee,
		label: "At Social Event",
		color: "text-green-500",
		bgColor: "bg-green-500/10 hover:bg-green-500/20",
	},
	available: {
		icon: UserCheck,
		label: "Available",
		color: "text-emerald-500",
		bgColor: "bg-emerald-500/10 hover:bg-emerald-500/20",
	},
	busy: {
		icon: MessageSquare,
		label: "Busy",
		color: "text-orange-500",
		bgColor: "bg-orange-500/10 hover:bg-orange-500/20",
	},
} as const;

type StatusButtonProps = {
	currentStatus: CommunicationStatus | null;
	variant?: "default" | "mobile";
	className?: string;
};

export const StatusButton = ({
	currentStatus,
	variant = "default",
	className = "",
}: StatusButtonProps) => {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);

	const handleStatusUpdate = async (data: {
		statusType: "office" | "social" | "available" | "busy";
		message?: string;
		expiresIn?: string;
	}) => {
		setIsUpdating(true);
		try {
			await updateStatusAction(data);
		} finally {
			setIsUpdating(false);
		}
	};

	const status = currentStatus?.statusType || null;
	const config = status ? statusConfig[status] : null;
	const Icon = config?.icon || Settings;

	if (variant === "mobile") {
		return (
			<>
				<button
					type="button"
					onClick={() => setDialogOpen(true)}
					disabled={isUpdating}
					className={`${className} ${config?.color || "text-muted-foreground"}`}
				>
					<Icon />
				</button>

				<StatusDialog
					open={dialogOpen}
					onOpenChange={setDialogOpen}
					currentStatus={currentStatus}
					onSubmit={handleStatusUpdate}
				/>
			</>
		);
	}

	return (
		<>
			<Button
				onClick={() => setDialogOpen(true)}
				variant="ghost"
				disabled={isUpdating}
				className={`w-full justify-start gap-3 font-medium ${
					config ? config.bgColor : "hover:bg-muted"
				}`}
			>
				<Icon
					className={`h-5 w-5 ${config?.color || "text-muted-foreground"}`}
				/>
				<span className="flex-1 text-left">
					{config ? config.label : "Set Status"}
				</span>
				{currentStatus?.message && (
					<span className="max-w-[120px] truncate text-muted-foreground text-xs">
						{currentStatus.message}
					</span>
				)}
			</Button>

			<StatusDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				currentStatus={currentStatus}
				onSubmit={handleStatusUpdate}
			/>
		</>
	);
};
