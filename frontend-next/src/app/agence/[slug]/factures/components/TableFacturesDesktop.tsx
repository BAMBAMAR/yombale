'use client'

import React from 'react'
import { Eye, Check, Download } from 'lucide-react'
import AgenceTableTh from '@/app/agence/components/AgenceTableTh'
import { FactureItem } from './ModalApercuFactureImmo'
import { getImmoAuthToken } from '@/lib/immo-auth'

export type { FactureItem }

interface TableFacturesDesktopProps {
  factures: FactureItem[]
  slug: string
  token?: string | null
  selectedIds: string[]
  currentSort: string
  sortDirection: 'asc' | 'desc'
  onSortColumn: (sortKey: string) => void
  onToggleSelect: (id: string) => void
  onSelectAll: () => void
  onSelectFacture: (f: FactureItem) => void
  onEncaisserFacture: (id: string) => void
}

export default function TableFacturesDesktop({
  factures,
  slug,
  token,
  selectedIds,
  currentSort,
  sortDirection,
  onSortColumn,
  onToggleSelect,
  onSelectAll,
  onSelectFacture,
  onEncaisserFacture,
}: TableFacturesDesktopProps) {
  const activeToken = token || (typeof window !== 'undefined' ? getImmoAuthToken() : null)
  const allSelected = factures.length > 0 && selectedIds.length === factures.length

  return (
    <div className="agence-table-wrapper">
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
              label="Facture & Date"
              field="date_emission"
              currentSortField={currentSort}
              sortOrder={sortDirection}
              onSort={onSortColumn}
            />
            <AgenceTableTh
              label="Client & Bien"
              field="client_nom"
              currentSortField={currentSort}
              sortOrder={sortDirection}
              onSort={onSortColumn}
            />
            <AgenceTableTh
              label="Montant TTC"
              field="montant_ttc"
              currentSortField={currentSort}
              sortOrder={sortDirection}
              onSort={onSortColumn}
            />
            <AgenceTableTh
              label="Statut"
              field="statut"
              currentSortField={currentSort}
              sortOrder={sortDirection}
              onSort={onSortColumn}
            />
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {factures.map((f) => {
            const isSelected = selectedIds.includes(f.id)
            const isPayee = f.statut === 'payee'
            return (
              <tr key={f.id} className={isSelected ? 'selected' : ''}>
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(f.id)}
                    className="immo-checkbox"
                  />
                </td>
                <td>
                  <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{f.numero_facture}</div>
                  <div style={{ fontSize: 11.5, color: '#64748B' }}>
                    Émise le {new Date(f.date_emission).toLocaleDateString('fr-FR')}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>{f.client_nom}</div>
                  {f.bien_titre && <div style={{ fontSize: 12, color: '#64748B' }}>{f.bien_titre}</div>}
                </td>
                <td>
                  <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                    {Number(f.montant_ttc).toLocaleString('fr-FR')} FCFA
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B' }}>
                    HT : {Number(f.montant_ht).toLocaleString('fr-FR')} FCFA
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${f.statut}`}>
                    {f.statut === 'payee' ? 'Payée' : f.statut === 'emise' ? 'Émise' : 'Annulée'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => onSelectFacture(f)}
                      title="Aperçu Facture"
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        background: '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        cursor: 'pointer',
                        color: 'var(--navy, #1C2B4A)',
                      }}
                    >
                      <Eye size={14} />
                    </button>

                    {!isPayee && (
                      <button
                        type="button"
                        onClick={() => onEncaisserFacture(f.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '6px 10px',
                          borderRadius: 6,
                          background: '#DCFCE7',
                          color: '#166534',
                          border: 'none',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Check size={13} />
                        <span>Encaisser</span>
                      </button>
                    )}

                    <a
                      href={`/api/factures-immo/agence/${slug}/${f.id}/pdf${
                        activeToken ? `?token=${encodeURIComponent(activeToken)}` : ''
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Télécharger Facture PDF"
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        background: '#F8F5F0',
                        border: '1px solid var(--border, #E8DDD2)',
                        color: 'var(--navy, #1C2B4A)',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      <Download size={13} />
                    </a>
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
