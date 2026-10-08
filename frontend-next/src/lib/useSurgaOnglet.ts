'use client'

// Onglet de Surga, porté par l'adresse (« ?tab=notes »).
// SRG-A3-007 : l'onglet vivait dans un état React sans lien avec l'adresse. Le bouton retour faisait quitter Surga,
// un rechargement ramenait à « Aujourd'hui », et les adresses « /surga?tab=… » de la barre du bas n'ouvraient rien.
// Chaque changement d'onglet ajoute une entrée à l'historique : le bouton retour revient à l'onglet précédent.

import { useCallback, useEffect, useState } from 'react'
import type { SurgaTab } from '@/app/surga/components/SurgaBottomNav'

const ONGLETS: SurgaTab[] = ['aujourdhui', 'notes', 'depenses', 'agenda', 'services', 'plus']

function ongletDeLAdresse(): SurgaTab {
  if (typeof window === 'undefined') return 'aujourdhui'
  const demande = new URLSearchParams(window.location.search).get('tab') as SurgaTab | null
  return demande && ONGLETS.includes(demande) ? demande : 'aujourdhui'
}

export function useSurgaOnglet(): [SurgaTab, (onglet: SurgaTab) => void] {
  // Premier rendu identique à celui du serveur ; l'adresse est lue juste après.
  const [onglet, setOnglet] = useState<SurgaTab>('aujourdhui')

  useEffect(() => {
    const lire = () => setOnglet(ongletDeLAdresse())
    lire()
    window.addEventListener('popstate', lire)
    return () => window.removeEventListener('popstate', lire)
  }, [])

  const changer = useCallback((suivant: SurgaTab) => {
    setOnglet(suivant)
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (suivant === 'aujourdhui') params.delete('tab')
    else params.set('tab', suivant)
    const requete = params.toString()
    const adresse = window.location.pathname + (requete ? `?${requete}` : '')
    if (adresse !== window.location.pathname + window.location.search) {
      window.history.pushState({ surgaOnglet: suivant }, '', adresse)
    }
  }, [])

  return [onglet, changer]
}
