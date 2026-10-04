'use client'

import React from 'react'
import { Trophy, Calendar } from 'lucide-react'
import SurgaShareButton from './SurgaShareButton'
import { formaterPartageSport } from '@/lib/surga-share'

export interface SportEventItem {
  id?: string
  competition: string
  equipe_domicile: string
  equipe_exterieur: string
  score_domicile: number | null
  score_exterieur: number | null
  statut: string
  date_debut: string
}

interface SurgaSportCardProps {
  sports: SportEventItem[]
}

function formatMatchDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return 'Prochainement'
  }
}

export default function SurgaSportCard({ sports }: SurgaSportCardProps) {
  if (!sports || sports.length === 0) {
    return null
  }

  return (
    <div className="surga-card" style={{ marginBottom: 16 }}>
      <div className="surga-card-header">
        <span className="surga-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Trophy size={17} color="var(--accent, #C75B00)" />
          <span>Sport &amp; Équipe Nationale</span>
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3, #73675E)' }}>
          Scores &amp; Programme
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sports.map((match, idx) => {
          const isTermine = match.statut === 'TERMINE'
          const hasScore = match.score_domicile !== null && match.score_exterieur !== null

          return (
            <div
              key={match.id || idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 8,
                backgroundColor: 'var(--bg, #F8F5F0)',
                border: '1px solid var(--border, #E8DDD2)',
                gap: 8,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent, #C75B00)', textTransform: 'uppercase', marginBottom: 2 }}>
                  {match.competition}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1, #1A1612)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {match.equipe_domicile} — {match.equipe_exterieur}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Calendar size={12} />
                  <span>{formatMatchDate(match.date_debut)}</span>
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                {isTermine && hasScore ? (
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: 'var(--navy, #1C2B4A)',
                      padding: '4px 8px',
                      borderRadius: 6,
                      backgroundColor: '#FFFFFF',
                      border: '1px solid var(--border, #E8DDD2)',
                    }}
                  >
                    {match.score_domicile} - {match.score_exterieur}
                  </div>
                ) : (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 6,
                      backgroundColor: 'rgba(28,43,74,0.06)',
                      color: 'var(--navy, #1C2B4A)',
                    }}
                  >
                    À venir
                  </span>
                )}

                <SurgaShareButton
                  payload={{
                    titre: `Surga Sport : ${match.equipe_domicile} vs ${match.equipe_exterieur}`,
                    texte: formaterPartageSport({
                      competition: match.competition,
                      equipeDomicile: match.equipe_domicile,
                      equipeExterieur: match.equipe_exterieur,
                      score: hasScore ? `${match.score_domicile} - ${match.score_exterieur}` : undefined,
                      heure: !isTermine ? formatMatchDate(match.date_debut) : undefined,
                      statut: match.statut,
                    }),
                  }}
                  taille="sm"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
