'use client'

import React, { useState, useEffect } from 'react'
import { Navigation, ChevronRight, Activity } from 'lucide-react'

export interface AxeTraficItem {
  id: string
  nom: string
  origine: string
  destination: string
  type: string
  sens: string
  niveau: 'fluide' | 'dense' | 'bouche'
  tempsEstimeMin: number
  tempsHabituelMin: number
  cause: string
  source?: 'tomtom_live' | 'previsionnel'
  vitesseReelleKmH?: number | null
  vitesseNormaleKmH?: number | null
}

interface SurgaTraficCardProps {
  onOuvrirDetail: () => void
}

export default function SurgaTraficCard({ onOuvrirDetail }: SurgaTraficCardProps) {
  const [axes, setAxes] = useState<AxeTraficItem[]>([])
  const [synthese, setSynthese] = useState<string>('')
  const [source, setSource] = useState<string>('previsionnel')
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true
    async function chargerTrafic() {
      try {
        const res = await fetch('/api/surga/trafic')
        const data = await res.json()
        if (isMounted && data.success && Array.isArray(data.axes)) {
          setAxes(data.axes)
          setSynthese(data.synthese || '')
          setSource(data.source || 'previsionnel')
        }
      } catch (err) {
        console.error('Erreur chargement trafic card:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    chargerTrafic()
    return () => {
      isMounted = false
    }
  }, [])

  const axesPertinents = axes.slice(0, 3)

  const getCouleurNiveau = (niveau: string) => {
    switch (niveau) {
      case 'bouche':
        return '#B91C1C'
      case 'dense':
        return 'var(--accent, #C75B00)'
      default:
        return 'var(--price, #0A5C36)'
    }
  }

  const getLibelleNiveau = (niveau: string) => {
    switch (niveau) {
      case 'bouche':
        return 'Bouché'
      case 'dense':
        return 'Dense'
      default:
        return 'Fluide'
    }
  }

  return (
    <div
      className="surga-card"
      style={{
        padding: '12px 14px',
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
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
              color: 'var(--accent, #C75B00)',
            }}
          >
            <Navigation size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                Trafic &amp; Déplacements Dakar
              </span>
              {source === 'tomtom_live' && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: 'var(--price, #0A5C36)',
                    backgroundColor: 'rgba(10, 92, 54, 0.1)',
                    padding: '1px 5px',
                    borderRadius: 4,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <Activity size={10} />
                  DIRECT
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
              {source === 'tomtom_live'
                ? 'Sondes TomTom en temps réel • TER & BRT'
                : 'Corridors A1, VDN, Corniche, TER & BRT'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOuvrirDetail}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--accent, #C75B00)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            padding: '4px 6px',
          }}
        >
          <span>Détails</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Synthèse textuelle */}
      {synthese && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--text2, #5A4E42)',
            lineHeight: 1.4,
            padding: '8px 10px',
            backgroundColor: 'var(--bg, #F8F5F0)',
            borderRadius: 8,
            border: '1px solid var(--border, #E8DDD2)',
          }}
        >
          {synthese}
        </div>
      )}

      {/* Aperçu des 3 axes clés */}
      {loading ? (
        <div style={{ fontSize: 11, color: 'var(--text3, #73675E)', padding: '6px 0' }}>
          Évaluation du trafic en cours...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {axesPertinents.map((axe) => {
            const couleur = getCouleurNiveau(axe.niveau)
            return (
              <div
                key={axe.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: 6,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border, #E8DDD2)',
                  fontSize: 11,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: couleur,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontWeight: 600,
                      color: 'var(--navy, #1C2B4A)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {axe.nom.split('(')[0].trim()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {axe.vitesseReelleKmH ? (
                    <span style={{ fontSize: 10, color: 'var(--text3, #73675E)' }}>
                      {axe.vitesseReelleKmH} km/h
                    </span>
                  ) : null}
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: couleur,
                      padding: '1px 5px',
                      borderRadius: 4,
                      backgroundColor: 'var(--bg, #F8F5F0)',
                    }}
                  >
                    {getLibelleNiveau(axe.niveau)}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text3, #73675E)', fontWeight: 600 }}>
                    {axe.tempsEstimeMin} min
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
