'use client'

import React from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, X } from 'lucide-react'

interface Props {
  categorie: string
}

export default function FacettesDynamiques({ categorie }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const catLower = (categorie || '').toLowerCase()

  // Définition des facettes pertinentes selon la catégorie
  const isTech = catLower.includes('smart') || catLower.includes('phone') || catLower.includes('informatique') || catLower.includes('ordinateur')
  const isMode = catLower.includes('mode') || catLower.includes('vetement') || catLower.includes('chaussure')
  const isImmo = catLower.includes('immo')

  if (!isTech && !isMode && !isImmo) return null

  function applyFilter(key: string, val: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (params.get(key) === val) {
      params.delete(key)
    } else {
      params.set(key, val)
    }
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}#resultats`, { scroll: false })
  }

  const currentRam = searchParams.get('ram') || ''
  const currentStockage = searchParams.get('stockage') || ''
  const currentTaille = searchParams.get('taille') || ''
  const currentPointure = searchParams.get('pointure') || ''

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        padding: '12px 16px',
        border: '1px solid var(--border, #E8DDD2)',
        marginBottom: 16,
        boxShadow: '0 1px 4px rgba(26,22,18,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 12, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
        <SlidersHorizontal size={14} color="var(--accent, #C75B00)" />
        <span>Filtres Spécifiques ({isTech ? 'Smartphones & Tech' : isMode ? 'Mode & Tailles' : 'Immobilier'}) :</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        {/* FACETTES TECH : STOCKAGE */}
        {isTech && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2, #5A4E42)' }}>Stockage :</span>
            {['64 Go', '128 Go', '256 Go', '512 Go'].map(st => {
              const active = currentStockage === st
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => applyFilter('stockage', st)}
                  style={{
                    padding: '3px 9px',
                    borderRadius: 14,
                    fontSize: 11,
                    fontWeight: active ? 800 : 600,
                    border: active ? '1.5px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
                    background: active ? 'var(--orange2, #FFF3E8)' : '#FFFFFF',
                    color: active ? 'var(--accent, #C75B00)' : 'var(--text1, #1A1612)',
                    cursor: 'pointer',
                  }}
                >
                  {st}
                </button>
              )
            })}
          </div>
        )}

        {/* FACETTES TECH : RAM */}
        {isTech && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2, #5A4E42)' }}>RAM :</span>
            {['4 Go', '6 Go', '8 Go', '16 Go'].map(r => {
              const active = currentRam === r
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => applyFilter('ram', r)}
                  style={{
                    padding: '3px 9px',
                    borderRadius: 14,
                    fontSize: 11,
                    fontWeight: active ? 800 : 600,
                    border: active ? '1.5px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
                    background: active ? 'var(--orange2, #FFF3E8)' : '#FFFFFF',
                    color: active ? 'var(--accent, #C75B00)' : 'var(--text1, #1A1612)',
                    cursor: 'pointer',
                  }}
                >
                  {r}
                </button>
              )
            })}
          </div>
        )}

        {/* FACETTES MODE : TAILLE */}
        {isMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2, #5A4E42)' }}>Taille :</span>
            {['S', 'M', 'L', 'XL', 'XXL'].map(t => {
              const active = currentTaille === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => applyFilter('taille', t)}
                  style={{
                    padding: '3px 9px',
                    borderRadius: 14,
                    fontSize: 11,
                    fontWeight: active ? 800 : 600,
                    border: active ? '1.5px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
                    background: active ? 'var(--orange2, #FFF3E8)' : '#FFFFFF',
                    color: active ? 'var(--accent, #C75B00)' : 'var(--text1, #1A1612)',
                    cursor: 'pointer',
                  }}
                >
                  {t}
                </button>
              )
            })}
          </div>
        )}

        {/* FACETTES MODE : POINTURE */}
        {isMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2, #5A4E42)' }}>Pointure :</span>
            {['38', '39', '40', '41', '42', '43', '44', '45'].map(p => {
              const active = currentPointure === p
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => applyFilter('pointure', p)}
                  style={{
                    padding: '3px 9px',
                    borderRadius: 14,
                    fontSize: 11,
                    fontWeight: active ? 800 : 600,
                    border: active ? '1.5px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
                    background: active ? 'var(--orange2, #FFF3E8)' : '#FFFFFF',
                    color: active ? 'var(--accent, #C75B00)' : 'var(--text1, #1A1612)',
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
