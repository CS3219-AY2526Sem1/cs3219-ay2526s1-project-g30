'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { EmailEntryView } from './EmailEntryView';
import { PasswordAuthView } from './PasswordAuthView';
import { SignupView } from './SignupView';
import { generateMockJWT, setMockJWT } from '@/lib/mockAuth';

/**
 * TODO: Server Actions Implementation
 *
 * When implementing actual authentication:
 *
 * 1. Create app/actions.ts with the following Server Actions:
 *    - signIn(email: string, password: string)
 *    - signUp(username: string, email: string, password: string)
 *
 * 2. signIn Server Action should:
 *    - Validate email and password format
 *    - Call POST /api/auth/signin endpoint (or direct DB call)
 *    - Validate credentials against backend
 *    - On success:
 *      * Set secure HTTP-only cookie with auth token
 *      * Return success response with user data
 *      * Use redirect() to send user to /home
 *    - On failure:
 *      * Return error message (e.g., invalid credentials, account not found)
 *      * Do NOT redirect; error will be caught and displayed in UI
 *
 * 3. signUp Server Action should:
 *    - Validate all inputs (username, email, password)
 *    - Ensure passwords match (client-side check before calling)
 *    - Call POST /api/auth/signup endpoint (or direct DB call)
 *    - Check for existing email/username on backend
 *    - Hash password on backend
 *    - Create user account
 *    - On success:
 *      * Set secure HTTP-only cookie with auth token
 *      * Return success response with user data
 *      * Use redirect() to send user to /home
 *    - On failure:
 *      * Return error message (e.g., email already exists, invalid username format)
 *      * Do NOT redirect; error will be caught and displayed in UI
 *
 * 4. Update root page (app/page.tsx) to:
 *    - Use getAuthToken() Server Function instead of mock JWT
 *    - Check for valid auth cookie instead of localStorage
 *    - Keep redirect logic the same
 *
 * 5. Create app/api/auth/signin route:
 *    - POST endpoint
 *    - Validate credentials
 *    - Return auth token or error
 *
 * 6. Create app/api/auth/signup route:
 *    - POST endpoint
 *    - Validate inputs
 *    - Create user account
 *    - Return auth token or error
 *
 * 7. Update PasswordAuthView and SignupView to:
 *    - Handle pending state from Server Action
 *    - Display error messages returned by Server Action
 *    - Show loading state while authentication is in progress
 *
 * 8. Implement logout functionality:
 *    - Create clearAuth() Server Action to delete auth cookie
 *    - Update Navbar component to call logout action
 *    - Redirect to /login after logout
 */

type ViewState = 'email-entry' | 'password-auth' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<ViewState>('email-entry');
  const [storedEmail, setStoredEmail] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState<string>('');

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
  };

  const handleSignUp = () => {
    setCurrentView('signup');
  };

  const handleLogIn = () => {
    setCurrentView('email-entry');
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
                    onSignIn={
                      async () => {
                        console.log('[LoginPage] Sign-in initiated')
                        // TODO: Replace mock JWT flow with Server Action
                        // Once signIn Server Action is implemented in app/actions.ts:
                        // - Import: import { signIn } from '@/app/actions'
                        // - Replace this entire function body with:
                        //   const result = await signIn(storedEmail, passwordInput);
                        //   if (result.error) {
                        //     setErrorMessage(result.error);
                        //   }
                        //   // On success, signIn will call redirect('/home')
                        //   // so this code won't be reached
                        //
                        // For now, use mock JWT flow:
                        const mockToken = generateMockJWT();
                        console.log('[LoginPage] Mock token generated')
                        setMockJWT(mockToken);
                        console.log('[LoginPage] Mock token stored, waiting before redirect...')
                        // Wait for next tick to ensure localStorage write completes
                        await new Promise(resolve => setTimeout(resolve, 0));
                        console.log('[LoginPage] Redirecting to /home')
                        router.push('/home');
                      }
                    }
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
                    onSignUp={
                      async () => {
                        console.log('[LoginPage] Sign-up initiated')
                        // TODO: Replace mock JWT flow with Server Action
                        // Once signUp Server Action is implemented in app/actions.ts:
                        // - Import: import { signUp } from '@/app/actions'
                        // - Add client-side validation:
                        //   if (signupPassword !== signupPasswordConfirm) {
                        //     setErrorMessage('Passwords do not match');
                        //     return;
                        //   }
                        // - Call Server Action:
                        //   const result = await signUp(usernameInput, signupEmail, signupPassword);
                        //   if (result.error) {
                        //     setErrorMessage(result.error);
                        //   }
                        //   // On success, signUp will call redirect('/home')
                        //   // so this code won't be reached
                        //
                        // For now, use mock JWT flow:
                        const mockToken = generateMockJWT();
                        console.log('[LoginPage] Mock token generated')
                        setMockJWT(mockToken);
                        console.log('[LoginPage] Mock token stored, waiting before redirect...')
                        // Wait for next tick to ensure localStorage write completes
                        await new Promise(resolve => setTimeout(resolve, 0));
                        console.log('[LoginPage] Redirecting to /home')
                        router.push('/home');
                      }
                    }
                    onBack={handleBackFromSignup}
                    onLogInClick={handleLogIn}
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
