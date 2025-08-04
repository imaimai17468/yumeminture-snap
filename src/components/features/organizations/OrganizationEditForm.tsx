"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { AlertCircle, Crown, Shield, Trash2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
	deleteOrganizationAction,
	removeMembershipAction,
	updateMembershipAction,
	updateOrganizationAction,
} from "@/actions/organization";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	ApprovalMethodSchema,
	type Organization,
} from "@/entities/organization";
import type { OrganizationMembershipWithUser } from "@/entities/organization-membership";
import { cn } from "@/lib/utils";

dayjs.extend(localizedFormat);
dayjs.locale("en");

const organizationFormSchema = z.object({
	name: z.string().min(1, "Name is required").max(200),
	description: z.string().max(500).nullable(),
});

const approvalSettingsSchema = z.object({
	approvalMethod: ApprovalMethodSchema,
	approvalDomains: z.string(),
});

type OrganizationFormValues = z.infer<typeof organizationFormSchema>;
type ApprovalSettingsFormValues = z.infer<typeof approvalSettingsSchema>;

type OrganizationEditFormProps = {
	organization: Organization;
	members: OrganizationMembershipWithUser[];
	currentUserId: string;
};

export const OrganizationEditForm = ({
	organization,
	members,
	currentUserId,
}: OrganizationEditFormProps) => {
	const router = useRouter();
	const [isUpdating, setIsUpdating] = useState(false);
	const [isUpdatingApproval, setIsUpdatingApproval] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [processingMemberships, setProcessingMemberships] = useState<
		Set<string>
	>(new Set());

	const form = useForm<OrganizationFormValues>({
		resolver: zodResolver(organizationFormSchema),
		defaultValues: {
			name: organization.name,
			description: organization.description || "",
		},
	});

	const approvalForm = useForm<ApprovalSettingsFormValues>({
		resolver: zodResolver(approvalSettingsSchema),
		defaultValues: {
			approvalMethod: organization.approvalMethod,
			approvalDomains: organization.approvalDomains.join(", "),
		},
	});

	const approvedMembers = members.filter(
		(member) => member.status === "approved",
	);

	const onSubmit = async (values: OrganizationFormValues) => {
		setIsUpdating(true);
		try {
			const result = await updateOrganizationAction(organization.id, {
				name: values.name,
				description: values.description || null,
			});

			if (result.success) {
				toast.success("Organization updated successfully");
				router.refresh();
			} else {
				toast.error("Failed to update organization", {
					description: result.error || "Something went wrong",
				});
			}
		} catch (error) {
			console.error("Update error:", error);
			toast.error("Failed to update organization");
		} finally {
			setIsUpdating(false);
		}
	};

	const onApprovalSubmit = async (values: ApprovalSettingsFormValues) => {
		setIsUpdatingApproval(true);
		try {
			const approvalDomains = values.approvalDomains
				.split(",")
				.map((d) => d.trim())
				.filter((d) => d.length > 0);

			const result = await updateOrganizationAction(organization.id, {
				approvalMethod: values.approvalMethod,
				approvalDomains,
			});

			if (result.success) {
				toast.success("Approval settings updated successfully");
				router.refresh();
			} else {
				toast.error("Failed to update approval settings", {
					description: result.error || "Something went wrong",
				});
			}
		} catch (error) {
			console.error("Update error:", error);
			toast.error("Failed to update approval settings");
		} finally {
			setIsUpdatingApproval(false);
		}
	};

	const handleDeleteOrganization = async () => {
		setIsDeleting(true);
		try {
			const result = await deleteOrganizationAction(organization.id);

			if (result.success) {
				toast.success("Organization deleted successfully");
				router.push("/organizations");
			} else {
				toast.error("Failed to delete organization", {
					description: result.error || "Something went wrong",
				});
			}
		} catch (error) {
			console.error("Delete error:", error);
			toast.error("Failed to delete organization");
		} finally {
			setIsDeleting(false);
			setShowDeleteDialog(false);
		}
	};

	const handleMemberAction = async (
		membershipId: string,
		action: "makeAdmin" | "removeAdmin" | "remove",
	) => {
		setProcessingMemberships((prev) => new Set(prev).add(membershipId));
		try {
			let result: { success: boolean; error?: string };

			if (action === "remove") {
				result = await removeMembershipAction(membershipId);
			} else {
				result = await updateMembershipAction(membershipId, {
					role: action === "makeAdmin" ? "admin" : "member",
				});
			}

			if (result.success) {
				toast.success(
					action === "remove"
						? "Member removed"
						: action === "makeAdmin"
							? "Member promoted to admin"
							: "Admin privileges removed",
				);
				router.refresh();
			} else {
				toast.error("Failed to update member", {
					description: result.error || "Something went wrong",
				});
			}
		} catch (error) {
			console.error("Member action error:", error);
			toast.error("Failed to update member");
		} finally {
			setProcessingMemberships((prev) => {
				const newSet = new Set(prev);
				newSet.delete(membershipId);
				return newSet;
			});
		}
	};

	return (
		<div className="space-y-8">
			{/* Organization Information */}
			<Card>
				<CardHeader>
					<CardTitle>Organization Information</CardTitle>
					<CardDescription>
						Update your organization's basic information.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							<FormField<OrganizationFormValues, "name">
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Organization Name</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormDescription>
											This is your organization's display name.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField<OrganizationFormValues, "description">
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Description</FormLabel>
										<FormControl>
											<Textarea
												{...field}
												value={field.value || ""}
												className="min-h-[100px] resize-none"
											/>
										</FormControl>
										<FormDescription>
											Brief description of your organization (optional).
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button type="submit" disabled={isUpdating}>
								{isUpdating ? "Updating..." : "Update Organization"}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>

			{/* Approval Settings */}
			<Card>
				<CardHeader>
					<CardTitle>Approval Settings</CardTitle>
					<CardDescription>
						Configure how new members can join your organization.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...approvalForm}>
						<form
							onSubmit={approvalForm.handleSubmit(onApprovalSubmit)}
							className="space-y-6"
						>
							<FormField<ApprovalSettingsFormValues, "approvalMethod">
								control={approvalForm.control}
								name="approvalMethod"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Approval Method</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value || "manual"}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select an approval method" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="manual">
													Manual Approval (Default)
												</SelectItem>
												<SelectItem value="auto">Automatic Approval</SelectItem>
												<SelectItem value="domain">
													Domain-based Approval
												</SelectItem>
											</SelectContent>
										</Select>
										<FormDescription>
											{field.value === "manual" &&
												"Organization admins must manually approve each join request."}
											{field.value === "auto" &&
												"New members are automatically approved when they apply."}
											{field.value === "domain" &&
												"Members with email addresses from specified domains are automatically approved."}
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							{approvalForm.watch("approvalMethod") === "domain" && (
								<FormField<ApprovalSettingsFormValues, "approvalDomains">
									control={approvalForm.control}
									name="approvalDomains"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Allowed Domains</FormLabel>
											<FormControl>
												<Input
													{...field}
													value={field.value || ""}
													placeholder="example.com, company.jp"
												/>
											</FormControl>
											<FormDescription>
												Enter comma-separated email domains that are
												automatically approved. For example: example.com,
												company.jp
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							<Button type="submit" disabled={isUpdatingApproval}>
								{isUpdatingApproval
									? "Updating..."
									: "Update Approval Settings"}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>

			{/* Member Management */}
			<Card>
				<CardHeader>
					<CardTitle>Member Management</CardTitle>
					<CardDescription>
						Manage your organization's members and their roles.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{approvedMembers.map((member) => {
							const isCurrentUser = member.userId === currentUserId;
							const isProcessing = processingMemberships.has(member.id);

							return (
								<div
									key={member.id}
									className={cn(
										"flex items-center justify-between rounded-lg border p-4",
										isCurrentUser && "bg-muted/50",
									)}
								>
									<div className="flex items-center gap-3">
										<Avatar className="h-10 w-10">
											<AvatarImage
												src={member.user.avatarUrl || undefined}
												alt={member.user.name || member.user.email}
											/>
											<AvatarFallback>
												<User className="h-5 w-5" />
											</AvatarFallback>
										</Avatar>
										<div className="space-y-1">
											<div className="flex items-center gap-2">
												<p className="font-medium">
													{member.user.name || member.user.email}
												</p>
												{member.role === "admin" && (
													<Badge variant="default" className="gap-1">
														<Shield className="h-3 w-3" />
														Admin
													</Badge>
												)}
												{isCurrentUser && (
													<Badge variant="secondary">You</Badge>
												)}
											</div>
											<p className="text-muted-foreground text-sm">
												Joined {dayjs(member.joinedAt).format("ll")}
											</p>
										</div>
									</div>

									{!isCurrentUser && (
										<div className="flex gap-2">
											{member.role === "admin" ? (
												<Button
													size="sm"
													variant="outline"
													disabled={isProcessing}
													onClick={() =>
														handleMemberAction(member.id, "removeAdmin")
													}
												>
													Remove Admin
												</Button>
											) : (
												<Button
													size="sm"
													variant="outline"
													disabled={isProcessing}
													onClick={() =>
														handleMemberAction(member.id, "makeAdmin")
													}
												>
													<Crown className="mr-1 h-3 w-3" />
													Make Admin
												</Button>
											)}
											<Button
												size="sm"
												variant="destructive"
												disabled={isProcessing}
												onClick={() => handleMemberAction(member.id, "remove")}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									)}
								</div>
							);
						})}

						{approvedMembers.length === 1 && (
							<p className="text-center text-muted-foreground text-sm">
								You are the only member in this organization.
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Danger Zone */}
			<Card className="border-destructive">
				<CardHeader>
					<CardTitle className="text-destructive">Danger Zone</CardTitle>
					<CardDescription>
						Irreversible and destructive actions.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
							<div className="space-y-1">
								<p className="font-medium">Delete this organization</p>
								<p className="text-muted-foreground text-sm">
									Once deleted, it cannot be recovered.
								</p>
							</div>
							<Button
								variant="destructive"
								onClick={() => setShowDeleteDialog(true)}
							>
								Delete Organization
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2">
							<AlertCircle className="h-5 w-5 text-destructive" />
							Are you absolutely sure?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete{" "}
							<span className="font-semibold">{organization.name}</span> and
							remove all members.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteOrganization}
							disabled={isDeleting}
							className="bg-destructive hover:bg-destructive/90"
						>
							{isDeleting ? "Deleting..." : "Delete Organization"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};
