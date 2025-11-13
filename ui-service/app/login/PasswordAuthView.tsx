// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Haiku 4.5 & Claude Sonnet 4.5), date: 2025‑10-26
// Scope: Generated implementation based on specifications and API requirements.
// Author review: Validated correctness, fixed bugs

'use client';

import { useActionState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { ViewContent } from '@/components/ViewContent';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Field, FieldContent, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { signIn } from '@/app/actions/auth';

interface PasswordAuthViewProps {
  isActive: boolean;
  email: string;
  passwordInput: string;
  onPasswordChange: (password: string) => void;
  onSignIn: (password: string) => Promise<void>;
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
  const [state, formAction, isSubmitting] = useActionState(signIn, undefined);
  const [, startTransition] = useTransition();

  // Display error from server action state
  const signInError = state && !state.success ? state.message : undefined;

  const handleSignInClick = async () => {
    const formData = new FormData();
    formData.set('email', email);
    formData.set('password', passwordInput);
    
    startTransition(() => {
      formAction(formData);
    });
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSubmitting) {
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
              disabled={isSubmitting}
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
          disabled={isSubmitting}
        >
          {isSubmitting && <Spinner className="size-4" />}
          {isSubmitting ? 'Signing in...' : 'Sign in'}
          {!isSubmitting && <ArrowRight className="size-4" />}
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
