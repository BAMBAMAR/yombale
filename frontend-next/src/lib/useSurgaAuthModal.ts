'use client'

import { useState, useEffect } from 'react'
import { setAuthCookieAction } from '@/app/actions/auth'
import { synchroniserSurga } from '@/lib/surga-offline-sync'

export interface SurgaAuthUser {
  id: string
  nom?: string
  telephone?: string
  email?: string
}

export type AuthMethod = 'whatsapp' | 'email'
export type WaStep = 'phone' | 'otp'

interface UseSurgaAuthModalOptions {
  isOpen: boolean
  onSuccess: (user: SurgaAuthUser) => void
  onClose: () => void
}

export function useSurgaAuthModal({
  isOpen,
  onSuccess,
  onClose,
}: UseSurgaAuthModalOptions) {
  const [method, setMethod] = useState<AuthMethod>('whatsapp')
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false)

  // Champs WhatsApp
  const [waStep, setWaStep] = useState<WaStep>('phone')
  const [telephone, setTelephone] = useState<string>('')
  const [nom, setNom] = useState<string>('')
  const [otpCode, setOtpCode] = useState<string>('')
  const [resendTimer, setResendTimer] = useState<number>(0)

  // Champs Email
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  // États de chargement et retours
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Minuteur de renvoi OTP
  useEffect(() => {
    if (resendTimer <= 0) return
    const interval = setInterval(() => {
      setResendTimer((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [resendTimer])

  // Réinitialiser les champs à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null)
      setSuccessMsg(null)
      setOtpCode('')
      setWaStep('phone')
    }
  }, [isOpen])

  // 1. Envoi OTP WhatsApp
  const handleSendWaOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    const cleaned = telephone.replace(/\s+/g, '').replace(/[^\d+]/g, '')
    if (cleaned.length < 8) {
      setErrorMsg('Veuillez renseigner un numéro de téléphone valide.')
      return
    }

    if (isRegisterMode && !nom.trim()) {
      setErrorMsg('Veuillez renseigner votre nom pour créer un compte.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/whatsapp-otp-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telephone: cleaned,
          type: isRegisterMode ? 'register' : 'login',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.code === 'ACCOUNT_NOT_FOUND' || res.status === 404) {
          setIsRegisterMode(true)
          setErrorMsg('Aucun compte trouvé avec ce numéro. Entrez votre nom pour créer votre compte en 1 clic.')
          return
        }
        throw new Error(data.error || 'Impossible d envoyer le code.')
      }

      setWaStep('otp')
      setResendTimer(45)
      setSuccessMsg('Code de vérification envoyé sur votre WhatsApp.')
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur de connexion au service WhatsApp.')
    } finally {
      setLoading(false)
    }
  }

  // 2. Vérification OTP WhatsApp
  const handleVerifyWaOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (otpCode.trim().length < 4) {
      setErrorMsg('Veuillez saisir le code reçu par WhatsApp.')
      return
    }

    const cleaned = telephone.replace(/\s+/g, '').replace(/[^\d+]/g, '')
    setLoading(true)

    try {
      const endpoint = isRegisterMode
        ? '/api/auth/whatsapp-otp-register'
        : '/api/auth/whatsapp-otp-login'

      const bodyPayload = isRegisterMode
        ? { telephone: cleaned, code: otpCode.trim(), nom: nom.trim() }
        : { telephone: cleaned, code: otpCode.trim() }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Code invalide ou expiré.')
      }

      if (data.token) {
        await setAuthCookieAction(data.token)
        try {
          localStorage.setItem('token', data.token)
        } catch {}
      }

      setSuccessMsg('Connexion réussie. Synchronisation des données...')

      try {
        await synchroniserSurga()
      } catch {}

      const authUser: SurgaAuthUser = {
        id: data.user.id,
        nom: data.user.nom,
        telephone: data.user.telephone,
        email: data.user.email,
      }

      setTimeout(() => {
        onSuccess(authUser)
        onClose()
      }, 700)
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la validation du code.')
    } finally {
      setLoading(false)
    }
  }

  // 3. Connexion Email
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!email.trim() || !password) {
      setErrorMsg('Veuillez renseigner votre email et mot de passe.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/connexion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          mot_de_passe: password,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Identifiants invalides.')
      }

      if (data.token) {
        await setAuthCookieAction(data.token)
        try {
          localStorage.setItem('token', data.token)
        } catch {}
      }

      setSuccessMsg('Connexion réussie.')
      try {
        await synchroniserSurga()
      } catch {}

      const authUser: SurgaAuthUser = {
        id: data.user.id,
        nom: data.user.nom,
        telephone: data.user.telephone,
        email: data.user.email,
      }

      setTimeout(() => {
        onSuccess(authUser)
        onClose()
      }, 700)
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur de connexion.')
    } finally {
      setLoading(false)
    }
  }

  return {
    method,
    setMethod,
    isRegisterMode,
    setIsRegisterMode,
    waStep,
    setWaStep,
    telephone,
    setTelephone,
    nom,
    setNom,
    otpCode,
    setOtpCode,
    resendTimer,
    email,
    setEmail,
    password,
    setPassword,
    loading,
    errorMsg,
    setErrorMsg,
    successMsg,
    handleSendWaOtp,
    handleVerifyWaOtp,
    handleEmailLogin,
  }
}
