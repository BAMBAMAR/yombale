'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Item { id: number; nom: string }

export default function CompareBar() {
  const [items, setItems] = useState<Item[]>([])

  function read() {
    try { setItems(JSON.parse(localStorage.getItem('nopalou_compare') || '[]')) } catch {}
  }

  useEffect(() => {
    read()
    window.addEventListener('nopalou:compare', read)
    return () => window.removeEventListener('nopalou:compare', read)
  }, [])

  if (items.length < 2) return null

  function clear(e: React.MouseEvent) {
    e.preventDefault()
    localStorage.removeItem('nopalou_compare')
    setItems([])
    window.dispatchEvent(new CustomEvent('nopalou:compare'))
  }

  return (
    <div className="compare-bar">
      <span className="compare-bar-label">⚖ {items.length} produits</span>
      <div className="compare-bar-items">
        {items.map(i => (
          <span key={i.id} className="compare-bar-item">
            {i.nom.length > 28 ? i.nom.slice(0, 28) + '…' : i.nom}
          </span>
        ))}
      </div>
      <div className="compare-bar-actions">
        <Link
          href={`/comparaison?ids=${items.map(i => i.id).join(',')}`}
          className="compare-bar-btn"
        >
          Comparer →
        </Link>
        <button onClick={clear} className="compare-bar-clear" aria-label="Vider la comparaison">
          ✕
        </button>
      </div>
    </div>
  )
}
