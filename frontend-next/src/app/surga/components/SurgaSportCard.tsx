'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Trophy, SlidersHorizontal, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import SurgaSportCustomModal from './SurgaSportCustomModal'
import SurgaSportMatchItem from './SurgaSportMatchItem'
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
  /** Raison de la présence du match dans la sélection (« Vous suivez … »), fournie par le service sport */
  raison_presence?: string | null
}

interface SurgaSportCardProps {
  sports: SportEventItem[]
  equipesFavoritesCompte?: string[]
  onRefresh?: () => void
}

const LIMITE_MATCHS_DEFAUT = 3

export function estMatchEquipeFavorite(match: SportEventItem, favorites: string[]): boolean {
  if (!favorites || favorites.length === 0) return false
  const dom = (match.equipe_domicile || '').toLowerCase().trim()
  const ext = (match.equipe_exterieur || '').toLowerCase().trim()
  const but = (match.buteurs || '').toLowerCase().trim()
  return favorites.some((fav) => {
    const f = fav.toLowerCase().trim()
    if (!f) return false
    return (
      dom.includes(f) ||
      ext.includes(f) ||
      f.includes(dom) ||
      f.includes(ext) ||
      but.includes(f)
    )
  })
}

export function getFavoriMatch(match: SportEventItem, favorites: string[]): string | null {
  if (!favorites || favorites.length === 0) return null
  const dom = (match.equipe_domicile || '').toLowerCase().trim()
  const ext = (match.equipe_exterieur || '').toLowerCase().trim()
  const but = (match.buteurs || '').toLowerCase().trim()
  for (const fav of favorites) {
    const f = fav.toLowerCase().trim()
    if (!f) continue
    if (dom.includes(f) || ext.includes(f) || f.includes(dom) || f.includes(ext) || but.includes(f)) {
      return fav
    }
  }
  return null
}

export function estMatchSenegalOuLigue1(match: SportEventItem): boolean {
  if (match.categorie === 'ligue1_sn' || match.categorie === 'nationale') return true
  const texte = `${match.competition} ${match.equipe_domicile} ${match.equipe_exterieur}`.toLowerCase()
  return /sénégal|senegal|jaraaf|teungueth|génération foot|generation foot|casa sports|guédiawaye|guediawaye|pikine|dakar sacré|gorée|goree|linguere|sonacos/i.test(texte)
}

export function trierMatchsParPriorite(liste: SportEventItem[], favorites: string[]): SportEventItem[] {
  return [...liste].sort((a, b) => {
    const aFav = estMatchEquipeFavorite(a, favorites)
    const bFav = estMatchEquipeFavorite(b, favorites)

    // 1. En priorité absolue : les équipes ou joueurs suivis par l'utilisateur
    if (aFav && !bFav) return -1
    if (!aFav && bFav) return 1

    // 2. Ligue 1 sénégalaise et équipes nationales
    const aSn = estMatchSenegalOuLigue1(a)
    const bSn = estMatchSenegalOuLigue1(b)
    if (aSn && !bSn) return -1
    if (!aSn && bSn) return 1

    // 3. Les matchs EN DIRECT
    if (a.statut === 'EN_DIRECT' && b.statut !== 'EN_DIRECT') return -1
    if (b.statut === 'EN_DIRECT' && a.statut !== 'EN_DIRECT') return 1

    // 4. Les matchs A_VENIR par ordre chronologique
    if (a.statut === 'A_VENIR' && b.statut === 'A_VENIR') {
      return new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime()
    }
    if (a.statut === 'A_VENIR' && b.statut === 'TERMINE') return -1
    if (a.statut === 'TERMINE' && b.statut === 'A_VENIR') return 1

    // 5. Les matchs TERMINE par ordre antéchronologique
    return new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime()
  })
}

