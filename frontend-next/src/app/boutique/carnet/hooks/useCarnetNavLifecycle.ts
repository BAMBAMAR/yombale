'use client'

import { useState, useEffect } from 'react'
import type { ClientCredit } from '../types'

interface UseCarnetNavLifecycleProps {
  clientSelectionne: ClientCredit | null
  setClientSelectionne: (c: ClientCredit | null) => void
  setMenuOuvertClientId: (id: string | null) => void
  setShowMenuOptionsDettes: (v: boolean) => void
  setShowModalNouveauClient: (v: boolean) => void
  setShowModalEditClient: (v: boolean) => void
  setShowModalTransaction: (v: boolean) => void
  setShowQrModalComptoir: (v: boolean) => void
}

export function useCarnetNavLifecycle({
  clientSelectionne,
  setClientSelectionne,
  setMenuOuvertClientId,
  setShowMenuOptionsDettes,
  setShowModalNouveauClient,
  setShowModalEditClient,
  setShowModalTransaction,
  setShowQrModalComptoir,
}: UseCarnetNavLifecycleProps) {
  const [isMobile, setIsMobile] = useState(false)

  // Responsiveness
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Clic extérieur & Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.npl-dropdown')) setMenuOuvertClientId(null)
      if (!target.closest('.npl-dettes-options-dropdown')) setShowMenuOptionsDettes(false)
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOuvertClientId(null)
        setShowMenuOptionsDettes(false)
        setShowModalNouveauClient(false)
        setShowModalEditClient(false)
        setShowModalTransaction(false)
        setShowQrModalComptoir(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [setMenuOuvertClientId, setShowMenuOptionsDettes, setShowModalEditClient, setShowModalNouveauClient, setShowModalTransaction, setShowQrModalComptoir])

  // Historique mobile navigation
  useEffect(() => {
    if (!clientSelectionne || !isMobile) return
    const onPop = () => setClientSelectionne(null)
    if (typeof window !== 'undefined') {
      window.history.pushState({ clientDetail: true }, '')
      window.addEventListener('popstate', onPop)
    }
    return () => {
      if (typeof window !== 'undefined') window.removeEventListener('popstate', onPop)
    }
  }, [clientSelectionne?.id, isMobile, setClientSelectionne])

  return { isMobile }
}
