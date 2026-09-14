'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { getInventaireValorise, updateStock } from '../../actions'
import { fcfa, formatNombre } from '@/lib/format'
import { exportToCSV, printInventairePDF } from '@/lib/export'
import { useTranslation } from '@/i18n/context'
import { inputStyle, KpiCard } from '../utils'

export default function ComptaInventaireView({
  boutiqueId,
  boutiqueNom = 'Ma Boutique',
}: {
  boutiqueId: string
  boutiqueNom?: string
}) {
  const { t } = useTranslation()
  const [produits, setProduits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtreRecherche, setFiltreRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState<'tous' | 'alerte' | 'en_stock'>('tous')
  const [ajustantId, setAjustantId] = useState<string | null>(null)
  const [nouveauStock, setNouveauStock] = useState<number>(0)
  const [, startTransition] = useTransition()

  const loadInventaire = async () => {
    setLoading(true)
    const cacheKey = `nopalou_inventaire_${boutiqueId}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        setProduits(JSON.parse(cached))
        setLoading(false)
      } catch (e) {
        console.warn('[Nopalou:ComptaInventaireView:cache]', e)
      }
    }

    try {
      const data = await getInventaireValorise(boutiqueId)
      if (Array.isArray(data)) {
        setProduits(data)
        localStorage.setItem(cacheKey, JSON.stringify(data))
      }
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInventaire()
  }, [boutiqueId])

  const totalReferences = produits.length
  const totalQuantiteStock = produits.reduce((acc, p) => acc + (Number(p.stock_quantite) || 0), 0)
  const valeurStockAchat = produits.reduce((acc, p) => acc + (Number(p.valeur_achat_totale) || 0), 0)
  const valeurStockVente = produits.reduce((acc, p) => acc + (Number(p.valeur_vente_totale) || 0), 0)
  const margeStockPotentielle = valeurStockVente - valeurStockAchat
  const margeStockPct = valeurStockVente > 0 ? Math.round((margeStockPotentielle / valeurStockVente) * 100) : 0
  const stockAlertesCount = produits.filter((p) => p.stock_quantite !== null && p.stock_quantite <= 3).length

  const produitsFiltres = produits.filter((p) => {
    if (filtreRecherche.trim()) {
      const q = filtreRecherche.trim().toLowerCase()
      const matchNom = p.nom?.toLowerCase().includes(q)
      const matchCat = p.categorie?.toLowerCase().includes(q)
      const matchCode = p.code_barre?.toLowerCase().includes(q)
      if (!matchNom && !matchCat && !matchCode) return false
    }
    if (filtreStatut === 'alerte') {
      if (p.stock_quantite === null || p.stock_quantite > 3) return false
    }
    if (filtreStatut === 'en_stock') {
      if (p.stock_quantite !== null && p.stock_quantite <= 0) return false
    }
    return true
  })

  const handleExportExcel = () => {
    const headers = [
      'Référence / ID',
      'Désignation Article',
      'Catégorie',
      'Code-barres',
      'Stock Disponible',
      "Prix d'Achat (Coût)",
      'Prix de Vente',
      'Valeur Stock Achat',
      'Valeur Marchande Vente',
      'Marge Unitaire',
      'Marge %',
    ]
    const rows = produits.map((p) => [
      p.id,
      p.nom,
      p.categorie || 'Non classé',
      p.code_barre || '',
      p.stock_quantite ?? 0,
      p.prix_achat ?? 0,
      p.prix ?? 0,
      p.valeur_achat_totale ?? 0,
      p.valeur_vente_totale ?? 0,
      p.marge_unitaire ?? 0,
      `${p.marge_pct ?? 0}%`,
    ])

    exportToCSV(`inventaire_valorise_${boutiqueNom.replace(/\s+/g, '_')}`, headers, rows)
  }

  const handlePrintPDF = () => {
    printInventairePDF({
      boutiqueNom,
      inventaireStats: {
        total_references: totalReferences,
        total_quantite_stock: totalQuantiteStock,
        valeur_stock_achat: valeurStockAchat,
        valeur_stock_vente: valeurStockVente,
        marge_stock_potentielle: margeStockPotentielle,
      },
      produits: produitsFiltres,
    })
  }

  const submitAjustementStock = (prodId: string) => {
    startTransition(async () => {
      await updateStock(boutiqueId, prodId, nouveauStock)
      setAjustantId(null)
      loadInventaire()
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPIs Valorisation du Stock */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard
          label="Valeur Coût d'Achat"
          value={fcfa(valeurStockAchat)}
          sub="Capital immobilisé dans le stock"
          color="#0f172a"
          bg="#f8fafc"
        />
        <KpiCard
          label="Valeur Marchande (Vente)"
          value={fcfa(valeurStockVente)}
          sub="CA potentiel si tout est vendu"
          color="#1e3a8a"
          bg="#eff6ff"
        />
        <KpiCard
          label="Marge Brute Potentielle"
          value={fcfa(margeStockPotentielle)}
          sub={`Taux de marge prévisionnel : ${margeStockPct}%`}
          color="#15803d"
          bg="#f0fdf4"
        />
        <KpiCard
          label="Articles en Stock"
          value={`${formatNombre(totalQuantiteStock)} pcs`}
          sub={`${totalReferences} références (${stockAlertesCount} en alerte)`}
          color={stockAlertesCount > 0 ? '#b45309' : '#0f172a'}
          bg={stockAlertesCount > 0 ? '#fffbeb' : '#ffffff'}
        />
      </div>

      {/* Barre d'Actions & Filtres */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: '1 1 240px' }}>
            <input
              type="text"
              placeholder="Rechercher un article, catégorie, code-barres…"
              value={filtreRecherche}
              onChange={(e) => setFiltreRecherche(e.target.value)}
              style={{ ...inputStyle, padding: '8px 12px', fontSize: 13 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handlePrintPDF}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #0284c7',
                background: '#f0f9ff',
                color: '#0369a1',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>Fiche Pointage PDF</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #16a34a',
                background: '#f0fdf4',
                color: '#15803d',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Pilules de statut stock */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'tous', label: `Tous (${totalReferences})` },
            { id: 'alerte', label: `Ruptures & Alertes (${stockAlertesCount})` },
            { id: 'en_stock', label: `En stock normal` },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltreStatut(f.id as any)}
              style={{
                padding: '4px 10px',
                borderRadius: 16,
                fontSize: 12,
                fontWeight: filtreStatut === f.id ? 800 : 600,
                border: filtreStatut === f.id ? '1px solid #0284c7' : '1px solid #e2e8f0',
                background: filtreStatut === f.id ? '#e0f2fe' : '#f8fafc',
                color: filtreStatut === f.id ? '#0369a1' : '#64748b',
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau d'Inventaire Détaillé */}
      {loading && produits.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>Chargement de l&apos;inventaire…</p>
      ) : (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left', minWidth: 620 }}>
              <thead>
                <tr
                  style={{
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    color: '#475569',
                    fontSize: 11.5,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <th style={{ padding: '12px 16px' }}>Article</th>
                  <th style={{ padding: '12px 12px' }}>Catégorie</th>
                  <th style={{ padding: '12px 12px', textAlign: 'center' }}>Stock</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>Prix Achat</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>Prix Vente</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>Valeur Vente</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>Marge (%)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {produitsFiltres.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                      Aucun article correspondant trouvé.
                    </td>
                  </tr>
                ) : (
                  produitsFiltres.map((p) => {
                    const isAlert = p.stock_quantite !== null && p.stock_quantite <= 3
                    const isEditing = ajustantId === p.id
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                          <div>{p.nom}</div>
                          {p.code_barre && (
                            <span style={{ fontSize: 10.5, color: '#64748b', fontFamily: 'monospace' }}>
                              EAN: {p.code_barre}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 12px', color: '#64748b', fontSize: 12 }}>{p.categorie || '—'}</td>
                        <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                              <input
                                type="number"
                                min={0}
                                value={nouveauStock}
                                onChange={(e) => setNouveauStock(Number(e.target.value))}
                                style={{
                                  width: 60,
                                  padding: '4px 6px',
                                  borderRadius: 6,
                                  border: '1px solid #0284c7',
                                  fontSize: 12,
                                  textAlign: 'center',
                                }}
                              />
                              <button
                                onClick={() => submitAjustementStock(p.id)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 6,
                                  background: '#16a34a',
                                  color: '#fff',
                                  border: 'none',
                                  fontSize: 11,
                                  cursor: 'pointer',
                                }}
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setAjustantId(null)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 6,
                                  background: '#e2e8f0',
                                  color: '#0f172a',
                                  border: 'none',
                                  fontSize: 11,
                                  cursor: 'pointer',
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: 12,
                                fontSize: 12,
                                fontWeight: 800,
                                background: isAlert ? '#fef3c7' : '#f1f5f9',
                                color: isAlert ? '#b45309' : '#0f172a',
                              }}
                            >
                              {p.stock_quantite ?? 0}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 12px', textAlign: 'right', color: '#64748b' }}>
                          {p.prix_achat ? fcfa(p.prix_achat) : '—'}
                        </td>
                        <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                          {p.prix ? fcfa(p.prix) : '—'}
                        </td>
                        <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 800, color: '#1e3a8a' }}>
                          {fcfa(p.valeur_vente_totale || (p.prix || 0) * (p.stock_quantite || 0))}
                        </td>
                        <td
                          style={{
                            padding: '12px 12px',
                            textAlign: 'right',
                            fontWeight: 700,
                            color: p.marge_pct > 0 ? '#16a34a' : '#64748b',
                          }}
                        >
                          {p.marge_pct ? `${p.marge_pct}%` : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {!isEditing && (
                            <button
                              type="button"
                              onClick={() => {
                                setAjustantId(p.id)
                                setNouveauStock(p.stock_quantite ?? 0)
                              }}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 6,
                                border: '1px solid #cbd5e1',
                                background: '#f8fafc',
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#475569',
                                cursor: 'pointer',
                              }}
                            >
                              Ajuster
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
