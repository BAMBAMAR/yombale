'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { Produit } from '../types'
import { getBoutiqueProduits, updateStock } from '../../actions'
import { exportToCSV, printPDFReport } from '@/lib/export'
import { inputStyle } from '../utils'
import { useTranslation } from '@/i18n/context'

interface ComptaStockViewProps {
  boutiqueId: string
}

export function ComptaStockView({ boutiqueId }: ComptaStockViewProps) {
  const { t } = useTranslation()
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [stockVal, setStockVal] = useState<Record<string, string>>({})
  const [, startTransition] = useTransition()

  async function load() {
    setLoading(true)
    try {
      const prods = await getBoutiqueProduits(boutiqueId)
      if (prods && prods.length > 0) {
        setProduits(prods)
      } else {
        const cache = typeof window !== 'undefined' ? localStorage.getItem(`nopalou_pos_produits_${boutiqueId}`) : null
        if (cache) {
          try {
            const parsed = JSON.parse(cache)
            if (Array.isArray(parsed)) setProduits(parsed)
          } catch (err) { console.warn('[Nopalou:ComptaStockView:CacheFallback]', err) }
        }
      }
    } catch (e) {
      console.warn('StockView offline fallback', e)
      const cache = typeof window !== 'undefined' ? localStorage.getItem(`nopalou_pos_produits_${boutiqueId}`) : null
      if (cache) {
        try {
          const parsed = JSON.parse(cache)
          if (Array.isArray(parsed)) setProduits(parsed)
        } catch (err) { console.warn('[Nopalou:ComptaStockView:CacheError]', err) }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [boutiqueId])

  function saveStock(produitId: string) {
    const val = stockVal[produitId]
    if (val === undefined || val === '') return
    startTransition(async () => {
      await updateStock(boutiqueId, produitId, Number(val))
      setEditing(null)
      load()
    })
  }

  function exportStockCSV() {
    const headers = ['ID Produit', 'Nom Produit', 'Prix (FCFA)', 'Quantité en Stock', 'Statut Stock']
    const rows = produits.map(p => [
      p.id,
      p.nom,
      p.prix || 0,
      (p.quantite_stock ?? p.stock_quantite) ?? 'Non suivi',
      (p.quantite_stock ?? p.stock_quantite) === null ? 'Non suivi' : (p.quantite_stock ?? p.stock_quantite)! <= 3 ? 'STOCK BAS' : 'DISPONIBLE'
    ])
    exportToCSV(`inventaire_stock_${boutiqueId}`, headers, rows)
  }

  function exportStockPDF() {
    const headers = ['ID', 'Nom Produit', 'Prix', 'Stock Restant', 'Statut']
    const rows = produits.map(p => [
      p.id.slice(0, 8),
      p.nom,
      p.prix ? `${p.prix.toLocaleString('fr-FR')} FCFA` : '—',
      (p.quantite_stock ?? p.stock_quantite) ?? 'Non suivi',
      (p.quantite_stock ?? p.stock_quantite) === null ? 'Non suivi' : (p.quantite_stock ?? p.stock_quantite)! <= 3 ? 'BAS' : 'OK'
    ])
    printPDFReport('Inventaire État des Stocks', `Boutique ${boutiqueId}`, headers, rows)
  }

  if (loading) return <p style={{ color: '#9ca3af', fontSize: 14 }}>{t('common.loading')}</p>

  if (produits.length === 0) return (
    <div style={{ textAlign: 'center', padding: '32px 20px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #d1d5db', color: '#9ca3af', fontSize: 14 }}>
      {t('shop.noProductsInInventory')}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{t('shop.inventoryRefTitle')} ({produits.length} {t('shop.catalog').toLowerCase()})</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportStockCSV} style={{ fontSize: 12, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer' }}>
            {t('common.exportCsv')}
          </button>
          <button onClick={exportStockPDF} style={{ fontSize: 12, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer' }}>
            {t('common.exportPdf')}
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {produits.map(p => (
          <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: 0, fontSize: 14, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nom}</h4>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>ID: {p.id.slice(0, 8)}</p>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                {p.prix ? `${p.prix.toLocaleString('fr-FR')} FCFA` : '—'}
              </div>
            </div>
            {editing === p.id ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="number"
                  value={stockVal[p.id] ?? ((p.quantite_stock ?? p.stock_quantite) ?? '')}
                  onChange={e => setStockVal(prev => ({ ...prev, [p.id]: e.target.value }))}
                  style={{ ...inputStyle, width: 80 }}
                  autoFocus
                />
                <button onClick={() => saveStock(p.id)} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✓</button>
                <button onClick={() => setEditing(null)} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}>✕</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span style={{
                  fontSize: 13, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  background: (p.quantite_stock ?? p.stock_quantite) === null ? '#f1f5f9' : (p.quantite_stock ?? p.stock_quantite)! <= 3 ? '#fef2f2' : '#dcfce7',
                  color: (p.quantite_stock ?? p.stock_quantite) === null ? '#9ca3af' : (p.quantite_stock ?? p.stock_quantite)! <= 3 ? '#dc2626' : '#16a34a',
                }}>
                  {(p.quantite_stock ?? p.stock_quantite) === null ? t('shop.notTrackedBadge') : `${(p.quantite_stock ?? p.stock_quantite)} ${t('shop.inStockLabel')}`}
                </span>
                <button onClick={() => { setEditing(p.id); setStockVal(prev => ({ ...prev, [p.id]: String((p.quantite_stock ?? p.stock_quantite) ?? '') })) }}
                  style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12 }}>
                  {t('common.edit')}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
