// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Haiku 4.5 & Claude Sonnet 4.5), date: 2025‑10-26
// Scope: Generated implementation based on specifications and API requirements.
// Author review: Validated correctness, fixed bugs

'use client';

import { useActionState, useTransition } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ViewContent } from '@/components/ViewContent';
import { ArrowRight, ArrowLeft, Info, TriangleAlert } from 'lucide-react';
import { Field, FieldContent, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyOTP, resendOTP } from '@/app/actions/auth';
import { useCountdown } from '@/hooks/use-countdown';
import { useTimeout } from '@/hooks/use-timeout';

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
  const [resendState, resendAction] = useActionState(resendOTP, undefined);
  const [, startTransition] = useTransition();
  const [otpValue, setOtpValue] = useState<string>('');
  const [isResending, setIsResending] = useState(false);

  // Countdown for resend button (60 seconds)
  const [secondsRemaining, { startCountdown, resetCountdown }] = useCountdown({
    countStart: 60,
    countStop: 0,
    intervalMs: 1000,
    isIncrement: false,
  });

  const canResend = secondsRemaining === 0;

  // Auto-start countdown on component mount
  useEffect(() => {
    startCountdown();
  }, [startCountdown]);

  // State for resend alert feedback
  const [resendAlert, setResendAlert] = useState<'success' | 'error' | null>(null);
  const resendStateTrackerRef = useRef<string | null>(null);

  // Auto-dismiss alert after 10 seconds
  useTimeout(
    () => setResendAlert(null),
    resendAlert ? 10000 : null
  );

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

  const handleResendOtp = async () => {
    if (!canResend || isResending) return;

    const formData = new FormData();
    formData.set('email', email);

    startTransition(() => {
      setIsResending(true);
      setOtpValue('');
      resendAction(formData);
    });
  };

  // Track resend state changes and show alert (using ref to avoid cascading renders)
  useEffect(() => {
    if (!resendState) return;

    const stateKey = `${resendState.success}-${resendState.message}`;
    if (resendStateTrackerRef.current === stateKey) {
      return; // Already shown this state
    }

    resendStateTrackerRef.current = stateKey;

    const showAlert = () => {
      if (resendState.success) {
        setResendAlert('success');
      } else if (!resendState.success) {
        setResendAlert('error');
      }
    };

    showAlert();
  }, [resendState]);

  // Reset isResending after resend action completes and restart countdown
  useTimeout(
    () => {
      if (isResending && resendState) {
        setIsResending(false);
        resetCountdown();
        startCountdown();
      }
    },
    isResending && resendState ? 0 : null
  );

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
          disabled={isVerifying || isResending}
        >
          <ArrowLeft /> Back
        </Button>
      </div>

      <AnimatePresence>
        {resendAlert === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Alert>
              <Info />
              <AlertDescription>
                Verification code has been resent to your email.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
        {resendAlert === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Alert variant="destructive">
              <TriangleAlert />
              <AlertDescription>
                Failed to resend the verification code. Please try again.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-sm text-center text-muted-foreground">
        {canResend ? (
          <>
            Didn&apos;t receive the code?{' '}
            <Button
              onClick={handleResendOtp}
              variant="link"
              className="h-auto p-0"
              disabled={isResending}
            >
              {isResending ? (
                <>
                  <Spinner />
                  Resending...
                </>
              ) : (
                'Resend'
              )}
            </Button>
          </>
        ) : (
          <>Resend code in {secondsRemaining}s</>
        )}
      </p>
    </ViewContent>
  );
}
