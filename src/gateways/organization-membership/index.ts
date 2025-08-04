import { and, eq, gte, inArray, or, sql } from "drizzle-orm";
import {
	type CreateOrganizationMembership,
	type OrganizationMembership,
	OrganizationMembershipSchema,
	type OrganizationMembershipWithUser,
	OrganizationMembershipWithUserSchema,
	type UpdateOrganizationMembership,
} from "@/entities/organization-membership";
import { createActivity } from "@/gateways/activity";
import { db } from "@/lib/drizzle/db";
import {
	activities,
	communicationStatuses,
	friendships,
	organizationMemberships,
	organizations,
	photos,
	photoUsers,
	users,
} from "@/lib/drizzle/schema";
import { AppError, tryCatch } from "@/lib/error-handling";
import { createClient } from "@/lib/supabase/server";

// Helper function to check admin privileges
const checkAdminPrivileges = async (
	organizationId: string,
	userId: string,
): Promise<boolean> => {
	const [adminMembership] = await db
		.select()
		.from(organizationMemberships)
		.where(
			and(
				eq(organizationMemberships.organizationId, organizationId),
				eq(organizationMemberships.userId, userId),
				eq(organizationMemberships.role, "admin"),
				eq(organizationMemberships.status, "approved"),
			),
		)
		.limit(1);

	return !!adminMembership;
};

// Helper function to get target membership
const getTargetMembership = async (
	membershipId: string,
): Promise<OrganizationMembership | null> => {
	const [membership] = await db
		.select()
		.from(organizationMemberships)
		.where(eq(organizationMemberships.id, membershipId))
		.limit(1);

	if (!membership) {
		return null;
	}

	return OrganizationMembershipSchema.parse({
		...membership,
		joinedAt: membership.joinedAt?.toISOString() || null,
		createdAt: membership.createdAt.toISOString(),
		updatedAt: membership.updatedAt.toISOString(),
	});
};

export const fetchUserMembership =
	async (): Promise<OrganizationMembership | null> => {
		return tryCatch(async () => {
			const supabase = await createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (!user) {
				throw new AppError("Authentication required", "unauthorized");
			}

			const [membership] = await db
				.select()
				.from(organizationMemberships)
				.where(eq(organizationMemberships.userId, user.id))
				.limit(1);

			if (!membership) {
				return null;
			}

			return OrganizationMembershipSchema.parse({
				...membership,
				joinedAt: membership.joinedAt?.toISOString() || null,
				createdAt: membership.createdAt.toISOString(),
				updatedAt: membership.updatedAt.toISOString(),
			});
		}, "Failed to fetch user membership");
	};

export const fetchUserMembershipWithOrganization = async (): Promise<{
	membership: OrganizationMembership | null;
	organizationName: string | null;
}> => {
	return tryCatch(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new AppError("Authentication required", "unauthorized");
		}

		const [result] = await db
			.select({
				membership: organizationMemberships,
				organization: organizations,
			})
			.from(organizationMemberships)
			.innerJoin(
				organizations,
				eq(organizationMemberships.organizationId, organizations.id),
			)
			.where(eq(organizationMemberships.userId, user.id))
			.limit(1);

		if (!result) {
			return { membership: null, organizationName: null };
		}

		const membership = OrganizationMembershipSchema.parse({
			...result.membership,
			joinedAt: result.membership.joinedAt?.toISOString() || null,
			createdAt: result.membership.createdAt.toISOString(),
			updatedAt: result.membership.updatedAt.toISOString(),
		});

		return {
			membership,
			organizationName: result.organization.name,
		};
	}, "Failed to fetch user membership with organization");
};

export const fetchOrganizationMembers = async (
	organizationId: string,
): Promise<OrganizationMembershipWithUser[]> => {
	return tryCatch(async () => {
		const memberships = await db
			.select({
				membership: organizationMemberships,
				user: users,
			})
			.from(organizationMemberships)
			.innerJoin(users, eq(organizationMemberships.userId, users.id))
			.where(eq(organizationMemberships.organizationId, organizationId));

		return memberships.map((row) =>
			OrganizationMembershipWithUserSchema.parse({
				...row.membership,
				joinedAt: row.membership.joinedAt?.toISOString() || null,
				createdAt: row.membership.createdAt.toISOString(),
				updatedAt: row.membership.updatedAt.toISOString(),
				user: {
					id: row.user.id,
					email: `user-${row.user.id.slice(0, 8)}@example.com`, // 仮のメールアドレス
					name: row.user.name,
					avatarUrl: row.user.avatarUrl,
				},
			}),
		);
	}, "Failed to fetch organization members");
};

