"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Loader2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { updateProfile, uploadAvatar } from "@/actions/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { Progress } from "@/components/ui/progress";
import type { UserWithEmail } from "@/entities/user";
import { UpdateUserSchema } from "@/entities/user";

type ProfileFormProps = {
	user: UserWithEmail;
};

type FormData = z.infer<typeof UpdateUserSchema>;

export const ProfileForm = ({ user }: ProfileFormProps) => {
	const [isPending, startTransition] = useTransition();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isUploading, setIsUploading] = useState(false);

	const form = useForm<FormData>({
		resolver: zodResolver(UpdateUserSchema),
		defaultValues: {
			name: user.name || "",
		},
	});

	const handleAvatarClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (file.size > 5 * 1024 * 1024) {
			toast.error("Please keep file size under 5MB");
			return;
		}

		const objectUrl = URL.createObjectURL(file);
		setPreviewUrl(objectUrl);
		setIsUploading(true);
		setUploadProgress(20);

		const formData = new FormData();
		formData.append("avatar", file);

		startTransition(async () => {
			setUploadProgress(60);
			const result = await uploadAvatar(formData);
			setUploadProgress(100);

			if (result.error) {
				toast.error(result.error);
				setPreviewUrl(null);
			} else {
				toast.success("Avatar updated successfully");
			}

			setTimeout(() => {
				setIsUploading(false);
				setUploadProgress(0);
			}, 500);
		});
	};

	const onSubmit = async (data: FormData) => {
		startTransition(async () => {
			const formData = new FormData();
			formData.append("name", data.name);

			const result = await updateProfile(formData);
			if (result.error) {
				toast.error(result.error);
			} else {
				toast.success("Profile updated successfully");
			}
		});
	};

	const displayName = user.name || "User";
	const avatarUrl = previewUrl || user.avatarUrl;

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="space-y-4 sm:space-y-6"
			>
				<div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
					<div className="relative">
						<Avatar className="h-20 w-20 sm:h-24 sm:w-24">
							<AvatarImage src={avatarUrl || undefined} alt={displayName} />
							<AvatarFallback className="text-xl sm:text-2xl">
								{displayName.charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<button
							type="button"
							onClick={handleAvatarClick}
							className="-right-1 -bottom-1 absolute rounded-full bg-primary p-1.5 text-primary-foreground shadow-lg transition-transform hover:scale-110 sm:right-0 sm:bottom-0 sm:p-2"
							disabled={isPending || isUploading}
						>
							{isUploading ? (
								<Loader2 className="h-3 w-3 animate-spin sm:h-4 sm:w-4" />
							) : (
								<Camera className="h-3 w-3 sm:h-4 sm:w-4" />
							)}
						</button>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							className="hidden"
							onChange={handleFileChange}
							disabled={isPending || isUploading}
						/>
					</div>
					<div className="flex-1 space-y-1 text-center sm:space-y-2 sm:text-left">
						<div>
							<p className="font-medium text-xs sm:text-sm">Profile Image</p>
							<p className="text-muted-foreground text-xs sm:text-sm">
								Click to change image (max 5MB)
							</p>
						</div>
						{isUploading && (
							<Progress value={uploadProgress} className="h-1.5 sm:h-2" />
						)}
					</div>
				</div>

				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-sm">Name</FormLabel>
							<FormControl>
								<Input
									placeholder="Enter your name"
									{...field}
									disabled={isPending}
									className="text-sm sm:text-base"
								/>
							</FormControl>
							<FormDescription className="text-xs sm:text-sm">
								The name displayed on your profile
							</FormDescription>
							<FormMessage className="text-xs sm:text-sm" />
						</FormItem>
					)}
				/>

				<Button
					type="submit"
					disabled={isPending}
					className="w-full text-sm sm:text-base"
				>
					{isPending ? (
						<>
							<Loader2 className="mr-2 h-3 w-3 animate-spin sm:h-4 sm:w-4" />
							Updating...
						</>
					) : (
						"Update Profile"
					)}
				</Button>
			</form>
		</Form>
	);
};
