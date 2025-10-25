'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ViewContent } from '@/components/ViewContent';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Field, FieldContent, FieldLabel, FieldDescription, FieldError, FieldGroup } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import { validateUsername, validateEmail, validatePassword, checkUsernameAvailability } from '@/lib/validation';
import { useDebounceValue } from '@/hooks/use-debounce-value';

interface SignupViewProps {
  isActive: boolean;
  usernameInput: string;
  emailInput: string;
  passwordInput: string;
  passwordConfirmInput: string;
  onUsernameChange: (username: string) => void;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onPasswordConfirmChange: (password: string) => void;
  onSignUp: () => void;
  onBack: () => void;
  onLogInClick: () => void;
}

export function SignupView({
  isActive,
  usernameInput,
  emailInput,
  passwordInput,
  passwordConfirmInput,
  onUsernameChange,
  onEmailChange,
  onPasswordChange,
  onPasswordConfirmChange,
  onSignUp,
  onBack,
  onLogInClick,
}: SignupViewProps) {
  // Debounce username for availability check
  const [debouncedUsername] = useDebounceValue(usernameInput, 500);

  const [usernameError, setUsernameError] = useState<string>();
  const [usernameIsChecking, setUsernameIsChecking] = useState(false);
  const [usernameIsAvailable, setUsernameIsAvailable] = useState<boolean>();
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleSignUpClick = async () => {
    setIsSigningUp(true);
    try {
      await onSignUp();
    } finally {
      setIsSigningUp(false);
    }
  };

  // Validate username format
  const usernameFormatValidation = useMemo(() => {
    if (!usernameInput) return { isValid: true };
    return validateUsername(usernameInput);
  }, [usernameInput]);

  // Check username availability with debounced value
  useEffect(() => {
    if (!debouncedUsername || !usernameFormatValidation.isValid) {
      setUsernameIsAvailable(undefined);
      setUsernameError(usernameFormatValidation.errorMessage);
      return;
    }

    const checkAvailability = async () => {
      setUsernameIsChecking(true);
      try {
        const result = await checkUsernameAvailability(debouncedUsername);
        setUsernameIsAvailable(result.isAvailable);
        setUsernameError(result.errorMessage);
      } finally {
        setUsernameIsChecking(false);
      }
    };

    checkAvailability();
  }, [debouncedUsername, usernameFormatValidation]);

  // Clear availability state when user continues typing
  useEffect(() => {
    if (usernameInput !== debouncedUsername) {
      setUsernameIsAvailable(undefined);
    }
  }, [usernameInput, debouncedUsername]);

  // Validate email
  const emailValidation = useMemo(() => {
    if (!emailInput) return { isValid: true };
    return { isValid: validateEmail(emailInput) };
  }, [emailInput]);

  // Validate password
  const passwordValidation = useMemo(() => {
    if (!passwordInput) return { isValid: true };
    return validatePassword(passwordInput);
  }, [passwordInput]);

  // Validate password confirmation
  const passwordConfirmValidation = useMemo(() => {
    if (!passwordConfirmInput) return { isValid: true };
    if (passwordInput !== passwordConfirmInput) {
      return { isValid: false, errorMessage: 'Passwords do not match' };
    }
    return { isValid: true };
  }, [passwordInput, passwordConfirmInput]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return (
      usernameInput &&
      usernameFormatValidation.isValid &&
      usernameIsAvailable === true &&
      emailInput &&
      emailValidation.isValid &&
      passwordInput &&
      passwordValidation.isValid &&
      passwordConfirmInput &&
      passwordConfirmValidation.isValid
    );
  }, [
    usernameInput,
    usernameFormatValidation.isValid,
    usernameIsAvailable,
    emailInput,
    emailValidation.isValid,
    passwordInput,
    passwordValidation.isValid,
    passwordConfirmInput,
    passwordConfirmValidation.isValid,
  ]);

  return (
    <ViewContent
      viewId="signup"
      isActive={isActive}
    >
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Welcome to PeerPrep.
        </h2>
        <p className="text-sm text-muted-foreground">
          We can&apos;t wait to have you onboard.
        </p>
      </div>

      <FieldGroup>
        <Field
          data-invalid={
            (usernameInput && !usernameFormatValidation.isValid && !usernameIsChecking) ||
            (usernameInput && !usernameIsChecking && usernameError)
              ? true
              : undefined
          }
        >
          <FieldLabel htmlFor="signup-username">
            Username
          </FieldLabel>
          <FieldContent>
            <InputGroup>
              <InputGroupInput
                id="signup-username"
                type="text"
                placeholder="jane.smith"
                value={usernameInput}
                onChange={(e) => onUsernameChange(e.target.value)}
                aria-invalid={
                  (usernameInput && !usernameFormatValidation.isValid && !usernameIsChecking) ||
                  (usernameInput && !usernameIsChecking && usernameError)
                    ? 'true'
                    : 'false'
                }
              />
              {usernameIsChecking && (
                <InputGroupAddon align="inline-end">
                  <Spinner className="size-4" />
                </InputGroupAddon>
              )}
              {usernameIsAvailable === true && !usernameIsChecking && (
                <InputGroupAddon align="inline-end">
                  <Check className="size-4 text-green-600" />
                </InputGroupAddon>
              )}
            </InputGroup>
            {usernameInput && usernameIsChecking && (
              <FieldDescription>Checking availability...</FieldDescription>
            )}
            {usernameIsAvailable === true && !usernameIsChecking && (
              <FieldDescription className="text-green-600">Username is available</FieldDescription>
            )}
            {usernameInput && !usernameIsChecking && usernameError && (
              <FieldError>{usernameError}</FieldError>
            )}
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="signup-email">
            Email
          </FieldLabel>
          <FieldContent>
            <Input
              id="signup-email"
              type="email"
              placeholder="jane@example.com"
              value={emailInput}
              onChange={(e) => onEmailChange(e.target.value)}
              aria-invalid={emailInput && !emailValidation.isValid ? 'true' : 'false'}
            />
            {emailInput && !emailValidation.isValid && (
              <FieldError>Please enter a valid email address</FieldError>
            )}
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="signup-password">
            Password
          </FieldLabel>
          <FieldContent>
            <Input
              id="signup-password"
              type="password"
              placeholder="••••••••"
              value={passwordInput}
              onChange={(e) => onPasswordChange(e.target.value)}
              aria-invalid={passwordInput && !passwordValidation.isValid ? 'true' : 'false'}
            />
            {passwordInput && !passwordValidation.isValid && (
              <FieldError>{passwordValidation.errorMessage || 'Invalid password'}</FieldError>
            )}
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="signup-password-confirm">
            Confirm Password
          </FieldLabel>
          <FieldContent>
            <Input
              id="signup-password-confirm"
              type="password"
              placeholder="••••••••"
              value={passwordConfirmInput}
              onChange={(e) => onPasswordConfirmChange(e.target.value)}
              aria-invalid={passwordConfirmInput && !passwordConfirmValidation.isValid ? 'true' : 'false'}
            />
            {passwordConfirmInput && !passwordConfirmValidation.isValid && (
              <FieldError>{passwordConfirmValidation.errorMessage || 'Invalid password confirmation'}</FieldError>
            )}
          </FieldContent>
        </Field>
      </FieldGroup>

      <div className="space-y-4">
        <Button
          onClick={handleSignUpClick}
          className="w-full"
          disabled={!isFormValid || isSigningUp}
        >
          <ArrowRight /> Sign up
        </Button>

        <Button
          onClick={onBack}
          variant="secondary"
          className="w-full"
        >
          <ArrowLeft /> Back
        </Button>
      </div>

      <p className="text-sm text-center text-muted-foreground">
        Already have an account?{' '}
        <Button
          onClick={onLogInClick}
          variant="link"
          className="h-auto p-0"
        >
          Log in
        </Button>
      </p>
    </ViewContent>
  );
}