export const applyForMembership = async (
	data: CreateOrganizationMembership,
): Promise<{
	success: boolean;
	membership?: OrganizationMembership;
	error?: string;
}> => {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { success: false, error: "Authentication required" };
	}

	// Get user's email
	const userEmail = user.email;
	if (!userEmail) {
		return { success: false, error: "Email required for membership" };
	}

	// Check existing membership
	const [existingMembership] = await db
		.select()
		.from(organizationMemberships)
		.where(eq(organizationMemberships.userId, user.id))
		.limit(1);

	if (existingMembership) {
		// If rejected, delete the existing membership to allow reapplication
		if (existingMembership.status === "rejected") {
			await db
				.delete(organizationMemberships)
				.where(eq(organizationMemberships.id, existingMembership.id));
		} else {
			return { success: false, error: "Already belongs to an organization" };
		}
	}

	// Get organization details
	const [organization] = await db
		.select()
		.from(organizations)
		.where(eq(organizations.id, data.organizationId))
		.limit(1);

	if (!organization) {
		return { success: false, error: "Organization not found" };
	}

	// Determine initial status based on approval method
	let initialStatus: "pending" | "approved" = "pending";
	let joinedAt: Date | null = null;

	if (organization.approvalMethod === "auto") {
		// Automatic approval
		initialStatus = "approved";
		joinedAt = new Date();
	} else if (organization.approvalMethod === "domain") {
		// Domain-based approval
		const emailDomain = userEmail.split("@")[1]?.toLowerCase();
		if (emailDomain && organization.approvalDomains?.includes(emailDomain)) {
			initialStatus = "approved";
			joinedAt = new Date();
		}
	}

	try {
		const [newMembership] = await db
			.insert(organizationMemberships)
			.values({
				userId: user.id,
				organizationId: data.organizationId,
				role: "member",
				status: initialStatus,
				joinedAt,
			})
			.returning();

		// If automatically approved, create activity
		if (initialStatus === "approved") {
			await createActivity({
				type: "joined_organization",
				relatedOrganizationId: organization.id,
				metadata: {
					organizationName: organization.name,
				},
			});
		}

		const membership = OrganizationMembershipSchema.parse({
			...newMembership,
			joinedAt: newMembership.joinedAt?.toISOString() || null,
			createdAt: newMembership.createdAt.toISOString(),
			updatedAt: newMembership.updatedAt.toISOString(),
		});

		return { success: true, membership };
	} catch (error) {
		console.error("Membership application error:", error);
		return { success: false, error: "Application failed" };
	}
};

export const updateMembership = async (
	membershipId: string,
	data: UpdateOrganizationMembership,
): Promise<{
	success: boolean;
	membership?: OrganizationMembership;
	error?: string;
}> => {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { success: false, error: "Authentication required" };
	}

	// Get target membership
	const targetMembership = await getTargetMembership(membershipId);

	if (!targetMembership) {
		return { success: false, error: "Membership not found" };
	}

	// Check admin privileges
	const isAdmin = await checkAdminPrivileges(
		targetMembership.organizationId,
		user.id,
	);

	if (!isAdmin) {
		return { success: false, error: "Admin privileges required" };
	}

	try {
		const updateData: {
			updatedAt: Date;
			role?: "admin" | "member";
			status?: "pending" | "approved" | "rejected";
			joinedAt?: Date;
		} = {
			updatedAt: new Date(),
		};

		if (data.role !== undefined) {
			updateData.role = data.role;
		}

		if (data.status !== undefined) {
			updateData.status = data.status;
			if (data.status === "approved") {
				updateData.joinedAt = new Date();
			}
		}

		const [updatedMembership] = await db
			.update(organizationMemberships)
			.set(updateData)
			.where(eq(organizationMemberships.id, membershipId))
			.returning();

		// If status changed to approved, create activity
		if (data.status === "approved" && targetMembership.status !== "approved") {
			// Get organization name
			const [organization] = await db
				.select()
				.from(organizations)
				.where(eq(organizations.id, targetMembership.organizationId))
				.limit(1);

			if (organization) {
				await createActivity({
					type: "joined_organization",
					relatedOrganizationId: organization.id,
					metadata: {
						organizationName: organization.name,
					},
				});
			}
		}

		const membership = OrganizationMembershipSchema.parse({
			...updatedMembership,
			joinedAt: updatedMembership.joinedAt?.toISOString() || null,
			createdAt: updatedMembership.createdAt.toISOString(),
			updatedAt: updatedMembership.updatedAt.toISOString(),
		});

		return { success: true, membership };
	} catch (error) {
		console.error("Membership update error:", error);
		return { success: false, error: "Update failed" };
	}
};

