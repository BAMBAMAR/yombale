'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Users,
  Plus,
  Phone,
  MessageCircle,
  Sparkles,
  ChevronRight,
  X,
  AlertCircle,
} from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'
import { ModalMatchingProspect, MatchedBien } from './components/ModalMatchingProspect'
import { ModalCreerProspect } from './components/ModalCreerProspect'
import ProspectCardMobile from './components/ProspectCardMobile'

interface Prospect {
  id: string
  nom: string
  prenom?: string
  telephone?: string
  whatsapp?: string
  statut_crm: string
  budget_min?: number
  budget_max?: number
  type_operation?: string
  type_bien_souhaite?: string
  villes_souhaitees?: string[]
  probabilite: number
  nb_visites: number
}

const COLUMNS = [
  { id: 'nouveau', label: 'Nouveaux', color: '#92400E', bg: '#FEF3C7' },
  { id: 'qualifie', label: 'Qualifiés', color: '#0369A1', bg: '#E0F2FE' },
  { id: 'visite_programmee', label: 'En Visite', color: '#5B21B6', bg: '#EDE9FE' },
  { id: 'offre', label: 'Offre / Négoc.', color: '#C75B00', bg: '#FFEDD5' },
  { id: 'gagne', label: 'Gagnés', color: '#166534', bg: '#DCFCE7' },
]

