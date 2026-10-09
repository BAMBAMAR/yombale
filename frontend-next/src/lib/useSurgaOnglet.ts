'use client'

// Onglet de Surga, porté par l'adresse (« ?tab=notes »).
// SRG-A3-007 : l'onglet vivait dans un état React sans lien avec l'adresse. Le bouton retour faisait quitter Surga,
// un rechargement ramenait à « Aujourd'hui », et les adresses « /surga?tab=… » de la barre du bas n'ouvraient rien.
// Chaque changement d'onglet ajoute une entrée à l'historique : le bouton retour revient à l'onglet précédent.
//
// Position de lecture : les onglets partagent la même page, donc le même défilement. Sans rien faire, un onglet
// ouvert depuis le bas d'une liste s'ouvrait au milieu de la sienne, et le bouton retour ne rendait pas l'endroit
// quitté. Un onglet ouvert par la navigation commence en haut ; un onglet retrouvé par le bouton retour (ou
// suivant) du navigateur revient là où on l'avait laissé.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { SurgaTab } from '@/app/surga/components/SurgaBottomNav'

const ONGLETS: SurgaTab[] = ['aujourdhui', 'notes', 'depenses', 'agenda', 'services', 'plus']

function ongletDeLAdresse(): SurgaTab {
  if (typeof window === 'undefined') return 'aujourdhui'
  const demande = new URLSearchParams(window.location.search).get('tab') as SurgaTab | null
  return demande && ONGLETS.includes(demande) ? demande : 'aujourdhui'
}

// Sur téléphone la page défile ; sur ordinateur c'est la colonne centrale. On retient les deux.
interface Position { page: number; colonne: number }
const HAUT: Position = { page: 0, colonne: 0 }
const positions = new Map<SurgaTab, Position>()
const SANS_ANIMATION = 'instant' as ScrollBehavior

const colonneCentrale = (): HTMLElement | null => document.querySelector<HTMLElement>('.surga-center-feed')

function lirePosition(): Position {
  return { page: window.scrollY, colonne: colonneCentrale()?.scrollTop ?? 0 }
}

function poserPosition(p: Position): void {
  window.scrollTo({ top: p.page, behavior: SANS_ANIMATION })
  colonneCentrale()?.scrollTo({ top: p.colonne, behavior: SANS_ANIMATION })
}

function atteinte(p: Position): boolean {
  const ici = lirePosition()
  return Math.abs(ici.page - p.page) <= 2 && Math.abs(ici.colonne - p.colonne) <= 2
}

export function useSurgaOnglet(): [SurgaTab, (onglet: SurgaTab) => void] {
  // Premier rendu identique à celui du serveur ; l'adresse est lue juste après.
  const [onglet, setOnglet] = useState<SurgaTab>('aujourdhui')
  const courant = useRef<SurgaTab>('aujourdhui')
  const cible = useRef<Position | null>(null)

  // Quitte l'onglet courant en retenant sa position, et dit où ouvrir le suivant.
  const passerA = useCallback((suivant: SurgaTab, ouvrirA: (retenue: Position | undefined) => Position) => {
    if (suivant !== courant.current) {
      positions.set(courant.current, lirePosition())
      cible.current = ouvrirA(positions.get(suivant))
      courant.current = suivant
    }
    setOnglet(suivant)
  }, [])

  useEffect(() => {
    // Le navigateur replace lui-même le défilement en parcourant l'historique, mais sans attendre que l'onglet
    // retrouvé soit affiché : il se cale sur la hauteur de l'onglet quitté. Surga s'en charge tant qu'il est ouvert.
    const reglage = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'

    courant.current = ongletDeLAdresse()
    setOnglet(courant.current)
    const auRetour = () => passerA(ongletDeLAdresse(), (retenue) => retenue ?? HAUT)
    window.addEventListener('popstate', auRetour)
    return () => {
      window.removeEventListener('popstate', auRetour)
      window.history.scrollRestoration = reglage
    }
  }, [passerA])

  // Une fois l'onglet affiché, on se place. Une liste lue après l'affichage (notes, dépenses de l'appareil) n'a
  // pas encore sa hauteur : on réessaie brièvement, et on s'arrête dès que la personne fait défiler elle-même.
  useEffect(() => {
    const voulue = cible.current
    cible.current = null
    if (!voulue) return
    let posee: Position | null = null
    const placer = () => {
      if (posee && !atteinte(posee)) return
      poserPosition(voulue)
      posee = lirePosition()
    }
    const image = window.requestAnimationFrame(placer)
    const minuteries = voulue.page > 0 || voulue.colonne > 0
      ? [150, 400].map((delai) => window.setTimeout(() => { if (!atteinte(voulue)) placer() }, delai))
      : []
    return () => {
      window.cancelAnimationFrame(image)
      minuteries.forEach((m) => window.clearTimeout(m))
    }
  }, [onglet])

  const changer = useCallback((suivant: SurgaTab) => {
    passerA(suivant, () => HAUT)
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (suivant === 'aujourdhui') params.delete('tab')
    else params.set('tab', suivant)
    const requete = params.toString()
    const adresse = window.location.pathname + (requete ? `?${requete}` : '')
    if (adresse !== window.location.pathname + window.location.search) {
      window.history.pushState({ surgaOnglet: suivant }, '', adresse)
    }
  }, [passerA])

  return [onglet, changer]
}
