'use client'

// Réglages de Surga de la personne qui utilise l'écran : lecture au chargement, reprise du compte, envoi des changements.
// SRG-A2-011 : l'appareil gardait toujours ses réglages (locaux d'abord, serveur seulement s'il n'y en avait pas) ;
// ceux d'un invité n'étaient jamais envoyés au compte, et un second appareil ne reprenait pas ceux du premier.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { SurgaPreferencesData } from '@/app/surga/components/SurgaOnboarding'
import { enregistrerPreferences, envoiEnAttente, reconcilierPreferences, type DecisionPreferences } from '@/lib/surga-preferences-sync'

// La météo fait partie du noyau de l'écran d'accueil : une configuration ancienne qui ne la porte pas la reçoit.
function avecMeteo(prefs: any): SurgaPreferencesData {
  if (Array.isArray(prefs?.modules_actifs) && !prefs.modules_actifs.includes('meteo')) prefs.modules_actifs = [...prefs.modules_actifs, 'meteo']
  return prefs
}

function lireLocales(): SurgaPreferencesData | null {
  try {
    if (localStorage.getItem('surga_onboarding_done') !== 'true') return null
    const brut = localStorage.getItem('surga_preferences')
    return brut ? avecMeteo(JSON.parse(brut)) : null
  } catch {
    return null
  }
}

async function lireServeur(): Promise<{ connecte: boolean; preferences: any } | null> {
  try {
    const data = await (await fetch('/api/surga/preferences')).json()
    return data?.success ? { connecte: !data.guest, preferences: data.preferences } : null
  } catch {
    return null
  }
}

export function useSurgaPreferences(definirConfigure: (oui: boolean) => void) {
  const [preferences, setPreferences] = useState<SurgaPreferencesData | null>(null)
  const courantes = useRef<SurgaPreferencesData | null>(null)
  const configurer = useRef(definirConfigure)
  configurer.current = definirConfigure
  courantes.current = preferences

  // Reprend les réglages du compte sur l'appareil.
  const adopter = useCallback((prefs: SurgaPreferencesData) => {
    const p = avecMeteo({ ...prefs })
    setPreferences(p)
    configurer.current(true)
    try {
      localStorage.setItem('surga_preferences', JSON.stringify(p))
      localStorage.setItem('surga_onboarding_done', 'true')
      window.dispatchEvent(new CustomEvent('surga-data-change'))
    } catch {}
  }, [])

  const appliquer = useCallback((decision: DecisionPreferences) => {
    if (decision.action === 'adopter') adopter(decision.prefs)
    else if (decision.action === 'envoyer') { setPreferences(decision.prefs); enregistrerPreferences(decision.prefs) }
  }, [adopter])

  useEffect(() => {
    const locales = lireLocales()
    if (locales) { setPreferences(locales); configurer.current(true) }
    lireServeur().then((serveur) => {
      const decision = serveur ? reconcilierPreferences(locales, serveur.preferences, { connecte: serveur.connecte, enAttente: envoiEnAttente() }) : ({ action: 'rien' } as const)
      appliquer(decision)
      if (!locales && decision.action !== 'adopter') configurer.current(false)
    })
  }, [appliquer])

  // Changement fait par la personne : gardé tout de suite sur l'appareil, puis envoyé au compte.
  const appliquerChangement = useCallback(async (patch: Partial<SurgaPreferencesData>) => {
    const maj = { ...(courantes.current || {}), ...patch } as SurgaPreferencesData
    setPreferences(maj)
    const envoi = enregistrerPreferences(maj) // l'écriture sur l'appareil est faite avant la première attente
    try { window.dispatchEvent(new CustomEvent('surga-data-change')) } catch {}
    await envoi
  }, [])

  // Connexion : un compte déjà configuré impose ses réglages à l'appareil ; sinon l'appareil lui envoie les siens.
  const reconcilierALaConnexion = useCallback(async () => {
    const serveur = await lireServeur()
    if (serveur) appliquer(reconcilierPreferences(courantes.current, serveur.preferences, { connecte: serveur.connecte, enAttente: envoiEnAttente() }))
  }, [appliquer])

  return { preferences, setPreferences, appliquerChangement, reconcilierALaConnexion }
}
