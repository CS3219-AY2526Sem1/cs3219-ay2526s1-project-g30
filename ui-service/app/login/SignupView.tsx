'use client';

import { useActionState, useEffect, useTransition } from 'react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { ViewContent } from '@/components/ViewContent';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Field, FieldContent, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { validateUsername, validateEmail, validatePassword } from '@/lib/validation';
import { signUp } from '@/app/actions/auth';

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
            (usernameInput && !usernameFormatValidation.isValid)
              ? true
              : undefined
          }
        >
          <FieldLabel htmlFor="signup-username">
            Username
          </FieldLabel>
          <FieldContent>
            <Input
              id="signup-username"
              type="text"
              placeholder="your.username"
              value={usernameInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUsernameChange(e.target.value)}
              aria-invalid={
                (usernameInput && !usernameFormatValidation.isValid)
                  ? 'true'
                  : 'false'
              }
            />
            {usernameInput && !usernameFormatValidation.isValid && (
              <FieldError>{usernameFormatValidation.errorMessage || 'Invalid username'}</FieldError>
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
