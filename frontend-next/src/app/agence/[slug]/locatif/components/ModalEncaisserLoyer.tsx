'use client'

import React, { useState } from 'react'
import { X, DollarSign, Check, Loader2, FileText } from 'lucide-react'

interface LoyerEcheance {
  id: string
  periode: string
  date_echeance: string
  montant_du: number
  montant_paye: number
  montant_restant: number
  statut: string
  bien_titre: string
  locataire_nom: string
  locataire_prenom?: string
  locataire_tel?: string
}

interface ModalEncaisserLoyerProps {
  slug: string
  loyer: LoyerEcheance
  onClose: () => void
  onSuccess: (message: string, loyerId?: string) => void
}

export default function ModalEncaisserLoyer({
  slug,
  loyer,
  onClose,
  onSuccess,
}: ModalEncaisserLoyerProps) {
  const [montant, setMontant] = useState(
    String(loyer.montant_restant > 0 ? loyer.montant_restant : loyer.montant_du)
  )
  const [modePaiement, setModePaiement] = useState('wave')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const montantNum = parseFloat(montant)
    if (!montantNum || montantNum <= 0) {
      setError('Veuillez saisir un montant supérieur à 0 FCFA.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }

      const res = await fetch(`/api/locatif-immo/agence/${slug}/loyers/${loyer.id}/encaisser`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          montant: montantNum,
          mode_paiement: modePaiement,
        }),
      })

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de l\'encaissement du loyer')
      }

      onSuccess(`Paiement de loyer enregistré avec succès ! Quittance générée : ${data.quittance_reference}`, loyer.id)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28, 43, 74, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 14,
          maxWidth: 460,
          width: '100%',
          padding: 24,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarSign size={20} color="var(--accent, #C75B00)" />
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              Encaisser le loyer — {loyer.periode}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              background: '#FEE2E2',
              color: '#991B1B',
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 16,
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16, padding: 14, background: 'var(--bg, #F8F5F0)', borderRadius: 10, border: '1px solid var(--border, #E8DDD2)' }}>
            <div style={{ fontSize: 13.5, fontWeight: 750, color: 'var(--navy, #1C2B4A)' }}>
              {loyer.bien_titre}
            </div>
            <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>
              Locataire : {loyer.locataire_nom} {loyer.locataire_prenom || ''}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--navy, #1C2B4A)', fontWeight: 700, marginTop: 4 }}>
              Montant total de l'échéance : {Number(loyer.montant_du).toLocaleString('fr-FR')} FCFA
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: 'var(--navy, #1C2B4A)' }}>
              Montant perçu (FCFA) *
            </label>
            <input
              type="number"
              required
              value={montant}
              onChange={e => setMontant(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 15,
                fontWeight: 700,
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: 'var(--navy, #1C2B4A)' }}>
              Moyen d'encaissement *
            </label>
            <select
              value={modePaiement}
              onChange={e => setModePaiement(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 13.5,
                fontWeight: 600,
                background: '#FFF',
              }}
            >
              <option value="wave">Wave Sénégal (Mobile Money)</option>
              <option value="orange_money">Orange Money</option>
              <option value="virement">Virement bancaire</option>
              <option value="especes">Espèces (Reçu de caisse)</option>
              <option value="cheque">Chèque bancaire</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                background: '#FFFFFF',
                border: '1px solid var(--border, #E8DDD2)',
                fontWeight: 650,
                color: '#64748B',
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                background: 'var(--accent, #C75B00)',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 750,
                cursor: saving ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {saving ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
              <span>{saving ? 'Validation...' : 'Valider & Émettre Quittance'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
