'use client'

import React from 'react'
import { Bell, Plus, Trash2 } from 'lucide-react'

export interface AlerteImmoItem {
  id: string
  titre: string
  type_bien?: string
  transaction?: string
  quartier?: string
  prix_max_xof?: number
  meuble?: boolean | null
  actif: boolean
  nb_matches?: number
  created_at: string
}

interface SurgaImmoAlertesTabProps {
  alertes: AlerteImmoItem[]
  onOpenNouvelleAlerte: () => void
  onToggleAlerte: (id: string) => void
  onSupprimerAlerte: (id: string) => void
}

export default function SurgaImmoAlertesTab({
  alertes,
  onOpenNouvelleAlerte,
  onToggleAlerte,
  onSupprimerAlerte,
}: SurgaImmoAlertesTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
          Veilles actives ({alertes.filter((a) => a.actif).length})
        </span>
        <button
          type="button"
          onClick={onOpenNouvelleAlerte}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            backgroundColor: 'var(--accent, #C75B00)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Plus size={13} />
          <span>Nouvelle alerte</span>
        </button>
      </div>

      {alertes.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '36px 16px',
            backgroundColor: 'var(--bg, #F8F5F0)',
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Bell size={32} style={{ color: 'var(--accent, #C75B00)' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
            Aucune alerte programmée
          </div>
          <p style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', margin: 0, maxWidth: 340 }}>
            Enregistrez une recherche pour retrouver les biens qui correspondent à vos critères. Aucune notification n’est envoyée pour le moment.
          </p>
          <button
            type="button"
            onClick={onOpenNouvelleAlerte}
            style={{
              marginTop: 8,
              backgroundColor: 'var(--navy, #1C2B4A)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Programmer une alerte
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alertes.map((alt) => (
            <div
              key={alt.id}
              style={{
                padding: '12px 14px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border, #E8DDD2)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                    {alt.titre}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                      backgroundColor: alt.actif ? 'rgba(10, 92, 54, 0.1)' : '#F3F4F6',
                      color: alt.actif ? 'var(--price, #0A5C36)' : 'var(--text3, #73675E)',
                    }}
                  >
                    {alt.actif ? 'Active' : 'En pause'}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3, #73675E)', marginTop: 2 }}>
                  {alt.type_bien || 'Tous types'} • {alt.transaction || 'Location'} •{' '}
                  {alt.quartier || 'Tout Dakar'}{' '}
                  {alt.prix_max_xof ? `• Max ${new Intl.NumberFormat('fr-FR').format(alt.prix_max_xof)} F` : ''}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => onToggleAlerte(alt.id)}
                  style={{
                    padding: '5px 8px',
                    borderRadius: 6,
                    border: '1px solid var(--border, #E8DDD2)',
                    backgroundColor: 'var(--bg, #F8F5F0)',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: 'var(--navy, #1C2B4A)',
                  }}
                >
                  {alt.actif ? 'Mettre en pause' : 'Réactiver'}
                </button>
                <button
                  type="button"
                  onClick={() => onSupprimerAlerte(alt.id)}
                  aria-label="Supprimer l alerte"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#B91C1C',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
