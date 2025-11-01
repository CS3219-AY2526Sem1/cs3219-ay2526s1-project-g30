'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ViewContent } from '@/components/ViewContent';
import { ArrowRight } from 'lucide-react';
import { Field, FieldContent, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { validateEmail } from '@/lib/validation';

interface EmailEntryViewProps {
  isActive: boolean;
  emailInput: string;
  onEmailChange: (email: string) => void;
  onContinue: () => void;
  onSignUpClick: () => void;
  isLoading?: boolean;
}

export function EmailEntryView({
  isActive,
  emailInput,
  onEmailChange,
  onContinue,
  onSignUpClick,
  isLoading = false,
}: EmailEntryViewProps) {
  const emailValidation = useMemo(() => {
    if (!emailInput) return { isValid: true };
    return { isValid: validateEmail(emailInput) };
  }, [emailInput]);

  const isContinueDisabled = !emailInput || !emailValidation.isValid || isLoading;

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isContinueDisabled) {
      onContinue();
    }
  };

  return (
    <ViewContent
      viewId="email-entry"
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
          <FieldLabel htmlFor="email-entry">
            Email
          </FieldLabel>
          <FieldContent>
            <Input
              id="email-entry"
              type="email"
              placeholder="you@example.com"
              value={emailInput}
              onChange={(e) => onEmailChange(e.target.value)}
              onKeyDown={handleEmailKeyDown}
              aria-invalid={emailInput && !emailValidation.isValid ? 'true' : 'false'}
            />
            {emailInput && !emailValidation.isValid && (
              <FieldError>Please enter a valid email address</FieldError>
            )}
          </FieldContent>
        </Field>
      </FieldGroup>

      <div className="space-y-4">
        <Button
          onClick={onContinue}
          className="w-full"
          disabled={isContinueDisabled}
        >
          {isLoading && <Spinner />}
          {isLoading ? 'Loading...' : 'Continue'}
          {!isLoading && <ArrowRight />}
        </Button>
      </div>

      <p className="text-sm text-center text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Button
          onClick={onSignUpClick}
          variant="link"
          className="h-auto p-0"
        >
          Sign up
        </Button>
      </p>
    </ViewContent>
  );
}
