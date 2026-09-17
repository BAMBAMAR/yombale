'use client'

import React from 'react'
import {
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  CheckCircle2,
  Calendar,
  Navigation
} from 'lucide-react'

export interface VisiteItem {
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

interface VisiteCardMobileProps {
  visite: VisiteItem
  onUpdateStatut: (id: string, statut: string) => void
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
}

export function VisiteCardMobile({
  visite,
  onUpdateStatut,
  isSelected = false,
  onToggleSelect,
}: VisiteCardMobileProps) {
  const d = new Date(visite.date_visite)
  const dateFormatee = !isNaN(d.getTime())
    ? d.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : visite.date_visite

  const nomClient = `${visite.contact_nom} ${visite.contact_prenom || ''}`.trim()
  const telNet = (visite.contact_tel || '').replace(/[^0-9]/g, '')
  const waMsg = `Bonjour ${nomClient}, nous vous confirmons votre visite le ${dateFormatee} pour le bien "${visite.bien_titre}" situé à ${visite.bien_quartier ? `${visite.bien_quartier}, ` : ''}${visite.bien_ville}.`

  const statutBadgeColors: Record<string, { bg: string; color: string; label: string }> = {
    confirmee: { bg: '#E0F2FE', color: '#0369A1', label: 'Confirmée' },
    realisee: { bg: '#DCFCE7', color: '#166534', label: 'Réalisée' },
    annulee: { bg: '#FEE2E2', color: '#991B1B', label: 'Annulée' },
    demande: { bg: '#FEF3C7', color: '#92400E', label: 'Demande en attente' },
  }
  const badge = statutBadgeColors[visite.statut] || { bg: '#F1F5F9', color: '#475569', label: visite.statut }

  return (
    <div
      className="agence-card"
      style={{
        padding: 14,
        marginBottom: 10,
        borderRadius: 12,
        border: isSelected ? '2px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
        background: '#FFFFFF',
        boxShadow: isSelected ? '0 4px 12px rgba(199, 91, 0, 0.1)' : undefined,
      }}
    >
      {/* ── Checkbox + Heure & Statut ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 13.5 }}>
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(visite.id)}
              className="immo-checkbox"
            />
          )}
          <Clock size={15} color="var(--accent, #C75B00)" />
          <span>{dateFormatee}</span>
          <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>({visite.duree_min} min)</span>
        </div>

        <span
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: 8,
            background: badge.bg,
            color: badge.color,
          }}
        >
          {badge.label}
        </span>
      </div>

      {/* ── Bien concerné & Lieu ── */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 750, color: 'var(--navy, #1C2B4A)' }}>
          {visite.bien_titre}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748B', fontSize: 12, marginTop: 2 }}>
          <MapPin size={13} color="var(--accent, #C75B00)" />
          <span>{visite.bien_quartier ? `${visite.bien_quartier}, ${visite.bien_ville}` : visite.bien_ville}</span>
          {visite.lieu_rdv && <span style={{ color: '#94A3B8' }}>• RDV : {visite.lieu_rdv}</span>}
        </div>
      </div>

      {/* ── Prospect & Agent ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, fontSize: 12 }}>
        <div style={{ fontWeight: 700, color: '#334155' }}>
          Prospect : <span style={{ color: 'var(--navy, #1C2B4A)' }}>{nomClient}</span>
        </div>
        {visite.agent_nom && (
          <div style={{ color: '#64748B' }}>
            Agent : {visite.agent_nom}
          </div>
        )}
      </div>

      {/* ── Actions Tactiles ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingTop: 10,
          borderTop: '1px solid var(--border, #E8DDD2)',
        }}
      >
        {/* Appel téléphonique */}
        {telNet && (
          <a
            href={`tel:${visite.contact_tel}`}
            style={{
              flex: 1,
              padding: '7px 10px',
              borderRadius: 8,
              background: '#FAF8F5',
              border: '1px solid var(--border, #E8DDD2)',
              color: 'var(--navy, #1C2B4A)',
              fontSize: 12,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              textDecoration: 'none',
              minHeight: 38,
            }}
          >
            <Phone size={13} />
            <span>Appeler</span>
          </a>
        )}

        {/* WhatsApp confirmation */}
        {telNet && (
          <a
            href={`https://wa.me/${telNet}?text=${encodeURIComponent(waMsg)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1.2,
              padding: '7px 10px',
              borderRadius: 8,
              background: 'rgba(22, 163, 74, 0.1)',
              border: '1px solid rgba(22, 163, 74, 0.3)',
              color: '#166534',
              fontSize: 12,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              textDecoration: 'none',
              minHeight: 38,
            }}
            title="Envoyer confirmation sur WhatsApp"
          >
            <MessageCircle size={14} />
            <span>WhatsApp</span>
          </a>
        )}

        {/* Marquer réalisée */}
        {visite.statut !== 'realisee' && (
          <button
            type="button"
            onClick={() => onUpdateStatut(visite.id, 'realisee')}
            style={{
              padding: '7px 12px',
              borderRadius: 8,
              background: 'var(--navy, #1C2B4A)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              minHeight: 38,
            }}
          >
            <CheckCircle2 size={13} />
            <span>Réalisée</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default VisiteCardMobile
