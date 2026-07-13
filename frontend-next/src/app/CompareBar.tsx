'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { lireCompare, type CompareEntry } from '@/lib/comparaison'

export default function CompareBar() {
  const router = useRouter()
  const pathname = usePathname()
  const [items, setItems] = useState<CompareEntry[]>([])

  function read() {
    setItems(lireCompare())
  }

  function retirerFiltreUrl() {
    const params = new URLSearchParams(window.location.search)
    if (!params.get('sousType')) return
    params.delete('sousType')
    params.delete('page')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
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
    retirerFiltreUrl()
  }

  function removeOne(id: string) {
    const next = items.filter(i => i.id !== id)
    localStorage.setItem('nopalou_compare', JSON.stringify(next))
    setItems(next)
    window.dispatchEvent(new CustomEvent('nopalou:compare'))
    if (next.length === 0) {
      retirerFiltreUrl()
    }
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
