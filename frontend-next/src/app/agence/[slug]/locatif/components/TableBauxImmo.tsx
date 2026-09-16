'use client'

import React from 'react'
import { Key, Plus, FileText } from 'lucide-react'
import { getImmoAuthToken } from '@/lib/immo-auth'

export interface BailItem {
  id: string
  bien_titre: string
  locataire_nom: string
  locataire_prenom?: string
  locataire_tel?: string
  loyer_mensuel: number
  charges: number
  depot_garantie?: number
  date_debut: string
  date_fin?: string
  statut: string
  nb_impayes?: number
}

interface TableBauxImmoProps {
  slug: string
  baux: BailItem[]
  onNouveauBail: () => void
}

export default function TableBauxImmo({ slug, baux, onNouveauBail }: TableBauxImmoProps) {
  if (baux.length === 0) {
    return (
      <div className="agence-card" style={{ textAlign: 'center', padding: '50px 20px', color: '#64748B' }}>
        <Key size={36} style={{ margin: '0 auto 12px', opacity: 0.5, color: 'var(--accent, #C75B00)' }} />
        <p style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 17 }}>Aucun bail enregistré</p>
        <p style={{ fontSize: 13.5, maxWidth: 450, margin: '6px auto 16px' }}>
          Associez un locataire à un bien immobilier pour créer votre premier contrat de bail locatif.
        </p>
        <button
          type="button"
          onClick={onNouveauBail}
          className="agence-btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '0 auto' }}
        >
          <Plus size={16} />
          <span>Nouveau Contrat de Bail</span>
        </button>
      </div>
    )
  }

  const token = getImmoAuthToken()

  return (
    <div className="agence-table-wrapper">
      <table className="agence-table">
        <thead>
          <tr>
            <th>Bien Loué</th>
            <th>Locataire</th>
            <th>Loyer Mensuel</th>
            <th>Période du Bail</th>
            <th>Statut</th>
            <th style={{ textAlign: 'right' }}>Contrat PDF</th>
          </tr>
        </thead>
        <tbody>
          {baux.map(b => {
            const bailPdfUrl = `/api/agences/agence/${slug}/documents/bail/${b.id}.pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`
            return (
              <tr key={b.id}>
                <td>
                  <div style={{ fontWeight: 750, color: 'var(--navy, #1C2B4A)' }}>{b.bien_titre}</div>
                </td>
                <td>
                  <div style={{ fontWeight: 700 }}>
                    {b.locataire_nom} {b.locataire_prenom || ''}
                  </div>
                  {b.locataire_tel && <div style={{ fontSize: 12, color: '#64748B' }}>{b.locataire_tel}</div>}
                </td>
                <td>
                  <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                    {Number(b.loyer_mensuel).toLocaleString('fr-FR')} FCFA
                  </div>
                  {b.charges > 0 && (
                    <div style={{ fontSize: 11.5, color: '#64748B' }}>
                      + {Number(b.charges).toLocaleString('fr-FR')} FCFA ch.
                    </div>
                  )}
                </td>
                <td>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                    Du {new Date(b.date_debut).toLocaleDateString('fr-FR')}
                  </div>
                  {b.date_fin && (
                    <div style={{ fontSize: 11.5, color: '#64748B' }}>
                      au {new Date(b.date_fin).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </td>
                <td>
                  <span className="status-badge actif">{b.statut || 'Actif'}</span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <a
                    href={bailPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '6px 12px',
                      borderRadius: 6,
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      color: 'var(--navy, #1C2B4A)',
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                    title="Télécharger le Contrat de Bail officiel"
                  >
                    <FileText size={13} />
                    <span>Contrat PDF</span>
                  </a>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
