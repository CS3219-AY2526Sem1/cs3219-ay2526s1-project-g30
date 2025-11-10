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

type ViewState = 'email-entry' | 'password-auth' | 'signup' | 'otp-verification' | 'signup-complete' | 'reset-password';

export function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Initialize view state based on query parameters
  const getInitialView = (): ViewState => {
    const step = searchParams.get('step');
    if (step === 'reset-password') {
      return 'reset-password';
    }
    return 'email-entry';
  };

  const getInitialEmail = (): string => {
    const step = searchParams.get('step');
    const email = searchParams.get('email');
    if (step === 'reset-password' && email) {
      return decodeURIComponent(email);
    }
    return '';
  };

  const [currentView, setCurrentView] = useState<ViewState>(getInitialView());
  const [storedEmail, setStoredEmail] = useState<string>(getInitialEmail());
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState<string>('');
  const [storedPassword, setStoredPassword] = useState<string>('');

  // Clear query parameters after mount
  useEffect(() => {
    const step = searchParams.get('step');
    if (step) {
      window.history.replaceState({}, '', '/login');
    }
  }, [searchParams]);

  const handleContinueEmail = () => {
    if (emailInput.trim()) {
      setStoredEmail(emailInput);
      setCurrentView('password-auth');
    }
  };

  const handleBackFromPassword = () => {
    setCurrentView('email-entry');
    setPasswordInput('');
  };

  const handleBackFromSignup = () => {
    setCurrentView('email-entry');
    setUsernameInput('');
    setSignupEmail('');
    setSignupPassword('');
    setSignupPasswordConfirm('');
    setStoredPassword('');
  };

  const handleBackFromOtpVerification = () => {
    setCurrentView('signup');
    // Reset OTP for security
  };

  const handleOtpVerified = () => {
    // Move to signup complete after OTP verification
    setCurrentView('signup-complete');
  };

  const handleSignupComplete = () => {
    // Redirect to home page after successful profile setup
    router.push('/home');
  };

  const handleSkipSignupComplete = () => {
    // Skip profile setup and go straight to home
    router.push('/home');
  };

  const handleBackFromSignupComplete = () => {
    setCurrentView('otp-verification');
  };

  const handleInitiateResetPassword = () => {
    const formData = new FormData();
    formData.set('email', storedEmail);
    startTransition(async () => {
      const result = await requestPasswordReset(undefined, formData);
      if (result?.success) {
        setCurrentView('reset-password');
      }
    });
  };

  const handleBackFromResetPassword = () => {
    setCurrentView('password-auth');
  };

  const handlePasswordReset = () => {
    // After successful password reset, return to login screen
    setCurrentView('email-entry');
    setEmailInput('');
    setPasswordInput('');
    setStoredEmail('');
  };

  const handleSignUp = () => {
    setCurrentView('signup');
  };

  const handleLogIn = () => {
    setCurrentView('email-entry');
  };

  const handleSignupInitiated = (email: string, password: string) => {
    // After signup form is completed, move to OTP verification
    if (email.trim()) {
      setStoredEmail(email);
      setStoredPassword(password);
      setCurrentView('otp-verification');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full flex justify-start items-center pl-8 md:pl-16 lg:pl-32">
        <div className="flex flex-col items-start">
          {/* PeerPrep Logo */}
          <h1 className="text-4xl font-bold text-background mb-8">PeerPrep</h1>

          {/* Card Container */}
          <motion.div
            layout
            className="w-[min(100vw-4rem,432px)] min-w-120 bg-card rounded-lg shadow-lg overflow-hidden border border-border"
            transition={{ type: 'spring', bounce: 0 }}
          >
            <div className="p-8 min-h-0">
              <AnimatePresence mode="wait">
                {currentView === 'email-entry' && (
                  <EmailEntryView
                    key="email-entry"
                    isActive={currentView === 'email-entry'}
                    emailInput={emailInput}
                    onEmailChange={setEmailInput}
                    onContinue={handleContinueEmail}
                    onSignUpClick={handleSignUp}
                  />
                )}

                {currentView === 'password-auth' && (
                  <PasswordAuthView
                    key="password-auth"
                    isActive={currentView === 'password-auth'}
                    email={storedEmail}
                    passwordInput={passwordInput}
                    onPasswordChange={setPasswordInput}
                    onSignIn={async () => {
                      // The PasswordAuthView will handle the server action
                      // On successful signin, the server action will redirect to /home
                    }}
                    onResetPassword={handleInitiateResetPassword}
                    onBack={handleBackFromPassword}
                  />
                )}

                {currentView === 'signup' && (
                  <SignupView
                    key="signup"
                    isActive={currentView === 'signup'}
                    usernameInput={usernameInput}
                    emailInput={signupEmail}
                    passwordInput={signupPassword}
                    passwordConfirmInput={signupPasswordConfirm}
                    onUsernameChange={setUsernameInput}
                    onEmailChange={setSignupEmail}
                    onPasswordChange={setSignupPassword}
                    onPasswordConfirmChange={setSignupPasswordConfirm}
                    onSignUpSuccess={handleSignupInitiated}
                    onBack={handleBackFromSignup}
                    onLogInClick={handleLogIn}
                  />
                )}

                {currentView === 'otp-verification' && (
                  <OtpVerificationView
                    key="otp-verification"
                    isActive={currentView === 'otp-verification'}
                    email={storedEmail}
                    password={storedPassword}
                    onOtpVerified={handleOtpVerified}
                    onBack={handleBackFromOtpVerification}
                  />
                )}

                {currentView === 'signup-complete' && (
                  <SignupCompleteView
                    key="signup-complete"
                    isActive={currentView === 'signup-complete'}
                    onCompleteSignup={handleSignupComplete}
                    onSkip={handleSkipSignupComplete}
                    onBack={handleBackFromSignupComplete}
                  />
                )}

                {currentView === 'reset-password' && (
                  <ResetPasswordView
                    key="reset-password"
                    isActive={currentView === 'reset-password'}
                    email={storedEmail}
                    onPasswordReset={handlePasswordReset}
                    onBack={handleBackFromResetPassword}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
