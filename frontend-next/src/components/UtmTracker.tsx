'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { captureAndPersistUtm } from '@/lib/analytics'

/**
 * Composant client invisible monté à la racine pour capter et persister
 * automatiquement les paramètres UTM dès l'arrivée de l'utilisateur sur le site.
 */
export default function UtmTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    captureAndPersistUtm(searchParams)
  }, [searchParams])

  return null
}
