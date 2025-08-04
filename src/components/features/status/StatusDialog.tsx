"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	AlertCircle,
	Building2,
	Coffee,
	MessageSquare,
	UserCheck,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { CommunicationStatus } from "@/entities/communication-status";
import { cn } from "@/lib/utils";

const statusOptions = [
	{
		value: "office",
		label: "In Office",
		icon: Building2,
		description: "Working at the office",
		color: "text-blue-500",
	},
	{
		value: "social",
		label: "At Social Event",
		icon: Coffee,
		description: "Attending company event or social gathering",
		color: "text-green-500",
	},
	{
		value: "available",
		label: "Available",
		icon: UserCheck,
		description: "Open for communication",
		color: "text-emerald-500",
	},
	{
		value: "busy",
		label: "Busy",
		icon: MessageSquare,
		description: "Unable to take photos",
		color: "text-orange-500",
	},
] as const;

const formSchema = z.object({
	statusType: z.enum(["office", "social", "available", "busy"]),
	message: z
		.string()
		.max(200, "Message must be 200 characters or less")
		.optional(),
	expiresIn: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

type StatusDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentStatus?: CommunicationStatus | null;
	onSubmit: (data: FormData) => Promise<void>;
};

export const StatusDialog = ({
	open,
	onOpenChange,
	currentStatus,
	onSubmit,
}: StatusDialogProps) => {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const formId = useId();

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			statusType: currentStatus?.statusType || "available",
			message: currentStatus?.message || "",
			expiresIn: "",
		},
	});

	const handleSubmit = async (data: FormData) => {
		try {
			setIsSubmitting(true);
			setError(null);
			await onSubmit(data);
			onOpenChange(false);
			form.reset();
		} catch {
			setError("Failed to update status");
		} finally {
			setIsSubmitting(false);
		}
	};

	// モバイルかどうかを判定するためのメディアクエリを使用
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 640);
		};
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className={cn(
					!isMobile && "sm:max-w-[500px]",
					"p-0",
					isMobile &&
						[
							"fixed inset-x-4",
							"top-[50%] left-[50%]",
							"max-h-[85vh] w-[calc(100%-2rem)] max-w-[calc(100%-2rem)]",
							"translate-x-[-50%] translate-y-[-50%]",
							"rounded-2xl",
							"overflow-hidden",
							"data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:animate-in",
							"data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:animate-out",
						].join(" "),
				)}
			>
				<div className="flex h-full max-h-[85vh] flex-col overflow-hidden">
					<DialogHeader className="space-y-3 p-6 pb-2">
						<DialogTitle className="text-center sm:text-left">
							Set Communication Status
						</DialogTitle>
					</DialogHeader>

					<div
						className={cn(
							"flex-1 space-y-4 overflow-y-auto px-6",
							isMobile && "pb-4",
						)}
					>
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(handleSubmit)}
								className="space-y-4 sm:space-y-6"
								id={formId}
							>
								{error && (
									<Alert variant="destructive">
										<AlertCircle className="h-4 w-4" />
										<AlertDescription>{error}</AlertDescription>
									</Alert>
								)}

								<FormField
									control={form.control}
									name="statusType"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Status Type</FormLabel>
											<FormControl>
												<RadioGroup
													onValueChange={field.onChange}
													defaultValue={field.value}
													className="grid grid-cols-2 gap-3 sm:gap-4"
												>
													{statusOptions.map((option) => {
														const Icon = option.icon;
														return (
															<div key={option.value}>
																<RadioGroupItem
																	value={option.value}
																	id={option.value}
																	className="peer sr-only"
																/>
																<label
																	htmlFor={option.value}
																	className="flex h-full min-h-[100px] flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary sm:min-h-[120px] sm:p-4 [&:has([data-state=checked])]:border-primary"
																>
																	<Icon
																		className={`mb-2 h-5 w-5 sm:h-6 sm:w-6 ${option.color}`}
																	/>
																	<div className="text-center">
																		<p className="font-medium text-xs sm:text-sm">
																			{option.label}
																		</p>
																		<p className="text-[10px] text-muted-foreground sm:text-xs">
																			{option.description}
																		</p>
																	</div>
																</label>
															</div>
														);
													})}
												</RadioGroup>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="message"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Message (Optional)</FormLabel>
											<FormControl>
												<Textarea
													placeholder="e.g., In meeting room 2F / Working remotely"
													className="resize-none"
													{...field}
												/>
											</FormControl>
											<FormDescription>
												Add details about your current situation
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="expiresIn"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Expires In (Optional)</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder="Enter hours (e.g., 2)"
													{...field}
												/>
											</FormControl>
											<FormDescription>
												Status will be automatically cleared after the specified
												hours
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</form>
						</Form>
					</div>

					<DialogFooter className="gap-2 border-t p-6 sm:gap-0">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
							className="w-full sm:w-auto"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							form={formId}
							disabled={isSubmitting}
							className="w-full sm:w-auto"
						>
							{isSubmitting ? "Setting..." : "Set Status"}
						</Button>
					</DialogFooter>
				</div>
			</DialogContent>
		</Dialog>
	);
};
