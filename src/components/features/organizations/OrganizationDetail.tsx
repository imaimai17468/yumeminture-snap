"use client";

import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Building2, Calendar, Shield, User, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
	applyForMembershipAction,
	updateMembershipAction,
} from "@/actions/organization";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Organization } from "@/entities/organization";
import type { OrganizationMembershipWithUser } from "@/entities/organization-membership";
import { cn } from "@/lib/utils";

dayjs.extend(localizedFormat);
dayjs.locale("en");

type OrganizationDetailProps = {
	organization: Organization;
	members: OrganizationMembershipWithUser[];
	currentUserMember: OrganizationMembershipWithUser | null;
};

export const OrganizationDetail = ({
	organization,
	members,
	currentUserMember,
}: OrganizationDetailProps) => {
	const router = useRouter();
	const [isApplying, setIsApplying] = useState(false);
	const [processingMemberships, setProcessingMemberships] = useState<
		Set<string>
	>(new Set());

	const approvedMembers = members.filter(
		(member) => member.status === "approved",
	);
	const pendingMembers = members.filter(
		(member) => member.status === "pending",
	);
	const isAdmin =
		currentUserMember?.role === "admin" &&
		currentUserMember.status === "approved";

	const handleApply = async () => {
		setIsApplying(true);
		try {
			const result = await applyForMembershipAction({
				organizationId: organization.id,
			});

			if (result.success) {
				toast.success("Application submitted", {
					description:
						"Your application has been sent to the organization admins.",
				});
				router.refresh();
			} else {
				toast.error("Application failed", {
					description: result.error || "Something went wrong",
				});
			}
		} catch (error) {
			console.error("Application error:", error);
			toast.error("Failed to submit application");
		} finally {
			setIsApplying(false);
		}
	};

	const handleMembershipUpdate = async (
		membershipId: string,
		status: "approved" | "rejected",
	) => {
		setProcessingMemberships((prev) => new Set(prev).add(membershipId));
		try {
			const result = await updateMembershipAction(membershipId, { status });

			if (result.success) {
				toast.success(
					status === "approved" ? "Member approved" : "Member rejected",
					{
						description:
							status === "approved"
								? "The member has been added to the organization."
								: "The membership application has been rejected.",
					},
				);
				router.refresh();
			} else {
				toast.error("Update failed", {
					description: result.error || "Something went wrong",
				});
			}
		} catch (error) {
			console.error("Membership update error:", error);
			toast.error("Failed to update membership");
		} finally {
			setProcessingMemberships((prev) => {
				const newSet = new Set(prev);
				newSet.delete(membershipId);
				return newSet;
			});
		}
	};

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Organization Header */}
			<Card>
				<CardHeader>
					<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<div className="space-y-1">
							<CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
								<Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
								{organization.name}
							</CardTitle>
							{organization.description && (
								<CardDescription className="text-sm sm:text-base">
									{organization.description}
								</CardDescription>
							)}
						</div>
						{!currentUserMember && (
							<Button
								onClick={handleApply}
								disabled={isApplying}
								size="sm"
								className="w-full sm:size-default sm:w-auto"
							>
								{isApplying ? "Applying..." : "Apply to Join"}
							</Button>
						)}
						{currentUserMember?.status === "rejected" && (
							<div className="flex flex-col gap-2 sm:items-end">
								<Badge
									variant="destructive"
									className="self-start sm:self-auto"
								>
									Application Rejected
								</Badge>
								<Button
									onClick={handleApply}
									disabled={isApplying}
									size="sm"
									variant="outline"
									className="w-full sm:w-auto"
								>
									{isApplying ? "Reapplying..." : "Reapply"}
								</Button>
							</div>
						)}
						{currentUserMember?.status === "pending" && (
							<Badge variant="secondary" className="self-start">
								Application Pending
							</Badge>
						)}
						{isAdmin && (
							<div className="flex flex-col gap-2 sm:flex-row">
								<Button
									variant="outline"
									asChild
									size="sm"
									className="w-full sm:size-default sm:w-auto"
								>
									<a href={`/organizations/${organization.id}/edit`}>
										Manage Organization
									</a>
								</Button>
								<Button
									variant="outline"
									asChild
									size="sm"
									className="w-full sm:size-default sm:w-auto"
								>
									<a href={`/organizations/${organization.id}/analytics`}>
										View Analytics
									</a>
								</Button>
							</div>
						)}
					</div>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-2 text-muted-foreground text-xs sm:flex-row sm:gap-6 sm:text-sm">
						<div className="flex items-center gap-1">
							<Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
							<span>{approvedMembers.length} members</span>
						</div>
						<div className="flex items-center gap-1">
							<Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
							<span>Created {dayjs(organization.createdAt).format("LL")}</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Members Section */}
			<div className="space-y-3 sm:space-y-4">
				<h2 className="font-semibold text-lg sm:text-xl">Members</h2>

				{/* Approved Members */}
				{approvedMembers.length > 0 ? (
					<div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
						{approvedMembers.map((member) => (
							<Link
								key={member.id}
								href={`/profile/${member.user.id}`}
								className="block transition-all hover:scale-[1.02]"
							>
								<Card className="h-full transition-all hover:shadow-md">
									<CardContent className="p-3 sm:p-4">
										<div className="flex items-center gap-2.5 sm:gap-3">
											<Avatar className="h-8 w-8 sm:h-10 sm:w-10">
												<AvatarImage
													src={member.user.avatarUrl || undefined}
													alt={member.user.name || member.user.email}
												/>
												<AvatarFallback>
													<User className="h-4 w-4 sm:h-5 sm:w-5" />
												</AvatarFallback>
											</Avatar>
											<div className="flex-1 space-y-0.5 sm:space-y-1">
												<p className="font-medium text-sm sm:text-base">
													{member.user.name || member.user.email}
												</p>
												<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
													{member.role === "admin" && (
														<Badge
															variant="default"
															className="gap-0.5 self-start text-xs sm:gap-1"
														>
															<Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
															Admin
														</Badge>
													)}
													<p className="text-muted-foreground text-xs sm:text-sm">
														Joined {dayjs(member.joinedAt).format("ll")}
													</p>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				) : (
					<Card>
						<CardContent className="py-6 text-center sm:py-8">
							<p className="text-muted-foreground text-sm">
								No members yet. Be the first to join!
							</p>
						</CardContent>
					</Card>
				)}

				{/* Pending Applications (Admin only) */}
				{isAdmin && pendingMembers.length > 0 && (
					<>
						<Separator className="my-6 sm:my-8" />
						<div className="space-y-3 sm:space-y-4">
							<h3 className="font-medium text-base sm:text-lg">
								Pending Applications ({pendingMembers.length})
							</h3>
							<div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
								{pendingMembers.map((member) => (
									<Card
										key={member.id}
										className={cn(
											"border-dashed transition-all",
											"border-yellow-500/50 bg-yellow-500/5",
										)}
									>
										<CardContent className="p-3 sm:p-4">
											<div className="space-y-2.5 sm:space-y-3">
												<Link
													href={`/profile/${member.user.id}`}
													className="block"
												>
													<div className="flex items-center gap-2.5 transition-opacity hover:opacity-80 sm:gap-3">
														<Avatar className="h-8 w-8 sm:h-10 sm:w-10">
															<AvatarImage
																src={member.user.avatarUrl || undefined}
																alt={member.user.name || member.user.email}
															/>
															<AvatarFallback>
																<User className="h-4 w-4 sm:h-5 sm:w-5" />
															</AvatarFallback>
														</Avatar>
														<div className="flex-1 space-y-0.5 sm:space-y-1">
															<p className="font-medium text-sm sm:text-base">
																{member.user.name || member.user.email}
															</p>
															<p className="text-muted-foreground text-xs sm:text-sm">
																Applied {dayjs(member.createdAt).format("ll")}
															</p>
														</div>
													</div>
												</Link>
												<div className="flex gap-2">
													<Button
														size="sm"
														variant="default"
														className="flex-1 text-xs sm:text-sm"
														disabled={processingMemberships.has(member.id)}
														onClick={() =>
															handleMembershipUpdate(member.id, "approved")
														}
													>
														{processingMemberships.has(member.id)
															? "Processing..."
															: "Approve"}
													</Button>
													<Button
														size="sm"
														variant="outline"
														className="flex-1 text-xs sm:text-sm"
														disabled={processingMemberships.has(member.id)}
														onClick={() =>
															handleMembershipUpdate(member.id, "rejected")
														}
													>
														{processingMemberships.has(member.id)
															? "Processing..."
															: "Reject"}
													</Button>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
};
