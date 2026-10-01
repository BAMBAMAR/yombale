'use client'

import { createContext, useContext } from 'react'
import { ESSAI_DEFAUT } from '@/lib/essai-format'

const EssaiContext = createContext<number>(ESSAI_DEFAUT)

/** Fournit la durée d'essai (réglage admin) aux composants clients, sans appel réseau ni clignotement. */
export function EssaiProvider({ jours, children }: { jours: number; children: React.ReactNode }) {
  return <EssaiContext.Provider value={jours}>{children}</EssaiContext.Provider>
}

export function useEssaiJours(): number {
  return useContext(EssaiContext)
}
