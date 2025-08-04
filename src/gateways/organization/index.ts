import { and, count, eq, ilike, or } from "drizzle-orm";
import {
	type CreateOrganization,
	type Organization,
	OrganizationSchema,
	type OrganizationWithStats,
	OrganizationWithStatsSchema,
	type UpdateOrganization,
} from "@/entities/organization";
import { createOrganizationCreatedActivity } from "@/gateways/activity";
import { db } from "@/lib/drizzle/db";
import { organizationMemberships, organizations } from "@/lib/drizzle/schema";
import { tryCatch } from "@/lib/error-handling";
import { createClient } from "@/lib/supabase/server";

export const fetchOrganizations = async (): Promise<Organization[]> => {
	return tryCatch(async () => {
		const rawOrganizations = await db.select().from(organizations);

		return rawOrganizations.map((org) =>
			OrganizationSchema.parse({
				...org,
				approvalMethod: org.approvalMethod || "manual",
				approvalDomains: org.approvalDomains || [],
				createdAt: org.createdAt.toISOString(),
				updatedAt: org.updatedAt.toISOString(),
			}),
		);
	}, "Failed to fetch organizations");
};

export const fetchAllOrganizations = async (): Promise<
	OrganizationWithStats[]
> => {
	const result = await db
		.select({
			id: organizations.id,
			name: organizations.name,
			description: organizations.description,
			approvalMethod: organizations.approvalMethod,
			approvalDomains: organizations.approvalDomains,
			createdAt: organizations.createdAt,
			updatedAt: organizations.updatedAt,
			memberCount: count(organizationMemberships.id),
		})
		.from(organizations)
		.leftJoin(
			organizationMemberships,
			and(
				eq(organizationMemberships.organizationId, organizations.id),
				eq(organizationMemberships.status, "approved"),
			),
		)
		.groupBy(organizations.id);

	return result.map((org) =>
		OrganizationWithStatsSchema.parse({
			...org,
			approvalMethod: org.approvalMethod || "manual",
			approvalDomains: org.approvalDomains || [],
			createdAt: org.createdAt.toISOString(),
			updatedAt: org.updatedAt.toISOString(),
			memberCount: Number(org.memberCount),
		}),
	);
};

export const searchOrganizations = async (
	query: string,
): Promise<OrganizationWithStats[]> => {
	// 検索クエリが空の場合は全組織を返す
	if (!query || query.trim() === "") {
		return fetchAllOrganizations();
	}

	const searchTerm = `%${query.trim()}%`;

	const result = await db
		.select({
			id: organizations.id,
			name: organizations.name,
			description: organizations.description,
			approvalMethod: organizations.approvalMethod,
			approvalDomains: organizations.approvalDomains,
			createdAt: organizations.createdAt,
			updatedAt: organizations.updatedAt,
			memberCount: count(organizationMemberships.id),
		})
		.from(organizations)
		.leftJoin(
			organizationMemberships,
			and(
				eq(organizationMemberships.organizationId, organizations.id),
				eq(organizationMemberships.status, "approved"),
			),
		)
		.where(
			or(
				ilike(organizations.name, searchTerm),
				ilike(organizations.description, searchTerm),
			),
		)
		.groupBy(organizations.id)
		.orderBy(organizations.name);

	return result.map((org) =>
		OrganizationWithStatsSchema.parse({
			...org,
			approvalMethod: org.approvalMethod || "manual",
			approvalDomains: org.approvalDomains || [],
			createdAt: org.createdAt.toISOString(),
			updatedAt: org.updatedAt.toISOString(),
			memberCount: Number(org.memberCount),
		}),
	);
};

export const fetchOrganizationById = async (
	id: string,
): Promise<Organization | null> => {
	const [rawOrganization] = await db
		.select()
		.from(organizations)
		.where(eq(organizations.id, id))
		.limit(1);

	if (!rawOrganization) {
		return null;
	}

	return OrganizationSchema.parse({
		...rawOrganization,
		approvalMethod: rawOrganization.approvalMethod || "manual",
		approvalDomains: rawOrganization.approvalDomains || [],
		createdAt: rawOrganization.createdAt.toISOString(),
		updatedAt: rawOrganization.updatedAt.toISOString(),
	});
};

