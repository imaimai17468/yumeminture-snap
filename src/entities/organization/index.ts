import { z } from "zod";

export const ApprovalMethodSchema = z.enum(["manual", "auto", "domain"]);
export type ApprovalMethod = z.infer<typeof ApprovalMethodSchema>;

export const OrganizationSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).max(200),
	description: z.string().nullable(),
	approvalMethod: ApprovalMethodSchema,
	approvalDomains: z.array(z.string()),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export type Organization = z.infer<typeof OrganizationSchema>;

export const CreateOrganizationSchema = z.object({
	name: z.string().min(1).max(200),
	description: z.string().nullable().optional(),
	approvalMethod: ApprovalMethodSchema.default("manual"),
	approvalDomains: z.array(z.string()).default([]),
});

export type CreateOrganization = z.infer<typeof CreateOrganizationSchema>;

export const UpdateOrganizationSchema = z.object({
	name: z.string().min(1).max(200).optional(),
	description: z.string().nullable().optional(),
	approvalMethod: ApprovalMethodSchema.optional(),
	approvalDomains: z.array(z.string()).optional(),
});

export type UpdateOrganization = z.infer<typeof UpdateOrganizationSchema>;

// Organization with member count
export const OrganizationWithStatsSchema = OrganizationSchema.extend({
	memberCount: z.number().optional(),
});

export type OrganizationWithStats = z.infer<typeof OrganizationWithStatsSchema>;
