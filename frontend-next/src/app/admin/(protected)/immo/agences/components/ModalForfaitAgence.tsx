'use client'

import React, { useState, useEffect } from 'react'
import { X, Crown, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'
import { adminChangerForfaitAgence } from '@/app/actions/admin/admin-immo'
import { showToast } from '@/context/ToastContext'

interface ModalForfaitAgenceProps {
  isOpen: boolean
  onClose: () => void
  agence: any | null
  onSuccess: (updatedAgence: any) => void
}

export default function ModalForfaitAgence({
  isOpen,
  onClose,
  agence,
  onSuccess,
}: ModalForfaitAgenceProps) {
  const [plan, setPlan] = useState<string>('immo_essentiel')
  const [sponsorise, setSponsorise] = useState<boolean>(false)
  const [joursSponsoring, setJoursSponsoring] = useState<number>(30)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    if (agence) {
      setPlan(agence.abonnement_plan || 'immo_essentiel')
      setSponsorise(Boolean(agence.sponsorise))
      setJoursSponsoring(30)
    }
  }, [agence])

  if (!isOpen || !agence) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await adminChangerForfaitAgence(agence.id, {
        abonnement_plan: plan,
        sponsorise,
        jours_sponsoring: sponsorise ? joursSponsoring : 0,
      })

      if (res.success && res.agence) {
        showToast(
          `Le forfait de l'agence "${agence.nom}" a été mis à jour avec succès.`,
          'success',
          'Gestion Forfait Agence'
        )
        onSuccess(res.agence)
        onClose()
      } else {
        showToast(res.error || 'Erreur lors de la mise à jour du forfait', 'error', 'Gestion Forfait Agence')
      }
    } catch (err: any) {
      showToast(err.message || 'Erreur réseau', 'error', 'Gestion Forfait Agence')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: 16,
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: 24,
          maxWidth: 500,
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
          border: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
              <Crown size={16} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                Forfait & Visibilité Agence
              </h2>
              <div style={{ fontSize: 12, color: 'var(--text3, #64748b)' }}>{agence.nom}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Sélection du Plan */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy, #1C2B4A)', marginBottom: 6 }}>
              Formule d&apos;abonnement
            </label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--navy, #1C2B4A)',
                background: '#fff',
                outline: 'none',
              }}
            >
              <option value="immo_essentiel">Plan Agence Essentiel (Inclus / Gratuit)</option>
              <option value="immo_pro">Plan Agence Pro & Croissance (10 000 FCFA/mois)</option>
              <option value="immo_multi_agence">Option Réseau Multi-Agences (15 000 FCFA/mois)</option>
            </select>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: '#64748b' }}>
              Définit le plafond d&apos;agents négociateurs, les fonctionnalités d&apos;export comptable et la gestion multi-succursales.
            </p>
          </div>

          {/* Option Sponsoring & Mise en Avant */}
          <div style={{ background: '#fafafa', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={sponsorise}
                onChange={(e) => setSponsorise(e.target.checked)}
              />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color="#f59e0b" />
                Badge doré &quot;En Vedette&quot; (Sponsoring)
              </span>
            </label>

            {sponsorise && (
              <div style={{ marginTop: 12, paddingLeft: 22 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Durée de validité (jours)
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={joursSponsoring}
                  onChange={(e) => setJoursSponsoring(Math.max(1, parseInt(e.target.value, 10) || 30))}
                  style={{
                    width: 120,
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                />
                {agence.sponsoring_expire_le && (
                  <p style={{ margin: '6px 0 0', fontSize: 11, color: '#64748b' }}>
                    Expiration actuelle : {new Date(agence.sponsoring_expire_le).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                color: '#475569',
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 18px',
                borderRadius: 6,
                border: 'none',
                background: 'var(--navy, #1C2B4A)',
                color: '#ffffff',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              {loading ? 'Enregistrement...' : 'Valider les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
