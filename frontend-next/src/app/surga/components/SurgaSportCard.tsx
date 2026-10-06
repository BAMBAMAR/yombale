'use client'

import React, { useState, useEffect } from 'react'
import { Trophy, Calendar, SlidersHorizontal, RefreshCw, Radio, Bell, BellCheck, Wallet } from 'lucide-react'
import SurgaShareButton from './SurgaShareButton'
import SurgaSportCustomModal from './SurgaSportCustomModal'
import { formaterPartageSport } from '@/lib/surga-share'
import {
  estMatchRappele,
  toggleRappelMatch,
  estMatchBudgete,
  toggleBudgetMatch,
} from '@/lib/surga-cross-actions'

export interface SportEventItem {
  id?: string
  competition: string
  categorie?: string
  equipe_domicile: string
  equipe_exterieur: string
  score_domicile: number | null
  score_exterieur: number | null
  statut: 'EN_DIRECT' | 'TERMINE' | 'A_VENIR' | string
  minute_jeu?: string | null
  buteurs?: string | null
  diffuseur?: string | null
  date_debut: string
}

interface SurgaSportCardProps {
  sports: SportEventItem[]
  onRefresh?: () => void
}

function formatMatchDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const isThisYear = d.getFullYear() === new Date().getFullYear()
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      ...(isThisYear ? {} : { year: 'numeric' }),
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return 'Prochainement'
  }
}

