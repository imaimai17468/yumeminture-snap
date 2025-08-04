"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type OrganizationSearchFormProps = {
	defaultValue?: string;
};

export const OrganizationSearchForm = ({
	defaultValue = "",
}: OrganizationSearchFormProps) => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();
	const [query, setQuery] = useState(defaultValue);

	// URLパラメータを更新する関数
	const updateSearchParams = useCallback(
		(value: string) => {
			const params = new URLSearchParams(searchParams.toString());
			if (value) {
				params.set("q", value);
			} else {
				params.delete("q");
			}

			startTransition(() => {
				router.replace(`${pathname}?${params.toString()}`, { scroll: false });
			});
		},
		[pathname, router, searchParams],
	);

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		updateSearchParams(query);
	};

	const handleClear = () => {
		setQuery("");
		updateSearchParams("");
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
			<div className="relative flex-1">
				<Search
					className={cn(
						"-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground transition-opacity",
						isPending && "opacity-50",
					)}
				/>
				<Input
					type="text"
					placeholder="Search organizations..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					className="pr-10 pl-10 text-sm sm:text-base"
					disabled={isPending}
				/>
				{query && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="-translate-y-1/2 absolute top-1/2 right-1 h-8 w-8 p-0"
						onClick={handleClear}
						disabled={isPending}
					>
						<X className="h-4 w-4" />
						<span className="sr-only">Clear search</span>
					</Button>
				)}
			</div>
			<Button type="submit" disabled={isPending} className="w-full sm:w-auto">
				{isPending ? (
					<div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
				) : (
					"Search"
				)}
			</Button>
		</form>
	);
};
