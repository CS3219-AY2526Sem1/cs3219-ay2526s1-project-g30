// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Haiku 4.5 & Claude Sonnet 4.5), date: 2025‑10-26
// Scope: Generated implementation based on specifications and API requirements.
// Author review: Validated correctness, fixed bugs

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { EmailEntryView } from './EmailEntryView'
import { PasswordAuthView } from './PasswordAuthView'
import { SignupView } from './SignupView'
import { OtpVerificationView } from './OtpVerificationView'
import { SignupCompleteView } from './SignupCompleteView'
import { ResetPasswordView } from './ResetPasswordView'
import { useLoginFlow } from './useLoginFlow'

export function LoginContent() {
  const {
    state,
    setField,
    handleContinueEmail,
    handleBackFromPassword,
    handleBackFromSignup,
    handleBackFromOtpVerification,
    handleOtpVerified,
    handleSignupComplete,
    handleSkipSignupComplete,
    handleBackFromSignupComplete,
    handleInitiateResetPassword,
    handleBackFromResetPassword,
    handlePasswordReset,
    handleSignUp,
    handleLogIn,
    handleSignupInitiated,
  } = useLoginFlow()

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full flex justify-start items-center pl-8 md:pl-16 lg:pl-32">
        <div className="flex flex-col items-start">
          <h1 className="text-4xl font-bold text-background mb-8">PeerPrep</h1>

          <motion.div
            layout
            className="w-[min(100vw-4rem,432px)] min-w-120 bg-card rounded-lg shadow-lg overflow-hidden border border-border"
            transition={{ type: 'spring', bounce: 0 }}
          >
            <div className="p-8 min-h-0">
              <AnimatePresence mode="wait">
                {state.currentView === 'email-entry' && (
                  <EmailEntryView
                    key="email-entry"
                    isActive
                    emailInput={state.emailInput}
                    onEmailChange={(value) => setField('emailInput', value)}
                    onContinue={handleContinueEmail}
                    onSignUpClick={handleSignUp}
                  />
                )}

                {state.currentView === 'password-auth' && (
                  <PasswordAuthView
                    key="password-auth"
                    isActive
                    email={state.storedEmail}
                    passwordInput={state.passwordInput}
                    onPasswordChange={(value) => setField('passwordInput', value)}
                    onSignIn={async () => {
                      // Handled inside PasswordAuthView via server action; redirects on success.
                    }}
                    onResetPassword={handleInitiateResetPassword}
                    onBack={handleBackFromPassword}
                  />
                )}

                {state.currentView === 'signup' && (
                  <SignupView
                    key="signup"
                    isActive
                    usernameInput={state.usernameInput}
                    emailInput={state.signupEmail}
                    passwordInput={state.signupPassword}
                    passwordConfirmInput={state.signupPasswordConfirm}
                    onUsernameChange={(value) => setField('usernameInput', value)}
                    onEmailChange={(value) => setField('signupEmail', value)}
                    onPasswordChange={(value) => setField('signupPassword', value)}
                    onPasswordConfirmChange={(value) =>
                      setField('signupPasswordConfirm', value)
                    }
                    onSignUpSuccess={handleSignupInitiated}
                    onBack={handleBackFromSignup}
                    onLogInClick={handleLogIn}
                  />
                )}

                {state.currentView === 'otp-verification' && (
                  <OtpVerificationView
                    key="otp-verification"
                    isActive
                    email={state.storedEmail}
                    password={state.storedPassword}
                    onOtpVerified={handleOtpVerified}
                    onBack={handleBackFromOtpVerification}
                  />
                )}

                {state.currentView === 'signup-complete' && (
                  <SignupCompleteView
                    key="signup-complete"
                    isActive
                    onCompleteSignup={handleSignupComplete}
                    onSkip={handleSkipSignupComplete}
                    onBack={handleBackFromSignupComplete}
                  />
                )}

                {state.currentView === 'reset-password' && (
                  <ResetPasswordView
                    key="reset-password"
                    isActive
                    email={state.storedEmail}
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
  )
}
