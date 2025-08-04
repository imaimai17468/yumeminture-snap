"use server";

import { revalidatePath } from "next/cache";
import type {
	CreateOrganization,
	UpdateOrganization,
} from "@/entities/organization";
import type {
	CreateOrganizationMembership,
	UpdateOrganizationMembership,
} from "@/entities/organization-membership";
import {
	createOrganization as createOrganizationGateway,
	deleteOrganization as deleteOrganizationGateway,
	updateOrganization as updateOrganizationGateway,
} from "@/gateways/organization";
import {
	applyForMembership as applyForMembershipGateway,
	removeMembership,
	updateMembership,
} from "@/gateways/organization-membership";

export const createOrganizationAction = async (data: CreateOrganization) => {
	const result = await createOrganizationGateway(data);

	if (result.success) {
		revalidatePath("/organizations");
		revalidatePath("/");
	}

	return result;
};

export const applyForMembershipAction = async (
	data: CreateOrganizationMembership,
) => {
	const result = await applyForMembershipGateway(data);

	if (result.success) {
		revalidatePath("/organizations");
		revalidatePath(`/organizations/${data.organizationId}`);
	}

	return result;
};

export const updateOrganizationAction = async (
	id: string,
	data: UpdateOrganization,
) => {
	const result = await updateOrganizationGateway(id, data);

	if (result.success) {
		revalidatePath("/organizations");
		revalidatePath(`/organizations/${id}`);
		revalidatePath(`/organizations/${id}/edit`);
	}

	return result;
};

export const deleteOrganizationAction = async (id: string) => {
	const result = await deleteOrganizationGateway(id);

	if (result.success) {
		revalidatePath("/organizations");
		revalidatePath("/");
	}

	return result;
};

export const removeMembershipAction = async (membershipId: string) => {
	const result = await removeMembership(membershipId);

	if (result.success) {
		revalidatePath("/organizations");
		revalidatePath("/");
	}

	return result;
};

export const updateMembershipAction = async (
	membershipId: string,
	data: UpdateOrganizationMembership,
) => {
	const result = await updateMembership(membershipId, data);

	if (result.success && result.membership) {
		revalidatePath("/organizations");
		revalidatePath(`/organizations/${result.membership.organizationId}`);
	}

	return result;
};
