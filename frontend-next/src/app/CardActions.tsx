'use client'
import { useState, useEffect } from 'react'

interface Props { id: number; nom: string }

export default function CardActions({ id, nom }: Props) {
  const [fav, setFav]           = useState(false)
  const [inCompare, setInCompare] = useState(false)

  useEffect(() => {
    try {
      const favs: number[]              = JSON.parse(localStorage.getItem('nopalou_favs')    || '[]')
      const cmps: { id: number }[]      = JSON.parse(localStorage.getItem('nopalou_compare') || '[]')
      setFav(favs.includes(id))
      setInCompare(cmps.some(c => c.id === id))
    } catch {}
  }, [id])

  function toggleFav(e: React.MouseEvent) {
    e.preventDefault()
    try {
      const favs: number[] = JSON.parse(localStorage.getItem('nopalou_favs') || '[]')
      const next = fav ? favs.filter(f => f !== id) : [...favs, id]
      localStorage.setItem('nopalou_favs', JSON.stringify(next))
      setFav(!fav)
    } catch {}
  }

  function toggleCompare(e: React.MouseEvent) {
    e.preventDefault()
    try {
      const cmps: { id: number; nom: string }[] = JSON.parse(localStorage.getItem('nopalou_compare') || '[]')
      let next
      if (inCompare) {
        next = cmps.filter(c => c.id !== id)
      } else {
        if (cmps.length >= 3) { alert('Maximum 3 produits à comparer'); return }
        next = [...cmps, { id, nom }]
      }
      localStorage.setItem('nopalou_compare', JSON.stringify(next))
      setInCompare(!inCompare)
      window.dispatchEvent(new CustomEvent('nopalou:compare'))
    } catch {}
  }

  return (
    <div className="card-actions" onClick={e => e.preventDefault()}>
      <button
        onClick={toggleCompare}
        className={`card-action-btn${inCompare ? ' active' : ''}`}
        title={inCompare ? 'Retirer de la comparaison' : 'Comparer'}
        aria-label="Comparer"
      >
        ⚖
      </button>
      <button
        onClick={toggleFav}
        className={`card-action-btn card-action-btn--fav${fav ? ' active' : ''}`}
        title={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        aria-label="Favoris"
      >
        ♥
      </button>
    </div>
  )
}
