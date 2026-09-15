'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Users,
  Plus,
  Phone,
  MessageCircle,
  MapPin,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Home,
  X,
  AlertCircle
} from 'lucide-react'

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

interface MatchedBien {
  id: string
  titre: string
  type_bien: string
  ville: string
  quartier?: string
  prix_location?: number
  prix_vente?: number
  score_matching: number
  raisons: string[]
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
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Matching state
  const [matchingProspect, setMatchingProspect] = useState<Prospect | null>(null)
  const [matchedBiens, setMatchedBiens] = useState<MatchedBien[]>([])
  const [loadingMatch, setLoadingMatch] = useState(false)

  // Form state
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    whatsapp: '',
    type_operation: 'location',
    type_bien_souhaite: 'appartement',
    budget_max: '',
  })

  async function chargerProspects() {
    try {
      setLoading(true)
      const res = await fetch(`/api/crm-immo/agence/${slug}/contacts?type_contact=prospect`)
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
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`/api/crm-immo/agence/${slug}/contacts/${prospect.id}/matching`)
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

  async function handleCreerProspect(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim()) return

    try {
      setSaving(true)
      const res = await fetch(`/api/crm-immo/agence/${slug}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setShowModal(false)
        setForm({ nom: '', prenom: '', telephone: '', whatsapp: '', type_operation: 'location', type_bien_souhaite: 'appartement', budget_max: '' })
        chargerProspects()
      }
    } catch (err) {
      console.error('[CREATE_PROSPECT_ERR]', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* ── En-tête ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">CRM Pipeline Prospects</h1>
          <p className="agence-subtitle">Suivez vos leads acquéreurs et locataires avec matching intelligent.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
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

      {/* ── Kanban Board ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
          <p>Chargement du pipeline CRM...</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
            alignItems: 'start',
            overflowX: 'auto',
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
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                        Max : {Number(p.budget_max).toLocaleString('fr-FR')} FCFA
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {p.telephone && (
                        <a
                          href={`tel:${p.telephone}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            padding: '3px 6px',
                            background: '#FAF8F5',
                            borderRadius: 4,
                            color: 'var(--navy, #1C2B4A)',
                            textDecoration: 'none',
                          }}
                        >
                          <Phone size={11} />
                          {p.telephone}
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
                          title="Avancer étape"
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
      )}

      {/* ── Modale Matching Intelligent ── */}
      {matchingProspect && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(28, 43, 74, 0.5)',
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
              maxWidth: 600,
              width: '100%',
              padding: 24,
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={20} color="var(--accent, #C75B00)" />
                <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                  Biens Matchés pour {matchingProspect.nom}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setMatchingProspect(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#94A3B8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {loadingMatch ? (
              <p style={{ textAlign: 'center', padding: '30px 0', color: '#64748B' }}>Calcul du matching en temps réel...</p>
            ) : matchedBiens.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '30px 0', color: '#64748B' }}>
                Aucun bien du portefeuille ne correspond actuellement aux critères.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {matchedBiens.map(b => (
                  <div
                    key={b.id}
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      border: '1px solid var(--border, #E8DDD2)',
                      background: '#FAF8F5',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 14 }}>{b.titre}</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>
                          {b.type_bien} • {b.quartier ? `${b.quartier}, ${b.ville}` : b.ville}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 12,
                          background: '#DCFCE7',
                          color: '#166534',
                        }}
                      >
                        {b.score_matching}% Match
                      </span>
                    </div>

                    <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {b.raisons.map((r, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 6px',
                            background: '#FFFFFF',
                            borderRadius: 4,
                            border: '1px solid #E2E8F0',
                            color: '#475569',
                          }}
                        >
                          ✓ {r}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modale Nouveau Prospect ── */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(28, 43, 74, 0.5)',
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
              maxWidth: 480,
              width: '100%',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                Nouveau Prospect CRM
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#94A3B8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreerProspect}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Nom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Diop"
                    value={form.nom}
                    onChange={e => setForm({ ...form, nom: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Prénom</label>
                  <input
                    type="text"
                    placeholder="Moussa"
                    value={form.prenom}
                    onChange={e => setForm({ ...form, prenom: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Téléphone / WhatsApp</label>
                <input
                  type="tel"
                  placeholder="+221 77 000 00 00"
                  value={form.telephone}
                  onChange={e => setForm({ ...form, telephone: e.target.value, whatsapp: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Opération</label>
                  <select
                    value={form.type_operation}
                    onChange={e => setForm({ ...form, type_operation: e.target.value })}
                    className="form-select"
                  >
                    <option value="location">Location</option>
                    <option value="vente">Achat</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Budget Max (FCFA)</label>
                  <input
                    type="number"
                    placeholder="Ex: 500000"
                    value={form.budget_max}
                    onChange={e => setForm({ ...form, budget_max: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 8,
                    background: '#FAF8F5',
                    border: '1px solid var(--border, #E8DDD2)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 8,
                    background: 'var(--accent, #C75B00)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Enregistrement...' : 'Créer prospect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
