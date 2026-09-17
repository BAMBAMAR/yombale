'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Home,
  Building2,
  MapPin,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  DollarSign,
  Tag,
} from 'lucide-react'
import { fcfa } from '@/lib/format'
import { adminModererBien } from '@/app/actions/admin'

interface BiensImmoClientProps {
  initialBiens: any[]
  total: number
}

export default function BiensImmoClient({ initialBiens, total }: BiensImmoClientProps) {
  const [biens, setBiens] = useState(initialBiens)
  const [filterStatut, setFilterStatut] = useState<'tous' | 'disponible' | 'loue' | 'vendu'>('tous')
  const [search, setSearch] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleStatutChange = async (bienId: string, newStatut: string) => {
    setLoadingId(bienId)
    try {
      const res = await adminModererBien(bienId, { statut: newStatut })
      if (res.success) {
        setBiens((prev) =>
          prev.map((b) => (b.id === bienId ? { ...b, statut_occupation: newStatut } : b))
        )
      } else {
        alert(res.error || 'Erreur lors de la mise à jour')
      }
    } finally {
      setLoadingId(null)
    }
  }

  const filtered = biens.filter((b) => {
    if (filterStatut !== 'tous' && b.statut_occupation !== filterStatut) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        b.titre?.toLowerCase().includes(q) ||
        b.reference?.toLowerCase().includes(q) ||
        b.agence_nom?.toLowerCase().includes(q) ||
        b.ville?.toLowerCase().includes(q) ||
        b.quartier?.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="admin-page-container">
      {/* En-tête Métier */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)', margin: '0 0 6px' }}>
            Parc Biens Immobiliers & Baux
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>
            Supervision du patrimoine immobilier géré par les agences, états locatifs et mandats de vente.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            href="/admin/immo/agences"
            className="btn-npl"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px', background: '#f1f5f9', color: 'var(--navy)', border: '1px solid var(--border)' }}
          >
            <Building2 size={14} />
            <span>Voir agences</span>
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

      {/* Barre de Filtres & Recherche */}
      <div style={{ background: '#ffffff', padding: 16, borderRadius: 10, border: '1px solid var(--border)', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setFilterStatut('tous')}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: filterStatut === 'tous' ? 'var(--navy)' : '#ffffff',
              color: filterStatut === 'tous' ? '#ffffff' : 'var(--text1)',
              cursor: 'pointer',
            }}
          >
            Tous les biens ({biens.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatut('disponible')}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: filterStatut === 'disponible' ? 'var(--navy)' : '#ffffff',
              color: filterStatut === 'disponible' ? '#ffffff' : 'var(--text1)',
              cursor: 'pointer',
            }}
          >
            Disponibles
          </button>
          <button
            type="button"
            onClick={() => setFilterStatut('loue')}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: filterStatut === 'loue' ? 'var(--navy)' : '#ffffff',
              color: filterStatut === 'loue' ? '#ffffff' : 'var(--text1)',
              cursor: 'pointer',
            }}
          >
            Loués
          </button>
          <button
            type="button"
            onClick={() => setFilterStatut('vendu')}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: filterStatut === 'vendu' ? 'var(--navy)' : '#ffffff',
              color: filterStatut === 'vendu' ? '#ffffff' : 'var(--text1)',
              cursor: 'pointer',
            }}
          >
            Vendus
          </button>
        </div>

        <div style={{ position: 'relative', minWidth: 260 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input
            type="text"
            placeholder="Rechercher bien, quartier, agence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid var(--border)',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Tableau des Biens */}
      <div style={{ background: '#ffffff', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: 'var(--text3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                <th style={{ padding: '12px 16px' }}>Bien & Référence</th>
                <th style={{ padding: '12px 16px' }}>Agence Gestionnaire</th>
                <th style={{ padding: '12px 16px' }}>Localisation</th>
                <th style={{ padding: '12px 16px' }}>Type & Statut</th>
                <th style={{ padding: '12px 16px' }}>Loyer / Prix de Vente</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text3)' }}>
                    Aucun bien immobilier correspondant aux critères.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => {
                  const statut = b.statut_occupation || 'disponible'
                  const prixAffiche = b.prix_location ? `${fcfa(b.prix_location)}/mois` : b.prix_vente ? fcfa(b.prix_vente) : '-'

                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{b.titre}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                          Ref : {b.reference || b.id?.slice(0, 8)}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text1)' }}>{b.agence_nom || 'Gestion Directe'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text2)', fontSize: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} color="var(--text3)" />
                          <span>{b.quartier ? `${b.quartier}, ${b.ville}` : b.ville || 'Dakar'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 11, color: 'var(--text1)' }}>
                            {b.type_bien || 'Appartement'}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 12,
                              background: statut === 'disponible' ? '#ecfdf5' : statut === 'loue' ? '#eff6ff' : '#fef2f2',
                              color: statut === 'disponible' ? '#10b981' : statut === 'loue' ? '#3b82f6' : '#ef4444',
                            }}
                          >
                            {statut}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--navy)' }}>
                        {prixAffiche}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <select
                          disabled={loadingId === b.id}
                          value={statut}
                          onChange={(e) => handleStatutChange(b.id, e.target.value)}
                          style={{
                            fontSize: 12,
                            padding: '4px 8px',
                            borderRadius: 6,
                            border: '1px solid var(--border)',
                            background: '#ffffff',
                            color: 'var(--text1)',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="disponible">Disponible</option>
                          <option value="loue">Loué</option>
                          <option value="vendu">Vendu</option>
                        </select>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
