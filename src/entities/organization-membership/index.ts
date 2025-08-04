import { z } from "zod";

export const MembershipRoleSchema = z.enum(["admin", "member"]);
export type MembershipRole = z.infer<typeof MembershipRoleSchema>;

export const MembershipStatusSchema = z.enum([
	"pending",
	"approved",
	"rejected",
]);
export type MembershipStatus = z.infer<typeof MembershipStatusSchema>;

export const OrganizationMembershipSchema = z.object({
	id: z.string().uuid(),
	userId: z.string().uuid(),
	organizationId: z.string().uuid(),
	role: MembershipRoleSchema,
	status: MembershipStatusSchema,
	joinedAt: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export type OrganizationMembership = z.infer<
	typeof OrganizationMembershipSchema
>;

export const CreateOrganizationMembershipSchema = z.object({
	organizationId: z.string().uuid(),
});

export type CreateOrganizationMembership = z.infer<
	typeof CreateOrganizationMembershipSchema
>;

export const UpdateOrganizationMembershipSchema = z.object({
	role: MembershipRoleSchema.optional(),
	status: MembershipStatusSchema.optional(),
});

export type UpdateOrganizationMembership = z.infer<
	typeof UpdateOrganizationMembershipSchema
>;

export const OrganizationMembershipWithUserSchema =
	OrganizationMembershipSchema.extend({
		user: z.object({
			id: z.string().uuid(),
			email: z.string().email(),
			name: z.string().nullable(),
			avatarUrl: z.string().nullable(),
		}),
	});

export type OrganizationMembershipWithUser = z.infer<
	typeof OrganizationMembershipWithUserSchema
>;
