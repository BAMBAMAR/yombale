'use client'
import { useState, useEffect } from 'react'

interface Props {
  id: string | number
  nom: string
  type?: 'produit' | 'immo' | 'telecom' | 'annonce'
}

interface FavEntry { id: string; type: string }

const MAX_COMPARE = 3

// nopalou_favs a historiquement stocké un tableau d'IDs bruts (produits uniquement).
// On accepte les deux formats en lecture et on réécrit toujours au nouveau format.
function lireFavs(): FavEntry[] {
  try {
    const raw = JSON.parse(localStorage.getItem('nopalou_favs') || '[]')
    return raw.map((f: string | FavEntry) => typeof f === 'string' ? { id: f, type: 'produit' } : f)
  } catch { return [] }
}

export default function CardActions({ id, nom, type = 'produit' }: Props) {
  const sid = String(id)
  const [fav, setFav]         = useState(false)
  const [favAnim, setFavAnim] = useState(false)
  const [cmp, setCmp]         = useState(false)

  function syncFav() {
    const favs = lireFavs()
    setFav(favs.some(f => f.id === sid && f.type === type))
  }

  function syncCmp() {
    try {
      const list: { id: string }[] = JSON.parse(localStorage.getItem('nopalou_compare') || '[]')
      setCmp(list.some(i => i.id === sid))
    } catch {}
  }

  useEffect(() => {
    syncFav(); syncCmp()
    window.addEventListener('nopalou:fav', syncFav)
    window.addEventListener('nopalou:compare', syncCmp)
    return () => {
      window.removeEventListener('nopalou:fav', syncFav)
      window.removeEventListener('nopalou:compare', syncCmp)
    }
  }, [sid])

  function toggleFav(e: React.MouseEvent) {
    e.preventDefault()
    try {
      const favs = lireFavs()
      const adding = !fav
      const next = adding
        ? [...favs, { id: sid, type }]
        : favs.filter(f => !(f.id === sid && f.type === type))
      localStorage.setItem('nopalou_favs', JSON.stringify(next))
      setFav(adding)
      setFavAnim(true)
      setTimeout(() => setFavAnim(false), 600)
      window.dispatchEvent(new CustomEvent('nopalou:fav', { detail: { adding, nom, count: next.length } }))
    } catch {}
  }

  function toggleCompare(e: React.MouseEvent) {
    e.preventDefault()
    try {
      const list: { id: string; nom: string; type: string }[] =
        JSON.parse(localStorage.getItem('nopalou_compare') || '[]')
      const already = list.some(i => i.id === sid)
      let next
      if (already) {
        next = list.filter(i => i.id !== sid)
      } else {
        if (list.length >= MAX_COMPARE) return // silently ignore si déjà 3
        next = [...list, { id: sid, nom, type }]
      }
      localStorage.setItem('nopalou_compare', JSON.stringify(next))
      setCmp(!already)
      window.dispatchEvent(new CustomEvent('nopalou:compare'))
    } catch {}
  }

  return (
    <div className="card-actions" onClick={e => e.preventDefault()}>
      <button
        onClick={toggleCompare}
        className={`card-action-btn${cmp ? ' active' : ''}`}
        title={cmp ? 'Retirer de la comparaison' : 'Comparer'}
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
