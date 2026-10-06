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
          paddingBottom: 8,
          marginBottom: 10,
          whiteSpace: 'nowrap',
          scrollbarWidth: 'none',
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
                padding: '4px 10px',
                borderRadius: 16,
                fontSize: 11,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: isActive ? 'var(--navy, #1C2B4A)' : 'var(--bg, #F8F5F0)',
                color: isActive ? '#FFFFFF' : 'var(--text2, #5A4E42)',
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
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 8,
                  backgroundColor: isDirect ? 'rgba(199,91,0,0.04)' : 'var(--bg, #F8F5F0)',
                  border: isDirect ? '1px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
                  gap: 8,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent, #C75B00)', textTransform: 'uppercase' }}>
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
                          padding: '1px 5px',
                          borderRadius: 4,
                          textTransform: 'uppercase',
                        }}
                      >
                        <Radio size={10} />
                        DIRECT {match.minute_jeu || ''}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1, #1A1612)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {match.equipe_domicile} — {match.equipe_exterieur}
                  </div>

                  {match.buteurs && (
                    <div style={{ fontSize: 11, color: 'var(--price, #0A5C36)', fontStyle: 'italic', marginTop: 2 }}>
                      {match.buteurs}
                    </div>
                  )}

                  <div style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <Calendar size={12} />
                    <span>{formatMatchDate(match.date_debut)}</span>
                    {match.diffuseur && (
                      <span style={{ color: 'var(--text3, #73675E)' }}>• {match.diffuseur}</span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {hasScore ? (
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 900,
                        color: isDirect ? '#DC2626' : 'var(--navy, #1C2B4A)',
                        padding: '4px 8px',
                        borderRadius: 6,
                        backgroundColor: '#FFFFFF',
                        border: isDirect ? '1px solid #DC2626' : '1px solid var(--border, #E8DDD2)',
                      }}
                    >
                      {match.score_domicile} - {match.score_exterieur}
                    </div>
                  ) : isTermine ? (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6,
                        backgroundColor: 'rgba(10,92,54,0.08)',
                        color: 'var(--price, #0A5C36)',
                      }}
                    >
                      Terminé
                    </span>
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

                  {!isTermine && (() => {
                    const matchKey = match.id || `${match.equipe_domicile}-${match.equipe_exterieur}`
                    const estRappele = matchsRappeles.includes(matchKey)
                    const estBudgete = matchsBudgetes.includes(matchKey)
                    const getBtnStyle = (actif: boolean, accentColor = 'var(--accent, #C75B00)'): React.CSSProperties => ({
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      padding: '4px 7px',
                      borderRadius: 6,
                      border: '1px solid',
                      borderColor: actif ? accentColor : 'var(--border, #E8DDD2)',
                      backgroundColor: actif ? 'rgba(199, 91, 0, 0.12)' : '#FFFFFF',
                      color: actif ? accentColor : 'var(--navy, #1C2B4A)',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: actif ? 700 : 500,
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
                          {estRappele ? <BellCheck size={14} /> : <Bell size={14} />}
                          {estRappele && <span>Rappelé</span>}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleToggleBudget(match, e)}
                          title={estBudgete ? "Budget noté — Cliquer pour retirer" : "Prévoir un budget sortie match"}
                          aria-label="Budget match"
                          style={getBtnStyle(estBudgete, 'var(--price, #0A5C36)')}
                        >
                          <Wallet size={14} />
                          {estBudgete && <span>Budgété</span>}
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
