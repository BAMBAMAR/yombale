'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Phone,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  Loader2,
  Lock,
  LogOut,
} from 'lucide-react'
import BailLocataireCard, { type BailLocataireItem } from './BailLocataireCard'
import PortailOtpCard from './PortailOtpCard'

export default function PortailLocataireClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTel = searchParams.get('tel') || ''

  const [inputVal, setInputVal] = useState(initialTel)
  const [step, setStep] = useState<'tel' | 'otp' | 'verified'>('tel')
  const [telephoneMasque, setTelephoneMasque] = useState('')
  const [verifiedPhone, setVerifiedPhone] = useState('')
  const [devCode, setDevCode] = useState<string | undefined>(undefined)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isVerifyingRef = useRef(false)
  const [locataireInfo, setLocataireInfo] = useState<{
    nom: string
    prenom: string
    telephone: string
    whatsapp?: string
  } | null>(null)
  const [baux, setBaux] = useState<BailLocataireItem[]>([])

  // Demander un code OTP WhatsApp
  async function handleDemanderOtp(telTarget: string) {
    const cleanPh = telTarget.replace(/\D/g, '')
    if (cleanPh.length < 8) {
      setError('Veuillez saisir un numéro de téléphone valide (ex : 77 123 45 67).')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/locatif-immo/public/demander-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tel: cleanPh }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de l\'envoi du code.')
      }

      setTelephoneMasque(data.telephoneMasque || cleanPh)
      setVerifiedPhone(data.telephone || cleanPh)
      setDevCode(data.dev_code)
      setStep('otp')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  // Valider le code OTP WhatsApp
  async function handleValiderOtp(code: string) {
    if (isVerifyingRef.current) return
    isVerifyingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/locatif-immo/public/verifier-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tel: verifiedPhone || inputVal, code }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Code de sécurité invalide.')
      }

      if (data.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('token_immo', data.token)
      }

      setLocataireInfo(data.locataire)
      setBaux(data.baux || [])
      setStep('verified')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Code incorrect ou expiré')
    } finally {
      setLoading(false)
      isVerifyingRef.current = false
    }
  }

  // Rechargement des baux sans redemander l'OTP
  async function handleRefreshBaux() {
    if (!verifiedPhone) return
    try {
      const token = localStorage.getItem('token_immo') || localStorage.getItem('token')
      const cleanPh = verifiedPhone.replace(/\D/g, '')
      const shortPh = cleanPh.length >= 9 ? cleanPh.slice(-9) : cleanPh
      const res = await fetch(`/api/locatif-immo/public/locataire-lookup?tel=${encodeURIComponent(shortPh)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success && data.baux) {
        setBaux(data.baux)
      }
    } catch (e) {
      console.warn('[handleRefreshBaux]', e)
    }
  }

  function handleReset() {
    setStep('tel')
    setError(null)
    setBaux([])
    setLocataireInfo(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = inputVal.trim()
    if (!clean) {
      setError('Veuillez saisir votre numéro de téléphone ou votre code échéance.')
      return
    }

    const onlyDigits = clean.replace(/\D/g, '')
    const isPhone = onlyDigits.length >= 8 && (clean.startsWith('+') || clean.startsWith('7') || clean.startsWith('221') || clean.startsWith('33'))

    if (!isPhone && (clean.includes('-') || clean.length > 15 || /[a-zA-Z]/.test(clean))) {
      router.push(`/payer-loyer/${encodeURIComponent(clean)}`)
      return
    }

    handleDemanderOtp(clean)
  }

  return (
    <div>
      {/* Étape 1 : Formulaire Numéro de téléphone */}
      {step === 'tel' && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 18,
            padding: '24px 20px',
            border: '1px solid var(--border, #E8DDD2)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            marginBottom: 24,
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <label
                htmlFor="locataire-input"
                style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}
              >
                Votre numéro de téléphone (WhatsApp) :
              </label>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--price, #0A5C36)',
                  background: '#DCFCE7',
                  padding: '2px 8px',
                  borderRadius: 6,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <ShieldCheck size={12} />
                <span>Sécurité OTP WhatsApp</span>
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1 1 240px' }}>
                <Phone
                  size={16}
                  color="var(--text-subtle, #5A4E42)"
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  id="locataire-input"
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Ex : 77 123 45 67 ou 78 169 03 79"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px 12px 38px',
                    borderRadius: 10,
                    border: '1.5px solid var(--border, #E8DDD2)',
                    fontSize: 14,
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'var(--price, #0A5C36)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px 22px',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Envoi du code...</span>
                  </>
                ) : (
                  <>
                    <Lock size={15} />
                    <span>Vérifier par Code WhatsApp</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>

            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#991B1B',
                  fontSize: 12.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <p style={{ margin: 0, fontSize: 11.5, color: '#64748B', lineHeight: 1.45 }}>
              Par mesure de protection de vos données personnelles (contrat de bail et pièces d&apos;identité), un code secret vous sera envoyé gratuitement sur votre compte WhatsApp.
            </p>
          </form>
        </div>
      )}

      {/* Étape 2 : Saisie du code OTP WhatsApp */}
      {step === 'otp' && (
        <PortailOtpCard
          telephoneMasque={telephoneMasque}
          devCode={devCode}
          loading={loading}
          error={error}
          onValiderOtp={handleValiderOtp}
          onRenvoyerOtp={() => handleDemanderOtp(verifiedPhone || inputVal)}
          onChangePhone={handleReset}
        />
      )}

      {/* Étape 3 : Session Validée & Affichage des baux */}
      {step === 'verified' && locataireInfo && baux.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          {/* Bandeau de session sécurisée */}
          <div
            style={{
              background: '#F0FDF4',
              border: '1.5px solid #86EFAC',
              borderRadius: 14,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'var(--price, #0A5C36)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UserCheck size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--price, #0A5C36)', textTransform: 'uppercase' }}>
                    Session Sécurisée Vérifiée
                  </span>
                  <ShieldCheck size={13} color="var(--price, #0A5C36)" />
                </div>
                <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                  {locataireInfo.prenom ? `${locataireInfo.prenom} ` : ''}{locataireInfo.nom}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: '#166534', fontWeight: 700 }}>
                {baux.length} contrat(s) actif(s)
              </span>
              <button
                type="button"
                onClick={handleReset}
                title="Déconnexion de cette session"
                style={{
                  background: 'none',
                  border: '1px solid #BBF7D0',
                  borderRadius: 6,
                  padding: '4px 8px',
                  color: '#166534',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <LogOut size={12} />
                <span>Quitter</span>
              </button>
            </div>
          </div>

          {/* Cartes des baux avec signatures et pièces déverrouillées */}
          {baux.map((bail) => (
            <BailLocataireCard
              key={bail.id}
              bail={bail}
              tenantPhone={verifiedPhone || locataireInfo.telephone || inputVal}
              onRefresh={handleRefreshBaux}
            />
          ))}
        </div>
      )}
    </div>
  )
}