export default function SurgaSportCard({
  sports: initialSports,
  equipesFavoritesCompte,
}: SurgaSportCardProps) {
  const [matchs, setMatchs] = useState<SportEventItem[]>(initialSports || [])
  const [loading, setLoading] = useState(false)
  const [filtreCategorie, setFiltreCategorie] = useState<string>('tous')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [afficherTous, setAfficherTous] = useState(false)

  const [equipesFavorites, setEquipesFavorites] = useState<string[]>(() => {
    if (Array.isArray(equipesFavoritesCompte) && equipesFavoritesCompte.length > 0) {
      return equipesFavoritesCompte
    }
    try {
      const stored = localStorage.getItem('surga_equipes_favorites')
      if (stored) return JSON.parse(stored)
      const prefStored = localStorage.getItem('surga_preferences')
      if (prefStored) {
        const p = JSON.parse(prefStored)
        if (Array.isArray(p.equipes_suivies) && p.equipes_suivies.length > 0) {
          return p.equipes_suivies
        }
      }
    } catch {}
    return ['Équipe Nationale du Sénégal']
  })

  const [matchsRappeles, setMatchsRappeles] = useState<string[]>([])
  const [matchsBudgetes, setMatchsBudgetes] = useState<string[]>([])

  useEffect(() => {
    if (Array.isArray(equipesFavoritesCompte) && equipesFavoritesCompte.length > 0) {
      setEquipesFavorites(equipesFavoritesCompte)
    }
  }, [equipesFavoritesCompte])

  useEffect(() => {
    if (Array.isArray(initialSports) && initialSports.length > 0) {
      setMatchs(initialSports)
    }
  }, [initialSports])

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
    setAfficherTous(false)
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

  // Tri par priorité : équipes favorites du compte en tête absolue
  const matchsTries = useMemo(() => {
    return trierMatchsParPriorite(matchs, equipesFavorites)
  }, [matchs, equipesFavorites])

  // Limitation ergonomique du nombre de matchs affichés
  const matchsAffiches = useMemo(() => {
    if (afficherTous) return matchsTries
    return matchsTries.slice(0, LIMITE_MATCHS_DEFAUT)
  }, [matchsTries, afficherTous])

  return (
    <div className="surga-card" style={{ marginBottom: 16 }}>
      {/* En-tête : Sports seulement, monoligne sans troncature */}
      <div
        className="surga-card-header"
        style={{
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flexShrink: 1 }}>
          <Trophy size={17} color="var(--surga-accent, #D97706)" style={{ flexShrink: 0 }} />
          <span
            className="surga-card-title"
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Sports
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
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
              color: 'var(--surga-text3, #73675E)',
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
              color: 'var(--surga-accent, #D97706)',
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
        className="surga-scroll-tabs"
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
          { id: 'mes_equipes', label: `Mes clubs (${equipesFavorites.length})` },
          { id: 'ucl', label: 'Ligue des Champions' },
          { id: 'premier_league', label: 'Premier League' },
          { id: 'laliga', label: 'LaLiga' },
          { id: 'ligue1_fr', label: 'Ligue 1' },
          { id: 'serie_a', label: 'Serie A' },
          { id: 'saudi_pro', label: 'Saudi Pro League' },
          { id: 'nationale', label: 'Lions du Sénégal' },
          { id: 'ligue1_sn', label: 'Ligue 1 SN' },
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

      {/* Liste des matchs limités et ordonnés par priorité */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {matchsAffiches.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--surga-text3, #73675E)', fontSize: 13 }}>
            {filtreCategorie === 'ligue1_sn' ? 'Ligue 1 sénégalaise : indisponible pour le moment.' : 'Aucun match trouvé pour ce filtre.'}
          </div>
        ) : (
          matchsAffiches.map((match, idx) => {
            const matchKey = match.id || `${match.equipe_domicile}-${match.equipe_exterieur}`
            const estFavori = estMatchEquipeFavorite(match, equipesFavorites)
            const isRappele = matchsRappeles.includes(matchKey)
            const isBudgete = matchsBudgetes.includes(matchKey)

            const raison = !estMatchSenegalOuLigue1(match) && estFavori ? (getFavoriMatch(match, equipesFavorites) || undefined) : undefined

            return (
              <SurgaSportMatchItem
                key={match.id || idx}
                match={match}
                idx={idx}
                estFavori={estFavori}
                isRappele={isRappele}
                isBudgete={isBudgete}
                raisonPresence={raison}
                onToggleRappel={handleToggleRappel}
                onToggleBudget={handleToggleBudget}
              />
            )
          })
        )}
      </div>

      {/* Bouton ergonomique d'extension pour limiter la hauteur par défaut */}
      {matchsTries.length > LIMITE_MATCHS_DEFAUT && (
        <button
          type="button"
          onClick={() => setAfficherTous((prev) => !prev)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            width: '100%',
            padding: '8px 12px',
            marginTop: 8,
            borderRadius: 10,
            backgroundColor: 'var(--surga-bg, #F8FAFC)',
            border: '1px solid var(--surga-border, #E2E8F0)',
            color: 'var(--surga-primary, #0F172A)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {afficherTous ? (
            <>
              <ChevronUp size={14} />
              <span>Afficher moins de matchs</span>
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              <span>Voir plus de rencontres ({matchsTries.length - LIMITE_MATCHS_DEFAUT} de plus)</span>
            </>
          )}
        </button>
      )}

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
