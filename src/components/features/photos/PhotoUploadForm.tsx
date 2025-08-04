"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, Upload, UserPlus, Users2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { uploadPhotoAction } from "@/actions/photo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import type { User } from "@/entities/user";
import { cn } from "@/lib/utils";

const photoUploadSchema = z.object({
	file: z.instanceof(File).refine((file) => file.size <= 5 * 1024 * 1024, {
		message: "File size must be less than 5MB",
	}),
	description: z.string().max(500).optional(),
	taggedUserIds: z.array(z.string()),
});

type PhotoUploadFormValues = z.infer<typeof photoUploadSchema>;

type PhotoUploadFormProps = {
	currentUser: User;
	allUsers: User[];
	friendIds: string[];
};

export const PhotoUploadForm = ({
	currentUser,
	allUsers,
	friendIds,
}: PhotoUploadFormProps) => {
	const router = useRouter();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [preview, setPreview] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const form = useForm<PhotoUploadFormValues>({
		resolver: zodResolver(photoUploadSchema),
		defaultValues: {
			description: "",
			taggedUserIds: [],
		},
	});

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			form.setValue("file", file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setPreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const onSubmit = async (values: PhotoUploadFormValues) => {
		setIsUploading(true);
		try {
			const formData = new FormData();
			formData.append("file", values.file);
			formData.append("description", values.description || "");
			formData.append(
				"taggedUserIds",
				JSON.stringify(values.taggedUserIds || []),
			);

			const result = await uploadPhotoAction(formData);

			if (result.success) {
				toast.success("Photo uploaded successfully!");
				router.push("/");
			} else {
				toast.error(result.error || "Failed to upload photo");
			}
		} catch (error) {
			console.error("Upload error:", error);
			toast.error("An unexpected error occurred");
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				{/* Photo Upload */}
				<Card>
					<CardHeader>
						<CardTitle>Select Photo</CardTitle>
					</CardHeader>
					<CardContent>
						<FormField
							control={form.control}
							name="file"
							render={({ field: { onChange, value, ...field } }) => (
								<FormItem>
									<FormControl>
										<div className="space-y-4">
											{preview ? (
												<div className="relative mx-auto max-w-md">
													<Image
														src={preview}
														alt="Preview"
														width={400}
														height={400}
														className="h-auto w-full rounded-lg"
													/>
													<Button
														type="button"
														variant="destructive"
														size="icon"
														className="absolute top-2 right-2"
														onClick={() => {
															setPreview(null);
															form.resetField("file");
															if (fileInputRef.current) {
																fileInputRef.current.value = "";
															}
														}}
													>
														<X className="h-4 w-4" />
													</Button>
												</div>
											) : (
												<button
													type="button"
													className="flex flex-col items-center justify-center rounded-lg border-2 border-muted-foreground/25 border-dashed p-12 transition-colors hover:border-muted-foreground/50"
													onClick={() => fileInputRef.current?.click()}
												>
													<Upload className="mb-4 h-8 w-8 text-muted-foreground" />
													<p className="mb-2 font-medium text-sm">
														Click to upload or drag and drop
													</p>
													<p className="text-muted-foreground text-xs">
														PNG, JPG or GIF (max. 5MB)
													</p>
												</button>
											)}
											<Input
												{...field}
												ref={fileInputRef}
												type="file"
												accept="image/*"
												capture="environment"
												className="hidden"
												onChange={handleFileChange}
											/>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
				</Card>

				{/* Description */}
				<Card>
					<CardHeader>
						<CardTitle>Description</CardTitle>
					</CardHeader>
					<CardContent>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<Textarea
											placeholder="Add a description..."
											className="min-h-[100px] resize-none"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Optional description for your photo
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
				</Card>

				{/* Tag Users */}
				<Card>
					<CardHeader>
						<CardTitle>Tag Users</CardTitle>
					</CardHeader>
					<CardContent>
						<FormField
							control={form.control}
							name="taggedUserIds"
							render={({ field }) => {
								const selectedUsers = allUsers.filter((user) =>
									(field.value || []).includes(user.id),
								);

								const filteredUsers = allUsers
									.filter((user) => user.id !== currentUser.id)
									.filter((user) =>
										user.name
											?.toLowerCase()
											.includes(searchQuery.toLowerCase()),
									);

								return (
									<FormItem>
										<div className="space-y-4">
											<FormDescription>
												Tag users in this photo (optional). Tagged users will
												automatically become connected with each other.
											</FormDescription>

											<Popover open={open} onOpenChange={setOpen}>
												<PopoverTrigger asChild>
													<Button
														variant="outline"
														type="button"
														className="w-full justify-start text-left font-normal"
													>
														<UserPlus className="mr-2 h-4 w-4" />
														Select users to tag
													</Button>
												</PopoverTrigger>
												<PopoverContent className="w-full p-0" align="start">
													<Command>
														<CommandInput
															placeholder="Search users..."
															value={searchQuery}
															onValueChange={setSearchQuery}
														/>
														<CommandList>
															<CommandEmpty>No user found.</CommandEmpty>
															<CommandGroup>
																{filteredUsers.map((user) => {
																	const isSelected = (
																		field.value || []
																	).includes(user.id);
																	return (
																		<CommandItem
																			key={user.id}
																			value={user.id}
																			onSelect={() => {
																				const updatedValue = isSelected
																					? (field.value || []).filter(
																							(id) => id !== user.id,
																						)
																					: [...(field.value || []), user.id];
																				field.onChange(updatedValue);
																			}}
																		>
																			<div className="flex items-center gap-2">
																				<div
																					className={cn(
																						"mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
																						isSelected
																							? "bg-primary text-primary-foreground"
																							: "opacity-50 [&_svg]:invisible",
																					)}
																				>
																					<Check className="h-4 w-4" />
																				</div>
																				<Avatar className="h-6 w-6">
																					<AvatarImage
																						src={user.avatarUrl || undefined}
																						alt={user.name || "User"}
																					/>
																					<AvatarFallback>
																						{user.name?.[0]?.toUpperCase() ||
																							"U"}
																					</AvatarFallback>
																				</Avatar>
																				<span className="font-medium">
																					{user.name || "Unknown User"}
																				</span>
																			</div>
																		</CommandItem>
																	);
																})}
															</CommandGroup>
														</CommandList>
													</Command>
												</PopoverContent>
											</Popover>

											{selectedUsers.length > 0 && (
												<div className="flex flex-wrap gap-2">
													{selectedUsers.map((user) => (
														<Badge
															key={user.id}
															variant="secondary"
															className="flex items-center gap-1"
														>
															<Avatar className="h-4 w-4">
																<AvatarImage
																	src={user.avatarUrl || undefined}
																	alt={user.name || "User"}
																/>
																<AvatarFallback className="text-[10px]">
																	{user.name?.[0]?.toUpperCase() || "U"}
																</AvatarFallback>
															</Avatar>
															{user.name}
															<button
																type="button"
																onClick={() => {
																	field.onChange(
																		(field.value || []).filter(
																			(id) => id !== user.id,
																		),
																	);
																}}
																className="ml-1 rounded-full text-muted-foreground hover:text-foreground"
															>
																<X className="h-3 w-3" />
															</button>
														</Badge>
													))}
												</div>
											)}
										</div>
										<FormMessage />
									</FormItem>
								);
							}}
						/>
					</CardContent>
				</Card>

				{/* New Friends Alert */}
				{(() => {
					const taggedUserIds = form.watch("taggedUserIds") || [];
					const newFriends = taggedUserIds
						.filter((id) => !friendIds.includes(id) && id !== currentUser.id)
						.map((id) => allUsers.find((u) => u.id === id))
						.filter(Boolean);

					if (newFriends.length > 0) {
						return (
							<Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
								<Users2 className="h-4 w-4 text-green-600 dark:text-green-400" />
								<AlertDescription className="text-green-800 dark:text-green-200">
									{newFriends.length === 1 && (
										<span>
											<span className="font-medium">{newFriends[0]?.name}</span>{" "}
											will be added as a friend
										</span>
									)}
									{newFriends.length === 2 && (
										<span>
											<span className="font-medium">{newFriends[0]?.name}</span>{" "}
											and{" "}
											<span className="font-medium">{newFriends[1]?.name}</span>{" "}
											will be added as friends
										</span>
									)}
									{newFriends.length > 2 && (
										<span>
											<span className="font-medium">{newFriends[0]?.name}</span>
											,{" "}
											<span className="font-medium">{newFriends[1]?.name}</span>
											, and {newFriends.length - 2} others will be added as
											friends
										</span>
									)}
								</AlertDescription>
							</Alert>
						);
					}
					return null;
				})()}

				{/* Submit Button */}
				<div className="flex gap-4">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.push("/")}
						disabled={isUploading}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isUploading || !preview}>
						{isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Upload Photo
					</Button>
				</div>
			</form>
		</Form>
	);
};
