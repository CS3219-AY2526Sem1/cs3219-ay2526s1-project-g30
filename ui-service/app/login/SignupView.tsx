// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Haiku 4.5 & Claude Sonnet 4.5), date: 2025‑10-26
// Scope: Generated implementation based on specifications and API requirements.
// Author review: Validated correctness, fixed bugs

'use client';

import { useActionState, useEffect, useTransition, useState } from 'react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { ViewContent } from '@/components/ViewContent';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Field, FieldContent, FieldLabel, FieldError, FieldDescription, FieldGroup } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import { validateUsername, validateEmail, validatePassword } from '@/lib/validation';
import { useDebounceValue } from '@/hooks/use-debounce-value';
import { signUp } from '@/app/actions/auth';
import { checkUsernameAvailability } from '@/app/actions/checkUsername';

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
  onSignUpSuccess: (email: string, password: string) => void;
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
  onSignUpSuccess,
  onBack,
  onLogInClick,
}: SignupViewProps) {
  const [state, formAction, isSigningUp] = useActionState(signUp, undefined);
  const [, startTransition] = useTransition();

  // Debounce username for availability check
  const [debouncedUsername] = useDebounceValue(usernameInput, 500);

  const [usernameError, setUsernameError] = useState<string>();
  const [usernameIsChecking, setUsernameIsChecking] = useState(false);
  const [usernameIsAvailable, setUsernameIsAvailable] = useState<boolean>();

  // Watch for successful signup and trigger callback
  useEffect(() => {
    if (state?.success) {
      // Use the email and password from the form
      const signupEmail = emailInput || '';
      const signupPassword = passwordInput || '';
      if (signupEmail.trim() && signupPassword.trim()) {
        onSignUpSuccess(signupEmail, signupPassword);
      }
    }
  }, [state?.success, emailInput, passwordInput, onSignUpSuccess]);

  // Validate username format
  const usernameFormatValidation = useMemo(() => {
    if (!usernameInput) return { isValid: true };
    return validateUsername(usernameInput);
  }, [usernameInput]);

  // Track if username is currently being edited (different from debounced value)
  const isUsernameBeingEdited = usernameInput !== debouncedUsername;

  // Clear/prepare availability state when user is actively typing
  useEffect(() => {
    if (isUsernameBeingEdited) {
      setUsernameIsAvailable(undefined);
      setUsernameError(undefined);
      setUsernameIsChecking(true);
    }
  }, [isUsernameBeingEdited]);

  // Check username availability only when debounce settles and user stops typing
  useEffect(() => {
    // Don't check if user is still typing
    if (isUsernameBeingEdited) {
      return;
    }

    // Clear state if format is invalid or username is empty
    if (!usernameFormatValidation.isValid || !debouncedUsername) {
      setUsernameIsAvailable(undefined);
      setUsernameError(usernameFormatValidation.errorMessage);
      setUsernameIsChecking(false);
      return;
    }

    // Check availability
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
  }, [debouncedUsername, usernameFormatValidation, isUsernameBeingEdited]);

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

  // Submit form action on button click
  const handleSignUpClick = () => {
    if (!isFormValid) return;
    
    const formData = new FormData();
    formData.set('username', usernameInput);
    formData.set('email', emailInput);
    formData.set('password', passwordInput);
    formData.set('confirmPassword', passwordConfirmInput);
    
    // Submit through form action within a transition
    startTransition(() => {
      formAction(formData);
    });
  };

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
        {state?.message && !state?.success && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {state.message}
          </div>
        )}
        
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
              placeholder="you@example.com"
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
            <PasswordInput
              id="signup-password"
              value={passwordInput}
              onChange={onPasswordChange}
              ariaInvalid={passwordInput && !passwordValidation.isValid ? 'true' : 'false'}
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
            <PasswordInput
              id="signup-password-confirm"
              value={passwordConfirmInput}
              onChange={onPasswordConfirmChange}
              ariaInvalid={passwordConfirmInput && !passwordConfirmValidation.isValid ? 'true' : 'false'}
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
          {isSigningUp && <Spinner />}
          {isSigningUp ? 'Signing up...' : 'Sign up'}
          {!isSigningUp && <ArrowRight />}
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
