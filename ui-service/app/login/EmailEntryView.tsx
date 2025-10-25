'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ViewContent } from '@/components/ViewContent';
import { ArrowRight } from 'lucide-react';
import { Field, FieldContent, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { validateEmail } from '@/lib/validation';

interface EmailEntryViewProps {
  isActive: boolean;
  emailInput: string;
  onEmailChange: (email: string) => void;
  onContinue: () => void;
  onSignUpClick: () => void;
}

export function EmailEntryView({
  isActive,
  emailInput,
  onEmailChange,
  onContinue,
  onSignUpClick,
}: EmailEntryViewProps) {
  const emailValidation = useMemo(() => {
    if (!emailInput) return { isValid: true };
    return { isValid: validateEmail(emailInput) };
  }, [emailInput]);

  const isContinueDisabled = !emailInput || !emailValidation.isValid;

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
          <ArrowRight /> Continue
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
