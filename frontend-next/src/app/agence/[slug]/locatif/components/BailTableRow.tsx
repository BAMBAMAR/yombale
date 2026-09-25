'use client'

import React from 'react'
import { FileText, Edit2, XCircle } from 'lucide-react'
import { BailItem } from './TableBauxImmo'

interface BailTableRowProps {
  bail: BailItem
  isSelected: boolean
  slug: string
  token: string | null
  onToggleSelect: (id: string) => void
  onEditer: (bail: BailItem) => void
  onResilier: (bail: BailItem) => void
}

export default function BailTableRow({
  bail: b,
  isSelected,
  slug,
  token,
  onToggleSelect,
  onEditer,
  onResilier,
}: BailTableRowProps) {
  const isActif = b.statut === 'actif'
  const bailPdfUrl = `/api/agences/agence/${slug}/documents/bail/${b.id}.pdf${
    token ? `?token=${encodeURIComponent(token)}` : ''
  }`

  return (
    <tr className={isSelected ? 'selected' : ''}>
      <td style={{ textAlign: 'center' }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(b.id)}
          className="immo-checkbox"
        />
      </td>
      <td>
        <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{b.bien_titre}</div>
      </td>
      <td>
        <div style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
          {b.locataire_nom} {b.locataire_prenom || ''}
        </div>
        {b.locataire_tel && (
          <div style={{ fontSize: 11.5, color: '#64748B' }}>{b.locataire_tel}</div>
        )}
      </td>
      <td>
        <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
          {Number(b.loyer_mensuel).toLocaleString('fr-FR')} FCFA
        </div>
        {Number(b.charges) > 0 && (
          <div style={{ fontSize: 11.5, color: '#64748B' }}>
            + {Number(b.charges).toLocaleString('fr-FR')} FCFA charges
          </div>
        )}
      </td>
      <td>
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>
          Début : {new Date(b.date_debut).toLocaleDateString('fr-FR')}
        </div>
        {b.date_fin && (
          <div style={{ fontSize: 11.5, color: '#64748B' }}>
            Fin : {new Date(b.date_fin).toLocaleDateString('fr-FR')}
          </div>
        )}
      </td>
      <td>
        <span className={`status-badge ${b.statut}`}>
          {b.statut === 'actif' ? 'En cours' : b.statut === 'resilie' ? 'Résilié' : b.statut}
        </span>
      </td>
      <td style={{ textAlign: 'right' }}>
        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <a
            href={bailPdfUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 10px',
              borderRadius: 6,
              background: '#F1F5F9',
              color: 'var(--navy, #1C2B4A)',
              border: '1px solid #CBD5E1',
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <FileText size={13} />
            <span>Contrat</span>
          </a>

          {isActif && (
            <>
              <button
                type="button"
                onClick={() => onEditer(b)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 10px',
                  borderRadius: 6,
                  background: '#FAF8F5',
                  color: 'var(--navy, #1C2B4A)',
                  border: '1px solid var(--border, #E8DDD2)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Edit2 size={13} />
                <span>Éditer</span>
              </button>

              <button
                type="button"
                onClick={() => onResilier(b)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 10px',
                  borderRadius: 6,
                  background: '#FFF1F2',
                  color: '#E11D48',
                  border: '1px solid #FECDD3',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <XCircle size={13} />
                <span>Résilier</span>
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}
