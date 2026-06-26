'use client'
import { useState, useEffect } from 'react'

interface Props {
  id: string | number
  nom: string
  type?: 'produit' | 'immo' | 'telecom'
}

export default function CardActions({ id, nom, type = 'produit' }: Props) {
  const sid = String(id)
  const [fav, setFav]             = useState(false)
  const [inCompare, setInCompare] = useState(false)
  const [favAnim, setFavAnim]     = useState(false)
  const [cmpAnim, setCmpAnim]     = useState(false)

  function sync() {
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('nopalou_favs') || '[]')
      const cmps: { id: string }[] = JSON.parse(localStorage.getItem('nopalou_compare') || '[]')
      setFav(favs.includes(sid))
      setInCompare(cmps.some(c => c.id === sid))
    } catch {}
  }

  useEffect(() => {
    sync()
    window.addEventListener('nopalou:fav', sync)
    window.addEventListener('nopalou:compare', sync)
    return () => {
      window.removeEventListener('nopalou:fav', sync)
      window.removeEventListener('nopalou:compare', sync)
    }
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

  function toggleCompare(e: React.MouseEvent) {
    e.preventDefault()
    try {
      const cmps: { id: string; nom: string; type: string }[] = JSON.parse(localStorage.getItem('nopalou_compare') || '[]')
      let next
      if (inCompare) {
        next = cmps.filter(c => c.id !== sid)
      } else {
        if (cmps.length >= 3) { alert('Maximum 3 éléments à comparer'); return }
        next = [...cmps, { id: sid, nom, type }]
      }
      localStorage.setItem('nopalou_compare', JSON.stringify(next))
      setInCompare(!inCompare)
      setCmpAnim(true)
      setTimeout(() => setCmpAnim(false), 600)
      window.dispatchEvent(new CustomEvent('nopalou:compare'))
    } catch {}
  }

  return (
    <div className="card-actions" onClick={e => e.preventDefault()}>
      <button
        onClick={toggleCompare}
        className={`card-action-btn${inCompare ? ' active' : ''}${cmpAnim ? ' card-action-btn--pop' : ''}`}
        title={inCompare ? 'Retirer de la comparaison' : 'Ajouter à la comparaison'}
        aria-label="Comparer"
      >
        ⚖
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
