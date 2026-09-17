'use client'

import React from 'react'
import { MapPin, Globe, Pencil, Copy, Trash2 } from 'lucide-react'
import { AgenceTableTh } from '../../../components/AgenceTableTh'
import { BienItem } from './BienCardMobile'

interface TableBiensDesktopProps {
  biens: BienItem[]
  selectedIds: string[]
  currentSort: string
  sortDirection: 'asc' | 'desc'
  onSortColumn: (key: string) => void
  onToggleSelect: (id: string) => void
  onSelectAll: () => void
  onEdit: (b: BienItem) => void
  onDupliquer: (id: string) => void
  onSupprimer: (id: string) => void
  onPublier: (id: string) => void
  publishingId: string | null
}

export default function TableBiensDesktop({
  biens,
  selectedIds,
  currentSort,
  sortDirection,
  onSortColumn,
  onToggleSelect,
  onSelectAll,
  onEdit,
  onDupliquer,
  onSupprimer,
  onPublier,
  publishingId,
}: TableBiensDesktopProps) {
  const allSelected = biens.length > 0 && selectedIds.length === biens.length

  return (
    <div className="agence-table-wrapper immo-desktop-only">
      <table className="agence-table">
        <thead>
          <tr>
            <th style={{ width: 42, textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onSelectAll}
                className="immo-checkbox"
                title="Tout sélectionner"
              />
            </th>
            <AgenceTableTh
              label="Bien & Référence"
              sortKey="titre_asc"
              currentSort={currentSort}
              sortDirection={sortDirection}
              onSort={onSortColumn}
            />
            <AgenceTableTh label="Type & Localisation" />
            <AgenceTableTh
              label="Prix"
              sortKey="prix_desc"
              currentSort={currentSort}
              sortDirection={sortDirection}
              onSort={onSortColumn}
            />
            <AgenceTableTh label="Occupation" />
            <AgenceTableTh label="Marketplace" />
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {biens.map((bien) => {
            const isSelected = selectedIds.includes(bien.id)
            const isPublie = Boolean(bien.annonce_publiee_id && bien.annonce_publiee_actif)

            return (
              <tr key={bien.id} className={isSelected ? 'selected' : ''}>
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(bien.id)}
                    className="immo-checkbox"
                  />
                </td>
                <td>
                  <div style={{ fontWeight: 750, color: 'var(--navy, #1C2B4A)' }}>{bien.titre}</div>
                  <div style={{ fontSize: 11.5, color: '#64748B' }}>{bien.reference}</div>
                </td>
                <td>
                  <div style={{ textTransform: 'capitalize', fontWeight: 600 }}>{bien.type_bien}</div>
                  <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} />
                    {bien.quartier ? `${bien.quartier}, ${bien.ville}` : bien.ville}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                    {bien.prix_location
                      ? `${Number(bien.prix_location).toLocaleString('fr-FR')} FCFA/mois`
                      : bien.prix_vente
                      ? `${Number(bien.prix_vente).toLocaleString('fr-FR')} FCFA`
                      : 'Sur demande'}
                  </div>
                  {bien.surface_m2 ? (
                    <div style={{ fontSize: 11.5, color: '#64748B' }}>{bien.surface_m2} m²</div>
                  ) : null}
                </td>
                <td>
                  <span className={`status-badge ${bien.statut_occupation}`}>{bien.statut_occupation}</span>
                </td>
                <td>
                  {isPublie ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        color: '#166534',
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      <Globe size={13} /> En ligne
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onPublier(bien.id)}
                      disabled={publishingId === bien.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: '#F1F5F9',
                        color: 'var(--navy, #1C2B4A)',
                        border: '1px solid #CBD5E1',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <Globe size={12} />
                      <span>Publier</span>
                    </button>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => onEdit(bien)}
                      title="Modifier"
                      style={{
                        padding: '5px 8px',
                        background: '#F1F5F9',
                        border: '1px solid #E2E8F0',
                        borderRadius: 6,
                        cursor: 'pointer',
                        color: 'var(--navy, #1C2B4A)',
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDupliquer(bien.id)}
                      title="Dupliquer"
                      style={{
                        padding: '5px 8px',
                        background: '#F1F5F9',
                        border: '1px solid #E2E8F0',
                        borderRadius: 6,
                        cursor: 'pointer',
                        color: '#64748B',
                      }}
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSupprimer(bien.id)}
                      title="Supprimer"
                      style={{
                        padding: '5px 8px',
                        background: '#FEE2E2',
                        border: '1px solid #FECACA',
                        borderRadius: 6,
                        cursor: 'pointer',
                        color: '#DC2626',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
