'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  ShieldAlert,
  Plus,
  Trash2,
  CheckCircle2,
  Users2,
  Briefcase,
  Pencil
} from 'lucide-react'
import ModalAjouterMembre from './components/ModalAjouterMembre'
import ModalEditerMembre, { MembreItem } from './components/ModalEditerMembre'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

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

  const [membres, setMembres] = useState<MembreItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [membreAEditer, setMembreAEditer] = useState<MembreItem | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [filtreType, setFiltreType] = useState<'tous' | 'internes' | 'courtiers'>('tous')

  async function chargerMembres() {
    try {
      setLoading(true)
      const res = await fetch(`/api/agences/${slug}/membres`, {
        headers: getImmoAuthHeaders(),
      })
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

  async function handleSupprimerMembre(membreId: string) {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce collaborateur de l’agence ?')) return
    try {
      const res = await fetch(`/api/agences/${slug}/membres/${membreId}`, {
        method: 'DELETE',
        headers: getImmoAuthHeaders(),
      })
      const data = await res.json()
      if (data.success) {
        setToastMsg('Membre retiré de l’agence.')
        chargerMembres()
        setTimeout(() => setToastMsg(null), 3000)
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
            Ajouter un courtier ou collaborateur
          </button>
        </div>
      ) : (
        <div className="agence-table-wrapper">
          <table className="agence-table">
            <thead>
              <tr>
                <th>Collaborateur / Courtier</th>
                <th>Rôle / Privilèges</th>
                <th>Coordonnées &amp; Cabinet</th>
                <th>Date d'entrée</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {membresFiltres.map(m => {
                const isCourtier = m.role === 'courtier'
                const p = m.permissions || {}
                return (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                        {m.utilisateur_prenom ? `${m.utilisateur_prenom} ${m.utilisateur_nom}` : m.utilisateur_nom}
                      </div>
                      {isCourtier && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                          <span style={{ fontSize: 11, color: '#0A5C36', fontWeight: 700, background: '#DCFCE7', padding: '1px 6px', borderRadius: 4 }}>
                            {p.partage_taux_commission ? `${p.partage_taux_commission}% com.` : 'Courtier Partenaire'}
                          </span>
                          {p.cabinet && (
                            <span style={{ fontSize: 11, color: '#64748B' }}>
                              {p.cabinet}
                            </span>
                          )}
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
                      {p.specialite && (
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 3, maxWidth: 200 }}>
                          {p.specialite}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: 12.5, color: '#475569' }}>{m.utilisateur_email || p.email || 'Non renseigné'}</div>
                      {(m.utilisateur_tel || p.telephone) && (
                        <div style={{ fontSize: 11.5, color: '#64748B' }}>{m.utilisateur_tel || p.telephone}</div>
                      )}
                    </td>
                    <td>{m.date_entree ? new Date(m.date_entree).toLocaleDateString('fr-FR') : 'Fondateur'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => setMembreAEditer(m)}
                          style={{
                            padding: '6px',
                            borderRadius: 6,
                            background: '#FAF8F5',
                            border: '1px solid var(--border, #E8DDD2)',
                            color: 'var(--navy, #1C2B4A)',
                            cursor: 'pointer',
                          }}
                          title="Modifier les coordonnées &amp; commissions"
                        >
                          <Pencil size={14} />
                        </button>

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
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modale Ajouter Membre / Courtier ── */}
      {showModal && (
        <ModalAjouterMembre
          slug={slug}
          onClose={() => setShowModal(false)}
          onSuccess={(msg) => {
            setToastMsg(msg)
            chargerMembres()
            setTimeout(() => setToastMsg(null), 4000)
          }}
        />
      )}

      {/* ── Modale Modifier Membre / Courtier ── */}
      {membreAEditer && (
        <ModalEditerMembre
          slug={slug}
          membre={membreAEditer}
          onClose={() => setMembreAEditer(null)}
          onSuccess={(msg) => {
            setToastMsg(msg)
            chargerMembres()
            setTimeout(() => setToastMsg(null), 4000)
          }}
        />
      )}
    </div>
  )
}
