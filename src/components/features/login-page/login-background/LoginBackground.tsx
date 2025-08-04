"use client";

import dynamic from "next/dynamic";

const DarkVeil = dynamic(
	() => import("@/components/ui/Backgrounds/DarkVeil/DarkVeil"),
	{
		ssr: false,
		loading: () => <div className="fixed inset-0 bg-black" />,
	},
);

export const LoginBackground = () => {
	return (
		<div className="fixed inset-0 z-0">
			<div className="absolute inset-0">
				<DarkVeil />
			</div>
		</div>
	);
};
