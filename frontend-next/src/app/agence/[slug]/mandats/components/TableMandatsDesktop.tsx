'use client'

import React from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, FileText, Sparkles } from 'lucide-react'
import AgenceTableTh from '@/app/agence/components/AgenceTableTh'

export interface MandatItem {
  id: string
  bien_id: string
  proprietaire_id: string
  type_mandat: string
  type_operation: string
  date_debut: string
  date_fin?: string
  duree_mois: number
  taux_commission?: number
  montant_commission_fixe?: number
  conditions?: string
  statut: string
  expire_bientot?: boolean
  jours_restants?: number | null
  bien_titre: string
  bien_quartier?: string
  bien_ville?: string
  bien_images?: string[]
  proprietaire_nom: string
  proprietaire_telephone?: string
  agent_nom?: string
  agent_prenom?: string
}

interface TableMandatsDesktopProps {
  mandats: MandatItem[]
  slug: string
  token: string | null
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  sortField: string
  sortOrder: 'asc' | 'desc'
  onSortChange: (field: string) => void
}

export default function TableMandatsDesktop({
  mandats,
  slug,
  token,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  sortField,
  sortOrder,
  onSortChange,
}: TableMandatsDesktopProps) {
  const allSelected = mandats.length > 0 && mandats.every((m) => selectedIds.has(m.id))
  const someSelected = mandats.some((m) => selectedIds.has(m.id))

  return (
    <div className="agence-table-wrapper">
      <table className="agence-table">
        <thead>
          <tr>
            <th style={{ width: 44, textAlign: 'center' }}>
              <input
                type="checkbox"
                className="immo-checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = !allSelected && someSelected
                }}
                onChange={onToggleSelectAll}
                aria-label="Tout sélectionner"
              />
            </th>
            <AgenceTableTh
              label="Bien & Opération"
              field="bien_titre"
              currentSortField={sortField}
              sortOrder={sortOrder}
              onSort={onSortChange}
            />
            <AgenceTableTh
              label="Propriétaire Mandant"
              field="proprietaire_nom"
              currentSortField={sortField}
              sortOrder={sortOrder}
              onSort={onSortChange}
            />
            <AgenceTableTh
              label="Type & Validité"
              field="date_fin"
              currentSortField={sortField}
              sortOrder={sortOrder}
              onSort={onSortChange}
            />
            <AgenceTableTh
              label="Honoraires"
              field="taux_commission"
              currentSortField={sortField}
              sortOrder={sortOrder}
              onSort={onSortChange}
            />
            <AgenceTableTh
              label="Statut"
              field="statut"
              currentSortField={sortField}
              sortOrder={sortOrder}
              onSort={onSortChange}
            />
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {mandats.map((m) => {
            const isSelected = selectedIds.has(m.id)
            return (
              <tr key={m.id} className={isSelected ? 'selected' : ''}>
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    className="immo-checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(m.id)}
                    aria-label={`Sélectionner mandat ${m.bien_titre}`}
                  />
                </td>
                <td>
                  <Link
                    href={`/agence/${slug}/biens/${m.bien_id}`}
                    style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', textDecoration: 'none', display: 'block' }}
                  >
                    {m.bien_titre}
                  </Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: m.type_operation === 'vente' ? '#fef3c7' : '#e0f2fe',
                        color: m.type_operation === 'vente' ? '#92400e' : '#0369a1',
                        textTransform: 'uppercase',
                      }}
                    >
                      {m.type_operation}
                    </span>
                    <span style={{ fontSize: 11.5, color: '#64748b' }}>
                      {m.bien_quartier ? `${m.bien_quartier}, ` : ''}
                      {m.bien_ville}
                    </span>
                  </div>
                </td>

                <td>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{m.proprietaire_nom}</div>
                  {m.proprietaire_telephone && (
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      {m.proprietaire_telephone}
                    </div>
                  )}
                </td>

                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        fontWeight: 750,
                        fontSize: 12,
                        color: m.type_mandat === 'exclusif' ? '#15803d' : '#334155',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {m.type_mandat === 'exclusif' && <Sparkles size={13} color="#15803d" />}
                      <span>
                        {m.type_mandat === 'exclusif'
                          ? 'Exclusif'
                          : m.type_mandat === 'co_exclusif'
                          ? 'Co-exclusif'
                          : 'Simple'}
                      </span>
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 3 }}>
                    Du {new Date(m.date_debut).toLocaleDateString('fr-FR')} au{' '}
                    {m.date_fin ? new Date(m.date_fin).toLocaleDateString('fr-FR') : 'Indéterminée'}
                  </div>
                  {m.expire_bientot && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        marginTop: 4,
                        color: '#b45309',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      <AlertTriangle size={12} />
                      <span>Expire dans {m.jours_restants}j</span>
                    </div>
                  )}
                </td>

                <td>
                  {m.taux_commission ? (
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{m.taux_commission}%</div>
                  ) : m.montant_commission_fixe ? (
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>
                      {Number(m.montant_commission_fixe).toLocaleString('fr-FR')} F
                    </div>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>Non défini</span>
                  )}
                </td>

                <td>
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: m.statut === 'actif' ? '#f0fdf4' : m.statut === 'expire' ? '#fef2f2' : '#f1f5f9',
                      color: m.statut === 'actif' ? '#166534' : m.statut === 'expire' ? '#dc2626' : '#475569',
                    }}
                  >
                    {m.statut === 'actif' ? 'En vigueur' : m.statut === 'expire' ? 'Expiré' : m.statut === 'resilie' ? 'Résilié' : m.statut}
                  </span>
                </td>

                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                    <a
                      href={`/api/agences/agence/${slug}/documents/mandat/${m.id}.pdf${
                        token ? `?token=${encodeURIComponent(token)}` : ''
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Télécharger le Mandat officiel PDF"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '5px 9px',
                        borderRadius: 6,
                        background: '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        color: 'var(--navy, #1C2B4A)',
                        fontSize: 11.5,
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      <FileText size={12} />
                      <span>PDF</span>
                    </a>

                    <Link
                      href={`/agence/${slug}/biens/${m.bien_id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--accent, #C75B00)',
                        textDecoration: 'none',
                      }}
                    >
                      <span>Fiche</span>
                      <ArrowRight size={13} />
                    </Link>
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
