'use client';

import { useActionState, useTransition } from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ViewContent } from '@/components/ViewContent';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Field, FieldContent, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyOTP } from '@/app/actions/auth';

interface OtpVerificationViewProps {
  isActive: boolean;
  email: string;
  password?: string;
  onOtpVerified: () => void;
  onBack: () => void;
}

export function OtpVerificationView({
  isActive,
  email,
  password,
  onOtpVerified,
  onBack,
}: OtpVerificationViewProps) {
  const [state, formAction, isVerifying] = useActionState(verifyOTP, undefined);
  const [isPending, startTransition] = useTransition();
  const [otpValue, setOtpValue] = useState<string>('');

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) return;

    const formData = new FormData();
    formData.set('email', email);
    formData.set('otp', otpValue);
    if (password) {
      formData.set('password', password);
    }

    startTransition(() => {
      formAction(formData);
    });
  };

  // Display error from server action state
  const displayError = state && !state.success ? state.message : undefined;

  // Trigger callback when verification succeeds
  useEffect(() => {
    if (state?.success && !isVerifying) {
      onOtpVerified();
    }
  }, [state?.success, isVerifying, onOtpVerified]);

  return (
    <ViewContent
      viewId="otp-verification"
      isActive={isActive}
    >
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Verify your email
        </h2>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a 6-digit code to <span className="font-medium">{email}.</span>
        </p>
      </div>

      <FieldGroup>
        <Field
          data-invalid={displayError ? true : undefined}
        >
          <FieldLabel htmlFor="otp">
            Verification code
          </FieldLabel>
          <FieldContent>
            <div className="my-4 flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpValue}
                onChange={setOtpValue}
                disabled={isVerifying}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <AnimatePresence>
              {displayError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <FieldError>{displayError}</FieldError>
                </motion.div>
              )}
            </AnimatePresence>
          </FieldContent>
        </Field>
      </FieldGroup>

      <div className="space-y-4">
        <Button
          onClick={handleVerifyOtp}
          className="w-full"
          disabled={otpValue.length !== 6 || isVerifying}
        >
          {isVerifying ? (
            <>
              <Spinner className="mr-2" />
              Verifying...
            </>
          ) : (
            <>
              <ArrowRight /> Continue
            </>
          )}
        </Button>

        <Button
          onClick={onBack}
          variant="secondary"
          className="w-full"
          disabled={isVerifying}
        >
          <ArrowLeft /> Back
        </Button>
      </div>

      <p className="text-sm text-center text-muted-foreground">
        Please check your email for the verification code. It may take a few minutes to arrive.
      </p>
    </ViewContent>
  );
}
