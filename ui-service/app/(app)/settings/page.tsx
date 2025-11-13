// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Haiku 4.5 & Claude Sonnet 4.5), date: 2025‑10-26
// Scope: Generated implementation based on API requirements.
// Author review: Validated correctness, fixed bugs

"use client"

import { useRef, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ImageCrop, ImageCropContent, ImageCropApply, ImageCropReset } from "@/components/ui/shadcn-io/image-crop";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MultiSelect } from "@/components/ui/multi-select";
import { Spinner } from "@/components/ui/spinner";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Item,
  ItemActions,
} from "@/components/ui/item";
import { SocialLinksSection } from "@/components/SocialLinksSection";
import { Upload, Trash2, X, Save, Loader2, RotateCcwKey } from 'lucide-react';
import { SocialLink } from "@/types/social";
import { ProgrammingLanguage } from "@/types/programming";
import type { MultiSelectOption } from "@/components/ui/multi-select";
import {
  PRONOUNS_OPTIONS,
  PROGRAMMING_LANGUAGE_OPTIONS,
} from '@/lib/constants';
import {
  getCurrentUserProfile,
  updateUserProfile,
  changePassword,
  uploadProfilePicture,
  deleteAccount,
} from '@/app/actions/profile';

export default function SettingsPage() {
  // Profile Picture
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [originalProfileImage, setOriginalProfileImage] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [croppedImageFile, setCroppedImageFile] = useState<File | null>(null);

  // Display Name
  const [displayName, setDisplayName] = useState("");
  const [originalDisplayName, setOriginalDisplayName] = useState("");

  // Profile Headline
  const [headline, setHeadline] = useState("");
  const [originalHeadline, setOriginalHeadline] = useState("");

  // Bio (About Me)
  const [bio, setBio] = useState("");
  const [originalBio, setOriginalBio] = useState("");

  // Pronouns
  const [pronounOptions] = useState<MultiSelectOption[]>(PRONOUNS_OPTIONS);
  const [pronouns, setPronouns] = useState<string[]>([]);
  const [originalPronouns, setOriginalPronouns] = useState<string[]>([]);

  // Preferred Programming Languages
  const [preferredLanguages, setPreferredLanguages] = useState<ProgrammingLanguage[]>([]);
  const [originalPreferredLanguages, setOriginalPreferredLanguages] = useState<ProgrammingLanguage[]>([]);

  // Social Links
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [originalSocialLinks, setOriginalSocialLinks] = useState<SocialLink[]>([]);

  // Password Change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Delete Account
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user profile on mount
  useEffect(() => {
    async function loadUserProfile() {
      try {
        const profile = await getCurrentUserProfile();
        if (!profile) {
          toast.error("Failed to load your profile");
          return;
        }

        // Set original values
        setOriginalDisplayName(profile.displayName || profile.username || "");
        setOriginalHeadline(profile.headline || "");
        setOriginalBio(profile.bio || profile.aboutMeInformation || "");
        setOriginalPronouns(profile.pronouns || []);
        setOriginalPreferredLanguages((profile.preferredTopics as ProgrammingLanguage[]) || []);
        setOriginalProfileImage(profile.profilePictureUrl || null);
        setOriginalSocialLinks(profile.socialLinks || []);

        // Set current values
        setDisplayName(profile.displayName || profile.username || "");
        setHeadline(profile.headline || "");
        setBio(profile.bio || profile.aboutMeInformation || "");
        setPronouns(profile.pronouns || []);
        setPreferredLanguages((profile.preferredTopics as ProgrammingLanguage[]) || []);
        setProfileImagePreview(profile.profilePictureUrl || null);
        setSocialLinks(profile.socialLinks || []);
      } catch (error) {
        console.error("Failed to load user profile:", error);
        toast.error("Failed to load your profile");
      } finally {
        setIsLoading(false);
      }
    }

    loadUserProfile();
  }, []);

  // Check if there are any changes
  const hasChanges = useMemo(() => {
    const profileImageChanged = profileImagePreview !== originalProfileImage;
    const displayNameChanged = displayName !== originalDisplayName;
    const headlineChanged = headline !== originalHeadline;
    const bioChanged = bio !== originalBio;
    const pronounsChanged = JSON.stringify(pronouns.sort()) !== JSON.stringify(originalPronouns.sort());
    const preferredLanguagesChanged = JSON.stringify(preferredLanguages.sort()) !== JSON.stringify(originalPreferredLanguages.sort());
    const socialLinksChanged = JSON.stringify(socialLinks) !== JSON.stringify(originalSocialLinks);

    return profileImageChanged || displayNameChanged || headlineChanged || bioChanged || pronounsChanged || preferredLanguagesChanged || socialLinksChanged;
  }, [profileImagePreview, displayName, headline, bio, pronouns, preferredLanguages, socialLinks, originalProfileImage, originalDisplayName, originalHeadline, originalBio, originalPronouns, originalPreferredLanguages, originalSocialLinks]);

  // Handlers
  const validateImageFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];
    return validTypes.includes(file.type);
  };

  const handleChangeButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!validateImageFile(file)) {
        alert('Please select a valid image format (JPG, PNG, HEIC, or WEBP).');
        return;
      }
      setSelectedFile(file);
      setShowCropDialog(true);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    setProfileImagePreview(croppedImage);
    
    // Convert data URL to File object for upload
    fetch(croppedImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'profile-picture.png', { type: 'image/png' });
        setCroppedImageFile(file);
      })
      .catch(error => {
        console.error('Failed to convert cropped image to file:', error);
        toast.error('Failed to process cropped image');
      });
    
    setShowCropDialog(false);
    setSelectedFile(null);
  };

  const handlePasswordChange = (field: keyof typeof passwordForm, value: string) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveSettings = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    try {
      // Update profile information
      await updateUserProfile({
        displayName,
        headline,
        bio,
        pronouns,
        preferredLanguages,
        socialLinks,
      });

      // Handle profile picture changes
      if (croppedImageFile && profileImagePreview !== originalProfileImage) {
        await uploadProfilePicture(croppedImageFile);
      }

      // Update original values to reflect saved state
      setOriginalDisplayName(displayName);
      setOriginalHeadline(headline);
      setOriginalBio(bio);
      setOriginalPronouns(pronouns);
      setOriginalPreferredLanguages(preferredLanguages);
      setOriginalProfileImage(profileImagePreview);
      setOriginalSocialLinks(socialLinks);
      setCroppedImageFile(null);
      setSelectedFile(null);

      toast.success("Settings saved successfully!");
      
      // Refresh the page to update navbar and other components with new profile data
      // Use setTimeout to ensure the toast is visible and data is saved
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save settings";
      toast.error(message);
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePasswordClick = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    try {
      const result = await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      if (result.success) {
        toast.success("Password changed successfully!");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        // Refresh to update auth state
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to change password";
      toast.error(message);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAccount();
      if (result.success) {
        toast.success("Account deleted successfully. Logging out...");
        // Wait a moment for toast to show, then redirect
        setTimeout(() => {
          router.push("/login");
        }, 1000);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete account";
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDeleteConfirmationText("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="flex justify-center h-screen overflow-y-auto">
      <div className="w-[90vw] max-w-6xl py-20">
        {/* Floating Header */}
        <div className="mb-4 pl-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Settings
          </h1>
        </div>

        <div className="bg-card rounded-lg shadow-lg overflow-hidden border border-border p-8 mb-24">
          <main className="flex flex-col gap-8">
            {/* Profile Header */}
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Profile
              </h2>
            </div>

            {/* Profile Picture Section */}
            <FieldSet>
              <FieldLegend>Profile Picture</FieldLegend>
              <FieldGroup>
                <div className="flex items-center gap-6">
                  <Avatar className="size-32">
                    <AvatarImage
                      src={profileImagePreview || undefined}
                      alt="Profile picture"
                    />
                    <AvatarFallback className="text-lg">{(displayName || "").substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col gap-4">
                    <div className="flex gap-3 flex-wrap">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/heic,image/webp"
                        onChange={handleProfileImageChange}
                        className="hidden"
                      />
                      <Button
                        className="gap-2"
                        onClick={handleChangeButtonClick}
                      >
                        <Upload />
                        Change Picture
                      </Button>
                    </div>
                    <FieldDescription>
                      Photo must be at least 256x256. JPG, PNG, HEIC, or WEBP accepted.
                    </FieldDescription>
                  </div>
                </div>
              </FieldGroup>
            </FieldSet>

            <Separator />

            {/* Profile Information Section */}
            <FieldSet>
              <FieldLegend>Profile Information</FieldLegend>
              <FieldGroup className="space-y-6">
                {/* Display Name */}
                <div className="grid grid-cols-2 gap-8">
                  <FieldContent>
                    <FieldLabel htmlFor="displayName">
                      Display Name
                    </FieldLabel>
                    <FieldDescription>
                      This is the name that will be displayed on your profile.
                    </FieldDescription>
                  </FieldContent>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                  />
                </div>

                {/* Pronouns */}
                <div className="grid grid-cols-2 gap-8">
                  <FieldContent>
                    <FieldLabel>
                      Pronouns
                    </FieldLabel>
                    <FieldDescription>
                      Select or create custom pronouns that represent you.
                    </FieldDescription>
                  </FieldContent>
                  <MultiSelect
                    options={pronounOptions}
                    onValueChange={setPronouns}
                    defaultValue={pronouns}
                    placeholder="Select pronouns..."
                    maxCount={3}
                    allowCustomOptions={true}
                  />
                </div>

                {/* Profile Headline */}
                <div className="grid grid-cols-2 gap-8">
                  <FieldContent>
                    <FieldLabel htmlFor="headline">
                      Profile Headline
                    </FieldLabel>
                    <FieldDescription>
                      A short description of yourself.
                    </FieldDescription>
                  </FieldContent>
                  <Input
                    id="headline"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g., Software Engineer"
                  />
                </div>

                {/* Bio */}
                <div className="grid grid-cols-2 gap-8">
                  <FieldContent>
                    <FieldLabel htmlFor="bio">
                      About Me
                    </FieldLabel>
                    <FieldDescription>
                      A brief bio to tell others about yourself.
                    </FieldDescription>
                  </FieldContent>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>

                {/* Preferred Programming Languages */}
                <div className="grid grid-cols-2 gap-8">
                  <FieldContent>
                    <FieldLabel>
                      Preferred Programming Languages
                    </FieldLabel>
                    <FieldDescription>
                      Select the programming languages you prefer to code in.
                    </FieldDescription>
                  </FieldContent>
                  <MultiSelect
                    options={PROGRAMMING_LANGUAGE_OPTIONS}
                    onValueChange={(values) => setPreferredLanguages(values as ProgrammingLanguage[])}
                    defaultValue={preferredLanguages}
                    placeholder="Select languages..."
                    maxCount={3}
                  />
                </div>
              </FieldGroup>
            </FieldSet>

            <Separator />

            {/* Social Links Section */}
            <SocialLinksSection
              links={socialLinks}
              onLinksChange={setSocialLinks}
            />

            <Separator />

            {/* Account Header */}
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Account
              </h2>
            </div>

            {/* Account Section */}
            <FieldSet>
              <FieldLegend>Change Password</FieldLegend>
              <FieldGroup>
                {/* Current Password */}
                <Field>
                  <FieldContent>
                    <FieldLabel htmlFor="currentPassword">
                      Current Password
                    </FieldLabel>
                  </FieldContent>
                  <PasswordInput
                    id="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={(value) =>
                      handlePasswordChange("currentPassword", value)
                    }
                    placeholder="Enter your current password"
                  />
                </Field>

                {/* Password Fields Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* New Password */}
                  <Field>
                    <FieldContent>
                      <FieldLabel htmlFor="newPassword">
                        New Password
                      </FieldLabel>
                    </FieldContent>
                    <PasswordInput
                      id="newPassword"
                      value={passwordForm.newPassword}
                      onChange={(value) =>
                        handlePasswordChange("newPassword", value)
                      }
                      placeholder="Enter your new password"
                    />
                  </Field>

                  {/* Confirm Password */}
                  <Field>
                    <FieldContent>
                      <FieldLabel htmlFor="confirmPassword">
                        Confirm New Password
                      </FieldLabel>
                    </FieldContent>
                    <PasswordInput
                      id="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={(value) =>
                        handlePasswordChange("confirmPassword", value)
                      }
                      placeholder="Confirm your new password"
                    />
                  </Field>
                </div>

                {passwordForm.newPassword !== passwordForm.confirmPassword && passwordForm.confirmPassword && (
                  <FieldError>Passwords do not match.</FieldError>
                )}

                <div className="flex justify-end w-full">
                  <div className="w-fit">
                    <Button
                      onClick={handleChangePasswordClick}
                    >
                      <RotateCcwKey />
                      Change password
                    </Button>
                  </div>
                </div>
              </FieldGroup>
            </FieldSet>

            <Separator />

            {/* Delete Account Section */}
            <FieldSet>
              <FieldLegend>Delete Account</FieldLegend>
              <FieldGroup>
                <div className="flex items-center justify-between gap-4">
                  <FieldDescription>
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </FieldDescription>
                  <div className="w-fit shrink-0">
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      className="gap-2"
                    >
                      <Trash2 />
                      Delete account
                    </Button>
                  </div>
                </div>
              </FieldGroup>
            </FieldSet>

          </main>
        </div>

        {/* Action Buttons - Sticky to Viewport */}
        <AnimatePresence>
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="fixed bottom-0 left-0 right-0 flex items-center justify-center py-4"
            >
              <div className="w-[90vw] max-w-6xl">
                <Item variant="outline" className="rounded-lg border border-border bg-card shadow-gray-950 shadow-2xl">
                  <ItemActions className="ml-auto gap-4">
                    <Button size="lg" variant="destructive" onClick={() => {
                      // Reset to original values
                      setDisplayName(originalDisplayName);
                      setHeadline(originalHeadline);
                      setBio(originalBio);
                      setPronouns(originalPronouns);
                      setPreferredLanguages(originalPreferredLanguages);
                      setProfileImagePreview(originalProfileImage);
                      setSocialLinks(originalSocialLinks);
                      setSelectedFile(null);
                      setCroppedImageFile(null);
                    }}>
                      <X />Cancel
                    </Button>
                    <Button 
                      size="lg" 
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="animate-spin" />
                          Saving changes...
                        </>
                      ) : (
                        <>
                          <Save />
                          Save changes
                        </>
                      )}
                    </Button>
                  </ItemActions>
                </Item>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image Crop Dialog */}
        <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Change Profile Picture</DialogTitle>
              <DialogDescription>
                Crop and resize your profile picture.
              </DialogDescription>
            </DialogHeader>

            {selectedFile && (
              <ImageCrop
                aspect={1}
                circularCrop
                file={selectedFile}
                maxImageSize={1024 * 1024 * 5}
                onCrop={handleCropComplete}
              >
                <div className="flex flex-col gap-4">
                  <ImageCropContent className="max-h-96 w-full" />

                  <TooltipProvider delayDuration={500}>
                    <div className="flex items-center justify-end gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <ImageCropReset />
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Reset</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => setShowCropDialog(false)}
                            size="icon"
                            type="button"
                            variant="ghost"
                          >
                            <X className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Cancel</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <ImageCropApply />
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Apply</TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </div>
              </ImageCrop>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Account Alert Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. Please type &quot;delete my account&quot; to confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <Input
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="Type 'delete my account' to confirm"
              className="mt-4"
            />

            <div className="flex gap-2 justify-end">
              <AlertDialogCancel className="gap-2">
                <X />
                Cancel
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmationText !== "delete my account" || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Spinner />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 />
                    Delete account
                  </>
                )}
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
    );
  }