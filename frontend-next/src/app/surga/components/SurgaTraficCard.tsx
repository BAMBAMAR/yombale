'use client'

import React, { useState, useEffect } from 'react'
import { Navigation, ChevronRight, Activity, ExternalLink } from 'lucide-react'
import { estZoneCouverteParTrafic } from '@/lib/surga-meteo'
import { axeRenseigne, libelleNiveau, origineAxe, MESSAGE_TRAFIC_INDISPONIBLE, CARTE_TRAFIC_EXTERNE } from '@/lib/surga-trafic'
import type { AxeTrafic } from '@/lib/surga-trafic'

export type AxeTraficItem = AxeTrafic

interface SurgaTraficCardProps {
  onOuvrirDetail: () => void
  ville?: string
}

export default function SurgaTraficCard({ onOuvrirDetail, ville = 'Dakar' }: SurgaTraficCardProps) {
  const [axes, setAxes] = useState<AxeTraficItem[]>([])
  const [synthese, setSynthese] = useState<string>('')
  const [source, setSource] = useState<string>('aucune')
  const [loading, setLoading] = useState<boolean>(true)
  const couvreTrafic = estZoneCouverteParTrafic(ville)

  useEffect(() => {
    let isMounted = true
    async function chargerTrafic() {
      try {
        const res = await fetch('/api/surga/trafic')
        const data = await res.json()
        if (isMounted && data.success && Array.isArray(data.axes)) {
          setAxes(data.axes)
          setSynthese(data.synthese || '')
          setSource(data.source || 'aucune')
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

  // Seuls les axes portant une mesure ou un signalement daté sont montrés.
  const axesPertinents = axes.filter(axeRenseigne).slice(0, 3)

  const getCouleurNiveau = (niveau: string) => {
    switch (niveau) {
      case 'bouche':
        return '#DC2626'
      case 'dense':
        return 'var(--surga-accent-text, #92400E)'
      case 'fluide':
        return 'var(--surga-emerald, #059669)'
      default:
        return 'var(--surga-text2, #475569)'
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: '1 1 150px' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: 'rgba(217, 119, 6, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--surga-accent-ink, #A64B08)',
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
              {source === 'google_maps' && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: 'var(--surga-emerald-ink, #047857)',
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
                  MESURÉ
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--surga-text3, #536175)',
                lineHeight: 1.3,
              }}
            >
              Dakar • mesures et signalements
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <a
            href={CARTE_TRAFIC_EXTERNE}
            target="_blank"
            rel="noopener noreferrer"
            title="Ouvrir la carte du trafic de Google Maps"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--surga-accent-ink, #A64B08)',
              backgroundColor: 'rgba(217, 119, 6, 0.1)',
              padding: '8px 10px',
              minHeight: 32,
              borderRadius: 8,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <span>Google Maps</span>
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
              padding: '8px 6px',
              minHeight: 32,
              whiteSpace: 'nowrap',
            }}
          >
            <span>Détails</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {!couvreTrafic ? (
        <div style={{ fontSize: 13, color: 'var(--surga-text2, #475569)', padding: '6px 0', lineHeight: 1.4 }}>
          Trafic indisponible pour {ville}. Disponible pour Dakar.
        </div>
      ) : (
        <>
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
            <div style={{ fontSize: 12, color: 'var(--surga-text3, #94A3B8)', padding: '6px 0' }}>
              Chargement du trafic…
            </div>
          ) : axesPertinents.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--surga-text2, #475569)', padding: '6px 0', lineHeight: 1.4 }}>
              {MESSAGE_TRAFIC_INDISPONIBLE}
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
                      fontSize: 12,
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
                        <span style={{ fontSize: 12, color: 'var(--surga-text3, #94A3B8)' }}>
                          {axe.vitesseReelleKmH} km/h
                        </span>
                      ) : null}
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: couleur,
                          padding: '1px 5px',
                          borderRadius: 4,
                          backgroundColor: 'var(--surga-bg, #F8FAFC)',
                        }}
                      >
                        {libelleNiveau(axe)}
                      </span>
                      {axe.tempsEstimeMin !== null && (
                        <span style={{ fontSize: 12, color: 'var(--surga-text2, #475569)', fontWeight: 600 }}>
                          {axe.tempsEstimeMin} min
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
              <div style={{ fontSize: 12, color: 'var(--surga-text3, #64748B)', marginTop: 4 }}>
                {origineAxe(axesPertinents[0])}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
