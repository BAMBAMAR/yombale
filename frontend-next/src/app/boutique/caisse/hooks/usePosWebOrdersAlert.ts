// frontend-next/src/app/boutique/caisse/hooks/usePosWebOrdersAlert.ts
'use client'

import { useEffect, useRef } from 'react'
import { playWebOrderChime } from '@/lib/audio-chime'

interface UsePosWebOrdersAlertProps {
  boutiqueActiveId: string
  isReallyOnline: boolean
  initialToken?: string | null
  showToast: (text: string, type?: 'success' | 'warning') => void
  formatPrice: (p: number) => string
}

export function usePosWebOrdersAlert({
  boutiqueActiveId,
  isReallyOnline,
  initialToken,
  showToast,
  formatPrice,
}: UsePosWebOrdersAlertProps) {
  const initialisesCommandesRef = useRef(false)
  const knownCommandesIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!boutiqueActiveId || !isReallyOnline) return

    const verifierNouvellesCommandesWeb = async () => {
      try {
        const token = initialToken || (typeof window !== 'undefined' ? localStorage.getItem('nopalou_token') : null)
        const headers: Record<string, string> = {}
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch(`/api/comptabilite/${boutiqueActiveId}/commandes?statut=confirmee`, { headers })
        if (!res.ok) return
        const commandes = await res.json()
        if (!Array.isArray(commandes)) return

        if (!initialisesCommandesRef.current) {
          commandes.forEach((c: any) => knownCommandesIdsRef.current.add(c.id || c.reference))
          initialisesCommandesRef.current = true
          return
        }

        const nouvelles = commandes.filter((c: any) => !knownCommandesIdsRef.current.has(c.id || c.reference))
        if (nouvelles.length > 0) {
          nouvelles.forEach((c: any) => knownCommandesIdsRef.current.add(c.id || c.reference))
          playWebOrderChime()
          const premiere = nouvelles[0]
          showToast(
            `Nouvelle commande Web reçue (${premiere.reference || 'CMD'}) • ${formatPrice(premiere.montant_total || 0)}`,
            'success'
          )
        }
      } catch (err) {
        console.warn('[POS WEB ORDERS] Échec vérification:', err)
      }
    }

    verifierNouvellesCommandesWeb()
    const interval = setInterval(verifierNouvellesCommandesWeb, 25000)
    return () => clearInterval(interval)
  }, [boutiqueActiveId, isReallyOnline, initialToken, showToast, formatPrice])
}
