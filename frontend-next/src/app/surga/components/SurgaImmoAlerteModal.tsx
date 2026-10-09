'use client'

import React, { useState } from 'react'
import { X, Bell, Check, Building2, MapPin, DollarSign } from 'lucide-react'

interface SurgaImmoAlerteModalProps {
  isOpen: boolean
  onClose: () => void
  onAlerteCreee: (alerte: any) => void
  quartiers: string[]
  criteresInitiaux?: {
    typeBien?: string | null
    transaction?: string | null
    quartier?: string | null
    prixMax?: number | null
    meuble?: boolean | null
  }
}

export default function SurgaImmoAlerteModal({
  isOpen,
  onClose,
  onAlerteCreee,
  quartiers,
  criteresInitiaux,
}: SurgaImmoAlerteModalProps) {
  const [titre, setTitre] = useState<string>(
    criteresInitiaux?.typeBien
      ? `${criteresInitiaux.typeBien.toUpperCase()} ${criteresInitiaux.quartier || 'Dakar'}`
      : 'Veille Immobilière Dakar'
  )
  const [typeBien, setTypeBien] = useState<string>(criteresInitiaux?.typeBien || 'tous')
  const [transaction, setTransaction] = useState<string>(criteresInitiaux?.transaction || 'location')
  const [quartier, setQuartier] = useState<string>(criteresInitiaux?.quartier || '')
  const [prixMax, setPrixMax] = useState<string>(
    criteresInitiaux?.prixMax ? String(criteresInitiaux.prixMax) : ''
  )
  const [meuble, setMeuble] = useState<string>('indifferent')
  const [loading, setLoading] = useState<boolean>(false)
  const [erreur, setErreur] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titre.trim()) {
      setErreur('Veuillez donner un nom à votre alerte.')
      return
    }

    setLoading(true)
    setErreur(null)

    try {
      const payload = {
        titre: titre.trim(),
        type_bien: typeBien,
        transaction,
        quartier: quartier || null,
        prix_max: prixMax ? parseInt(prixMax, 10) : null,
        meuble: meuble === 'oui' ? true : meuble === 'non' ? false : null,
      }

      const res = await fetch('/api/surga/immo/alertes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (data.success && data.alerte) {
        onAlerteCreee(data.alerte)
        onClose()
      } else {
        setErreur(data.error || 'Erreur lors de la création de l alerte')
      }
    } catch (err: any) {
      setErreur('Impossible de joindre le serveur. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 43, 74, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          backgroundColor: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid var(--border, #E8DDD2)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--bg, #F8F5F0)',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: 'rgba(199, 91, 0, 0.1)',
                color: 'var(--surga-accent-ink, #A64B08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={16} />
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              Créer une alerte immobilière
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre d alerte"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text3, #73675E)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {erreur && (
            <div style={{ padding: '8px 12px', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: 8, fontSize: 12 }}>
              {erreur}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
              Nom de l alerte
            </label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex: Studio Almadies max 300k"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 13,
                outline: 'none',
              }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
                Type de transaction
              </label>
              <select
                value={transaction}
                onChange={(e) => setTransaction(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--border, #E8DDD2)',
                  fontSize: 13,
                  backgroundColor: '#FFFFFF',
                }}
              >
                <option value="location">Location</option>
                <option value="vente">Vente</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
                Type de bien
              </label>
              <select
                value={typeBien}
                onChange={(e) => setTypeBien(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--border, #E8DDD2)',
                  fontSize: 13,
                  backgroundColor: '#FFFFFF',
                }}
              >
                <option value="tous">Tous les types</option>
                <option value="appartement">Appartement</option>
                <option value="studio">Studio</option>
                <option value="villa">Villa</option>
                <option value="terrain">Terrain</option>
                <option value="bureau">Bureau</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
                Quartier Dakar
              </label>
              <select
                value={quartier}
                onChange={(e) => setQuartier(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--border, #E8DDD2)',
                  fontSize: 13,
                  backgroundColor: '#FFFFFF',
                }}
              >
                <option value="">Tous les quartiers</option>
                {quartiers.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
                Budget max (FCFA)
              </label>
              <input
                type="number"
                value={prixMax}
                onChange={(e) => setPrixMax(e.target.value)}
                placeholder="Ex: 350000"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--border, #E8DDD2)',
                  fontSize: 13,
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
              Mobilier
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { id: 'indifferent', label: 'Indifférent' },
                { id: 'oui', label: 'Meublé' },
                { id: 'non', label: 'Vide' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMeuble(opt.id)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: meuble === opt.id ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
                    backgroundColor: meuble === opt.id ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
                    color: meuble === opt.id ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text3, #73675E)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
            Vos critères sont enregistrés pour retrouver les biens correspondants. Surga n’envoie pas encore de notification à la mise en ligne d’un bien.
          </p>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                backgroundColor: 'transparent',
                color: 'var(--text2, #5A4E42)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '10px 14px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: 'var(--accent, #C75B00)',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              <Check size={14} />
              <span>{loading ? 'Activation...' : 'Activer l alerte'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
