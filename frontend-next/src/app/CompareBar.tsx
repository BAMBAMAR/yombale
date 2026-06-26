'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Item { id: string; nom: string; type?: string }

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

  if (items.length === 0) return null

  function clear(e: React.MouseEvent) {
    e.preventDefault()
    localStorage.removeItem('nopalou_compare')
    setItems([])
    window.dispatchEvent(new CustomEvent('nopalou:compare'))
  }

  function removeOne(id: string) {
    const next = items.filter(i => i.id !== id)
    localStorage.setItem('nopalou_compare', JSON.stringify(next))
    setItems(next)
    window.dispatchEvent(new CustomEvent('nopalou:compare'))
  }

  return (
    <div className="compare-bar">
      <span className="compare-bar-label">⚖ Comparaison</span>

      <div className="compare-bar-items">
        {items.map(i => (
          <span key={i.id} className="compare-bar-item">
            {i.nom.length > 22 ? i.nom.slice(0, 22) + '…' : i.nom}
            <button
              className="compare-bar-item-remove"
              onClick={() => removeOne(i.id)}
              aria-label="Retirer"
            >✕</button>
          </span>
        ))}
        {/* Slots vides pour guider l'utilisateur */}
        {items.length < 2 && (
          <span className="compare-bar-slot">+ Ajoutez un 2e élément</span>
        )}
        {items.length < 3 && items.length >= 2 && (
          <span className="compare-bar-slot compare-bar-slot--opt">+ 3e élément (optionnel)</span>
        )}
      </div>

      <div className="compare-bar-actions">
        {items.length >= 2 ? (
          (() => {
            const t = items[0]?.type
            const allSame = items.every(i => i.type === t)
            const ids = items.map(i => i.id).join(',')
            const href = allSame && t === 'immo'
              ? `/immo/comparaison?ids=${ids}`
              : allSame && t === 'telecom'
              ? `/telecom/comparaison?ids=${ids}`
              : `/comparaison?ids=${ids}`
            return <Link href={href} className="compare-bar-btn">Comparer →</Link>
          })()
        ) : (
          <span className="compare-bar-hint">Sélectionnez au moins 2 éléments</span>
        )}
        <button onClick={clear} className="compare-bar-clear" aria-label="Vider la comparaison">
          ✕ Vider
        </button>
      </div>
    </div>
  )
}
