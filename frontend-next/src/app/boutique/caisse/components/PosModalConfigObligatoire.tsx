'use client'

import React, { useState } from 'react'
import { Shield, AlertTriangle, Eye, EyeOff, X, ArrowRight, Lock } from 'lucide-react'

interface PosModalConfigObligatoireProps {
  boutiqueId: string
  onClose: () => void
  onSuccess?: () => void
  onRefreshCaissiers: () => void
}

export default function PosModalConfigObligatoire({
  boutiqueId,
  onClose,
  onSuccess,
  onRefreshCaissiers,
}: PosModalConfigObligatoireProps) {
  const [pinObligatoireSuperviseur, setPinObligatoireSuperviseur] = useState('')
  const [pinObligatoireCaissier, setPinObligatoireCaissier] = useState('')
  const [showPinSup, setShowPinSup] = useState(false)
  const [showPinCai, setShowPinCai] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function validerConfigObligatoire() {
    setErreur(null)
    if (!pinObligatoireSuperviseur || pinObligatoireSuperviseur.length < 4) {
      setErreur('Le PIN Superviseur doit comporter entre 4 et 6 chiffres.')
      return
    }
    if (!pinObligatoireCaissier || pinObligatoireCaissier.length < 4) {
      setErreur('Le PIN Caissier doit comporter entre 4 et 6 chiffres.')
      return
    }
    if (['1234', '0000', '1111', '9999', '2222', '3333', '4444', '5555', '6666', '7777', '8888'].includes(pinObligatoireSuperviseur)) {
      setErreur('Le PIN Superviseur est trop trivial. Choisissez un code personnalisé.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/caisse/config-pin-initial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin_superviseur: pinObligatoireSuperviseur,
          pin_caissier: pinObligatoireCaissier,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        onRefreshCaissiers()
        if (onSuccess) onSuccess()
        onClose()
      } else {
        setErreur(data.error || 'Erreur lors de la configuration des PINs.')
      }
    } catch {
      setErreur('Erreur de connexion au serveur.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="pos-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 12000,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 12px',
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="pos-modal-card"
        style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: '28px 20px',
          width: '100%',
          maxWidth: 480,
          border: '2px solid var(--accent, #C75B00)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          boxSizing: 'border-box',
          margin: 'auto',
          position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text2, #5A4E42)',
            padding: 4,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={20} />
        </button>

        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'var(--orange2, #FFF3E8)',
            color: 'var(--accent, #C75B00)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Shield size={28} />
        </div>

        <h2 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 900, color: 'var(--navy, #1C2B4A)', textAlign: 'center' }}>
          Sécurisation Obligatoire du POS
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text2, #5A4E42)', lineHeight: 1.45, textAlign: 'center' }}>
          Pour protéger votre caisse et vos recettes, personnalisez vos <strong>codes PIN secrets</strong> avant de commencer les encaissements.
        </p>

        {erreur && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 700,
              marginBottom: 16,
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#B91C1C',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertTriangle size={16} />
            <span>{erreur}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24, textAlign: 'left' }}>
          <div
            style={{
              background: 'var(--bg, #F8F5F0)',
              padding: 14,
              borderRadius: 12,
              border: '1px solid var(--border, #E8DDD2)',
            }}
          >
            <label style={{ fontSize: 12, color: 'var(--accent, #C75B00)', display: 'block', fontWeight: 800, marginBottom: 4 }}>
              1. Code PIN Gérant / Superviseur (4 à 6 chiffres)
            </label>
            <span style={{ fontSize: 11, color: 'var(--text2, #5A4E42)', display: 'block', marginBottom: 8 }}>
              Autorise les remises, annulations d&apos;articles et clôtures Z.
            </span>
            <div style={{ position: 'relative' }}>
              <input
                type={showPinSup ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={6}
                placeholder="••••"
                value={pinObligatoireSuperviseur}
                onChange={(e) => setPinObligatoireSuperviseur(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  borderRadius: 8,
                  border: '1.5px solid var(--accent, #C75B00)',
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: '0.2em',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPinSup(!showPinSup)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text2, #5A4E42)',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                {showPinSup ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg, #F8F5F0)',
              padding: 14,
              borderRadius: 12,
              border: '1px solid var(--border, #E8DDD2)',
            }}
          >
            <label style={{ fontSize: 12, color: 'var(--navy, #1C2B4A)', display: 'block', fontWeight: 800, marginBottom: 4 }}>
              2. Code PIN Caissier Standard (4 à 6 chiffres)
            </label>
            <span style={{ fontSize: 11, color: 'var(--text2, #5A4E42)', display: 'block', marginBottom: 8 }}>
              Sert au déverrouillage et à la vente quotidienne.
            </span>
            <div style={{ position: 'relative' }}>
              <input
                type={showPinCai ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={6}
                placeholder="••••"
                value={pinObligatoireCaissier}
                onChange={(e) => setPinObligatoireCaissier(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border, #E8DDD2)',
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: '0.2em',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPinCai(!showPinCai)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text2, #5A4E42)',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                {showPinCai ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={validerConfigObligatoire}
          disabled={saving || pinObligatoireSuperviseur.length < 4 || pinObligatoireCaissier.length < 4}
          className="btn-npl btn-npl-lg btn-npl-primary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <span>{saving ? 'Enregistrement en cours...' : 'Activer la Sécurité & Ouvrir le POS'}</span>
          {!saving && <ArrowRight size={16} />}
        </button>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text2, #5A4E42)',
              fontSize: 12,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Configurer plus tard (Continuer avec les codes par défaut)
          </button>
        </div>
      </div>
    </div>
  )
}

