import { z } from "zod";

// Activity type enum
export const ActivityTypeSchema = z.enum([
	"friend_added",
	"photo_uploaded",
	"joined_organization",
	"left_organization",
	"status_changed",
	"photo_tagged",
	"organization_created",
]);

export type ActivityType = z.infer<typeof ActivityTypeSchema>;

// Metadata schemas for different activity types
export const FriendAddedMetadataSchema = z.object({
	friendshipId: z.string().uuid(),
});

export const PhotoUploadedMetadataSchema = z.object({
	photoUrl: z.string().url(),
	thumbnailUrl: z.string().url().optional(),
});

export const OrganizationMetadataSchema = z.object({
	organizationName: z.string(),
});

export const StatusChangedMetadataSchema = z.object({
	previousStatus: z.string().optional(),
	newStatus: z.string(),
	statusMessage: z.string().optional(),
});

export const PhotoTaggedMetadataSchema = z.object({
	photoUrl: z.string().url(),
	taggedBy: z.string().uuid(),
});

// Main Activity schema
export const ActivitySchema = z.object({
	id: z.string().uuid(),
	userId: z.string().uuid(),
	type: ActivityTypeSchema,
	relatedUserId: z.string().uuid().nullable(),
	relatedPhotoId: z.string().uuid().nullable(),
	relatedOrganizationId: z.string().uuid().nullable(),
	metadata: z.record(z.string(), z.unknown()).nullable(),
	createdAt: z.string(),
});

export type Activity = z.infer<typeof ActivitySchema>;

// Create activity input
export const CreateActivitySchema = z.object({
	type: ActivityTypeSchema,
	relatedUserId: z.string().uuid().optional(),
	relatedPhotoId: z.string().uuid().optional(),
	relatedOrganizationId: z.string().uuid().optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateActivity = z.infer<typeof CreateActivitySchema>;

// Extended activity with user information
export const ActivityWithUserSchema = ActivitySchema.extend({
	user: z.object({
		id: z.string().uuid(),
		name: z.string().nullable(),
		avatarUrl: z.string().nullable(),
	}),
	relatedUser: z
		.object({
			id: z.string().uuid(),
			name: z.string().nullable(),
			avatarUrl: z.string().nullable(),
		})
		.nullable(),
	currentStatus: z
		.object({
			statusType: z.enum(["office", "social", "available", "busy"]),
			message: z.string().nullable(),
		})
		.nullable(),
});

export type ActivityWithUser = z.infer<typeof ActivityWithUserSchema>;

// Timeline Component Types
type BaseTimelineActivity = {
	id: string;
	userId: string;
	userName: string;
	userAvatar?: string;
	description: string;
	createdAt: string;
	currentStatus?: {
		statusType: "office" | "social" | "available" | "busy";
		message: string | null;
	} | null;
};

type FriendAddedTimelineActivity = BaseTimelineActivity & {
	type: "friend_added";
	relatedUser?: {
		id: string;
		name: string | null;
		avatarUrl: string | null;
	} | null;
};

type PhotoUploadedTimelineActivity = BaseTimelineActivity & {
	type: "photo_uploaded";
	photoUrl: string;
	metadata: {
		photoUrl: string;
		thumbnailUrl?: string;
		taggedUserCount: number;
		taggedUsers: Array<{
			id: string;
			name: string | null;
			avatarUrl: string | null;
		}>;
	};
};

type OrganizationTimelineActivity = BaseTimelineActivity & {
	type: "joined_organization" | "left_organization" | "organization_created";
	metadata: {
		organizationId: string;
		organizationName: string;
	};
};

type StatusChangedTimelineActivity = BaseTimelineActivity & {
	type: "status_changed";
	metadata: {
		previousStatus?: string;
		newStatus: string;
		statusMessage?: string;
		statusType: string;
	};
};

type PhotoTaggedTimelineActivity = BaseTimelineActivity & {
	type: "photo_tagged";
	photoUrl: string;
	metadata: {
		photoUrl: string;
		taggedBy: string;
	};
};

export type TimelineActivity =
	| FriendAddedTimelineActivity
	| PhotoUploadedTimelineActivity
	| OrganizationTimelineActivity
	| StatusChangedTimelineActivity
	| PhotoTaggedTimelineActivity;

// Conversion function
export const convertToTimelineActivity = (
	activity: ActivityWithUser,
): TimelineActivity => {
	const baseActivity = {
		id: activity.id,
		userId: activity.userId,
		userName: activity.user.name || "User",
		userAvatar: activity.user.avatarUrl || undefined,
		createdAt: activity.createdAt,
		currentStatus: activity.currentStatus,
	};

	switch (activity.type) {
		case "friend_added":
			return {
				...baseActivity,
				type: "friend_added" as const,
				description: "became friends with",
				relatedUser: activity.relatedUser,
			};

		case "photo_uploaded":
			return {
				...baseActivity,
				type: "photo_uploaded" as const,
				description: "uploaded a photo",
				photoUrl: (activity.metadata?.photoUrl as string) || "",
				metadata: {
					photoUrl: (activity.metadata?.photoUrl as string) || "",
					thumbnailUrl: activity.metadata?.thumbnailUrl as string | undefined,
					taggedUserCount: (activity.metadata?.taggedUserCount as number) || 0,
					taggedUsers:
						(activity.metadata?.taggedUsers as Array<{
							id: string;
							name: string | null;
							avatarUrl: string | null;
						}>) || [],
				},
			};

		case "joined_organization":
		case "left_organization":
		case "organization_created":
			return {
				...baseActivity,
				type: activity.type,
				description:
					activity.type === "joined_organization"
						? "joined"
						: activity.type === "left_organization"
							? "left"
							: "created",
				metadata: {
					organizationId:
						(activity.metadata?.organizationId as string) ||
						activity.relatedOrganizationId ||
						"",
					organizationName:
						(activity.metadata?.organizationName as string) ||
						"Unknown Organization",
				},
			};

		case "status_changed": {
			const statusLabels: Record<string, string> = {
				office: "In Office",
				social: "At Social Event",
				available: "Available",
				busy: "Busy",
			};
			const newStatus = (activity.metadata?.newStatus as string) || "available";
			return {
				...baseActivity,
				type: "status_changed" as const,
				description: `is now ${statusLabels[newStatus] || newStatus}`,
				metadata: {
					previousStatus: activity.metadata?.previousStatus as
						| string
						| undefined,
					newStatus,
					statusMessage: activity.metadata?.statusMessage as string | undefined,
					statusType: (activity.metadata?.statusType as string) || "available",
				},
			};
		}

		case "photo_tagged":
			return {
				...baseActivity,
				type: "photo_tagged" as const,
				description: "was tagged in a photo",
				photoUrl: (activity.metadata?.photoUrl as string) || "",
				metadata: {
					photoUrl: (activity.metadata?.photoUrl as string) || "",
					taggedBy: (activity.metadata?.taggedBy as string) || "",
				},
			};

		default:
			// Type-safety: このケースには到達しないはず
			return {
				...baseActivity,
				type: "friend_added" as const,
				description: "performed an action",
			};
	}
};
