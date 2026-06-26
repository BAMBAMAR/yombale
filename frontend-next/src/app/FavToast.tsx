'use client'

import { useEffect, useState } from 'react'

interface FavEvent { adding: boolean; nom: string; count: number }

export default function FavToast() {
  const [visible, setVisible] = useState(false)
  const [info, setInfo]       = useState<FavEvent | null>(null)
  const [timer, setTimer]     = useState<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<FavEvent>).detail
      setInfo(detail)
      setVisible(true)
      if (timer) clearTimeout(timer)
      const t = setTimeout(() => setVisible(false), 2500)
      setTimer(t)
    }
    window.addEventListener('nopalou:fav', handler)
    return () => window.removeEventListener('nopalou:fav', handler)
  }, [timer])

  if (!info) return null

  return (
    <div className={`fav-toast${visible ? ' fav-toast--visible' : ''}`} role="status" aria-live="polite">
      <span className="fav-toast-icon">{info.adding ? '❤️' : '🤍'}</span>
      <span className="fav-toast-msg">
        {info.adding
          ? <><strong>{info.nom}</strong> ajouté aux favoris</>
          : <><strong>{info.nom}</strong> retiré des favoris</>
        }
      </span>
      <a href="/favoris" className="fav-toast-link">
        Voir mes favoris ({info.count})
      </a>
    </div>
  )
}
