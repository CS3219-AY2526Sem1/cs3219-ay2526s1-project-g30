'use client';

import { useActionState, useTransition } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { PasswordInput } from '@/components/ui/password-input';
import { ViewContent } from '@/components/ViewContent';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Field, FieldContent, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import { useCountdown } from '@/hooks/use-countdown';
import { Spinner } from '@/components/ui/spinner';
import { validatePassword } from '@/lib/validation';
import { motion, AnimatePresence } from 'framer-motion';
import { resetPassword, requestPasswordReset } from '@/app/actions/auth';

interface ResetPasswordViewProps {
  isActive: boolean;
  email: string;
  onPasswordReset: () => void;
  onBack: () => void;
}

export function ResetPasswordView({
  isActive,
  email,
  onPasswordReset,
  onBack,
}: ResetPasswordViewProps) {
  const [resetState, resetFormAction, isResettingPassword] = useActionState(resetPassword, undefined);
  const [resendState, resendFormAction, isResendingOtp] = useActionState(requestPasswordReset, undefined);
  const [isPending, startTransition] = useTransition();
  
  const [otpValue, setOtpValue] = useState<string>('');
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [resetError, setResetError] = useState<string>();

  // Countdown for resend OTP button (60 seconds)
  const [secondsRemaining, { startCountdown, resetCountdown }] = useCountdown({
    countStart: 60,
    countStop: 0,
    intervalMs: 1000,
    isIncrement: false,
  });

  const canResendOtp = secondsRemaining === 0;

  // Auto-start countdown on component mount
  useEffect(() => {
    startCountdown();
  }, [startCountdown]);

  // Handle successful password reset
  useEffect(() => {
    if (resetState?.success) {
      onPasswordReset();
    }
  }, [resetState?.success, onPasswordReset]);

  // Handle successful OTP resend
  useEffect(() => {
    if (resendState?.success) {
      resetCountdown();
    }
  }, [resendState?.success, resetCountdown]);

  // Validate new password
  const newPasswordValidation = useMemo(() => {
    if (!newPasswordInput) return { isValid: true };
    return validatePassword(newPasswordInput);
  }, [newPasswordInput]);

  // Validate password confirmation
  const confirmPasswordValidation = useMemo(() => {
    if (!confirmPasswordInput) return { isValid: true };
    if (newPasswordInput !== confirmPasswordInput) {
      return { isValid: false, errorMessage: 'Passwords do not match' };
    }
    return { isValid: true };
  }, [newPasswordInput, confirmPasswordInput]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return (
      otpValue.length === 6 &&
      newPasswordInput &&
      newPasswordValidation.isValid &&
      confirmPasswordInput &&
      confirmPasswordValidation.isValid
    );
  }, [otpValue, newPasswordInput, newPasswordValidation.isValid, confirmPasswordInput, confirmPasswordValidation.isValid]);

  const handleResetPassword = async () => {
    if (!isFormValid) return;

    setResetError(undefined);

    const formData = new FormData();
    formData.set('email', email);
    formData.set('otp', otpValue);
    formData.set('password', newPasswordInput);

    startTransition(() => {
      resetFormAction(formData);
    });
  };

  const handleResendOtp = async () => {
    if (!canResendOtp || isResendingOtp) return;

    setResetError(undefined);
    setOtpValue('');

    const formData = new FormData();
    formData.set('email', email);

    startTransition(() => {
      resendFormAction(formData);
    });
  };

  const handleResetPasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isFormValid && !isResettingPassword) {
      handleResetPassword();
    }
  };

  return (
    <ViewContent
      viewId="reset-password"
      isActive={isActive}
    >
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Reset your password
        </h2>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a code to <span className="font-medium">{email}</span>
        </p>
      </div>

      <FieldGroup>
        <Field
          data-invalid={resetError ? true : undefined}
        >
          <FieldLabel htmlFor="reset-otp">
            Verification code
          </FieldLabel>
          <FieldContent>
            <div className="my-4 flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpValue}
                onChange={setOtpValue}
                disabled={isResettingPassword}
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
          </FieldContent>
        </Field>

        <Field
          data-invalid={newPasswordInput && !newPasswordValidation.isValid ? true : undefined}
        >
          <FieldLabel htmlFor="new-password">
            New password
          </FieldLabel>
          <FieldContent>
            <PasswordInput
              id="new-password"
              value={newPasswordInput}
              onChange={setNewPasswordInput}
              disabled={isResettingPassword}
              ariaInvalid={newPasswordInput && !newPasswordValidation.isValid ? 'true' : 'false'}
            />
            {newPasswordInput && !newPasswordValidation.isValid && (
              <FieldError>{newPasswordValidation.errorMessage}</FieldError>
            )}
          </FieldContent>
        </Field>

        <Field
          data-invalid={confirmPasswordInput && !confirmPasswordValidation.isValid ? true : undefined}
        >
          <FieldLabel htmlFor="confirm-password">
            Confirm password
          </FieldLabel>
          <FieldContent>
            <PasswordInput
              id="confirm-password"
              value={confirmPasswordInput}
              onChange={setConfirmPasswordInput}
              onKeyDown={handleResetPasswordKeyDown}
              disabled={isResettingPassword}
              ariaInvalid={confirmPasswordInput && !confirmPasswordValidation.isValid ? 'true' : 'false'}
            />
            {confirmPasswordInput && !confirmPasswordValidation.isValid && (
              <FieldError>{confirmPasswordValidation.errorMessage}</FieldError>
            )}
          </FieldContent>
        </Field>

        <AnimatePresence>
          {resetError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <FieldError>{resetError}</FieldError>
            </motion.div>
          )}
        </AnimatePresence>
      </FieldGroup>

      <div className="space-y-4">
        <Button
          onClick={handleResetPassword}
          className="w-full"
          disabled={!isFormValid || isResettingPassword}
        >
          {isResettingPassword ? (
            <>
              <Spinner />
              Resetting...
            </>
          ) : (
            <>
              <ArrowRight /> Reset password
            </>
          )}
        </Button>

        <Button
          onClick={onBack}
          variant="secondary"
          className="w-full"
          disabled={isResettingPassword || isResendingOtp}
        >
          <ArrowLeft /> Back
        </Button>
      </div>

      <p className="text-sm text-center text-muted-foreground">
        {canResendOtp ? (
          <>
            Didn&apos;t receive the code?{' '}
            <Button
              onClick={handleResendOtp}
              variant="link"
              className="h-auto p-0"
              disabled={isResendingOtp}
            >
              {isResendingOtp ? (
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
