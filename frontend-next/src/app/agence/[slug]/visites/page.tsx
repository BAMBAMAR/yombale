'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

interface Visite {
  id: string
  date_visite: string
  duree_min: number
  lieu_rdv?: string
  statut: string
  resultat?: string
  bien_titre: string
  bien_quartier?: string
  bien_ville: string
  contact_nom: string
  contact_prenom?: string
  contact_tel?: string
  agent_nom?: string
}

interface OptionItem {
  id: string
  titre?: string
  nom?: string
  prenom?: string
}

export default function VisitesPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [visites, setVisites] = useState<Visite[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDate, setFilterDate] = useState('tous')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Options pour le formulaire
  const [biensOptions, setBiensOptions] = useState<OptionItem[]>([])
  const [contactsOptions, setContactsOptions] = useState<OptionItem[]>([])

  const [form, setForm] = useState({
    bien_id: '',
    contact_id: '',
    date_visite: '',
    duree_min: '30',
    lieu_rdv: '',
    notes: '',
  })

  async function chargerVisites() {
    try {
      setLoading(true)
      let url = `/api/crm-immo/agence/${slug}/visites`
      if (filterDate !== 'tous') url += `?date=${filterDate}`
      const res = await fetch(url, { headers: getImmoAuthHeaders() })
      const data = await res.json()
      if (data.success) {
        setVisites(data.visites || [])
      }
    } catch (err) {
      console.error('[LOAD_VISITES_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  async function chargerOptions() {
    try {
      const [resBiens, resContacts] = await Promise.all([
        fetch(`/api/biens/agence/${slug}?statut=actif`, { headers: getImmoAuthHeaders() }),
        fetch(`/api/crm-immo/agence/${slug}/contacts`, { headers: getImmoAuthHeaders() }),
      ])
      const dataBiens = await resBiens.json()
      const dataContacts = await resContacts.json()
      if (dataBiens.success) setBiensOptions(dataBiens.biens || [])
      if (dataContacts.success) setContactsOptions(dataContacts.contacts || [])
    } catch (err) {
      console.error('[LOAD_OPTIONS_ERR]', err)
    }
  }

  useEffect(() => {
    if (slug) {
      chargerVisites()
      chargerOptions()
    }
  }, [slug, filterDate])

  async function handleCreerVisite(e: React.FormEvent) {
    e.preventDefault()
    if (!form.bien_id || !form.contact_id || !form.date_visite) return

    try {
      setSaving(true)
      const res = await fetch(`/api/crm-immo/agence/${slug}/visites`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setShowModal(false)
        chargerVisites()
      }
    } catch (err) {
      console.error('[CREATE_VISITE_ERR]', err)
    } finally {
      setSaving(false)
    }
  }

  async function updateStatut(visiteId: string, statut: string) {
    try {
      await fetch(`/api/crm-immo/agence/${slug}/visites/${visiteId}`, {
        method: 'PUT',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ statut }),
      })
      chargerVisites()
    } catch (err) {
      console.error('[UPDATE_VISITE_ERR]', err)
    }
  }

  return (
    <div>
      {/* ── En-tête ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Agenda des Visites</h1>
          <p className="agence-subtitle">Planifiez et suivez les visites des biens avec vos prospects.</p>
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
          Programmer une visite
        </button>
      </div>

      {/* ── Filtres ── */}
      <div className="agence-card" style={{ padding: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setFilterDate('tous')}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid var(--border, #E8DDD2)',
            background: filterDate === 'tous' ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
            color: filterDate === 'tous' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
          }}
        >
          Toutes
        </button>
        <button
          type="button"
          onClick={() => setFilterDate('aujourdhui')}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid var(--border, #E8DDD2)',
            background: filterDate === 'aujourdhui' ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
            color: filterDate === 'aujourdhui' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
          }}
        >
          Aujourd'hui
        </button>
        <button
          type="button"
          onClick={() => setFilterDate('a_venir')}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid var(--border, #E8DDD2)',
            background: filterDate === 'a_venir' ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
            color: filterDate === 'a_venir' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
          }}
        >
          À venir
        </button>
      </div>

      {/* ── Liste des Visites ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
          <p>Chargement des visites...</p>
        </div>
      ) : visites.length === 0 ? (
        <div className="agence-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
          <Calendar size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>Aucune visite trouvée</p>
          <p style={{ fontSize: 13.5 }}>Programmez votre premier rendez-vous de visite avec un prospect.</p>
        </div>
      ) : (
        <div className="agence-table-wrapper">
          <table className="agence-table">
            <thead>
              <tr>
                <th>Date & Heure</th>
                <th>Bien Immobilier</th>
                <th>Prospect</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {visites.map(v => {
                const d = new Date(v.date_visite)
                const dateFormatee = d.toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
                return (
                  <tr key={v.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={14} color="#64748B" />
                        {dateFormatee}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748B' }}>Durée : {v.duree_min} min</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>{v.bien_titre}</div>
                      <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} />
                        {v.bien_quartier ? `${v.bien_quartier}, ${v.bien_ville}` : v.bien_ville}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>
                        {v.contact_nom} {v.contact_prenom || ''}
                      </div>
                      {v.contact_tel && (
                        <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={11} />
                          {v.contact_tel}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${v.statut}`}>
                        {v.statut === 'confirmee' ? 'Confirmée' : v.statut === 'realisee' ? 'Réalisée' : v.statut}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        {v.statut !== 'realisee' && (
                          <button
                            type="button"
                            onClick={() => updateStatut(v.id, 'realisee')}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 6,
                              background: '#DCFCE7',
                              color: '#166534',
                              border: 'none',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Réalisée
                          </button>
                        )}
                        {v.statut !== 'annulee' && (
                          <button
                            type="button"
                            onClick={() => updateStatut(v.id, 'annulee')}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 6,
                              background: '#FEE2E2',
                              color: '#991B1B',
                              border: 'none',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modale Programmation Visite ── */}
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
                Programmer une visite
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#94A3B8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreerVisite}>
              <div className="form-group">
                <label className="form-label">Bien à visiter *</label>
                <select
                  required
                  value={form.bien_id}
                  onChange={e => setForm({ ...form, bien_id: e.target.value })}
                  className="form-select"
                >
                  <option value="">Sélectionner un bien</option>
                  {biensOptions.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.titre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Prospect concerné *</label>
                <select
                  required
                  value={form.contact_id}
                  onChange={e => setForm({ ...form, contact_id: e.target.value })}
                  className="form-select"
                >
                  <option value="">Sélectionner un prospect</option>
                  {contactsOptions.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nom} {c.prenom || ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Date & Heure *</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.date_visite}
                    onChange={e => setForm({ ...form, date_visite: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Durée estimée (min)</label>
                  <input
                    type="number"
                    value={form.duree_min}
                    onChange={e => setForm({ ...form, duree_min: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Lieu de rendez-vous</label>
                <input
                  type="text"
                  placeholder="Devant le bien / rond-point..."
                  value={form.lieu_rdv}
                  onChange={e => setForm({ ...form, lieu_rdv: e.target.value })}
                  className="form-input"
                />
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
                  {saving ? 'Enregistrement...' : 'Confirmer la visite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
