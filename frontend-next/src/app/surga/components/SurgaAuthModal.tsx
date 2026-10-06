'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  User,
  MessageCircle,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Send,
} from 'lucide-react'
import { setAuthCookieAction } from '@/app/actions/auth'
import { synchroniserSurga } from '@/lib/surga-offline-sync'

interface SurgaAuthUser {
  id: string
  nom?: string
  telephone?: string
  email?: string
}

interface SurgaAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (user: SurgaAuthUser) => void
}

type AuthMethod = 'whatsapp' | 'email'
type WaStep = 'phone' | 'otp'

export default function SurgaAuthModal({
  isOpen,
  onClose,
  onSuccess,
}: SurgaAuthModalProps) {
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

  if (!isOpen) return null

  // ── 1. Envoi OTP WhatsApp ──
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

  // ── 2. Vérification OTP WhatsApp ──
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

      // Positionner le cookie de session Next.js
      if (data.token) {
        await setAuthCookieAction(data.token)
        try {
          localStorage.setItem('token', data.token)
        } catch {}
      }

      setSuccessMsg('Connexion réussie. Synchronisation des données...')

      // Synchronisation en tâche de fond des notes/dépenses accumulées en mode invité
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

  // ── 3. Connexion par Email & Mot de passe ──
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: 'rgba(255,255,255,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={18} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Compte &amp; Synchronisation</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                Sauvegardez vos notes, dépenses et accès Surga
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Messages statut */}
          {errorMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                backgroundColor: 'rgba(199, 91, 0, 0.08)',
                border: '1px solid rgba(199, 91, 0, 0.25)',
                color: 'var(--accent, #C75B00)',
                fontSize: 12.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                backgroundColor: 'rgba(10, 92, 54, 0.08)',
                border: '1px solid rgba(10, 92, 54, 0.25)',
                color: 'var(--price, #0A5C36)',
                fontSize: 12.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Onglets Méthode */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg, #F8F5F0)',
              borderRadius: 10,
              padding: 3,
              gap: 4,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMethod('whatsapp')
                setErrorMsg(null)
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: method === 'whatsapp' ? '#FFFFFF' : 'transparent',
                color: method === 'whatsapp' ? 'var(--navy, #1C2B4A)' : 'var(--text3, #73675E)',
                fontWeight: method === 'whatsapp' ? 800 : 500,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: method === 'whatsapp' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <MessageCircle size={14} color={method === 'whatsapp' ? 'var(--price, #0A5C36)' : 'currentColor'} />
              <span>WhatsApp (Recommandé)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod('email')
                setErrorMsg(null)
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: method === 'email' ? '#FFFFFF' : 'transparent',
                color: method === 'email' ? 'var(--navy, #1C2B4A)' : 'var(--text3, #73675E)',
                fontWeight: method === 'email' ? 800 : 500,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: method === 'email' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <Mail size={14} />
              <span>Email &amp; Mot de passe</span>
            </button>
          </div>

          {/* FLUX 1 : WHATSAPP */}
          {method === 'whatsapp' && (
            <>
              {waStep === 'phone' ? (
                <form onSubmit={handleSendWaOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {isRegisterMode && (
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 6 }}>
                        Votre Nom complet
                      </label>
                      <div style={{ position: 'relative' }}>
                        <User size={15} color="var(--text3, #73675E)" style={{ position: 'absolute', left: 12, top: 12 }} />
                        <input
                          type="text"
                          value={nom}
                          onChange={(e) => setNom(e.target.value)}
                          placeholder="Ex: Awa Diop"
                          style={{
                            width: '100%',
                            padding: '10px 14px 10px 36px',
                            borderRadius: 10,
                            border: '1px solid var(--border, #E8DDD2)',
                            fontSize: 13,
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 6 }}>
                      Numéro WhatsApp (+221)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <MessageCircle size={15} color="var(--price, #0A5C36)" style={{ position: 'absolute', left: 12, top: 12 }} />
                      <input
                        type="tel"
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                        placeholder="77 123 45 67"
                        style={{
                          width: '100%',
                          padding: '10px 14px 10px 36px',
                          borderRadius: 10,
                          border: '1px solid var(--border, #E8DDD2)',
                          fontSize: 14,
                          fontWeight: 600,
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="surga-btn-primary"
                    style={{
                      padding: '11px 16px',
                      fontSize: 13,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={15} className="surga-spin" />
                        <span>Envoi du code...</span>
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>{isRegisterMode ? 'Créer mon compte et recevoir le code' : 'Recevoir le code par WhatsApp'}</span>
                      </>
                    )}
                  </button>

                  <div style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterMode(!isRegisterMode)
                        setErrorMsg(null)
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent, #C75B00)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      {isRegisterMode
                        ? 'Déjà un compte ? Se connecter'
                        : 'Nouveau sur Surga ? Créer un compte'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyWaOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 6 }}>
                      Code de validation reçu par WhatsApp
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: '1.5px solid var(--price, #0A5C36)',
                        fontSize: 20,
                        textAlign: 'center',
                        letterSpacing: 6,
                        fontWeight: 800,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="surga-btn-primary"
                    style={{
                      padding: '11px 16px',
                      fontSize: 13,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={15} className="surga-spin" />
                        <span>Vérification...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Valider et synchroniser</span>
                      </>
                    )}
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <button
                      type="button"
                      onClick={() => setWaStep('phone')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text3, #73675E)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <ArrowLeft size={13} />
                      <span>Modifier numéro</span>
                    </button>

                    <button
                      type="button"
                      disabled={resendTimer > 0 || loading}
                      onClick={() => handleSendWaOtp()}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: resendTimer > 0 ? 'var(--text3, #73675E)' : 'var(--accent, #C75B00)',
                        cursor: resendTimer > 0 ? 'not-allowed' : 'pointer',
                        fontWeight: 700,
                        textDecoration: resendTimer > 0 ? 'none' : 'underline',
                      }}
                    >
                      {resendTimer > 0 ? `Renvoyer (${resendTimer}s)` : 'Renvoyer le code'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* FLUX 2 : EMAIL */}
          {method === 'email' && (
            <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 6 }}>
                  Adresse Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} color="var(--text3, #73675E)" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 36px',
                      borderRadius: 10,
                      border: '1px solid var(--border, #E8DDD2)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 6 }}>
                  Mot de passe
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="var(--text3, #73675E)" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 36px',
                      borderRadius: 10,
                      border: '1px solid var(--border, #E8DDD2)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="surga-btn-primary"
                style={{
                  padding: '11px 16px',
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={15} className="surga-spin" />
                    <span>Connexion...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight size={15} />
                    <span>Se connecter</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
