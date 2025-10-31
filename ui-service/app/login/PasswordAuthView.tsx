'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { ViewContent } from '@/components/ViewContent';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Field, FieldContent, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { signInWithPassword } from '@/lib/validation';

interface PasswordAuthViewProps {
  isActive: boolean;
  email: string;
  passwordInput: string;
  onPasswordChange: (password: string) => void;
  onSignIn: () => void;
  onResetPassword: () => void;
  onBack: () => void;
}

export function PasswordAuthView({
  isActive,
  email,
  passwordInput,
  onPasswordChange,
  onSignIn,
  onResetPassword,
  onBack,
}: PasswordAuthViewProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string>();

  const handleSignInClick = async () => {
    setSignInError(undefined);
    setIsSigningIn(true);

    try {
      const result = await signInWithPassword(email, passwordInput);

      if (!result.success) {
        setSignInError(result.errorMessage || 'Sign in failed');
        setIsSigningIn(false);
        return;
      }

      // Sign-in successful - call the onSignIn callback to handle JWT setup
      setIsSigningIn(false);
      await onSignIn();
      // Note: onSignIn handles redirect, so we don't need to do it here
    } catch (error) {
      setSignInError('An error occurred during sign-in. Please try again.');
      setIsSigningIn(false);
    }
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSigningIn) {
      handleSignInClick();
    }
  };

  return (
    <ViewContent
      viewId="password-auth"
      isActive={isActive}
    >
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Welcome back to PeerPrep.
        </h2>
        <p className="text-sm text-muted-foreground">Sign in to continue.</p>
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">
            Email
          </FieldLabel>
          <FieldContent>
            <Input
              id="email"
              type="text"
              value={email}
              disabled
            />
          </FieldContent>
        </Field>

        <Field
          data-invalid={signInError ? true : undefined}
        >
          <FieldLabel htmlFor="password">
            Password
          </FieldLabel>
          <FieldContent>
            <PasswordInput
              id="password"
              value={passwordInput}
              onChange={onPasswordChange}
              onKeyDown={handlePasswordKeyDown}
              disabled={isSigningIn}
              ariaInvalid={signInError ? 'true' : 'false'}
            />
            {signInError && (
              <FieldError>{signInError}</FieldError>
            )}
          </FieldContent>
        </Field>
      </FieldGroup>

      <div className="space-y-4">
        <Button
          onClick={handleSignInClick}
          className="w-full"
          disabled={isSigningIn}
        >
          {isSigningIn && <Spinner className="size-4" />}
          {isSigningIn ? 'Signing in...' : 'Sign in'}
          {!isSigningIn && <ArrowRight className="size-4" />}
        </Button>

        <Button
          onClick={onBack}
          variant="secondary"
          className="w-full"
          disabled={isSigningIn}
        >
          <ArrowLeft /> Back
        </Button>
      </div>

      <p className="text-sm text-center text-muted-foreground">
        Forgot your password?{' '}
        <Button
          onClick={onResetPassword}
          variant="link"
          className="h-auto p-0"
        >
          Reset password
        </Button>
      </p>
    </ViewContent>
  );
}
