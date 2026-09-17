'use client'

import React from 'react'
import { Bell, Edit3, FileCheck } from 'lucide-react'
import { AgenceTableTh } from '../../../components/AgenceTableTh'
import { LoyerEcheance } from './LoyerCardMobile'
import { getImmoAuthToken } from '@/lib/immo-auth'

export type LoyerItem = LoyerEcheance

interface TableLoyersDesktopProps {
  loyers: LoyerItem[]
  slug: string
  token?: string | null
  selectedIds: string[]
  currentSort: string
  sortDirection: 'asc' | 'desc'
  onSortColumn: (sortKey: string) => void
  onToggleSelect: (id: string) => void
  onSelectAll: () => void
  onEncaisser: (l: LoyerItem) => void
  onRelance: (id: string) => void
  onEditer: (l: LoyerItem) => void
}

export default function TableLoyersDesktop({
  loyers,
  slug,
  token,
  selectedIds,
  currentSort,
  sortDirection,
  onSortColumn,
  onToggleSelect,
  onSelectAll,
  onEncaisser,
  onRelance,
  onEditer,
}: TableLoyersDesktopProps) {
  const activeToken = token || (typeof window !== 'undefined' ? getImmoAuthToken() : null)
  const allSelected = loyers.length > 0 && selectedIds.length === loyers.length

  return (
    <div className="immo-desktop-only agence-table-wrapper">
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
              label="Période & Échéance"
              sortKey="date_asc"
              currentSort={currentSort}
              sortDirection={sortDirection}
              onSort={onSortColumn}
            />
            <AgenceTableTh
              label="Bien & Locataire"
              sortKey="locataire_asc"
              currentSort={currentSort}
              sortDirection={sortDirection}
              onSort={onSortColumn}
            />
            <AgenceTableTh
              label="Montant Dû"
              sortKey="montant_desc"
              currentSort={currentSort}
              sortDirection={sortDirection}
              onSort={onSortColumn}
            />
            <AgenceTableTh label="Statut" />
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loyers.map((l) => {
            const isSelected = selectedIds.includes(l.id)
            const isPaye = l.statut === 'paye'
            return (
              <tr key={l.id} className={isSelected ? 'selected' : ''}>
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(l.id)}
                    className="immo-checkbox"
                  />
                </td>
                <td>
                  <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{l.periode}</div>
                  <div style={{ fontSize: 11.5, color: '#64748B' }}>
                    Échéance : {new Date(l.date_echeance).toLocaleDateString('fr-FR')}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>{l.bien_titre}</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    {l.locataire_nom} {l.locataire_prenom || ''}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                    {Number(l.montant_du).toLocaleString('fr-FR')} FCFA
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${l.statut}`}>
                    {l.statut === 'paye' ? 'Payé' : l.statut === 'retard' ? 'En retard' : 'En attente'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    {!isPaye && (
                      <button
                        type="button"
                        onClick={() => onEncaisser(l)}
                        className="btn-npl"
                        style={{
                          padding: '5px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          background: 'var(--accent, #C75B00)',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Encaisser
                      </button>
                    )}

                    {!isPaye && l.locataire_tel && (
                      <button
                        type="button"
                        onClick={() => onRelance(l.id)}
                        title="Envoyer relance"
                        style={{
                          padding: '5px 8px',
                          borderRadius: 6,
                          background: '#F1F5F9',
                          border: '1px solid #CBD5E1',
                          cursor: 'pointer',
                        }}
                      >
                        <Bell size={13} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onEditer(l)}
                      title="Modifier montant / date"
                      style={{
                        padding: '5px 8px',
                        borderRadius: 6,
                        background: '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        cursor: 'pointer',
                      }}
                    >
                      <Edit3 size={13} />
                    </button>

                    {isPaye && (
                      <a
                        href={`/api/locatif-immo/agence/${slug}/loyers/${l.id}/quittance${
                          activeToken ? `?token=${encodeURIComponent(activeToken)}` : ''
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Quittance certifiée PDF"
                        style={{
                          padding: '5px 8px',
                          borderRadius: 6,
                          background: '#DCFCE7',
                          color: '#166534',
                          border: '1px solid #BBF7D0',
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        <FileCheck size={13} />
                      </a>
                    )}
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
