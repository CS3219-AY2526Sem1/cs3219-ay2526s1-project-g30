'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ViewContent } from '@/components/ViewContent';
import { ArrowRight, ArrowLeft, Info, TriangleAlert } from 'lucide-react';
import { Field, FieldContent, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithPassword, requestPasswordReset } from '@/lib/validation';

interface PasswordAuthViewProps {
  isActive: boolean;
  email: string;
  passwordInput: string;
  onPasswordChange: (password: string) => void;
  onSignIn: () => void;
  onBack: () => void;
}

export function PasswordAuthView({
  isActive,
  email,
  passwordInput,
  onPasswordChange,
  onSignIn,
  onBack,
}: PasswordAuthViewProps) {
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string>();
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordAlert, setResetPasswordAlert] = useState<'success' | 'error' | null>(null);

  // Auto-dismiss alert after 10 seconds
  useEffect(() => {
    if (resetPasswordAlert === null) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setResetPasswordAlert(null);
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [resetPasswordAlert]);

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

  const handleResetPasswordClick = async () => {
    setIsResettingPassword(true);

    try {
      const result = await requestPasswordReset(email);

      if (result.success) {
        setResetPasswordAlert('success');
      } else {
        setResetPasswordAlert('error');
      }
    } catch (error) {
      setResetPasswordAlert('error');
    } finally {
      setIsResettingPassword(false);
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
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={passwordInput}
              onChange={(e) => onPasswordChange(e.target.value)}
              onKeyDown={handlePasswordKeyDown}
              disabled={isSigningIn}
              aria-invalid={signInError ? 'true' : 'false'}
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
          onClick={handleResetPasswordClick}
          disabled={isResettingPassword}
          variant="link"
          className="inline-flex gap-2 h-auto p-0"
        >
          {isResettingPassword && <Spinner className="size-3" />}
          {isResettingPassword ? 'Sending reset instructions...' : 'Reset password'}
        </Button>
      </p>

      <AnimatePresence>
        {resetPasswordAlert === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Alert>
              <Info/>
              <AlertDescription>
                Password reset instructions have been sent to your email.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
        {resetPasswordAlert === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Alert variant="destructive">
              <TriangleAlert/>
              <AlertDescription>
                The password reset email couldn&apos;t be sent. Please try again.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </ViewContent>
  );
}
