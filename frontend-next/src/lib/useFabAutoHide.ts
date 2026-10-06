'use client'

import { useState, useEffect, useRef } from 'react'

/**
 * Hook personnalisé d'auto-hide pour le bouton flottant vocal (FAB) de Surga
 * Masque automatiquement le bouton lors du scroll descendant (lecture active)
 * et le réaffiche lors du scroll ascendant ou dès que l'utilisateur s'arrête.
 */
export function useFabAutoHide(seuil = 60): boolean {
  const [isHidden, setIsHidden] = useState(false)
  const lastScrollYRef = useRef(0)

  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY
          // Scroll vers le bas au-delà du seuil initial -> masquer
          if (currentY > seuil && currentY > lastScrollYRef.current + 8) {
            setIsHidden(true)
          }
          // Scroll vers le haut ou retour tout en haut -> réafficher
          else if (currentY < lastScrollYRef.current - 6 || currentY <= seuil) {
            setIsHidden(false)
          }
          lastScrollYRef.current = currentY
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [seuil])

  return isHidden
}