export const createOrganization = async (
	data: CreateOrganization,
): Promise<{
	success: boolean;
	organization?: Organization;
	error?: string;
}> => {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { success: false, error: "Authentication required" };
	}

	try {
		const result = await db.transaction(async (tx) => {
			// Create organization
			const [newOrganization] = await tx
				.insert(organizations)
				.values({
					name: data.name,
					description: data.description,
					approvalMethod: data.approvalMethod || "manual",
					approvalDomains: data.approvalDomains || [],
				})
				.returning();

			// Register creator as admin
			await tx.insert(organizationMemberships).values({
				userId: user.id,
				organizationId: newOrganization.id,
				role: "admin",
				status: "approved",
				joinedAt: new Date(),
			});

			return newOrganization;
		});

		const organization = OrganizationSchema.parse({
			...result,
			approvalMethod: result.approvalMethod || "manual",
			approvalDomains: result.approvalDomains || [],
			createdAt: result.createdAt.toISOString(),
			updatedAt: result.updatedAt.toISOString(),
		});

		// Create activity for organization creation
		await createOrganizationCreatedActivity(organization.id, organization.name);

		return { success: true, organization };
	} catch (error) {
		console.error("Organization creation error:", error);
		return { success: false, error: "Failed to create organization" };
	}
};

export const updateOrganization = async (
	id: string,
	data: UpdateOrganization,
): Promise<{
	success: boolean;
	organization?: Organization;
	error?: string;
}> => {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { success: false, error: "Authentication required" };
	}

	// Check admin privileges
	const [membership] = await db
		.select()
		.from(organizationMemberships)
		.where(
			and(
				eq(organizationMemberships.organizationId, id),
				eq(organizationMemberships.userId, user.id),
				eq(organizationMemberships.role, "admin"),
				eq(organizationMemberships.status, "approved"),
			),
		)
		.limit(1);

	if (!membership) {
		return { success: false, error: "Admin privileges required" };
	}

	try {
		const [updatedOrganization] = await db
			.update(organizations)
			.set({
				...(data.name && { name: data.name }),
				...(data.description !== undefined && {
					description: data.description,
				}),
				...(data.approvalMethod !== undefined && {
					approvalMethod: data.approvalMethod,
				}),
				...(data.approvalDomains !== undefined && {
					approvalDomains: data.approvalDomains,
				}),
				updatedAt: new Date(),
			})
			.where(eq(organizations.id, id))
			.returning();

		if (!updatedOrganization) {
			return { success: false, error: "Organization not found" };
		}

		const organization = OrganizationSchema.parse({
			...updatedOrganization,
			approvalMethod: updatedOrganization.approvalMethod || "manual",
			approvalDomains: updatedOrganization.approvalDomains || [],
			createdAt: updatedOrganization.createdAt.toISOString(),
			updatedAt: updatedOrganization.updatedAt.toISOString(),
		});

		return { success: true, organization };
	} catch (error) {
		console.error("Organization update error:", error);
		return { success: false, error: "Failed to update organization" };
	}
};

export const deleteOrganization = async (
	id: string,
): Promise<{ success: boolean; error?: string }> => {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { success: false, error: "Authentication required" };
	}

	// Check admin privileges
	const [membership] = await db
		.select()
		.from(organizationMemberships)
		.where(
			and(
				eq(organizationMemberships.organizationId, id),
				eq(organizationMemberships.userId, user.id),
				eq(organizationMemberships.role, "admin"),
				eq(organizationMemberships.status, "approved"),
			),
		)
		.limit(1);

	if (!membership) {
		return { success: false, error: "Admin privileges required" };
	}

	try {
		await db.delete(organizations).where(eq(organizations.id, id));

		return { success: true };
	} catch (error) {
		console.error("Organization deletion error:", error);
		return { success: false, error: "Failed to delete organization" };
	}
};
