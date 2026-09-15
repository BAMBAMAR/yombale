'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  ShieldAlert,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Users2,
  Briefcase,
  X
} from 'lucide-react'

interface Membre {
  id: string
  utilisateur_id: string
  role: string
  actif: boolean
  date_entree: string
  utilisateur_nom: string
  utilisateur_prenom?: string
  utilisateur_email: string
  utilisateur_tel?: string
}

const ROLES: Record<string, string> = {
  admin_agence: 'Administrateur Agence',
  directeur: 'Directeur Agence',
  agent: 'Agent Immobilier',
  gestionnaire_locatif: 'Gestionnaire Locatif',
  commercial: 'Commercial',
  courtier: 'Courtier / Apporteur d\'Affaires',
}

export default function EquipePage() {
  const params = useParams()
  const slug = params?.slug as string

  const [membres, setMembres] = useState<Membre[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [filtreType, setFiltreType] = useState<'tous' | 'internes' | 'courtiers'>('tous')

  const [form, setForm] = useState({
    emailOrPhone: '',
    role: 'courtier',
  })

  async function chargerMembres() {
    try {
      setLoading(true)
      const res = await fetch(`/api/agences/${slug}/membres`)
      const data = await res.json()
      if (data.success) {
        setMembres(data.membres || [])
      }
    } catch (err) {
      console.error('[LOAD_MEMBRES_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerMembres()
  }, [slug])

  async function handleInviterMembre(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    if (!form.emailOrPhone.trim()) return

    try {
      setSaving(true)
      const res = await fetch(`/api/agences/${slug}/membres`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Erreur lors de l'invitation du collaborateur.")
        return
      }
      setShowModal(false)
      setForm({ emailOrPhone: '', role: 'courtier' })
      setToastMsg('Collaborateur ou courtier ajouté avec succès à l’agence.')
      chargerMembres()
      setTimeout(() => setToastMsg(null), 4000)
    } catch (err) {
      console.error('[INVITE_MEMBRE_ERR]', err)
      setErrorMsg('Erreur de connexion au serveur.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSupprimerMembre(membreId: string) {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce collaborateur de l’agence ?')) return
    try {
      const res = await fetch(`/api/agences/${slug}/membres/${membreId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        chargerMembres()
      }
    } catch (err) {
      console.error('[DELETE_MEMBRE_ERR]', err)
    }
  }

  const membresFiltres = membres.filter(m => {
    if (filtreType === 'courtiers') return m.role === 'courtier'
    if (filtreType === 'internes') return m.role !== 'courtier'
    return true
  })

  const nbCourtiers = membres.filter(m => m.role === 'courtier').length
  const nbInternes = membres.filter(m => m.role !== 'courtier').length

  return (
    <div>
      {/* ── En-tête ── */}
      <div className="agence-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="agence-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users2 size={22} color="var(--accent, #C75B00)" />
            <span>Équipe, Agents &amp; Courtiers Partenaires</span>
          </h1>
          <p className="agence-subtitle">
            Gérez les directeurs, agents négociateurs, gestionnaires locatifs et courtiers en crédit immobilier / apporteurs d'affaires.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="agence-btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} />
          <span>Ajouter un collaborateur / courtier</span>
        </button>
      </div>

      {toastMsg && (
        <div style={{ padding: '12px 16px', background: '#DCFCE7', color: '#166534', borderRadius: 8, fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <CheckCircle2 size={18} />
          {toastMsg}
        </div>
      )}

      {/* ── Filtres Onglets ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setFiltreType('tous')}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid',
            borderColor: filtreType === 'tous' ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
            background: filtreType === 'tous' ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
            color: filtreType === 'tous' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Tous ({membres.length})
        </button>

        <button
          type="button"
          onClick={() => setFiltreType('internes')}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid',
            borderColor: filtreType === 'internes' ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
            background: filtreType === 'internes' ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
            color: filtreType === 'internes' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Équipe Interne ({nbInternes})
        </button>

        <button
          type="button"
          onClick={() => setFiltreType('courtiers')}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid',
            borderColor: filtreType === 'courtiers' ? '#0A5C36' : 'var(--border, #E8DDD2)',
            background: filtreType === 'courtiers' ? '#0A5C36' : '#FFFFFF',
            color: filtreType === 'courtiers' ? '#FFFFFF' : '#0A5C36',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Briefcase size={14} />
          <span>Courtiers &amp; Apporteurs ({nbCourtiers})</span>
        </button>
      </div>

      {/* ── Tableau de l'Équipe ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
          <p>Chargement des membres de l'équipe et courtiers...</p>
        </div>
      ) : membresFiltres.length === 0 ? (
        <div className="agence-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
          <ShieldAlert size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>
            {filtreType === 'courtiers' ? 'Aucun courtier ou apporteur d\'affaires enregistré' : 'Aucun collaborateur'}
          </p>
          <p style={{ fontSize: 13, maxWidth: 450, margin: '6px auto 14px' }}>
            {filtreType === 'courtiers'
              ? 'Associez des courtiers en crédit immobilier ou apporteurs pour partager les commissions sur les transactions.'
              : 'Invitez vos agents négociateurs et gestionnaires pour collaborer sur le portefeuille.'}
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="agence-btn-primary"
            style={{ margin: '0 auto' }}
          >
            Inviter un courtier ou collaborateur
          </button>
        </div>
      ) : (
        <div className="agence-table-wrapper">
          <table className="agence-table">
            <thead>
              <tr>
                <th>Collaborateur / Courtier</th>
                <th>Rôle / Privilèges</th>
                <th>Contact</th>
                <th>Date d'entrée</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {membresFiltres.map(m => {
                const isCourtier = m.role === 'courtier'
                return (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                        {m.utilisateur_prenom ? `${m.utilisateur_prenom} ${m.utilisateur_nom}` : m.utilisateur_nom}
                      </div>
                      {isCourtier && (
                        <div style={{ fontSize: 11, color: '#0A5C36', fontWeight: 650 }}>
                          Partenaire Financement &amp; Apporteur
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 12,
                          background: isCourtier ? '#DCFCE7' : m.role === 'admin_agence' ? '#FFEDD5' : '#FAF8F5',
                          color: isCourtier ? '#166534' : m.role === 'admin_agence' ? '#9A3412' : 'var(--navy, #1C2B4A)',
                          border: `1px solid ${isCourtier ? '#BBF7D0' : 'var(--border, #E8DDD2)'}`,
                        }}
                      >
                        {ROLES[m.role] || m.role}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 12.5, color: '#475569' }}>{m.utilisateur_email}</div>
                      {m.utilisateur_tel && <div style={{ fontSize: 11.5, color: '#64748B' }}>{m.utilisateur_tel}</div>}
                    </td>
                    <td>{m.date_entree ? new Date(m.date_entree).toLocaleDateString('fr-FR') : 'Fondateur'}</td>
                    <td style={{ textAlign: 'right' }}>
                      {m.role !== 'admin_agence' && (
                        <button
                          type="button"
                          onClick={() => handleSupprimerMembre(m.id)}
                          style={{
                            padding: '6px',
                            borderRadius: 6,
                            background: '#FEE2E2',
                            color: '#991B1B',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                          title="Retirer de l'agence"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modale Inviter Membre / Courtier ── */}
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
          <div style={{ background: '#FFFFFF', borderRadius: 14, maxWidth: 440, width: '100%', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                Inviter un Collaborateur ou Courtier
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div style={{ padding: '10px 14px', background: '#FEE2E2', color: '#991B1B', borderRadius: 8, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <AlertCircle size={16} />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleInviterMembre}>
              <div className="form-group">
                <label className="form-label">Email ou Téléphone du compte Nopalou *</label>
                <input
                  type="text"
                  required
                  placeholder="courtier@banque.sn ou 770000000"
                  value={form.emailOrPhone}
                  onChange={e => setForm({ ...form, emailOrPhone: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Rôle attribué dans l'agence *</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="form-select"
                >
                  <option value="courtier">Courtier / Apporteur d'Affaires (Financement &amp; Partage)</option>
                  <option value="agent">Agent Immobilier (Gestion Portefeuille)</option>
                  <option value="gestionnaire_locatif">Gestionnaire Locatif (Baux &amp; Loyers)</option>
                  <option value="commercial">Commercial (Prospects &amp; Visites)</option>
                  <option value="directeur">Directeur Agence</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', background: '#FFF', color: '#64748B', fontWeight: 650, cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="agence-btn-primary"
                >
                  {saving ? 'Envoi...' : 'Valider l’invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
