'use client'
import { useEffect, useRef } from 'react'

/**
 * Hook universel pour les menus et rubans défilants horizontaux.
 * Déclenche un micro-balancement doux (+35px puis retour) au chargement et toutes les 60s sur mobile,
 * et permet le centrage fluide au clic.
 */
export function useScrollNudge<T extends HTMLElement = HTMLDivElement>(intervalMs = 60000) {
  const ref = useRef<T | null>(null)
  const isInteracting = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleTouchStart = () => { isInteracting.current = true }
    const handleTouchEnd = () => {
      setTimeout(() => { isInteracting.current = false }, 5000)
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })
    el.addEventListener('mouseenter', handleTouchStart)
    el.addEventListener('mouseleave', handleTouchEnd)

    function doNudge() {
      if (!el || isInteracting.current) return
      if (typeof window !== 'undefined' && window.innerWidth > 768) return

      // Vérifier s'il y a un réel débordement
      const maxScroll = el.scrollWidth - el.clientWidth
      if (maxScroll <= 10) return

      // Si l'utilisateur est déjà au bout à droite, ne pas balayer
      if (el.scrollLeft >= maxScroll - 15) return

      const current = el.scrollLeft
      const target = Math.min(maxScroll, current + 35)

      // Micro-balancement : +35px puis retour fluide
      el.scrollTo({ left: target, behavior: 'smooth' })
      setTimeout(() => {
        if (el && !isInteracting.current) {
          el.scrollTo({ left: current, behavior: 'smooth' })
        }
      }, 550)
    }

    // Premier micro-nudge 1.5s après l'apparition
    const initialTimer = setTimeout(doNudge, 1500)
    const intervalTimer = setInterval(doNudge, intervalMs)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(intervalTimer)
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchend', handleTouchEnd)
      el.removeEventListener('mouseenter', handleTouchStart)
      el.removeEventListener('mouseleave', handleTouchEnd)
    }
  }, [intervalMs])

  const scrollToCenter = (targetEl: HTMLElement | null) => {
    if (!targetEl) return
    targetEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  return { scrollRef: ref, scrollToCenter }
}
