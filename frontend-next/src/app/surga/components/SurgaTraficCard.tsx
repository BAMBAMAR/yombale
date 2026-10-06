'use client'

import React, { useState, useEffect } from 'react'
import { Navigation, ChevronRight, Activity, ExternalLink } from 'lucide-react'

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
        return '#DC2626'
      case 'dense':
        return 'var(--surga-accent, #D97706)'
      default:
        return 'var(--surga-emerald, #059669)'
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
      {/* En-tête épuré : Trafic seulement, monoligne et aéré */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: '1 1 auto' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: 'rgba(217, 119, 6, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--surga-accent, #D97706)',
              flexShrink: 0,
            }}
          >
            <Navigation size={16} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: 'var(--surga-primary, #0F172A)',
                  whiteSpace: 'nowrap',
                }}
              >
                Trafic
              </span>
              {source === 'tomtom_live' && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: 'var(--surga-emerald, #059669)',
                    backgroundColor: 'rgba(5, 150, 105, 0.1)',
                    padding: '1px 5px',
                    borderRadius: 4,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    flexShrink: 0,
                  }}
                >
                  <Activity size={10} />
                  DIRECT
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--surga-text3, #94A3B8)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {source === 'tomtom_live'
                ? 'Sondes TomTom en direct • TER & BRT'
                : 'Dakar • TER & BRT'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <a
            href="https://www.google.com/maps/@14.7300,-17.4480,13z/data=!5m1!1e1"
            target="_blank"
            rel="noopener noreferrer"
            title="Carte Google Maps Trafic en temps réel"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--surga-accent, #D97706)',
              backgroundColor: 'rgba(217, 119, 6, 0.1)',
              padding: '4px 8px',
              borderRadius: 6,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <span>Carte Live</span>
            <ExternalLink size={11} />
          </a>

          <button
            type="button"
            onClick={onOuvrirDetail}
            aria-label="Voir le détail du trafic"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--surga-primary, #0F172A)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              padding: '4px 6px',
              whiteSpace: 'nowrap',
            }}
          >
            <span>Détails</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Synthèse textuelle */}
      {synthese && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--surga-text2, #475569)',
            lineHeight: 1.4,
            padding: '8px 10px',
            backgroundColor: 'var(--surga-bg, #F8FAFC)',
            borderRadius: 8,
            border: '1px solid var(--surga-border, #E2E8F0)',
          }}
        >
          {synthese}
        </div>
      )}

      {/* Aperçu des 3 axes clés */}
      {loading ? (
        <div style={{ fontSize: 11, color: 'var(--surga-text3, #94A3B8)', padding: '6px 0' }}>
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
                  backgroundColor: 'var(--surga-surface, #FFFFFF)',
                  border: '1px solid var(--surga-border, #E2E8F0)',
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
                      color: 'var(--surga-primary, #0F172A)',
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
                    <span style={{ fontSize: 10, color: 'var(--surga-text3, #94A3B8)' }}>
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
                      backgroundColor: 'var(--surga-bg, #F8FAFC)',
                    }}
                  >
                    {getLibelleNiveau(axe.niveau)}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--surga-text3, #94A3B8)', fontWeight: 600 }}>
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
