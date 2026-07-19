'use client'

import { useState } from 'react'
import Link from 'next/link'

interface FiltrePill {
  key: string
  label: string
  href?: string
  onClick?: () => void
  active: boolean
  reset?: boolean
}

interface FiltresBarProps {
  essentiels: FiltrePill[]
  secondaires?: FiltrePill[]
  secondaireActifsCount?: number
  tri?: FiltrePill[]
}

function Pill({ p }: { p: FiltrePill }) {
  const cls = `filter-pill${p.active ? ' filter-pill--active' : ''}${p.reset ? ' filter-pill--reset' : ''}`
  if (p.href) {
    return <Link href={p.href} className={cls}>{p.label}</Link>
  }
  return <button type="button" className={cls} onClick={p.onClick}>{p.label}</button>
}

export default function FiltresBar({ essentiels, secondaires = [], secondaireActifsCount, tri = [] }: FiltresBarProps) {
  const [open, setOpen] = useState(false)
  const badgeCount = secondaireActifsCount ?? secondaires.filter(p => p.active).length

  return (
    <div>
      <div className="filtres-row">
        {essentiels.map(p => <Pill key={p.key} p={p} />)}

        {secondaires.length > 0 && (
          <button type="button" className="filtres-more-btn" onClick={() => setOpen(o => !o)}>
            ⚙ Plus de filtres
            {badgeCount > 0 && <span className="filtres-more-badge">{badgeCount}</span>}
          </button>
        )}

        {tri.length > 0 && (
          <>
            <span className="filtres-label" style={{ marginLeft: 8 }}>Trier :</span>
            {tri.map(p => <Pill key={p.key} p={p} />)}
          </>
        )}
      </div>

      {open && secondaires.length > 0 && (
        <div className="filtres-panel">
          <div className="filtres-panel-row">
            {secondaires.map(p => <Pill key={p.key} p={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}
