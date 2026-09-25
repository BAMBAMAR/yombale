'use client'

import React, { useState } from 'react'
import { X, Calendar, DollarSign, Loader2, Save, FileText, CheckCircle2 } from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'
import { BailItem } from './TableBauxImmo'

interface ModalEditerBailProps {
  slug: string
  bail: BailItem
  onClose: () => void
  onSuccess: (message: string) => void
}

export default function ModalEditerBail({ slug, bail, onClose, onSuccess }: ModalEditerBailProps) {
  const [loyerMensuel, setLoyerMensuel] = useState(String(bail.loyer_mensuel || ''))
  const [charges, setCharges] = useState(String(bail.charges || 0))
  const [depotGarantie, setDepotGarantie] = useState(String(bail.depot_garantie || 0))
  const [jourEcheance, setJourEcheance] = useState(5)
  const [dureeMois, setDureeMois] = useState(12)
  const [conditions, setConditions] = useState('')
  const [documentUrl, setDocumentUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`/api/locatif-immo/agence/${slug}/baux/${bail.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getImmoAuthHeaders(),
        },
        body: JSON.stringify({
          loyer_mensuel: parseFloat(loyerMensuel) || 0,
          charges: parseFloat(charges) || 0,
          depot_garantie: parseFloat(depotGarantie) || 0,
          jour_echeance: parseInt(String(jourEcheance), 10) || 5,
          duree_mois: parseInt(String(dureeMois), 10) || 12,
          conditions: conditions.trim() || null,
          document_url: documentUrl.trim() || null,
        }),
      })

      const data = await res.json()
      if (data.success) {
        onSuccess(data.message || 'Contrat de bail mis à jour avec succès.')
        onClose()
      } else {
        setError(data.error || 'Erreur lors de la mise à jour du bail.')
      }
    } catch {
      setError('Impossible de joindre le serveur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 43, 74, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 580,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #FAF8F5 0%, #FFF3E8 100%)',
          }}
        >
          <div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '.05em',
                color: 'var(--accent, #C75B00)',
              }}
            >
              Gestion Locative & ERP
            </span>
            <h3 style={{ margin: '2px 0 0', fontSize: 17, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              Personnaliser le Bail : {bail.bien_titre}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
              Locataire : {bail.locataire_prenom ? `${bail.locataire_prenom} ` : ''}{bail.locataire_nom}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEE2E2', color: '#991B1B', fontSize: 12.5, fontWeight: 700 }}>
              {error}
            </div>
          )}

          {/* Loyer et charges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5, color: 'var(--navy, #1C2B4A)' }}>
                Loyer Mensuel Nu (FCFA) *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  required
                  min="1000"
                  value={loyerMensuel}
                  onChange={e => setLoyerMensuel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 34px',
                    borderRadius: 8,
                    border: '1px solid var(--border, #E8DDD2)',
                    fontSize: 13.5,
                    fontWeight: 800,
                  }}
                />
                <DollarSign size={15} style={{ position: 'absolute', left: 10, top: 12, color: '#94A3B8' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5, color: 'var(--navy, #1C2B4A)' }}>
                Charges Locatives (FCFA)
              </label>
              <input
                type="number"
                min="0"
                value={charges}
                onChange={e => setCharges(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border, #E8DDD2)',
                  fontSize: 13.5,
                  fontWeight: 800,
                }}
              />
            </div>
          </div>

          {/* Dépôt de garantie et jour d'échéance */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5, color: 'var(--navy, #1C2B4A)' }}>
                Dépôt de Garantie (Caution FCFA)
              </label>
              <input
                type="number"
                min="0"
                value={depotGarantie}
                onChange={e => setDepotGarantie(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border, #E8DDD2)',
                  fontSize: 13.5,
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5, color: 'var(--navy, #1C2B4A)' }}>
                Jour d&apos;Échéance du Mois
              </label>
              <select
                value={jourEcheance}
                onChange={e => setJourEcheance(parseInt(e.target.value, 10))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border, #E8DDD2)',
                  fontSize: 13.5,
                  background: '#FFF',
                }}
              >
                <option value={1}>Le 1er du mois</option>
                <option value={5}>Le 5 du mois (standard)</option>
                <option value={10}>Le 10 du mois</option>
                <option value={15}>Le 15 du mois</option>
              </select>
            </div>
          </div>

          {/* Durée ferme */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5, color: 'var(--navy, #1C2B4A)' }}>
              Durée Ferme du Contrat
            </label>
            <select
              value={dureeMois}
              onChange={e => setDureeMois(parseInt(e.target.value, 10))}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 13.5,
                background: '#FFF',
              }}
            >
              <option value={6}>6 mois</option>
              <option value={12}>12 mois (1 an standard)</option>
              <option value={24}>24 mois (2 ans)</option>
              <option value={36}>36 mois (3 ans)</option>
            </select>
          </div>

          {/* Conditions particulières & clauses spéciales imprimées sur le PDF */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5, color: 'var(--navy, #1C2B4A)' }}>
              Conditions Particulières & Clauses Spéciales (Imprimées à l&apos;Article 6 du Bail PDF)
            </label>
            <textarea
              value={conditions}
              onChange={e => setConditions(e.target.value)}
              placeholder="Ex : Animaux admis sous conditions, sous-location strictement interdite, place de parking n° 12 incluse, état des lieux d'entrée contradictoire..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 12.5,
                lineHeight: 1.4,
              }}
            />
            <span style={{ fontSize: 11, color: '#64748B', display: 'block', marginTop: 4 }}>
              Ces clauses personnalisées apparaîtront textuellement dans le contrat de bail officiel COCC généré pour le locataire et le propriétaire.
            </span>
          </div>

          {/* URL du document signé numérisé */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5, color: 'var(--navy, #1C2B4A)' }}>
              Lien du Contrat Numérisé Signé (Optionnel)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={documentUrl}
              onChange={e => setDocumentUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 13,
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                background: '#F1F5F9',
                color: '#64748B',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 18px',
                borderRadius: 8,
                background: 'var(--navy, #1C2B4A)',
                color: '#ffffff',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>{loading ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
