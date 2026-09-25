'use client'

import React from 'react'
import { AlertTriangle, Building2, Phone, Mail, Pencil, MessageCircle, Home, Layers } from 'lucide-react'

export interface BailSummary {
  bail_id: string
  bien_id: string
  bien_titre: string
  type_bien?: string
  quartier?: string
  ville?: string
  loyer_mensuel: number
  charges?: number
  depot_garantie?: number
  date_debut?: string
  date_fin?: string
  jour_echeance?: number
  statut: string
  nb_impayes?: number
}

export interface LocataireItem {
  id: string
  nom: string
  prenom?: string
  email?: string
  telephone?: string
  whatsapp?: string
  cni_numero?: string
  profession?: string
  employeur?: string
  revenu_mensuel?: number
  bien_titre?: string
  bien_id?: string
  bail_id?: string
  loyer_mensuel?: number
  nb_impayes?: number
  nb_baux?: number
  nb_baux_actifs?: number
  baux?: BailSummary[]
  notes?: string
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
  const cleanTel = (locataire.telephone || locataire.whatsapp || '').replace(/\D/g, '')
  const baux = Array.isArray(locataire.baux) ? locataire.baux : []
  const hasMultipleBaux = baux.length > 1
  const totalLoyer = baux.reduce((acc, b) => acc + (Number(b.loyer_mensuel) || 0), 0)

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
                {locataire.prenom ? `${locataire.prenom} ` : ''}{locataire.nom}
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

        {/* Biens rattachés (Simple ou Multiples) */}
        {hasMultipleBaux ? (
          <div
            style={{
              background: '#FAF8F5',
              padding: '8px 10px',
              borderRadius: 8,
              marginBottom: 10,
              border: '1px solid var(--border, #E8DDD2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                <Layers size={13} color="var(--accent, #C75B00)" />
                <span>{baux.length} biens associés</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--price, #0A5C36)' }}>
                Total: {Math.round(totalLoyer).toLocaleString('fr-FR')} F/m
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {baux.slice(0, 2).map((b, i) => (
                <div key={b.bail_id || i} style={{ fontSize: 11.5, color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 170 }}>
                    • {b.bien_titre}
                  </span>
                  <span style={{ fontWeight: 600 }}>{Math.round(Number(b.loyer_mensuel)).toLocaleString('fr-FR')} F</span>
                </div>
              ))}
              {baux.length > 2 && (
                <span style={{ fontSize: 10.5, color: 'var(--accent, #C75B00)', fontWeight: 600 }}>
                  + {baux.length - 2} autre(s) bien(s)...
                </span>
              )}
            </div>
          </div>
        ) : baux.length === 1 || locataire.bien_titre ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12,
              color: 'var(--navy, #1C2B4A)',
              fontWeight: 600,
              background: '#FAF8F5',
              padding: '6px 10px',
              borderRadius: 6,
              marginBottom: 10,
              border: '1px solid var(--border, #E8DDD2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <Building2 size={13} color="var(--accent, #C75B00)" style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {baux[0]?.bien_titre || locataire.bien_titre}
              </span>
            </div>
            <span style={{ fontWeight: 800, color: 'var(--price, #0A5C36)', flexShrink: 0, marginLeft: 8 }}>
              {Math.round(Number(baux[0]?.loyer_mensuel || locataire.loyer_mensuel || 0)).toLocaleString('fr-FR')} F/m
            </span>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11.5,
              color: '#94A3B8',
              fontStyle: 'italic',
              background: '#F8FAFC',
              padding: '5px 8px',
              borderRadius: 6,
              marginBottom: 10,
            }}
          >
            <Home size={12} />
            <span>Aucun bien rattaché</span>
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
          title="Modifier & Gérer les baux"
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            background: '#F8F5F0',
            color: 'var(--navy, #1C2B4A)',
            border: '1px solid var(--border, #E8DDD2)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          <Pencil size={13} />
          <span>Fiche & Biens</span>
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
