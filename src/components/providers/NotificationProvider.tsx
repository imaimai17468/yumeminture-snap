"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { createContext, type ReactNode, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

type NotificationProviderProps = {
	children: ReactNode;
	userId: string;
};

const NotificationContext = createContext<null>(null);

export const NotificationProvider = ({
	children,
	userId,
}: NotificationProviderProps) => {
	useEffect(() => {
		let channel: RealtimeChannel;

		const setupRealtimeSubscription = async () => {
			channel = supabase
				.channel(`user-${userId}-notifications`)
				.on(
					"postgres_changes",
					{
						event: "INSERT",
						schema: "public",
						table: "notifications",
						filter: `user_id=eq.${userId}`,
					},
					(payload) => {
						const notification = payload.new as {
							title: string;
							message?: string;
							type: string;
						};

						// Show toast notification
						toast(notification.title, {
							description: notification.message,
							duration: 5000,
						});

						// Play notification sound if available
						if (typeof window !== "undefined" && "Audio" in window) {
							const audio = new Audio("/notification-sound.mp3");
							audio.volume = 0.5;
							audio.play().catch(() => {
								// Ignore errors if user hasn't interacted with page
							});
						}
					},
				)
				.subscribe();
		};

		setupRealtimeSubscription();

		return () => {
			if (channel) {
				supabase.removeChannel(channel);
			}
		};
	}, [userId]);

	return (
		<NotificationContext.Provider value={null}>
			{children}
		</NotificationContext.Provider>
	);
};
