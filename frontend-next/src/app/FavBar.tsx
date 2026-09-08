'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function FavBar() {
  const pathname = usePathname() || ''
  const [count, setCount] = useState(0)

  function read() {
    try {
      const favs: unknown[] = JSON.parse(localStorage.getItem('nopalou_favs') || '[]')
      setCount(favs.length)
    } catch {}
  }

  useEffect(() => {
    read()
    window.addEventListener('nopalou:fav', read)
    return () => window.removeEventListener('nopalou:fav', read)
  }, [])

  if (count === 0 || pathname === '/favoris') return null

  function clear(e: React.MouseEvent) {
    e.preventDefault()
    localStorage.removeItem('nopalou_favs')
    setCount(0)
    window.dispatchEvent(new CustomEvent('nopalou:fav', { detail: { adding: false, nom: '', count: 0 } }))
  }

  const favHref = pathname.startsWith('/compte') ? '/compte?tab=favoris' : '/favoris'

  return (
    <div className="fav-bar" role="region" aria-label="Barre d'actions des favoris">
      <span className="fav-bar-label">❤ Favoris</span>
      <span className="fav-bar-count">
        {count} produit{count > 1 ? 's' : ''} sauvegardé{count > 1 ? 's' : ''}
      </span>
      <div className="fav-bar-actions">
        <Link href={favHref} className="fav-bar-btn">
          Voir mes favoris →
        </Link>
        <button onClick={clear} className="fav-bar-clear" aria-label="Vider les favoris">
          ✕ Vider
        </button>
      </div>
    </div>
  )
}
