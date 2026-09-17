'use client'

import React from 'react'
import { Phone, Mail, Pencil, FileText, MessageCircle } from 'lucide-react'

export interface ProprietaireItem {
  id: string
  nom: string
  prenom?: string
  email?: string
  telephone?: string
  whatsapp?: string
  type_bailleur: string
  adresse?: string
  nb_biens_total: number
}

interface BailleurCardItemProps {
  bailleur: ProprietaireItem
  slug: string
  token: string | null
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onEdit: (b: ProprietaireItem) => void
}

export default function BailleurCardItem({
  bailleur,
  slug,
  token,
  isSelected,
  onToggleSelect,
  onEdit,
}: BailleurCardItemProps) {
  const decomptePdfUrl = `/api/agences/agence/${slug}/documents/decompte-bailleur/${bailleur.id}.pdf${
    token ? `?token=${encodeURIComponent(token)}` : ''
  }`

  const cleanWa = (bailleur.whatsapp || bailleur.telephone || '').replace(/\D/g, '')

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
        background: '#FFFFFF',
        boxShadow: isSelected ? '0 4px 12px rgba(199, 91, 0, 0.1)' : undefined,
        transition: 'all 0.15s ease',
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(bailleur.id)}
              className="immo-checkbox"
            />
            <div>
              <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 15.5 }}>
                {bailleur.nom} {bailleur.prenom || ''}
              </div>
              <span style={{ fontSize: 12, color: '#64748B', textTransform: 'capitalize', fontWeight: 500 }}>
                {bailleur.type_bailleur || 'Particulier'}
              </span>
            </div>
          </div>

          <div
            style={{
              padding: '4px 8px',
              borderRadius: 8,
              background: '#FAF8F5',
              border: '1px solid var(--border, #E8DDD2)',
              fontSize: 12,
              fontWeight: 750,
              color: 'var(--navy, #1C2B4A)',
            }}
          >
            {bailleur.nb_biens_total} bien(s)
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: '#475569', marginBottom: 14 }}>
          {bailleur.telephone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Phone size={13} color="var(--navy, #1C2B4A)" />
              <a href={`tel:${bailleur.telephone}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}>
                {bailleur.telephone}
              </a>
            </div>
          )}
          {bailleur.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={13} color="#64748B" />
              <span style={{ color: '#64748B' }}>{bailleur.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Barre d'Actions Bailleurs */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          paddingTop: 12,
          borderTop: '1px solid var(--border, #E8DDD2)',
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          onClick={() => onEdit(bailleur)}
          title="Modifier les coordonnées"
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: '#F8F5F0',
            border: '1px solid var(--border, #E8DDD2)',
            color: 'var(--navy, #1C2B4A)',
            cursor: 'pointer',
          }}
        >
          <Pencil size={14} />
        </button>

        {cleanWa && (
          <a
            href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(
              `Bonjour ${bailleur.prenom ? `${bailleur.prenom} ` : ''}${bailleur.nom}, votre gestionnaire de portefeuille immobilier vous contacte.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '8px 12px',
              borderRadius: 8,
              background: '#25D366',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 12.5,
              textDecoration: 'none',
            }}
          >
            <MessageCircle size={14} />
            <span>WhatsApp</span>
          </a>
        )}

        <a
          href={decomptePdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Télécharger le décompte de gérance (PDF)"
          style={{
            flex: 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px 12px',
            borderRadius: 8,
            background: '#F8F5F0',
            border: '1px solid var(--border, #E8DDD2)',
            color: 'var(--navy, #1C2B4A)',
            fontWeight: 600,
            fontSize: 12.5,
            textDecoration: 'none',
          }}
        >
          <FileText size={13} />
          <span>Décompte</span>
        </a>
      </div>
    </div>
  )
}
