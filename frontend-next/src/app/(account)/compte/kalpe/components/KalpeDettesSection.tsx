'use client'

import React, { useState } from 'react'
import {
  BookOpen,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  ExternalLink,
  DollarSign,
} from 'lucide-react'
import type { KalpeDette } from '../types'
import { relancerKalpeDetteWhatsApp } from '../actions'
import { showToast } from '@/context/ToastContext'

interface KalpeDettesSectionProps {
  dettes: KalpeDette[]
  loading: boolean
  onAddDette: () => void
  onRembourser: (dette: KalpeDette) => void
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n)
}

export default function KalpeDettesSection({
  dettes,
  loading,
  onAddDette,
  onRembourser,
}: KalpeDettesSectionProps) {
  const [activeTab, setActiveTab] = useState<'a_recevoir' | 'a_payer'>('a_recevoir')
  const [relanceLoading, setRelanceLoading] = useState<string | null>(null)

  const filteredDettes = dettes.filter((d) => d.direction === activeTab)
  const totalRestant = filteredDettes.reduce((sum, d) => sum + (d.statut !== 'solde' ? Number(d.montant_restant) : 0), 0)

  const handleRelancer = async (dette: KalpeDette) => {
    setRelanceLoading(dette.id)
    try {
      const res = await relancerKalpeDetteWhatsApp(dette.id)
      if (res.success && res.whatsapp_url) {
        window.open(res.whatsapp_url, '_blank')
        showToast('Relance WhatsApp prête à l’envoi !', 'success', 'Relance Wave')
      } else {
        showToast(res.error || 'Numéro de téléphone manquant pour WhatsApp.', 'warning', 'Relance')
      }
    } catch {
      showToast('Erreur lors de la génération de la relance.', 'error', 'Erreur')
    } finally {
      setRelanceLoading(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Barre d'onglets de direction */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F1F5F9', padding: 3, borderRadius: 10 }}>
          <button
            type="button"
            onClick={() => setActiveTab('a_recevoir')}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'a_recevoir' ? '#ffffff' : 'transparent',
              color: activeTab === 'a_recevoir' ? 'var(--navy, #1C2B4A)' : '#64748B',
              boxShadow: activeTab === 'a_recevoir' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            On me doit (Créances)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('a_payer')}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'a_payer' ? '#ffffff' : 'transparent',
              color: activeTab === 'a_payer' ? 'var(--navy, #1C2B4A)' : '#64748B',
              boxShadow: activeTab === 'a_payer' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            Je dois (Dettes)
          </button>
        </div>

        <button
          type="button"
          onClick={onAddDette}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            fontSize: 12,
            fontWeight: 800,
            borderRadius: 10,
            border: 'none',
            background: 'var(--navy, #1C2B4A)',
            color: '#ffffff',
            cursor: 'pointer',
          }}
        >
          <Plus size={15} strokeWidth={2.4} />
          <span>+ Noter {activeTab === 'a_recevoir' ? 'une créance' : 'une dette'}</span>
        </button>
      </div>

      {/* Résumé de l'encours */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderRadius: 12,
          background: '#ffffff',
          border: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
            {activeTab === 'a_recevoir' ? 'Total à recevoir' : 'Total à régler'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
            {fmt(totalRestant)} FCFA
          </div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>
          {filteredDettes.filter((d) => d.statut !== 'solde').length} dossier(s) en cours
        </div>
      </div>

      {/* Liste des fiches dettes */}
      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: 13, fontWeight: 600 }}>
          Chargement des dettes...
        </div>
      ) : filteredDettes.length === 0 ? (
        <div
          style={{
            padding: '32px 16px',
            textAlign: 'center',
            background: '#ffffff',
            borderRadius: 14,
            border: '1px dashed var(--border, #E8DDD2)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>
            Aucun dossier dans cette catégorie
          </div>
          <div style={{ fontSize: 11.5, color: '#94A3B8' }}>
            {activeTab === 'a_recevoir'
              ? 'Personne ne vous doit d’argent actuellement. Tranquillité d’esprit totale !'
              : 'Vous n’avez aucune dette en cours enregistrée.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredDettes.map((d) => {
            const isSolde = d.statut === 'solde' || d.montant_restant === 0
            const pctPaye = Math.min(100, Math.round((Number(d.montant_paye) / Math.max(Number(d.montant_initial), 1)) * 100))

            return (
              <div
                key={d.id}
                style={{
                  background: '#ffffff',
                  borderRadius: 14,
                  border: d.est_en_retard && !isSolde ? '1.5px solid #FCA5A5' : '1px solid var(--border, #E8DDD2)',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {/* Ligne 1 : Nom du tiers + Statut */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                      {d.tiers_nom}
                    </div>
                    {d.tiers_telephone && (
                      <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>
                        {d.tiers_telephone}
                      </div>
                    )}
                  </div>

                  <div>
                    {isSolde ? (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 10, background: '#DCFCE7', color: '#166534' }}>
                        Soldé
                      </span>
                    ) : d.est_en_retard ? (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 10, background: '#FEE2E2', color: '#991B1B' }}>
                        Échéance dépassée
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 10, background: '#FEF3C7', color: '#92400E' }}>
                        En cours
                      </span>
                    )}
                  </div>
                </div>

                {/* Ligne 2 : Montants & Progression */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#64748B', marginBottom: 4 }}>
                    <span>Initial : {fmt(d.montant_initial)} F</span>
                    <span>Payé : {fmt(d.montant_paye)} F ({pctPaye}%)</span>
                  </div>

                  {/* Barre de progression */}
                  <div style={{ width: '100%', height: 6, borderRadius: 6, background: '#E2E8F0', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pctPaye}%`,
                        height: '100%',
                        borderRadius: 6,
                        background: isSolde ? 'var(--price, #0A5C36)' : 'var(--accent, #C75B00)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                      Reste à régler :
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: isSolde ? 'var(--price, #0A5C36)' : 'var(--navy, #1C2B4A)' }}>
                      {fmt(d.montant_restant)} FCFA
                    </span>
                  </div>
                </div>

                {/* Ligne 3 : Actions rapides */}
                {!isSolde && (
                  <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                    {activeTab === 'a_recevoir' && d.tiers_telephone && (
                      <button
                        type="button"
                        onClick={() => handleRelancer(d)}
                        disabled={relanceLoading === d.id}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          padding: '8px 12px',
                          borderRadius: 9,
                          border: 'none',
                          background: '#16A34A',
                          color: '#ffffff',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        <MessageCircle size={14} strokeWidth={2.4} />
                        <span>{relanceLoading === d.id ? 'Préparation...' : 'Relancer WhatsApp Wave'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onRembourser(d)}
                      style={{
                        flex: activeTab === 'a_recevoir' && d.tiers_telephone ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '8px 12px',
                        borderRadius: 9,
                        border: '1px solid var(--navy, #1C2B4A)',
                        background: '#ffffff',
                        color: 'var(--navy, #1C2B4A)',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      <DollarSign size={14} strokeWidth={2.4} />
                      <span>{activeTab === 'a_recevoir' ? 'Encaisser acompte' : 'Enregistrer paiement'}</span>
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