export const removeMembership = async (
	membershipId: string,
): Promise<{ success: boolean; error?: string }> => {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { success: false, error: "Authentication required" };
	}

	// Get target membership
	const targetMembership = await getTargetMembership(membershipId);

	if (!targetMembership) {
		return { success: false, error: "Membership not found" };
	}

	// Only the person themselves or admin can delete
	const canDelete =
		targetMembership.userId === user.id ||
		(await checkAdminPrivileges(targetMembership.organizationId, user.id));

	if (!canDelete) {
		return { success: false, error: "No deletion permission" };
	}

	try {
		await db
			.delete(organizationMemberships)
			.where(eq(organizationMemberships.id, membershipId));

		return { success: true };
	} catch (error) {
		console.error("Membership deletion error:", error);
		return { success: false, error: "Deletion failed" };
	}
};

export const fetchOrganizationAnalyticsData = async (
	organizationId: string,
) => {
	const [
		members,
		allActivities,
		allPhotos,
		allCommunicationStatuses,
		allFriendships,
	] = await Promise.all([
		// メンバー一覧（承認済みのみ）
		db
			.select({
				id: organizationMemberships.id,
				userId: organizationMemberships.userId,
				organizationId: organizationMemberships.organizationId,
				role: organizationMemberships.role,
				status: organizationMemberships.status,
				joinedAt: organizationMemberships.joinedAt,
				createdAt: organizationMemberships.createdAt,
				updatedAt: organizationMemberships.updatedAt,
				user: users,
			})
			.from(organizationMemberships)
			.innerJoin(users, eq(organizationMemberships.userId, users.id))
			.where(
				and(
					eq(organizationMemberships.organizationId, organizationId),
					eq(organizationMemberships.status, "approved"),
				),
			),

		// 全メンバーのアクティビティ（過去3ヶ月）
		db
			.select()
			.from(activities)
			.where(
				and(
					inArray(
						activities.userId,
						db
							.select({ userId: organizationMemberships.userId })
							.from(organizationMemberships)
							.where(
								and(
									eq(organizationMemberships.organizationId, organizationId),
									eq(organizationMemberships.status, "approved"),
								),
							),
					),
					gte(activities.createdAt, sql`NOW() - INTERVAL '3 months'`),
				),
			),

		// 全メンバーの写真（過去3ヶ月）
		db
			.select({
				photo: photos,
				taggedUsers: sql<string[]>`ARRAY_AGG(${photoUsers.userId})`,
			})
			.from(photos)
			.leftJoin(photoUsers, eq(photos.id, photoUsers.photoId))
			.where(
				and(
					inArray(
						photos.uploadedBy,
						db
							.select({ userId: organizationMemberships.userId })
							.from(organizationMemberships)
							.where(
								and(
									eq(organizationMemberships.organizationId, organizationId),
									eq(organizationMemberships.status, "approved"),
								),
							),
					),
					gte(photos.createdAt, sql`NOW() - INTERVAL '3 months'`),
				),
			)
			.groupBy(photos.id),

		// 現在のコミュニケーションステータス
		db
			.select()
			.from(communicationStatuses)
			.where(
				inArray(
					communicationStatuses.userId,
					db
						.select({ userId: organizationMemberships.userId })
						.from(organizationMemberships)
						.where(
							and(
								eq(organizationMemberships.organizationId, organizationId),
								eq(organizationMemberships.status, "approved"),
							),
						),
				),
			),

		// 全メンバーの友達関係
		db
			.select()
			.from(friendships)
			.where(
				or(
					inArray(
						friendships.userId1,
						db
							.select({ userId: organizationMemberships.userId })
							.from(organizationMemberships)
							.where(
								and(
									eq(organizationMemberships.organizationId, organizationId),
									eq(organizationMemberships.status, "approved"),
								),
							),
					),
					inArray(
						friendships.userId2,
						db
							.select({ userId: organizationMemberships.userId })
							.from(organizationMemberships)
							.where(
								and(
									eq(organizationMemberships.organizationId, organizationId),
									eq(organizationMemberships.status, "approved"),
								),
							),
					),
				),
			),
	]);

	return {
		members: members.map((m) => ({
			...m,
			createdAt: m.createdAt.toISOString(),
			updatedAt: m.updatedAt.toISOString(),
			joinedAt: m.joinedAt?.toISOString() || null,
			user: {
				...m.user,
				createdAt: m.user.createdAt.toISOString(),
				updatedAt: m.user.updatedAt.toISOString(),
			},
		})),
		activities: allActivities.map((a) => ({
			...a,
			createdAt: a.createdAt.toISOString(),
		})),
		photos: allPhotos.map((p) => ({
			...p.photo,
			createdAt: p.photo.createdAt.toISOString(),
			taggedUsers: p.taggedUsers || [],
		})),
		communicationStatuses: allCommunicationStatuses.map((cs) => ({
			...cs,
			createdAt: cs.createdAt.toISOString(),
			updatedAt: cs.updatedAt.toISOString(),
			expiresAt: cs.expiresAt?.toISOString() || null,
		})),
		friendships: allFriendships.map((f) => ({
			...f,
			createdAt: f.createdAt.toISOString(),
		})),
	};
};
