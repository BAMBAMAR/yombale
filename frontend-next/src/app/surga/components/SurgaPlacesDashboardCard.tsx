'use client'

import React, { useState, useEffect } from 'react'
import { UtensilsCrossed, Star, MapPin, ChevronRight, Sparkles } from 'lucide-react'
import { type PlaceItem } from './SurgaPlaceCard'

interface SurgaPlacesDashboardCardProps {
  onOuvrirModal: () => void
}

export default function SurgaPlacesDashboardCard({
  onOuvrirModal,
}: SurgaPlacesDashboardCardProps) {
  const [placeDuJour, setPlaceDuJour] = useState<PlaceItem | null>(null)

  useEffect(() => {
    fetch('/api/surga/places?limite=1')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.places) && data.places.length > 0) {
          setPlaceDuJour(data.places[0])
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div
      className="surga-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* En-tête de la carte */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: 'rgba(199, 91, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--surga-accent-ink, #A64B08)',
            }}
          >
            <UtensilsCrossed size={16} />
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              Bonnes Adresses &amp; Bons Plans
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text3, #73675E)' }}>
              Recommandations certifiées à Dakar
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOuvrirModal}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--surga-accent-ink, #A64B08)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            padding: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <span>Explorer</span>
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Suggestion du jour */}
      {placeDuJour ? (
        <div
          onClick={onOuvrirModal}
          style={{
            backgroundColor: 'var(--bg, #F8F5F0)',
            borderRadius: 10,
            padding: '10px 12px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            border: '1px solid var(--border, #E8DDD2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                {placeDuJour.nom}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text3, #73675E)' }}>
                &bull; {placeDuJour.quartier}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Star size={12} fill="var(--accent, #C75B00)" color="var(--accent, #C75B00)" />
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--surga-accent-ink, #A64B08)' }}>
                {Number(placeDuJour.note_moyenne || 4.5).toFixed(1)}
              </span>
            </div>
          </div>

          <p
            style={{
              fontSize: 12,
              color: 'var(--text2, #5A4E42)',
              margin: 0,
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {placeDuJour.resume_honnete}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--price, #0A5C36)', fontWeight: 600 }}>
            <Sparkles size={11} />
            <span>Spécialité : {placeDuJour.specialite}</span>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', padding: '6px 0' }}>
          Découvrez les meilleurs dibiteries, restaurants vue mer et cafés coworking de la capitale.
        </div>
      )}
    </div>
  )
}
