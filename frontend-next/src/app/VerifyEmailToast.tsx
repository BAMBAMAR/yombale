'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function VerifyEmailToast() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (searchParams.get('email_verifie') === '1') {
      setVisible(true)
      // Nettoyer l'URL sans recharger la page
      const url = new URL(window.location.href)
      url.searchParams.delete('email_verifie')
      router.replace(url.pathname + (url.search ? url.search : ''), { scroll: false })
      // Masquer après 4 secondes
      const t = setTimeout(() => setVisible(false), 4000)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!visible) return null

  return (
    <div
      className="fav-toast fav-toast--visible"
      role="status"
      aria-live="polite"
      style={{ background: 'var(--success, #10b981)', bottom: 100, right: 20 }}
    >
      <span className="fav-toast-icon">✅</span>
      <span className="fav-toast-msg">
        <strong>Email vérifié</strong>
        Vous pouvez maintenant publier vos annonces.
      </span>
    </div>
  )
}
