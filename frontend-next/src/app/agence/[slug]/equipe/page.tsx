'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  ShieldAlert,
  Plus,
  User,
  Mail,
  Phone,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

interface Membre {
  id: string
  utilisateur_id: string
  role: string
  actif: boolean
  date_entree: string
  utilisateur_nom: string
  utilisateur_email: string
  utilisateur_tel?: string
}

const ROLES: Record<string, string> = {
  admin_agence: 'Administrateur Agence',
  directeur: 'Directeur Agence',
  agent: 'Agent Immobilier',
  gestionnaire_locatif: 'Gestionnaire Locatif',
  commercial: 'Commercial',
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

  const [form, setForm] = useState({
    emailOrPhone: '',
    role: 'agent',
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
      setForm({ emailOrPhone: '', role: 'agent' })
      setToastMsg('Collaborateur ajouté avec succès à l’équipe.')
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

  return (
    <div>
      {/* ── En-tête ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Équipe & Rôles</h1>
          <p className="agence-subtitle">Gérez les accès et délégations des agents, directeurs et gestionnaires.</p>
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
          Inviter un collaborateur
        </button>
      </div>

      {toastMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#DCFCE7',
            color: '#166534',
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <CheckCircle2 size={18} />
          {toastMsg}
        </div>
      )}

      {/* ── Tableau de l'Équipe ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
          <p>Chargement des membres de l'équipe...</p>
        </div>
      ) : membres.length === 0 ? (
        <div className="agence-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
          <ShieldAlert size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>Aucun membre</p>
        </div>
      ) : (
        <div className="agence-table-wrapper">
          <table className="agence-table">
            <thead>
              <tr>
                <th>Collaborateur</th>
                <th>Rôle / Privilèges</th>
                <th>Contact</th>
                <th>Date d'entrée</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {membres.map(m => (
                <tr key={m.id}>
                  <td>
                    <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{m.utilisateur_nom}</div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 12,
                        background: m.role === 'admin_agence' ? '#FFEDD5' : '#FAF8F5',
                        color: m.role === 'admin_agence' ? '#9A3412' : 'var(--navy, #1C2B4A)',
                        border: '1px solid var(--border, #E8DDD2)',
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
                        title="Retirer le collaborateur"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modale Inviter Membre ── */}
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
              maxWidth: 460,
              width: '100%',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                Inviter un collaborateur
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#94A3B8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div
                style={{
                  padding: '10px 14px',
                  background: '#FEE2E2',
                  color: '#991B1B',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 16,
                }}
              >
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
                  placeholder="agent@exemple.sn ou 770000000"
                  value={form.emailOrPhone}
                  onChange={e => setForm({ ...form, emailOrPhone: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Rôle attribué *</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="form-select"
                >
                  <option value="agent">Agent Immobilier (Portefeuille)</option>
                  <option value="directeur">Directeur Agence</option>
                  <option value="gestionnaire_locatif">Gestionnaire Locatif (Baux/Loyers)</option>
                  <option value="commercial">Commercial (Prospects/Visites)</option>
                </select>
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
                  {saving ? 'Ajout...' : 'Ajouter au groupe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
