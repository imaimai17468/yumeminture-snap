"use client";

import { Building2, Coffee, MessageSquare, UserCheck } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import type { CommunicationStatusWithUser } from "@/entities/communication-status";
import { formatDistanceToNow } from "@/lib/date";

const statusConfig = {
	office: {
		icon: Building2,
		label: "出社中",
		color: "text-blue-500",
		bgColor: "bg-blue-500/10",
	},
	social: {
		icon: Coffee,
		label: "懇親会",
		color: "text-green-500",
		bgColor: "bg-green-500/10",
	},
	available: {
		icon: UserCheck,
		label: "対応可能",
		color: "text-emerald-500",
		bgColor: "bg-emerald-500/10",
	},
	busy: {
		icon: MessageSquare,
		label: "取り込み中",
		color: "text-orange-500",
		bgColor: "bg-orange-500/10",
	},
} as const;

type StatusListProps = {
	statuses: CommunicationStatusWithUser[];
	currentUserId: string;
};

export const StatusList = ({ statuses, currentUserId }: StatusListProps) => {
	if (statuses.length === 0) {
		return (
			<Card>
				<CardContent className="py-12 text-center">
					<MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
					<h3 className="font-semibold text-lg">No active statuses</h3>
					<p className="mt-2 text-muted-foreground">
						友達がステータスを設定すると、ここに表示されます
					</p>
				</CardContent>
			</Card>
		);
	}

	const groupedStatuses = statuses.reduce(
		(acc, status) => {
			const type = status.statusType;
			if (!acc[type]) {
				acc[type] = [];
			}
			acc[type].push(status);
			return acc;
		},
		{} as Record<
			CommunicationStatusWithUser["statusType"],
			CommunicationStatusWithUser[]
		>,
	);

	return (
		<div className="space-y-6">
			{(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map(
				(type) => {
					const statuses = groupedStatuses[type];
					if (!statuses || statuses.length === 0) return null;

					const config = statusConfig[type];
					const Icon = config.icon;

					return (
						<div key={type}>
							<div className="mb-3 flex items-center gap-2">
								<div
									className={`flex items-center gap-2 rounded-full px-3 py-1 ${config.bgColor}`}
								>
									<Icon className={`h-4 w-4 ${config.color}`} />
									<span className="font-medium text-sm">{config.label}</span>
									<span className="text-muted-foreground text-sm">
										({statuses.length})
									</span>
								</div>
							</div>

							<div className="grid gap-3 sm:grid-cols-2">
								{statuses.map((status) => (
									<Card key={status.id} className="overflow-hidden">
										<CardContent className="p-4">
											<div className="flex items-start gap-3">
												<Link href={`/profile/${status.userId}`}>
													<Avatar className="h-10 w-10 transition-opacity hover:opacity-80">
														<AvatarImage
															src={status.user.avatarUrl || undefined}
															alt={status.user.name || "User"}
														/>
														<AvatarFallback>
															{status.userId === currentUserId
																? "You"
																: status.user.name?.[0]?.toUpperCase() || "U"}
														</AvatarFallback>
													</Avatar>
												</Link>
												<div className="min-w-0 flex-1">
													<div className="flex items-center justify-between">
														<Link
															href={`/profile/${status.userId}`}
															className="font-medium hover:underline"
														>
															{status.userId === currentUserId
																? "あなた"
																: status.user.name || "Unknown User"}
														</Link>
														<span className="text-muted-foreground text-xs">
															{formatDistanceToNow(new Date(status.updatedAt))}
														</span>
													</div>
													{status.message && (
														<p className="mt-1 text-muted-foreground text-sm">
															{status.message}
														</p>
													)}
													{status.expiresAt && (
														<p className="mt-1 text-muted-foreground text-xs">
															有効期限:{" "}
															{formatDistanceToNow(new Date(status.expiresAt))}
														</p>
													)}
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</div>
					);
				},
			)}
		</div>
	);
};
