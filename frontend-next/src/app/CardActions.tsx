'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  id: string | number
  nom: string
  type?: 'produit' | 'immo' | 'telecom'
}

export default function CardActions({ id, nom }: Props) {
  const sid = String(id)
  const router = useRouter()
  const [fav, setFav]         = useState(false)
  const [favAnim, setFavAnim] = useState(false)

  function sync() {
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('nopalou_favs') || '[]')
      setFav(favs.includes(sid))
    } catch {}
  }

  useEffect(() => {
    sync()
    window.addEventListener('nopalou:fav', sync)
    return () => window.removeEventListener('nopalou:fav', sync)
  }, [sid])

  function toggleFav(e: React.MouseEvent) {
    e.preventDefault()
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('nopalou_favs') || '[]')
      const adding = !fav
      const next = adding ? [...favs, sid] : favs.filter(f => f !== sid)
      localStorage.setItem('nopalou_favs', JSON.stringify(next))
      setFav(adding)
      setFavAnim(true)
      setTimeout(() => setFavAnim(false), 600)
      window.dispatchEvent(new CustomEvent('nopalou:fav', {
        detail: { adding, nom, count: next.length }
      }))
    } catch {}
  }

  function handleSearch(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/recherche?q=${encodeURIComponent(nom)}`)
  }

  return (
    <div className="card-actions" onClick={e => e.preventDefault()}>
      <button
        onClick={handleSearch}
        className="card-action-btn"
        title={`Rechercher "${nom}"`}
        aria-label="Rechercher"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>
      <button
        onClick={toggleFav}
        className={`card-action-btn card-action-btn--fav${fav ? ' active' : ''}${favAnim ? ' card-action-btn--pop' : ''}`}
        title={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        aria-label="Favoris"
      >
        ♥
      </button>
    </div>
  )
}
