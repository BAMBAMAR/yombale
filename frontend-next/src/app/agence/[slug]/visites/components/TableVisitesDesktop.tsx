'use client'

import React from 'react'
import { Clock, MapPin, Phone, MessageCircle } from 'lucide-react'
import AgenceTableTh from '@/app/agence/components/AgenceTableTh'

export interface Visite {
  id: string
  date_visite: string
  duree_min: number
  lieu_rdv?: string
  statut: string
  resultat?: string
  bien_titre: string
  bien_quartier?: string
  bien_ville: string
  contact_nom: string
  contact_prenom?: string
  contact_tel?: string
  agent_nom?: string
}

interface TableVisitesDesktopProps {
  visites: Visite[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onUpdateStatut: (id: string, statut: string) => void
  sortField: string
  sortOrder: 'asc' | 'desc'
  onSortChange: (field: string) => void
}

export default function TableVisitesDesktop({
  visites,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onUpdateStatut,
  sortField,
  sortOrder,
  onSortChange,
}: TableVisitesDesktopProps) {
  const allSelected = visites.length > 0 && visites.every((v) => selectedIds.has(v.id))
  const someSelected = visites.some((v) => selectedIds.has(v.id))

  return (
    <div className="agence-table-wrapper immo-desktop-only">
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
              label="Date & Heure"
              field="date_visite"
              currentSortField={sortField}
              sortOrder={sortOrder}
              onSort={onSortChange}
            />
            <AgenceTableTh
              label="Bien Immobilier"
              field="bien_titre"
              currentSortField={sortField}
              sortOrder={sortOrder}
              onSort={onSortChange}
            />
            <AgenceTableTh
              label="Prospect"
              field="contact_nom"
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
          {visites.map((v) => {
            const isSelected = selectedIds.has(v.id)
            const d = new Date(v.date_visite)
            const dateFormatee = !isNaN(d.getTime())
              ? d.toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : v.date_visite

            return (
              <tr key={v.id} className={isSelected ? 'selected' : ''}>
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    className="immo-checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(v.id)}
                    aria-label={`Sélectionner visite ${v.contact_nom}`}
                  />
                </td>
                <td>
                  <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={14} color="#64748B" />
                    {dateFormatee}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B' }}>Durée : {v.duree_min} min</div>
                </td>
                <td>
                  <div style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>{v.bien_titre}</div>
                  <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} />
                    {v.bien_quartier ? `${v.bien_quartier}, ${v.bien_ville}` : v.bien_ville}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 700 }}>
                    {v.contact_nom} {v.contact_prenom || ''}
                  </div>
                  {v.contact_tel && (
                    <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Phone size={11} />
                      {v.contact_tel}
                    </div>
                  )}
                </td>
                <td>
                  <span className={`status-badge ${v.statut}`}>
                    {v.statut === 'confirmee' ? 'Confirmée' : v.statut === 'realisee' ? 'Réalisée' : v.statut === 'annulee' ? 'Annulée' : v.statut}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
                    {v.contact_tel && (
                      <a
                        href={`https://wa.me/${(v.contact_tel || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Bonjour ${v.contact_nom}, nous vous confirmons votre rendez-vous de visite pour le bien "${v.bien_titre}".`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '5px 8px',
                          borderRadius: 6,
                          background: 'rgba(22, 163, 74, 0.08)',
                          color: '#166534',
                          border: '1px solid rgba(22, 163, 74, 0.25)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textDecoration: 'none',
                        }}
                        title="Écrire sur WhatsApp"
                      >
                        <MessageCircle size={13} />
                      </a>
                    )}

                    {v.statut !== 'realisee' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatut(v.id, 'realisee')}
                        style={{
                          padding: '5px 10px',
                          borderRadius: 6,
                          background: '#DCFCE7',
                          color: '#166534',
                          border: 'none',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Réalisée
                      </button>
                    )}
                    {v.statut !== 'annulee' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatut(v.id, 'annulee')}
                        style={{
                          padding: '5px 10px',
                          borderRadius: 6,
                          background: '#FEE2E2',
                          color: '#991B1B',
                          border: 'none',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Annuler
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
  )
}
