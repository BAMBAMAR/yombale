'use client'

import React from 'react'
import { Check, CheckCircle2, Clock, Wrench } from 'lucide-react'

export interface TicketItem {
  id: string
  bien_id: string
  bien_titre: string
  bien_quartier?: string
  bien_ville?: string
  type: string
  description: string
  priorite: string
  statut: string
  demandeur: string
  technicien?: string
  cout_estime?: number
  cout_reel?: number
  a_charge_de: string
  date_signal: string
  date_resolution?: string
}

interface TicketMaintenanceCardProps {
  ticket: TicketItem
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onChangerStatut: (id: string, statut: string) => void
}

export default function TicketMaintenanceCard({
  ticket,
  isSelected,
  onToggleSelect,
  onChangerStatut,
}: TicketMaintenanceCardProps) {
  return (
    <div
      className="agence-card"
      style={{
        padding: 18,
        marginBottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        border: isSelected ? '2px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
        background: isSelected ? '#FDFBF7' : '#FFFFFF',
        borderRadius: 12,
        position: 'relative',
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="checkbox"
              className="immo-checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(ticket.id)}
              aria-label={`Sélectionner incident ${ticket.bien_titre}`}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                padding: '3px 8px',
                borderRadius: 4,
                background: ticket.priorite === 'urgente' ? '#FEE2E2' : '#F1F5F9',
                color: ticket.priorite === 'urgente' ? '#991B1B' : '#475569',
              }}
            >
              {ticket.type} • {ticket.priorite}
            </span>
          </div>

          <span className={`status-badge ${ticket.statut === 'resolu' ? 'actif' : 'pause'}`}>
            {ticket.statut === 'resolu' ? 'Résolu' : ticket.statut === 'en_cours' ? 'En cours' : 'Signalé'}
          </span>
        </div>

        <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 14.5, marginBottom: 4 }}>
          {ticket.bien_titre}
        </div>
        <div style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>
          {ticket.bien_quartier ? `${ticket.bien_quartier}, ${ticket.bien_ville}` : ticket.bien_ville}
        </div>

        <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>
          {ticket.description}
        </p>

        <div
          style={{
            fontSize: 12,
            color: '#64748B',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            padding: '10px',
            background: '#FAF8F5',
            borderRadius: 6,
            marginBottom: 14,
          }}
        >
          <div>
            <strong>Demandeur :</strong> {ticket.demandeur}
          </div>
          <div>
            <strong>Prise en charge :</strong> {ticket.a_charge_de === 'proprietaire' ? 'Bailleur' : 'Locataire'}
          </div>
          {ticket.cout_estime && (
            <div>
              <strong>Coût estimé :</strong> {Number(ticket.cout_estime).toLocaleString('fr-FR')} FCFA
            </div>
          )}
          {ticket.technicien && (
            <div>
              <strong>Artisan / Prestataire :</strong> {ticket.technicien}
            </div>
          )}
        </div>
      </div>

      {/* Actions de Statut */}
      <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border, #E8DDD2)', paddingTop: 12 }}>
        {ticket.statut !== 'en_cours' && ticket.statut !== 'resolu' && (
          <button
            type="button"
            onClick={() => onChangerStatut(ticket.id, 'en_cours')}
            style={{
              flex: 1,
              padding: '7px',
              borderRadius: 6,
              background: '#FAF8F5',
              border: '1px solid var(--border, #E8DDD2)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Démarrer travaux
          </button>
        )}
        {ticket.statut !== 'resolu' && (
          <button
            type="button"
            onClick={() => onChangerStatut(ticket.id, 'resolu')}
            style={{
              flex: 1,
              padding: '7px',
              borderRadius: 6,
              background: '#16a34a',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <Check size={14} />
            Marquer résolu
          </button>
        )}
      </div>
    </div>
  )
}
