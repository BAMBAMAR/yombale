'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  Search,
  RefreshCw,
  EyeOff,
  Eye,
  Store,
  Layers,
  Edit2,
} from 'lucide-react'
import { fcfa } from '@/lib/format'
import { adminModererProduit } from '@/app/actions/admin'

interface ProduitsSupervisionClientProps {
  initialData: {
    produits: any[]
    total: number
    stats: any
  }
}

export default function ProduitsSupervisionClient({ initialData }: ProduitsSupervisionClientProps) {
  const [produits, setProduits] = useState(initialData.produits || [])
  const [filterStock, setFilterStock] = useState<'tous' | 'stock' | 'rupture'>('tous')
  const [search, setSearch] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleToggleStock = async (produit: any) => {
    const nextStock = !produit.en_stock
    setLoadingId(produit.id)
    try {
      const res = await adminModererProduit(produit.id, { actif: nextStock })
      if (res.success) {
        setProduits((prev) =>
          prev.map((p) => (p.id === produit.id ? { ...p, en_stock: nextStock } : p))
        )
      } else {
        alert(res.error || 'Erreur lors de la modération')
      }
    } finally {
      setLoadingId(null)
    }
  }

  const filtered = produits.filter((p) => {
    if (filterStock === 'stock' && !p.en_stock) return false
    if (filterStock === 'rupture' && p.en_stock && (p.stock_quantite === null || p.stock_quantite > 0)) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        p.nom?.toLowerCase().includes(q) ||
        p.boutique_nom?.toLowerCase().includes(q) ||
        p.categorie?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const stats = initialData.stats || {}

  return (
    <div className="admin-page-container">
      {/* En-tête Métier */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)', margin: '0 0 6px' }}>
            Catalogue Marchands & Supervision Stocks
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>
            Contrôle transversal des catalogues de boutiques, ruptures d&apos;approvisionnement et modération tarifaire.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn-npl"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}
        >
          <RefreshCw size={14} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Cartes KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="admin-stat-card" style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Articles Référencés</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', margin: '8px 0 4px' }}>
            {stats.totalProduits || initialData.total || 0}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            Dans l&apos;ensemble des boutiques marchandes
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Ruptures de Stock</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: stats.nbRuptures > 0 ? '#ef4444' : 'var(--navy)', margin: '8px 0 4px' }}>
            {stats.nbRuptures || 0}
          </div>
          <div style={{ fontSize: 12, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle size={13} />
            <span>Articles indisponibles à la vente</span>
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Prix Moyen Catalogue</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0284c7', margin: '8px 0 4px' }}>
            {fcfa(stats.prixMoyen || 0)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            Moyenne pondérée des prix marchands
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Articles avec Variantes</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)', margin: '8px 0 4px' }}>
            {stats.nbAvecVariantes || 0}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            Pointures, tailles, coloris multiples
          </div>
        </div>
      </div>

      {/* Barre de Filtres & Recherche */}
      <div style={{ background: '#ffffff', padding: 16, borderRadius: 10, border: '1px solid var(--border)', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setFilterStock('tous')}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: filterStock === 'tous' ? 'var(--navy)' : '#ffffff',
              color: filterStock === 'tous' ? '#ffffff' : 'var(--text1)',
              cursor: 'pointer',
            }}
          >
            Tous les articles ({produits.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStock('stock')}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: filterStock === 'stock' ? 'var(--navy)' : '#ffffff',
              color: filterStock === 'stock' ? '#ffffff' : 'var(--text1)',
              cursor: 'pointer',
            }}
          >
            En stock
          </button>
          <button
            type="button"
            onClick={() => setFilterStock('rupture')}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: filterStock === 'rupture' ? 'var(--navy)' : '#ffffff',
              color: filterStock === 'rupture' ? '#ffffff' : 'var(--text1)',
              cursor: 'pointer',
            }}
          >
            Ruptures de stock
          </button>
        </div>

        <div style={{ position: 'relative', minWidth: 260 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input
            type="text"
            placeholder="Rechercher produit, boutique, catégorie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid var(--border)',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Tableau des Produits */}
      <div style={{ background: '#ffffff', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: 'var(--text3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                <th style={{ padding: '12px 16px' }}>Produit</th>
                <th style={{ padding: '12px 16px' }}>Boutique</th>
                <th style={{ padding: '12px 16px' }}>Catégorie</th>
                <th style={{ padding: '12px 16px' }}>Prix Marchand</th>
                <th style={{ padding: '12px 16px' }}>Disponibilité & Stock</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Modération</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text3)' }}>
                    Aucun produit marchand trouvé.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const imgUrl = Array.isArray(p.images) && p.images[0] ? p.images[0] : null
                  const isStock = p.en_stock !== false && (p.stock_quantite === null || p.stock_quantite > 0)

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {imgUrl ? (
                            <Image
                              src={imgUrl}
                              alt=""
                              width={40}
                              height={40}
                              style={{ borderRadius: 6, objectFit: 'cover', background: '#f1f5f9' }}
                            />
                          ) : (
                            <div style={{ width: 40, height: 40, borderRadius: 6, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>
                              <Package size={18} />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{p.nom}</div>
                            {p.nb_variantes > 0 && (
                              <span style={{ fontSize: 11, color: 'var(--text3)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                <Layers size={10} /> {p.nb_variantes} variantes
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text1)' }}>{p.boutique_nom}</div>
                        <a
                          href={`/boutiques/${p.boutique_slug}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}
                        >
                          Voir boutique
                        </a>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text2)' }}>
                        <span style={{ background: '#f8fafc', padding: '3px 8px', borderRadius: 4, fontSize: 12, border: '1px solid var(--border)' }}>
                          {p.categorie || 'Général'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--navy)' }}>
                        {fcfa(p.prix)}
                        {p.prix_barre && (
                          <div style={{ fontSize: 11, color: 'var(--text3)', textDecoration: 'line-through' }}>
                            {fcfa(p.prix_barre)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {isStock ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#10b981', background: '#ecfdf5', padding: '3px 8px', borderRadius: 12 }}>
                            <CheckCircle2 size={12} />
                            {p.stock_quantite !== null ? `${p.stock_quantite} en stock` : 'En stock'}
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#ef4444', background: '#fef2f2', padding: '3px 8px', borderRadius: 12 }}>
                            <AlertTriangle size={12} />
                            Rupture de stock
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          disabled={loadingId === p.id}
                          onClick={() => handleToggleStock(p)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            color: p.en_stock ? '#b91c1c' : '#047857',
                            background: p.en_stock ? '#fef2f2' : '#ecfdf5',
                            border: `1px solid ${p.en_stock ? '#fecaca' : '#a7f3d0'}`,
                            padding: '4px 8px',
                            borderRadius: 6,
                            cursor: 'pointer',
                          }}
                        >
                          {p.en_stock ? <EyeOff size={12} /> : <Eye size={12} />}
                          <span>{loadingId === p.id ? 'Modération...' : p.en_stock ? 'Désactiver' : 'Réactiver'}</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
