"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createOrganizationAction } from "@/actions/organization";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreateOrganizationSchema } from "@/entities/organization";

type FormData = {
	name: string;
	description?: string | null | undefined;
	approvalMethod?: "manual" | "auto" | "domain" | undefined;
	approvalDomains?: string[] | undefined;
};

export const CreateOrganizationForm = () => {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<FormData>({
		resolver: zodResolver(CreateOrganizationSchema),
		defaultValues: {
			name: "",
			description: "",
			approvalMethod: "manual",
			approvalDomains: [],
		},
	});

	const onSubmit = async (data: FormData) => {
		setIsSubmitting(true);
		try {
			const result = await createOrganizationAction({
				name: data.name,
				description: data.description,
				approvalMethod: data.approvalMethod || "manual",
				approvalDomains: data.approvalDomains || [],
			});

			if (result.success) {
				toast.success("Organization created successfully");
				router.push("/organizations");
			} else {
				toast.error(result.error || "Failed to create organization");
			}
		} catch (_error) {
			toast.error("An unexpected error occurred");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<CardHeader className="space-y-1.5 pb-6">
						<CardTitle className="text-xl">Organization Details</CardTitle>
						<CardDescription>
							Provide information about your organization
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-8">
						<FormField<FormData, "name">
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem className="space-y-2.5">
									<FormLabel className="font-medium text-sm">
										Organization Name
									</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter organization name"
											{...field}
											value={field.value ?? ""}
											className="h-10"
										/>
									</FormControl>
									<FormDescription className="text-sm">
										This will be the public name of your organization
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField<FormData, "description">
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem className="space-y-2.5">
									<FormLabel className="font-medium text-sm">
										Description (Optional)
									</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Describe your organization..."
											className="min-h-[120px] resize-none"
											{...field}
											value={field.value || ""}
										/>
									</FormControl>
									<FormDescription className="text-sm">
										Help others understand what your organization is about
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
					<CardFooter className="mt-6 flex justify-end gap-3 border-t pt-6">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.push("/organizations")}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Create Organization
						</Button>
					</CardFooter>
				</form>
			</Form>
		</Card>
	);
};
