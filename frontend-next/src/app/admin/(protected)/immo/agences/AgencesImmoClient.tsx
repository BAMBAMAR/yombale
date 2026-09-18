'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Search,
  RefreshCw,
  Phone,
  Mail,
  Home,
  CheckCircle2,
  XCircle,
  Crown,
  Sparkles,
  Settings,
} from 'lucide-react'
import { adminModererAgence } from '@/app/actions/admin'
import { showToast } from '@/context/ToastContext'
import ModalForfaitAgence from './components/ModalForfaitAgence'

interface AgencesImmoClientProps {
  initialAgences: any[]
  total: number
}

export default function AgencesImmoClient({ initialAgences, total }: AgencesImmoClientProps) {
  const [agences, setAgences] = useState(initialAgences)
  const [search, setSearch] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [selectedAgenceForForfait, setSelectedAgenceForForfait] = useState<any | null>(null)

  const handleToggleStatut = async (agence: any) => {
    const nextStatut = agence.statut === 'actif' || agence.statut === 'active' ? 'suspendue' : 'active'
    setLoadingId(agence.id)
    try {
      const res = await adminModererAgence(agence.id, { statut: nextStatut as any })
      if (res.success) {
        setAgences((prev) =>
          prev.map((a) => (a.id === agence.id ? { ...a, statut: nextStatut === 'active' ? 'actif' : 'suspendu' } : a))
        )
        showToast(`Agence "${agence.nom}" : statut mis à jour vers "${nextStatut}".`, 'success', 'Modération Agence')
      } else {
        showToast(res.error || 'Erreur lors de la modération de l\'agence', 'error', 'Modération Agence')
      }
    } finally {
      setLoadingId(null)
    }
  }

  const handleForfaitUpdated = (updatedAgence: any) => {
    setAgences((prev) =>
      prev.map((a) => (a.id === updatedAgence.id ? { ...a, ...updatedAgence } : a))
    )
  }

  const getPlanLabel = (planSlug?: string) => {
    switch (planSlug) {
      case 'immo_pro':
      case 'pro':
        return { label: 'Plan Pro', color: '#7c3aed', bg: '#ede9fe' }
      case 'immo_multi_agence':
        return { label: 'Multi-Agences', color: '#b45309', bg: '#fef3c7' }
      case 'immo_essentiel':
      case 'essentiel':
      default:
        return { label: 'Essentiel', color: '#475569', bg: '#f1f5f9' }
    }
  }

  const filtered = agences.filter((a) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      a.nom?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.telephone?.toLowerCase().includes(q) ||
      a.ville?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="admin-page-container">
      {/* En-tête Métier */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy, #1C2B4A)', margin: '0 0 6px' }}>
            Réseau Agences Immobilières
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text2, #64748b)', margin: 0 }}>
            Supervision des professionnels de l&apos;immobilier, forfaits d&apos;abonnement, baux OHADA et sponsoring.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link
            href="/admin/plans?categorie=immo"
            className="btn-npl"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              padding: '8px 14px',
              background: '#ede9fe',
              color: '#6d28d9',
              border: '1px solid #ddd6fe',
              fontWeight: 600,
            }}
          >
            <Crown size={14} />
            <span>Catalogue Forfaits Agences</span>
          </Link>
          <Link
            href="/admin/immo"
            className="btn-npl"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px', background: '#f1f5f9', color: 'var(--navy, #1C2B4A)', border: '1px solid var(--border, #E8DDD2)' }}
          >
            <Home size={14} />
            <span>Vue globale</span>
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-npl"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}
          >
            <RefreshCw size={14} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Barre de Recherche */}
      <div style={{ background: '#ffffff', padding: 16, borderRadius: 10, border: '1px solid var(--border, #E8DDD2)', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ position: 'relative', minWidth: 280, flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3, #94a3b8)' }} />
          <input
            type="text"
            placeholder="Rechercher par nom agence, email, téléphone, ville..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid var(--border, #E8DDD2)',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3, #94a3b8)' }}>
          {filtered.length} agence(s) affichée(s) sur {total}
        </div>
      </div>

      {/* Tableau des Agences */}
      <div style={{ background: '#ffffff', borderRadius: 10, border: '1px solid var(--border, #E8DDD2)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border, #E8DDD2)', color: 'var(--text3, #64748b)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                <th style={{ padding: '12px 16px' }}>Agence & Contact</th>
                <th style={{ padding: '12px 16px' }}>Ville</th>
                <th style={{ padding: '12px 16px' }}>Biens Gérés</th>
                <th style={{ padding: '12px 16px' }}>Baux Locatifs</th>
                <th style={{ padding: '12px 16px' }}>Forfait & Visibilité</th>
                <th style={{ padding: '12px 16px' }}>Statut</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text3, #64748b)' }}>
                    Aucune agence immobilière trouvée.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => {
                  const isActif = a.statut === 'actif' || a.statut === 'active'
                  const planInfo = getPlanLabel(a.abonnement_plan)
                  const isSponsor = Boolean(a.sponsorise)

                  return (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--border, #E8DDD2)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 8, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', flexShrink: 0 }}>
                            <Building2 size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--navy, #1C2B4A)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{a.nom}</span>
                              {isSponsor && (
                                <span title="Agence Sponsorisée / En Vedette" style={{ display: 'inline-flex', color: '#f59e0b' }}>
                                  <Sparkles size={13} />
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text3, #64748b)', display: 'flex', gap: 8, marginTop: 2 }}>
                              {a.email && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                  <Mail size={10} /> {a.email}
                                </span>
                              )}
                              {a.telephone && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                  <Phone size={10} /> {a.telephone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text2, #475569)' }}>
                        {a.ville || 'Dakar'}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--navy, #1C2B4A)' }}>
                        {a.nb_biens || 0} biens
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0284c7' }}>
                        {a.nb_baux_actifs || a.nb_baux || 0} baux
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              color: planInfo.color,
                              background: planInfo.bg,
                              padding: '2px 8px',
                              borderRadius: 12,
                            }}
                          >
                            <Crown size={11} />
                            {planInfo.label}
                          </span>
                          {isSponsor && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                fontSize: 10,
                                fontWeight: 700,
                                color: '#b45309',
                                background: '#fef3c7',
                                padding: '1px 6px',
                                borderRadius: 10,
                              }}
                            >
                              <Sparkles size={10} /> Vedette
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {isActif ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#10b981', background: '#ecfdf5', padding: '3px 8px', borderRadius: 12 }}>
                            <CheckCircle2 size={12} />
                            Active
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#ef4444', background: '#fef2f2', padding: '3px 8px', borderRadius: 12 }}>
                            <XCircle size={12} />
                            Suspendue
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedAgenceForForfait(a)}
                            title="Changer le forfait ou le sponsoring de l'agence"
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '4px 8px',
                              borderRadius: 6,
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              color: '#334155',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Crown size={12} color="#7c3aed" />
                            <span>Forfait</span>
                          </button>
                          <button
                            type="button"
                            disabled={loadingId === a.id}
                            onClick={() => handleToggleStatut(a)}
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '4px 10px',
                              borderRadius: 6,
                              border: `1px solid ${isActif ? '#fecaca' : '#a7f3d0'}`,
                              background: isActif ? '#fef2f2' : '#ecfdf5',
                              color: isActif ? '#b91c1c' : '#047857',
                              cursor: 'pointer',
                            }}
                          >
                            {loadingId === a.id ? '...' : isActif ? 'Suspendre' : 'Activer'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Changement Forfait Agence */}
      <ModalForfaitAgence
        isOpen={Boolean(selectedAgenceForForfait)}
        onClose={() => setSelectedAgenceForForfait(null)}
        agence={selectedAgenceForForfait}
        onSuccess={handleForfaitUpdated}
      />
    </div>
  )
}
