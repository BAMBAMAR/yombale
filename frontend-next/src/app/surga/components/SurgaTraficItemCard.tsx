'use client'

import React from 'react'
import { MapPin, Activity, ExternalLink } from 'lucide-react'
import { libelleNiveau, origineAxe } from '@/lib/surga-trafic'
import type { AxeTrafic } from '@/lib/surga-trafic'

interface SurgaTraficItemCardProps {
  axe: AxeTrafic
}

export default function SurgaTraficItemCard({ axe }: SurgaTraficItemCardProps) {
  const getCouleurNiveau = (niveau: string) => {
    switch (niveau) {
      case 'bouche':
        return '#B91C1C'
      case 'dense':
        return 'var(--accent, #C75B00)'
      case 'fluide':
        return 'var(--price, #0A5C36)'
      default:
        return 'var(--text3, #73675E)'
    }
  }

  const couleur = getCouleurNiveau(axe.niveau)
  const estMesure = axe.source === 'google_maps'
  const origine = origineAxe(axe)

  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--border, #E8DDD2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: couleur,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
            {axe.nom}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {estMesure && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--price, #0A5C36)',
                backgroundColor: 'rgba(10, 92, 54, 0.1)',
                padding: '2px 5px',
                borderRadius: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <Activity size={10} />
              MESURÉ
            </span>
          )}
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: couleur,
              backgroundColor: 'var(--bg, #F8F5F0)',
              padding: '2px 6px',
              borderRadius: 4,
              textTransform: 'uppercase',
            }}
          >
            {libelleNiveau(axe)}
          </span>
          {axe.tempsEstimeMin !== null && (
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
              {axe.tempsEstimeMin} min
            </span>
          )}
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', lineHeight: 1.35 }}>
        {axe.cause || 'Aucune mesure ni signalement récent sur cet axe.'}
        {origine ? ` ${origine}.` : ''}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
          color: 'var(--text3, #73675E)',
          marginTop: 2,
          paddingTop: 6,
          borderTop: '1px solid #F5EFE8',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <MapPin size={10} />
          {axe.pointsChauds.slice(0, 2).join(' • ')}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>
            {axe.vitesseReelleKmH ? <strong>{axe.vitesseReelleKmH} km/h • </strong> : null}
            {axe.distanceKm} km{axe.itineraire ? ` • par ${axe.itineraire}` : ''}
          </span>
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(axe.origine + ', Dakar')}&destination=${encodeURIComponent(axe.destination + ', Dakar')}&travelmode=driving`}
            target="_blank"
            rel="noopener noreferrer"
            title="Voir l'axe sur Google Maps"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              color: 'var(--surga-accent-ink, #A64B08)',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            <span>Carte</span>
            <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  )
}
