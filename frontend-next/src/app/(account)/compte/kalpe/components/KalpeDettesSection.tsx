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
  User,
  Building2,
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

function isEntrepriseDette(d: KalpeDette): boolean {
  if (d.tiers_type === 'entreprise') return true
  if (d.tiers_type === 'particulier') return false
  return /sarl|sa|ets|école|ecole|pressing|service|agence|boutique|cabinet|clinique|hopital|societe|société|fournisseur/i.test(d.tiers_nom || '')
}

export default function KalpeDettesSection({
  dettes,
  loading,
  onAddDette,
  onRembourser,
}: KalpeDettesSectionProps) {
  const [activeTab, setActiveTab] = useState<'a_recevoir' | 'a_payer'>('a_recevoir')
  const [filterType, setFilterType] = useState<'all' | 'particulier' | 'entreprise'>('all')
  const [relanceLoading, setRelanceLoading] = useState<string | null>(null)

  const directionDettes = dettes.filter((d) => d.direction === activeTab)
  const filteredDettes = directionDettes.filter((d) => {
    if (filterType === 'all') return true
    if (filterType === 'entreprise') return isEntrepriseDette(d)
    return !isEntrepriseDette(d)
  })

  const totalRestant = filteredDettes.reduce((sum, d) => sum + (d.statut !== 'solde' ? Number(d.montant_restant) : 0), 0)

  const nbEntreprises = directionDettes.filter(isEntrepriseDette).length
  const nbParticuliers = directionDettes.length - nbEntreprises

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
      {/* Barre d'onglets de direction & bouton d'action */}
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
          <span>Noter {activeTab === 'a_recevoir' ? 'une créance' : 'une dette'}</span>
        </button>
      </div>

      {/* Filtres par Type de Tiers : Tous, Particuliers, Entreprises / Entités */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setFilterType('all')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            fontSize: 11.5,
            fontWeight: 700,
            borderRadius: 7,
            border: filterType === 'all' ? '1.5px solid var(--navy, #1C2B4A)' : '1px solid #E8DDD2',
            background: filterType === 'all' ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
            color: filterType === 'all' ? '#FFFFFF' : '#64748B',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span>Tous</span>
          <span style={{ opacity: 0.8, fontSize: 10 }}>({directionDettes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterType('particulier')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            fontSize: 11.5,
            fontWeight: 700,
            borderRadius: 7,
            border: filterType === 'particulier' ? '1.5px solid var(--navy, #1C2B4A)' : '1px solid #E8DDD2',
            background: filterType === 'particulier' ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
            color: filterType === 'particulier' ? '#FFFFFF' : '#64748B',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <User size={12} strokeWidth={2.2} />
          <span>Particuliers</span>
          <span style={{ opacity: 0.8, fontSize: 10 }}>({nbParticuliers})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterType('entreprise')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            fontSize: 11.5,
            fontWeight: 700,
            borderRadius: 7,
            border: filterType === 'entreprise' ? '1.5px solid var(--accent, #C75B00)' : '1px solid #E8DDD2',
            background: filterType === 'entreprise' ? 'var(--accent, #C75B00)' : '#FFFFFF',
            color: filterType === 'entreprise' ? '#FFFFFF' : '#64748B',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Building2 size={12} strokeWidth={2.4} />
          <span>Entreprises & Entités</span>
          <span style={{ opacity: 0.8, fontSize: 10 }}>({nbEntreprises})</span>
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
              ? 'Aucune créance en cours enregistrée dans ce filtre.'
              : 'Vous n’avez aucune dette en cours enregistrée dans ce filtre.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredDettes.map((d) => {
            const isSolde = d.statut === 'solde' || d.montant_restant === 0
            const pctPaye = Math.min(100, Math.round((Number(d.montant_paye) / Math.max(Number(d.montant_initial), 1)) * 100))
            const isEnt = isEntrepriseDette(d)

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
                {/* Ligne 1 : Nom du tiers + Badge Entreprise/Particulier + Statut */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                        {d.tiers_nom}
                      </span>
                      {isEnt ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 6,
                            background: '#EFF6FF',
                            color: '#1D4ED8',
                            border: '1px solid #DBEAFE',
                          }}
                        >
                          <Building2 size={12} strokeWidth={2.4} />
                          <span>Entreprise / Entité</span>
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 10.5,
                            fontWeight: 600,
                            padding: '2px 7px',
                            borderRadius: 6,
                            background: '#F1F5F9',
                            color: '#475569',
                            border: '1px solid #E2E8F0',
                          }}
                        >
                          <User size={12} strokeWidth={2.2} />
                          <span>Particulier</span>
                        </span>
                      )}
                    </div>
                    {d.tiers_telephone && (
                      <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, marginTop: 2 }}>
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