export default function SurgaSportCard({ sports: initialSports }: SurgaSportCardProps) {
  const [matchs, setMatchs] = useState<SportEventItem[]>(initialSports || [])
  const [loading, setLoading] = useState(false)
  const [filtreCategorie, setFiltreCategorie] = useState<string>('tous')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [equipesFavorites, setEquipesFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('surga_equipes_favorites')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [matchsRappeles, setMatchsRappeles] = useState<string[]>([])
  const [matchsBudgetes, setMatchsBudgetes] = useState<string[]>([])

  useEffect(() => {
    const synchroniserEtat = () => {
      const rappeles = matchs
        .filter((m) => estMatchRappele(m))
        .map((m) => m.id || `${m.equipe_domicile}-${m.equipe_exterieur}`)
      const budgetes = matchs
        .filter((m) => estMatchBudgete(m))
        .map((m) => m.id || `${m.equipe_domicile}-${m.equipe_exterieur}`)

      setMatchsRappeles(rappeles)
      setMatchsBudgetes(budgetes)
    }

    synchroniserEtat()
    if (typeof window !== 'undefined') {
      window.addEventListener('surga-data-change', synchroniserEtat)
      return () => window.removeEventListener('surga-data-change', synchroniserEtat)
    }
  }, [matchs])

  const handleToggleRappel = (match: SportEventItem, e: React.MouseEvent) => {
    e.stopPropagation()
    const matchKey = match.id || `${match.equipe_domicile}-${match.equipe_exterieur}`
    const actif = toggleRappelMatch(match)
    setMatchsRappeles((prev) =>
      actif ? [...prev, matchKey] : prev.filter((k) => k !== matchKey)
    )
  }

  const handleToggleBudget = (match: SportEventItem, e: React.MouseEvent) => {
    e.stopPropagation()
    const matchKey = match.id || `${match.equipe_domicile}-${match.equipe_exterieur}`
    const actif = toggleBudgetMatch(match)
    setMatchsBudgetes((prev) =>
      actif ? [...prev, matchKey] : prev.filter((k) => k !== matchKey)
    )
  }

  const rechargerScores = async (categorie = filtreCategorie, equipes = equipesFavorites) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('refresh', 'true')
      if (categorie !== 'tous' && categorie !== 'mes_equipes') {
        params.append('categorie', categorie)
      }
      if (categorie === 'mes_equipes' && equipes.length > 0) {
        params.append('equipes', equipes.join(','))
      }
      const res = await fetch(`/api/surga/sport?${params.toString()}`)
      const data = await res.json()
      if (data.success && Array.isArray(data.matchs)) {
        setMatchs(data.matchs)
      }
    } catch (err) {
      console.warn('[SURGA SPORT REFRESH ERR]:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (filtreCategorie === 'mes_equipes') {
      rechargerScores('mes_equipes', equipesFavorites)
    } else if (filtreCategorie !== 'tous') {
      rechargerScores(filtreCategorie)
    } else {
      rechargerScores('tous')
    }
  }, [filtreCategorie])

  const handleEnregistrerEquipes = (nouvelles: string[]) => {
    setEquipesFavorites(nouvelles)
    if (nouvelles.length > 0) {
      setFiltreCategorie('mes_equipes')
      rechargerScores('mes_equipes', nouvelles)
    } else {
      rechargerScores(filtreCategorie)
    }
  }

  return (
    <div className="surga-card" style={{ marginBottom: 16 }}>
      {/* En-tête */}
      <div className="surga-card-header" style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Trophy size={17} color="var(--accent, #C75B00)" />
          <span className="surga-card-title">Sport &amp; Équipe Nationale</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => rechargerScores()}
            disabled={loading}
            aria-label="Actualiser les scores"
            style={{
              background: 'none',
              border: 'none',
              padding: 4,
              cursor: loading ? 'wait' : 'pointer',
              color: 'var(--text3, #73675E)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            aria-label="Personnaliser les équipes"
            style={{
              background: 'none',
              border: 'none',
              padding: 4,
              cursor: 'pointer',
              color: 'var(--accent, #C75B00)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            <SlidersHorizontal size={13} />
            <span>Mes équipes</span>
          </button>
        </div>
      </div>

      {/* Onglets de filtres rapides */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 4,
          marginBottom: 10,
          whiteSpace: 'nowrap',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {[
          { id: 'tous', label: 'Tous les matchs' },
          { id: 'ucl', label: 'Ligue des Champions' },
          { id: 'premier_league', label: 'Premier League' },
          { id: 'laliga', label: 'LaLiga' },
          { id: 'ligue1_fr', label: 'Ligue 1' },
          { id: 'serie_a', label: 'Serie A' },
          { id: 'saudi_pro', label: 'Saudi Pro League' },
          { id: 'nationale', label: 'Lions du Sénégal' },
          { id: 'ligue1_sn', label: 'Ligue 1 SN' },
          { id: 'mes_equipes', label: `Mes clubs (${equipesFavorites.length})` },
        ].map((tab) => {
          const isActive = filtreCategorie === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFiltreCategorie(tab.id)}
              style={{
                padding: '5px 12px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: isActive ? 'var(--surga-primary, #0F172A)' : 'var(--surga-surface, #FFFFFF)',
                color: isActive ? '#FFFFFF' : 'var(--surga-text2, #475569)',
                boxShadow: isActive ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.05)',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Liste des matchs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {matchs.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text3, #73675E)', fontSize: 13 }}>
            Aucun match trouvé pour ce filtre.
          </div>
        ) : (
          matchs.map((match, idx) => {
            const isDirect = match.statut === 'EN_DIRECT'
            const isTermine = match.statut === 'TERMINE'
            const hasScore = match.score_domicile !== null && match.score_exterieur !== null

            return (
              <div
                key={match.id || idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '12px 14px',
                  borderRadius: 12,
                  backgroundColor: isDirect ? 'rgba(217, 119, 6, 0.04)' : 'var(--surga-surface, #FFFFFF)',
                  border: isDirect ? '1px solid var(--surga-accent, #D97706)' : '1px solid var(--surga-border, #E2E8F0)',
                  gap: 8,
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                }}
              >
                {/* Étage 1 : Compétition & Statut ou Score */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--surga-accent, #D97706)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {match.competition}
                    </span>
                    {isDirect && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          fontSize: 10,
                          fontWeight: 900,
                          color: '#FFFFFF',
                          backgroundColor: '#DC2626',
                          padding: '1px 6px',
                          borderRadius: 4,
                          textTransform: 'uppercase',
                        }}
                      >
                        <Radio size={10} />
                        DIRECT {match.minute_jeu || ''}
                      </span>
                    )}
                  </div>

                  {hasScore ? (
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 900,
                        color: isDirect ? '#DC2626' : 'var(--surga-primary, #0F172A)',
                        padding: '2px 8px',
                        borderRadius: 6,
                        backgroundColor: 'var(--surga-bg, #F8FAFC)',
                        border: isDirect ? '1px solid #DC2626' : '1px solid var(--surga-border, #E2E8F0)',
                        flexShrink: 0,
                      }}
                    >
                      {match.score_domicile} - {match.score_exterieur}
                    </div>
                  ) : isTermine ? (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 6,
                        backgroundColor: 'rgba(5, 150, 105, 0.08)',
                        color: 'var(--surga-emerald, #059669)',
                        flexShrink: 0,
                      }}
                    >
                      Terminé
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 6,
                        backgroundColor: 'rgba(15, 23, 42, 0.06)',
                        color: 'var(--surga-primary, #0F172A)',
                        flexShrink: 0,
                      }}
                    >
                      À venir
                    </span>
                  )}
                </div>

                {/* Étage 2 : Noms complets des équipes (Pleine largeur, zéro troncature sauvage) */}
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--surga-primary, #0F172A)', lineHeight: 1.35, wordBreak: 'break-word' }}>
                  {match.equipe_domicile} — {match.equipe_exterieur}
                </div>

                {match.buteurs && (
                  <div style={{ fontSize: 11, color: 'var(--surga-emerald, #059669)', fontStyle: 'italic' }}>
                    {match.buteurs}
                  </div>
                )}

                {/* Étage 3 : Date/Heure/Diffuseur à gauche, Actions rapides à droite */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 4, borderTop: '1px solid var(--surga-border, #F1F5F9)' }}>
                  <div style={{ fontSize: 12, color: 'var(--surga-text2, #475569)', display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                    <Calendar size={12} color="var(--surga-text3, #94A3B8)" />
                    <span style={{ fontWeight: 600 }}>{formatMatchDate(match.date_debut)}</span>
                    {match.diffuseur && (
                      <span style={{ color: 'var(--surga-text3, #94A3B8)' }}>• {match.diffuseur}</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {!isTermine && (() => {
                      const matchKey = match.id || `${match.equipe_domicile}-${match.equipe_exterieur}`
                      const estRappele = matchsRappeles.includes(matchKey)
                      const estBudgete = matchsBudgetes.includes(matchKey)
                      const getBtnStyle = (actif: boolean, accentColor = 'var(--surga-accent, #D97706)'): React.CSSProperties => ({
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: '1px solid',
                        borderColor: actif ? accentColor : 'var(--surga-border, #E2E8F0)',
                        backgroundColor: actif ? 'rgba(217, 119, 6, 0.12)' : 'var(--surga-surface, #FFFFFF)',
                        color: actif ? accentColor : 'var(--surga-primary, #0F172A)',
                        cursor: 'pointer',
                        padding: 0,
                      })

                      return (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleToggleRappel(match, e)}
                            title={estRappele ? "Rappel actif — Cliquer pour désactiver" : "Programmer un rappel dans l'Agenda"}
                            aria-label="Rappel match"
                            style={getBtnStyle(estRappele)}
                          >
                            {estRappele ? <BellCheck size={14} color="var(--surga-accent, #D97706)" /> : <Bell size={14} />}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleToggleBudget(match, e)}
                            title={estBudgete ? "Budget noté — Cliquer pour retirer" : "Prévoir un budget sortie match"}
                            aria-label="Budget match"
                            style={getBtnStyle(estBudgete, 'var(--surga-emerald, #059669)')}
                          >
                            <Wallet size={14} color={estBudgete ? 'var(--surga-emerald, #059669)' : undefined} />
                          </button>
                        </>
                      )
                    })()}

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
              </div>
            )
          })
        )}
      </div>

      {/* Modale de sélection d'équipes favorites */}
      <SurgaSportCustomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        equipesSelectionnees={equipesFavorites}
        onEnregistrer={handleEnregistrerEquipes}
      />
    </div>
  )
}
