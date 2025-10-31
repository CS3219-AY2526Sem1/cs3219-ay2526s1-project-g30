"use client"

import { useRef, useState, useMemo } from "react";
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
  AlertDialogAction,
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
  INITIAL_DISPLAY_NAME,
  INITIAL_HEADLINE,
  INITIAL_BIO,
  INITIAL_PROFILE_IMAGE,
  INITIAL_PRONOUNS,
  INITIAL_SOCIAL_LINKS,
  INITIAL_PRONOUNS_OPTIONS,
  INITIAL_PREFERRED_LANGUAGES,
  INITIAL_PROGRAMMING_LANGUAGE_OPTIONS,
} from './mockData';

export default function SettingsPage() {
  // Profile Picture
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(INITIAL_PROFILE_IMAGE);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Display Name
  const [displayName, setDisplayName] = useState(INITIAL_DISPLAY_NAME);

  // Profile Headline
  const [headline, setHeadline] = useState(INITIAL_HEADLINE);

  // Bio (About Me)
  const [bio, setBio] = useState(INITIAL_BIO);

  // Pronouns
  const [pronounOptions, setPronounOptions] = useState<MultiSelectOption[]>(INITIAL_PRONOUNS_OPTIONS);
  const [pronouns, setPronouns] = useState<string[]>(INITIAL_PRONOUNS);

  // Preferred Programming Languages
  const [preferredLanguages, setPreferredLanguages] = useState<ProgrammingLanguage[]>(INITIAL_PREFERRED_LANGUAGES);

  // Social Links
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(INITIAL_SOCIAL_LINKS);

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

  // Check if there are any changes
  const hasChanges = useMemo(() => {
    const profileImageChanged = profileImagePreview !== INITIAL_PROFILE_IMAGE;
    const displayNameChanged = displayName !== INITIAL_DISPLAY_NAME;
    const headlineChanged = headline !== INITIAL_HEADLINE;
    const bioChanged = bio !== INITIAL_BIO;
    const pronounsChanged = JSON.stringify(pronouns.sort()) !== JSON.stringify(INITIAL_PRONOUNS.sort());
    const preferredLanguagesChanged = JSON.stringify(preferredLanguages.sort()) !== JSON.stringify(INITIAL_PREFERRED_LANGUAGES.sort());
    const socialLinksChanged = JSON.stringify(socialLinks) !== JSON.stringify(INITIAL_SOCIAL_LINKS);

    return profileImageChanged || displayNameChanged || headlineChanged || bioChanged || pronounsChanged || preferredLanguagesChanged || socialLinksChanged;
  }, [profileImagePreview, displayName, headline, bio, pronouns, preferredLanguages, socialLinks]);

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
    setShowCropDialog(false);
    setSelectedFile(null);
  };

  const handleRemoveProfileImage = () => {
    setProfileImagePreview(null);
  };

  const handlePasswordChange = (field: keyof typeof passwordForm, value: string) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveSettings = async () => {
    // TODO: Implement API call to save settings
    setIsSaving(true);
    console.log("Saving settings...", {
      profileImage: profileImagePreview,
      displayName,
      headline,
      bio,
      pronouns,
      preferredLanguages,
      socialLinks,
    });

    // Mock API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Reset state to initial values after successful save
    setProfileImagePreview(INITIAL_PROFILE_IMAGE);
    setDisplayName(INITIAL_DISPLAY_NAME);
    setHeadline(INITIAL_HEADLINE);
    setBio(INITIAL_BIO);
    setPronouns(INITIAL_PRONOUNS);
    setPreferredLanguages(INITIAL_PREFERRED_LANGUAGES);
    setSocialLinks(INITIAL_SOCIAL_LINKS);

    setIsSaving(false);
    toast.success("Settings saved successfully!");
  };

  const handleChangePassword = () => {
    // TODO: Implement password change API call
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    console.log("Changing password...", {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
    // Reset form
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleDeleteAccount = async () => {
    // TODO: Implement account deletion API call
    setIsDeleting(true);
    console.log("Deleting account...");

    // Mock API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Log out the user
    setShowDeleteDialog(false);
    setDeleteConfirmationText("");
    setIsDeleting(false);
    
    // TODO: Redirect to login page after logout
    console.log("Account deleted, logging out...");
    toast.success("Account deleted successfully. Logging out...");
  };

  return (
    <div className="flex items-center justify-center min-h-screen py-20">
      <div className="w-[90vw] max-w-6xl">
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
                    <AvatarFallback className="text-lg">JD</AvatarFallback>
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
                      {profileImagePreview && (
                        <Button
                          variant="destructive"
                          className="gap-2"
                          onClick={handleRemoveProfileImage}
                        >
                          <Trash2 />
                          Remove Picture
                        </Button>
                      )}
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
                    options={INITIAL_PROGRAMMING_LANGUAGE_OPTIONS}
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
                      onClick={handleChangePassword}
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
                    <Button size="lg" variant="destructive">
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
