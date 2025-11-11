'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { EmailEntryView } from './EmailEntryView';
import { PasswordAuthView } from './PasswordAuthView';
import { SignupView } from './SignupView';
import { OtpVerificationView } from './OtpVerificationView';
import { SignupCompleteView } from './SignupCompleteView';
import { ResetPasswordView } from './ResetPasswordView';
import { requestPasswordReset } from '@/app/actions/auth';
import { Suspense } from 'react';
import { LoginContent } from './LoginContent';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