export default function ProspectsCRMPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [showModalCreer, setShowModalCreer] = useState(false)

  // Matching state
  const [matchingProspect, setMatchingProspect] = useState<Prospect | null>(null)
  const [matchedBiens, setMatchedBiens] = useState<MatchedBien[]>([])
  const [loadingMatch, setLoadingMatch] = useState(false)
  const [mobileStage, setMobileStage] = useState<string>('tous')

  const prospectsFiltresMobile = mobileStage === 'tous'
    ? prospects
    : prospects.filter(p => p.statut_crm === mobileStage)

  async function chargerProspects() {
    try {
      setLoading(true)
      const res = await fetch(`/api/crm-immo/agence/${slug}/contacts?type_contact=prospect`, {
        headers: getImmoAuthHeaders()
      })
      const data = await res.json()
      if (data.success) {
        setProspects(data.contacts || [])
      }
    } catch (err) {
      console.error('[LOAD_PROSPECTS_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerProspects()
  }, [slug])

  async function changerStatut(contactId: string, nouveauStatut: string) {
    try {
      await fetch(`/api/crm-immo/agence/${slug}/contacts/${contactId}`, {
        method: 'PUT',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ statut_crm: nouveauStatut }),
      })
      chargerProspects()
    } catch (err) {
      console.error('[STATUS_CHANGE_ERR]', err)
    }
  }

  async function ouvrirMatching(prospect: Prospect) {
    try {
      setMatchingProspect(prospect)
      setLoadingMatch(true)
      const res = await fetch(`/api/crm-immo/agence/${slug}/contacts/${prospect.id}/matching`, {
        headers: getImmoAuthHeaders()
      })
      const data = await res.json()
      if (data.success) {
        setMatchedBiens(data.biens_matches || [])
      }
    } catch (err) {
      console.error('[MATCHING_ERR]', err)
    } finally {
      setLoadingMatch(false)
    }
  }

  return (
    <div>
      {/* ── En-tête ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Pipeline Commercial & Prospects</h1>
          <p className="agence-subtitle">Suivi du cycle de conversion acheteurs et locataires qualifiés.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowModalCreer(true)}
          className="btn-npl"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 8,
            background: 'var(--accent, #C75B00)',
            color: '#FFFFFF',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Plus size={18} />
          Nouveau prospect
        </button>
      </div>

      {/* ── Pipeline Kanban ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
          <p>Chargement du pipeline CRM...</p>
        </div>
      ) : (
        <>
          {/* ── Vue Mobile : Sélecteur d'Étape & Cartes Tactiles (< 768px) ── */}
          <div className="immo-mobile-only" style={{ flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {/* Chips d'étapes défilables */}
            <div className="immo-chips-scroller">
              <button
                type="button"
                onClick={() => setMobileStage('tous')}
                className={`immo-chip ${mobileStage === 'tous' ? 'active' : ''}`}
              >
                <span>Tous ({prospects.length})</span>
              </button>
              {COLUMNS.map(col => {
                const count = prospects.filter(p => p.statut_crm === col.id).length
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setMobileStage(col.id)}
                    className={`immo-chip ${mobileStage === col.id ? 'active' : ''}`}
                  >
                    <span>{col.label} ({count})</span>
                  </button>
                )
              })}
            </div>

            {/* Cartes prospects mobiles */}
            {prospectsFiltresMobile.length === 0 ? (
              <div className="agence-card" style={{ textAlign: 'center', padding: '30px 16px', color: '#64748B' }}>
                <p style={{ margin: 0, fontSize: 13.5 }}>Aucun prospect dans cette étape.</p>
              </div>
            ) : (
              prospectsFiltresMobile.map(p => (
                <ProspectCardMobile
                  key={p.id}
                  prospect={p}
                  onStatusChange={changerStatut}
                  onOpenMatching={ouvrirMatching}
                />
              ))
            )}
          </div>

          {/* ── Vue Desktop : Pipeline Kanban Multi-Colonnes (>= 768px) ── */}
          <div
            className="immo-desktop-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, minmax(240px, 1fr))',
              gap: 14,
              overflowX: 'auto',
              paddingBottom: 16,
            }}
          >
          {COLUMNS.map(col => {
            const list = prospects.filter(p => p.statut_crm === col.id)
            return (
              <div
                key={col.id}
                style={{
                  background: '#F1EBE3',
                  borderRadius: 12,
                  padding: 12,
                  minHeight: 400,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {/* En-tête colonne */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 800, color: col.color, textTransform: 'uppercase' }}>
                    {col.label}
                  </span>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 10,
                      background: col.bg,
                      color: col.color,
                    }}
                  >
                    {list.length}
                  </span>
                </div>

                {/* Cartes Prospects */}
                {list.map(p => (
                  <div
                    key={p.id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 10,
                      padding: 12,
                      border: '1px solid var(--border, #E8DDD2)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 750, color: 'var(--navy, #1C2B4A)', fontSize: 14 }}>
                        {p.nom} {p.prenom || ''}
                      </div>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'capitalize' }}>
                        {p.type_operation}
                      </span>
                    </div>

                    {p.budget_max && (
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                        Max : {Number(p.budget_max).toLocaleString('fr-FR')} FCFA
                      </div>
                    )}

                    {/* Actions de Contact Direct */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {p.telephone && (
                        <a
                          href={`tel:${p.telephone}`}
                          title="Appeler le prospect"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            padding: '3px 6px',
                            background: '#FAF8F5',
                            borderRadius: 4,
                            border: '1px solid var(--border, #E8DDD2)',
                            color: 'var(--navy, #1C2B4A)',
                            textDecoration: 'none',
                          }}
                        >
                          <Phone size={11} />
                          {p.telephone}
                        </a>
                      )}
                      {(p.whatsapp || p.telephone) && (
                        <a
                          href={`https://wa.me/${(p.whatsapp || p.telephone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `Bonjour ${p.nom}, nous faisons suite à votre recherche de bien immobilier.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Contacter sur WhatsApp"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            padding: '3px 6px',
                            background: 'rgba(22, 163, 74, 0.08)',
                            border: '1px solid rgba(22, 163, 74, 0.2)',
                            borderRadius: 4,
                            color: '#166534',
                            textDecoration: 'none',
                            fontWeight: 600,
                          }}
                        >
                          <MessageCircle size={11} />
                          WhatsApp
                        </a>
                      )}
                    </div>

                    {/* Actions Card */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 4,
                        paddingTop: 8,
                        borderTop: '1px solid #F1EBE3',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => ouvrirMatching(p)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--accent, #C75B00)',
                          background: 'rgba(199, 91, 0, 0.08)',
                          border: 'none',
                          borderRadius: 4,
                          padding: '4px 6px',
                          cursor: 'pointer',
                        }}
                      >
                        <Sparkles size={11} />
                        Biens matchés
                      </button>

                      {col.id !== 'gagne' && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextIdx = COLUMNS.findIndex(c => c.id === col.id) + 1
                            if (nextIdx < COLUMNS.length) {
                              changerStatut(p.id, COLUMNS[nextIdx].id)
                            }
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748B',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Avancer à l'étape suivante"
                        >
                          <ChevronRight size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </>
      )}

      {/* ── Modale Matching Intelligent ── */}
      <ModalMatchingProspect
        prospectNom={matchingProspect ? `${matchingProspect.nom} ${matchingProspect.prenom || ''}` : ''}
        matchedBiens={matchedBiens}
        loading={loadingMatch}
        isOpen={!!matchingProspect}
        onClose={() => setMatchingProspect(null)}
      />

      {/* ── Modale Nouveau Prospect ── */}
      <ModalCreerProspect
        slug={slug}
        isOpen={showModalCreer}
        onClose={() => setShowModalCreer(false)}
        onSuccess={() => chargerProspects()}
      />
    </div>
  )
}
