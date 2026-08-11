'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function PwaBackButton() {
  const pathname = usePathname()
  const router = useRouter()
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://')

      setIsStandalone(standalone)
    }

    checkStandalone()
  }, [])

  // Ne pas afficher sur la page d'accueil ou si pas en mode PWA standalone
  if (!isStandalone || pathname === '/') return null

  // Ne pas afficher sur la caisse POS qui a déjà son propre header de retour ultra-visible
  if (pathname.includes('/boutique/caisse')) return null

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <button
      onClick={handleBack}
      aria-label="Retour à la page précédente"
      style={{
        position: 'fixed',
        bottom: '80px', // juste au-dessus des barres mobiles
        left: '16px',
        zIndex: 9999,
        background: '#0f172a',
        color: '#ffffff',
        border: '1px solid #334155',
        borderRadius: '24px',
        padding: '8px 16px 8px 12px',
        fontSize: '13px',
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        pointerEvents: 'auto',
      }}
    >
      <ArrowLeft size={16} />
      <span>Retour</span>
    </button>
  )
}
