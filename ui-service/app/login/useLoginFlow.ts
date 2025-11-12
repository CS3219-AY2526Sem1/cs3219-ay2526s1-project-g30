'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { requestPasswordReset } from '@/app/actions/auth'

export type ViewState =
  | 'email-entry'
  | 'password-auth'
  | 'signup'
  | 'otp-verification'
  | 'signup-complete'
  | 'reset-password'

interface LoginFlowState {
  currentView: ViewState
  emailInput: string
  passwordInput: string
  usernameInput: string
  signupEmail: string
  signupPassword: string
  signupPasswordConfirm: string
  storedEmail: string
  storedPassword: string
  isPending: boolean
}

export function useLoginFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const getInitialView = (): ViewState => {
    const step = searchParams.get('step')
    if (step === 'reset-password') return 'reset-password'
    return 'email-entry'
  }

  const getInitialEmail = (): string => {
    const step = searchParams.get('step')
    const email = searchParams.get('email')
    if (step === 'reset-password' && email) {
      return decodeURIComponent(email)
    }
    return ''
  }

  const [state, setState] = useState<LoginFlowState>({
    currentView: getInitialView(),
    emailInput: '',
    passwordInput: '',
    usernameInput: '',
    signupEmail: '',
    signupPassword: '',
    signupPasswordConfirm: '',
    storedEmail: getInitialEmail(),
    storedPassword: '',
    isPending: false,
  })

  useEffect(() => {
    const step = searchParams.get('step')
    if (step) {
      window.history.replaceState({}, '', '/login')
    }
  }, [searchParams])

  const setCurrentView = (view: ViewState) =>
    setState((prev) => ({ ...prev, currentView: view }))

  const setField = <K extends keyof LoginFlowState>(key: K, value: LoginFlowState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  const handleContinueEmail = () => {
    if (state.emailInput.trim()) {
      setState((prev) => ({
        ...prev,
        storedEmail: prev.emailInput,
        currentView: 'password-auth',
      }))
    }
  }

  const handleBackFromPassword = () => {
    setState((prev) => ({
      ...prev,
      currentView: 'email-entry',
      passwordInput: '',
    }))
  }

  const handleBackFromSignup = () => {
    setState((prev) => ({
      ...prev,
      currentView: 'email-entry',
      usernameInput: '',
      signupEmail: '',
      signupPassword: '',
      signupPasswordConfirm: '',
      storedPassword: '',
    }))
  }

  const handleBackFromOtpVerification = () => {
    setCurrentView('signup')
  }

  const handleOtpVerified = () => {
    setCurrentView('signup-complete')
  }

  const handleSignupComplete = () => {
    router.refresh()
    router.push('/home')
  }
 
  const handleSkipSignupComplete = () => {
    router.refresh()
    router.push('/home')
  }


  const handleBackFromSignupComplete = () => {
    setCurrentView('otp-verification')
  }

  const handleInitiateResetPassword = () => {
    if (!state.storedEmail) return
    const formData = new FormData()
    formData.set('email', state.storedEmail)
    startTransition(async () => {
      const result = await requestPasswordReset(undefined, formData)
      if (result?.success) {
        setCurrentView('reset-password')
      }
    })
  }

  const handleBackFromResetPassword = () => {
    setCurrentView('password-auth')
  }

  const handlePasswordReset = () => {
    setState({
      currentView: 'email-entry',
      emailInput: '',
      passwordInput: '',
      usernameInput: '',
      signupEmail: '',
      signupPassword: '',
      signupPasswordConfirm: '',
      storedEmail: '',
      storedPassword: '',
      isPending,
    })
  }

  const handleSignUp = () => {
    setCurrentView('signup')
  }

  const handleLogIn = () => {
    setCurrentView('email-entry')
  }

  const handleSignupInitiated = (email: string, password: string) => {
    if (email.trim()) {
      setState((prev) => ({
        ...prev,
        storedEmail: email,
        storedPassword: password,
        currentView: 'otp-verification',
      }))
    }
  }

  return {
    state: { ...state, isPending },
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
  }
}
