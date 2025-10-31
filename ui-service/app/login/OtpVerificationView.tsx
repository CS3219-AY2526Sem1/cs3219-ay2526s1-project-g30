'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ViewContent } from '@/components/ViewContent';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Field, FieldContent, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import { useCountdown } from '@/hooks/use-countdown';
import { Spinner } from '@/components/ui/spinner';
import { motion, AnimatePresence } from 'framer-motion';

interface OtpVerificationViewProps {
  isActive: boolean;
  email: string;
  onOtpVerified: () => void;
  onBack: () => void;
}

export function OtpVerificationView({
  isActive,
  email,
  onOtpVerified,
  onBack,
}: OtpVerificationViewProps) {
  const [otpValue, setOtpValue] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string>();

  // Countdown for resend button (60 seconds)
  const [secondsRemaining, { startCountdown, resetCountdown }] = useCountdown({
    countStart: 60,
    countStop: 0,
    intervalMs: 1000,
    isIncrement: false,
  });

  const canResend = secondsRemaining === 0;
  const [isResending, setIsResending] = useState(false);

  // Auto-start countdown on component mount
  useEffect(() => {
    startCountdown();
  }, [startCountdown]);

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) return;

    setVerificationError(undefined);
    setIsVerifying(true);

    try {
      // TODO: Replace with actual OTP verification API call
      // For now, any 6-digit code is considered valid
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate success
      setIsVerifying(false);
      onOtpVerified();
    } catch (error) {
      setVerificationError('Invalid OTP. Please try again.');
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    setVerificationError(undefined);

    try {
      // TODO: Replace with actual resend OTP API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reset OTP input and countdown
      setOtpValue('');
      resetCountdown();
      startCountdown();
      setIsResending(false);
    } catch (error) {
      setVerificationError('Failed to resend OTP. Please try again.');
      setIsResending(false);
    }
  };

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
          data-invalid={verificationError ? true : undefined}
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
              {verificationError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <FieldError>{verificationError}</FieldError>
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
                  <Spinner className="mr-1 size-3" />
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
