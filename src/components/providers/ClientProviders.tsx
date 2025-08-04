"use client";

import type { ReactNode } from "react";
import { NotificationProvider } from "./NotificationProvider";

type ClientProvidersProps = {
	children: ReactNode;
	userId?: string;
};

export const ClientProviders = ({ children, userId }: ClientProvidersProps) => {
	if (!userId) {
		return <>{children}</>;
	}

	return (
		<NotificationProvider userId={userId}>{children}</NotificationProvider>
	);
};
