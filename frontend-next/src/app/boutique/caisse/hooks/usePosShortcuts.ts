'use client'

import { useEffect } from 'react'

interface UsePosShortcutsOptions {
  onFocusSearch: () => void
  onTriggerCheckout: () => void
  onHoldTicket: () => void
  onClearCartOrDismiss: () => void
  enabled?: boolean
}

export function usePosShortcuts({
  onFocusSearch,
  onTriggerCheckout,
  onHoldTicket,
  onClearCartOrDismiss,
  enabled = true,
}: UsePosShortcutsOptions) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')

      // F2 — Focus direct sur la barre de recherche
      if (e.key === 'F2') {
        e.preventDefault()
        onFocusSearch()
        return
      }

      // F4 — Accès direct au règlement / Encaissement
      if (e.key === 'F4') {
        e.preventDefault()
        onTriggerCheckout()
        return
      }

      // F8 — Mettre le panier en attente (Client suivant)
      if (e.key === 'F8') {
        e.preventDefault()
        onHoldTicket()
        return
      }

      // Échap — Fermer les modales ou vider
      if (e.key === 'Escape') {
        onClearCartOrDismiss()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onFocusSearch, onTriggerCheckout, onHoldTicket, onClearCartOrDismiss, enabled])
}
