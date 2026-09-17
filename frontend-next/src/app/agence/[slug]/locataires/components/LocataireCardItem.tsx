'use client'

import React from 'react'
import { AlertTriangle, Building2, Phone, Mail, Pencil, MessageCircle } from 'lucide-react'

export interface LocataireItem {
  id: string
  nom: string
  prenom?: string
  email?: string
  telephone?: string
  cni_numero?: string
  profession?: string
  employeur?: string
  revenu_mensuel?: number
  bien_titre?: string
  bien_id?: string
  bail_id?: string
  nb_impayes?: number
}

interface LocataireCardItemProps {
  locataire: LocataireItem
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onEdit: (loc: LocataireItem) => void
}

export default function LocataireCardItem({
  locataire,
  isSelected,
  onToggleSelect,
  onEdit,
}: LocataireCardItemProps) {
  const cleanTel = (locataire.telephone || '').replace(/\D/g, '')

  return (
    <div
      className="agence-card"
      style={{
        padding: 16,
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(locataire.id)}
              className="immo-checkbox"
            />
            <div>
              <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 15.5 }}>
                {locataire.nom} {locataire.prenom || ''}
              </div>
              {locataire.profession && (
                <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 500 }}>{locataire.profession}</span>
              )}
            </div>
          </div>

          {Number(locataire.nb_impayes || 0) > 0 ? (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 4,
                background: '#FEE2E2',
                color: '#DC2626',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <AlertTriangle size={12} /> {locataire.nb_impayes} impayé(s)
            </span>
          ) : (
            <span className="status-badge actif">À jour</span>
          )}
        </div>

        {/* Bien rattaché */}
        {locataire.bien_titre && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: 'var(--navy, #1C2B4A)',
              fontWeight: 600,
              background: '#FAF8F5',
              padding: '5px 8px',
              borderRadius: 6,
              marginBottom: 10,
            }}
          >
            <Building2 size={13} color="var(--accent, #C75B00)" />
            <span>{locataire.bien_titre}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#475569', marginBottom: 12 }}>
          {locataire.telephone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Phone size={13} color="var(--navy, #1C2B4A)" />
              <a href={`tel:${locataire.telephone}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}>
                {locataire.telephone}
              </a>
            </div>
          )}
          {locataire.email && <div style={{ fontSize: 12, color: '#64748B' }}>{locataire.email}</div>}
        </div>
      </div>

      {/* Actions Locataire */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border, #E8DDD2)' }}>
        <button
          type="button"
          onClick={() => onEdit(locataire)}
          title="Modifier"
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            background: '#F8F5F0',
            color: 'var(--navy, #1C2B4A)',
            border: '1px solid var(--border, #E8DDD2)',
            cursor: 'pointer',
          }}
        >
          <Pencil size={14} />
        </button>

        {locataire.telephone && (
          <a
            href={`tel:${locataire.telephone}`}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '8px 12px',
              borderRadius: 6,
              background: '#FAF8F5',
              color: 'var(--navy, #1C2B4A)',
              fontWeight: 600,
              fontSize: 12.5,
              textDecoration: 'none',
              border: '1px solid var(--border, #E8DDD2)',
            }}
          >
            <Phone size={13} />
            <span>Appeler</span>
          </a>
        )}

        {cleanTel && (
          <a
            href={`https://wa.me/${cleanTel}?text=${encodeURIComponent(
              `Bonjour ${locataire.prenom ? `${locataire.prenom} ` : ''}${locataire.nom}, votre agence immobilière vous contacte.`
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
              borderRadius: 6,
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
      </div>
    </div>
  )
}
