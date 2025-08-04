import { z } from "zod";

export const CommunicationStatusTypeSchema = z.enum([
	"office",
	"social",
	"available",
	"busy",
]);

export type CommunicationStatusType = z.infer<
	typeof CommunicationStatusTypeSchema
>;

export const CommunicationStatusSchema = z.object({
	id: z.string().uuid(),
	userId: z.string().uuid(),
	statusType: CommunicationStatusTypeSchema,
	message: z.string().max(200).nullable(),
	expiresAt: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export type CommunicationStatus = z.infer<typeof CommunicationStatusSchema>;

export const CreateCommunicationStatusSchema = z.object({
	statusType: CommunicationStatusTypeSchema,
	message: z.string().max(200).optional(),
	expiresAt: z.string().optional(),
});

export type CreateCommunicationStatus = z.infer<
	typeof CreateCommunicationStatusSchema
>;

export const UpdateCommunicationStatusSchema = z.object({
	statusType: CommunicationStatusTypeSchema.optional(),
	message: z.string().max(200).nullable().optional(),
	expiresAt: z.string().nullable().optional(),
});

export type UpdateCommunicationStatus = z.infer<
	typeof UpdateCommunicationStatusSchema
>;

export const CommunicationStatusWithUserSchema =
	CommunicationStatusSchema.extend({
		user: z.object({
			id: z.string().uuid(),
			name: z.string().nullable(),
			avatarUrl: z.string().nullable(),
		}),
	});

export type CommunicationStatusWithUser = z.infer<
	typeof CommunicationStatusWithUserSchema
>;
