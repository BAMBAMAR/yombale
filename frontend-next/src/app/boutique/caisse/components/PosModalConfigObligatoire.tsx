'use client'

import React, { useState } from 'react'
import { Shield, AlertTriangle } from 'lucide-react'

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
    if (['1234', '0000', '1111', '9999'].includes(pinObligatoireSuperviseur)) {
      setErreur('Le PIN Superviseur est trop trivial. Choisissez un code complexe.')
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
    <div className="pos-modal-backdrop" style={{ zIndex: 12000 }}>
      <div className="pos-modal-card" style={{ maxWidth: 480, border: '2px solid var(--accent, #C75B00)' }}>
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

        <h2 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
          Sécurisation Obligatoire du POS
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text2, #5A4E42)', lineHeight: 1.45 }}>
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
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••"
              value={pinObligatoireSuperviseur}
              onChange={(e) => setPinObligatoireSuperviseur(e.target.value.replace(/\D/g, ''))}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                border: '1.5px solid var(--accent, #C75B00)',
                fontSize: 20,
                fontWeight: 900,
                letterSpacing: '0.25em',
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            />
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
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••"
              value={pinObligatoireCaissier}
              onChange={(e) => setPinObligatoireCaissier(e.target.value.replace(/\D/g, ''))}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 20,
                fontWeight: 900,
                letterSpacing: '0.25em',
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={validerConfigObligatoire}
          disabled={saving || pinObligatoireSuperviseur.length < 4 || pinObligatoireCaissier.length < 4}
          className="btn-npl btn-npl-lg btn-npl-primary"
          style={{ width: '100%' }}
        >
          {saving ? 'Enregistrement en cours...' : 'Activer la Sécurité & Ouvrir le POS →'}
        </button>
      </div>
    </div>
  )
}
