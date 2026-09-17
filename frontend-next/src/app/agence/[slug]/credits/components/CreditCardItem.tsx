'use client'

import React, { useState } from 'react'
import { Check, MessageCircle, Zap, Loader2 } from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'
import { showToast } from '@/context/ToastContext'

export interface EcheanceItem {
  numero: number
  date_echeance: string
  montant: number
  statut: string
  montant_paye?: number
  date_paiement?: string
}

export interface CreditItem {
  id: string
  type_credit: string
  beneficiaire_nom: string
  beneficiaire_tel?: string
  bien_titre?: string
  montant_total: number
  apport_initial: number
  solde_restant: number
  nb_echeances: number
  frequence: string
  statut: string
  echeances: EcheanceItem[]
  notes?: string
}

interface CreditCardItemProps {
  slug: string
  credit: CreditItem
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onEncaisserEcheance: (creditId: string, numero: number, montant: number) => void
  encaissementId: string | null
}

export function CreditCardItem({
  slug,
  credit: cr,
  isSelected,
  onToggleSelect,
  onEncaisserEcheance,
  encaissementId,
}: CreditCardItemProps) {
  const [loadingWaveEch, setLoadingWaveEch] = useState<number | null>(null)

  async function handleSendWaveLink(numero: number) {
    try {
      setLoadingWaveEch(numero)
      const res = await fetch(`/api/credits-immo/agence/${slug}/${cr.id}/echeances/${numero}/wave-link`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
      })
      const json = await res.json()
      if (res.ok && json.success && json.wave_url) {
        const tel = (cr.beneficiaire_tel || '').replace(/\D/g, '')
        const cleanTel = tel.length === 9 ? `221${tel}` : tel
        const msg = (
          `Bonjour ${cr.beneficiaire_nom} !\n\n` +
          `Voici le rappel pour votre échéance #${numero} d'un montant de *${Number(json.montant).toLocaleString('fr-FR')} FCFA* (${cr.bien_titre || 'financement'}).\n\n` +
          `👉 *Réglez directement en 1 clic par Wave sécurisé :*\n` +
          `${json.wave_url}\n\n` +
          `_Votre quittance numérique est délivrée immédiatement dès confirmation Wave._\n\n` +
          `Cordialement,\nVotre agence`
        )
        const waUrl = cleanTel
          ? `https://wa.me/${cleanTel}?text=${encodeURIComponent(msg)}`
          : `https://wa.me/?text=${encodeURIComponent(msg)}`
        showToast('Lien de paiement Wave envoyé sur WhatsApp.', 'success', 'Paiement Wave')
      } else {
        showToast(json.error || 'Erreur lors de la génération du lien Wave', 'error', 'Paiement Wave')
      }
    } catch (e) {
      console.error(e)
      showToast('Erreur réseau lors de la génération du lien Wave', 'error')
    } finally {
      setLoadingWaveEch(null)
    }
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        border: isSelected ? '2px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: isSelected ? '0 4px 12px rgba(199, 91, 0, 0.1)' : '0 1px 3px rgba(28, 43, 74, 0.04)',
        transition: 'all 0.15s ease',
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(cr.id)}
              className="immo-checkbox"
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                padding: '3px 8px',
                borderRadius: 4,
                background: '#E0F2FE',
                color: '#0369A1',
              }}
            >
              {cr.type_credit.replace(/_/g, ' ')}
            </span>
          </div>

          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 4,
              background: cr.statut === 'solde' ? '#f0fdf4' : '#fef3c7',
              color: cr.statut === 'solde' ? '#166534' : '#92400e',
            }}
          >
            {cr.statut === 'solde' ? 'Soldé' : 'En cours'}
          </span>
        </div>

        <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 15, marginBottom: 2 }}>
          {cr.beneficiaire_nom}
        </div>
        {cr.bien_titre && (
          <div style={{ fontSize: 12, color: 'var(--accent, #C75B00)', fontWeight: 600, marginBottom: 4 }}>
            {cr.bien_titre}
          </div>
        )}
        {cr.beneficiaire_tel && (
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>
            Tél : {cr.beneficiaire_tel}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
          <span style={{ color: '#64748B' }}>Montant total :</span>
          <span style={{ fontWeight: 700 }}>{Number(cr.montant_total).toLocaleString('fr-FR')} FCFA</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
          <span style={{ color: '#64748B' }}>Apport initial :</span>
          <span style={{ fontWeight: 700, color: '#166534' }}>{Number(cr.apport_initial).toLocaleString('fr-FR')} FCFA</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 12 }}>
          <span style={{ color: '#64748B' }}>Solde restant :</span>
          <span style={{ fontWeight: 800, color: cr.solde_restant > 0 ? '#DC2626' : '#166534' }}>
            {Number(cr.solde_restant).toLocaleString('fr-FR')} FCFA
          </span>
        </div>

        {/* Échéancier détaillé */}
        <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
            Échéances ({cr.echeances?.length || 0})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {cr.echeances?.map((ech) => (
              <div
                key={ech.numero}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 10px',
                  background: ech.statut === 'paye' ? '#F0FDF4' : '#F8FAFC',
                  borderRadius: 6,
                  fontSize: 12,
                }}
              >
                <div>
                  <span style={{ fontWeight: 700 }}>#{ech.numero}</span> · {new Date(ech.date_echeance).toLocaleDateString('fr-FR')}
                  <div style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                    {Number(ech.montant).toLocaleString('fr-FR')} FCFA
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {ech.statut === 'paye' ? (
                    <span style={{ color: '#166534', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Check size={13} /> Payé
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSendWaveLink(ech.numero)}
                        disabled={loadingWaveEch === ech.numero}
                        title="Envoyer le lien Wave par WhatsApp"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                          background: '#E0F2FE',
                          color: '#0369A1',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        {loadingWaveEch === ech.numero ? (
                          <Loader2 size={12} className="spin-animate" />
                        ) : (
                          <Zap size={12} />
                        )}
                        <span>Lien Wave</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onEncaisserEcheance(cr.id, ech.numero, ech.montant)}
                        disabled={encaissementId === `${cr.id}-${ech.numero}`}
                        style={{
                          padding: '4px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                          background: 'var(--accent, #C75B00)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        Encaisser
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {cr.beneficiaire_tel && (
        <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
          <a
            href={`https://wa.me/${cr.beneficiaire_tel.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${cr.beneficiaire_nom}, rappel de votre financement ${cr.bien_titre ? `pour ${cr.bien_titre}` : ''} : solde restant de ${Number(cr.solde_restant).toLocaleString('fr-FR')} FCFA.`)}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              width: '100%',
              padding: '7px 0',
              background: '#25D366',
              color: '#fff',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <MessageCircle size={14} />
            <span>Relance Globale WhatsApp</span>
          </a>
        </div>
      )}
    </div>
  )
}

export default CreditCardItem
