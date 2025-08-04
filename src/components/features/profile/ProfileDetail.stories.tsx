import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import type { Friendship } from "@/entities/friendship";
import type { User } from "@/entities/user";
import { ProfileDetail } from "./ProfileDetail";

const meta = {
	component: ProfileDetail,
	args: {
		profileUser: {
			id: "user-123",
			name: "田中太郎",
			avatarUrl:
				"https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		} as User,
		activities: [],
		friendsCount: 0,
		photosCount: 0,
		isCurrentUser: false,
		onUnfriend: fn(),
	},
} satisfies Meta<typeof ProfileDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const 友達のプロフィール: Story = {
	args: {
		friendship: {
			id: "friendship-123",
			userId1: "current-user-id",
			userId2: "user-123",
			createdAt: "2023-06-15T10:30:00Z",
		} as Friendship,
	},
};

export const 友達ではないユーザーのプロフィール: Story = {
	args: {
		friendship: null,
	},
};
