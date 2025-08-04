import type { Meta, StoryObj } from "@storybook/react";
import { FriendList } from "./FriendList";

const meta = {
	component: FriendList,
} satisfies Meta<typeof FriendList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const 複数の友達: Story = {
	args: {
		friendships: [
			{
				id: "1",
				userId1: "current-user-id",
				userId2: "friend-1",
				createdAt: new Date(
					Date.now() - 1000 * 60 * 60 * 24 * 30,
				).toISOString(),
				friend: {
					id: "friend-1",
					name: "田中太郎",
					avatarUrl:
						"https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop",
				},
			},
			{
				id: "2",
				userId1: "current-user-id",
				userId2: "friend-2",
				createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
				friend: {
					id: "friend-2",
					name: "山田花子",
					avatarUrl:
						"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
				},
			},
			{
				id: "3",
				userId1: "current-user-id",
				userId2: "friend-3",
				createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
				friend: {
					id: "friend-3",
					name: "佐藤次郎",
					avatarUrl: null,
				},
			},
		],
	},
};

export const 友達がいない状態: Story = {
	args: {
		friendships: [],
	},
};
