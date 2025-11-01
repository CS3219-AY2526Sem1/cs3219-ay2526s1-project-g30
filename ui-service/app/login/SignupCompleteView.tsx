'use client';

import { useActionState, useState, useMemo, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ViewContent } from '@/components/ViewContent';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Field, FieldContent, FieldLabel, FieldDescription, FieldError, FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { PROGRAMMING_LANGUAGES, EXPERIENCE_LEVELS, type ProgrammingLanguage, type ExperienceLevel } from '@/types/programming';
import { updateUserProfile } from '@/app/actions/auth';

interface SignupCompleteViewProps {
  isActive: boolean;
  onCompleteSignup: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export function SignupCompleteView({
  isActive,
  onCompleteSignup,
  onSkip,
  onBack,
}: SignupCompleteViewProps) {
  const [state, formAction, isSubmitting] = useActionState(updateUserProfile, undefined);
  const [, startTransition] = useTransition();
  const [displayNameInput, setDisplayNameInput] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<ProgrammingLanguage | undefined>();
  const [experienceSliderValue, setExperienceSliderValue] = useState<number[]>([0]);
  const [languageOpen, setLanguageOpen] = useState(false);

  // Trigger callback when profile update succeeds
  useEffect(() => {
    if (state?.success && !isSubmitting) {
      onCompleteSignup();
    }
  }, [state?.success, isSubmitting, onCompleteSignup]);

  // Map slider value (0-2) to experience level
  const selectedExperience: ExperienceLevel | undefined = useMemo(() => {
    const value = experienceSliderValue[0];
    if (value === 0) return 'beginner';
    if (value === 1) return 'intermediate';
    if (value === 2) return 'advanced';
    return undefined;
  }, [experienceSliderValue]);

  const displayNameValidation = useMemo(() => {
    if (!displayNameInput) return { isValid: true };
    if (displayNameInput.trim().length < 2) {
      return { isValid: false, errorMessage: 'Display name must be at least 2 characters' };
    }
    if (displayNameInput.trim().length > 50) {
      return { isValid: false, errorMessage: 'Display name must not exceed 50 characters' };
    }
    return { isValid: true };
  }, [displayNameInput]);

  const isFormValid = useMemo(() => {
    return (
      displayNameInput &&
      displayNameValidation.isValid &&
      selectedLanguage &&
      selectedExperience
    );
  }, [displayNameInput, displayNameValidation.isValid, selectedLanguage, selectedExperience]);

  const handleCompleteSignup = async () => {
    if (!isFormValid) return;

    const formData = new FormData();
    formData.set('displayName', displayNameInput);
    formData.set('preferredLanguage', selectedLanguage || '');
    formData.set('experienceLevel', selectedExperience || 'beginner');

    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <ViewContent
      viewId="signup-complete"
      isActive={isActive}
    >
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Complete your profile
        </h2>
        <p className="text-sm text-muted-foreground">
          We just need a bit more information to get you all set up.
        </p>
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="display-name">
            Display name
          </FieldLabel>
          <FieldDescription>
            This is how other users will see you.
          </FieldDescription>
          <FieldContent>
            <Input
              id="display-name"
              placeholder="Your name"
              value={displayNameInput}
              onChange={(e) => setDisplayNameInput(e.target.value)}
              disabled={isSubmitting}
              aria-invalid={displayNameInput && !displayNameValidation.isValid ? 'true' : 'false'}
            />
            {displayNameInput && !displayNameValidation.isValid && (
              <FieldError>{displayNameValidation.errorMessage}</FieldError>
            )}
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="language">
            Preferred coding language
          </FieldLabel>
          <FieldContent>
            <Popover open={languageOpen} onOpenChange={setLanguageOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={languageOpen}
                  className="justify-between"
                  disabled={isSubmitting}
                >
                  {selectedLanguage
                    ? PROGRAMMING_LANGUAGES.find(
                      (lang) => lang.value === selectedLanguage
                    )?.label
                    : 'Select language...'}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandList>
                    <CommandEmpty>No language found.</CommandEmpty>
                    <CommandGroup>
                      {PROGRAMMING_LANGUAGES.map((lang) => (
                        <CommandItem
                          key={lang.value}
                          value={lang.value}
                          onSelect={(currentValue) => {
                            setSelectedLanguage(
                              currentValue === selectedLanguage
                                ? undefined
                                : (currentValue as ProgrammingLanguage)
                            );
                            setLanguageOpen(false);
                          }}
                        >
                          {lang.label}
                          <Check
                            className={cn(
                              'ml-auto',
                              selectedLanguage === lang.value
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="experience">
            Experience level: {selectedExperience ? EXPERIENCE_LEVELS.find((exp) => exp.value === selectedExperience)?.label : 'Beginner'}
          </FieldLabel>
          <FieldContent>
            <div className="space-y-4">
              <Slider
                id="experience"
                min={0}
                max={2}
                step={1}
                value={experienceSliderValue}
                onValueChange={setExperienceSliderValue}
                disabled={isSubmitting}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Beginner</span>
                <span>Intermediate</span>
                <span>Advanced</span>
              </div>
            </div>
          </FieldContent>
        </Field>
      </FieldGroup>

      <p className="text-sm text-center text-muted-foreground">
        <Button
          onClick={onSkip}
          variant="link"
          className="h-auto p-0"
          disabled={isSubmitting}
        >
          Skip for now
        </Button>
      </p>

      <div className="space-y-4">
        <Button
          onClick={handleCompleteSignup}
          className="w-full"
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Spinner className="mr-2" />
              Completing...
            </>
          ) : (
            <>
              <ArrowRight /> Get started
            </>
          )}
        </Button>

        <Button
          onClick={onBack}
          variant="secondary"
          className="w-full"
          disabled={isSubmitting}
        >
          <ArrowLeft /> Back
        </Button>
      </div>
    </ViewContent>
  );
}
