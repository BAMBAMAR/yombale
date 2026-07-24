'use client'
import { useState, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { fcfa } from '@/lib/format'

interface ProduitCross {
  id: string
  nom: string
  prix: number | null
  images?: string[]
}

export default function CrossSelling({
  boutiqueId,
  boutiqueNom,
  produitActuel,
  whatsapp,
}: {
  boutiqueId: string
  boutiqueNom: string
  produitActuel: { id: string; nom: string; prix: number | null; images?: string[] }
  whatsapp?: string | null
}) {
  const { addToCart } = useCart()
  const [recommandations, setRecommandations] = useState<ProduitCross[]>([])
  const [selectionnes, setSelectionnes] = useState<string[]>([])
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false)

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  useEffect(() => {
    fetch(`${backendUrl}/api/boutiques/${boutiqueId}/produits/${produitActuel.id}/recommandations`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.recommandations) && data.recommandations.length > 0) {
          setRecommandations(data.recommandations)
          setSelectionnes(data.recommandations.map((r: any) => r.id))
        }
      })
      .catch(() => {})
  }, [boutiqueId, produitActuel.id, backendUrl])

  if (recommandations.length === 0) return null

  const itemsChoisis = recommendationsFiltrees()
  const totalSansRemise = (produitActuel.prix || 0) + itemsChoisis.reduce((acc, i) => acc + (i.prix || 0), 0)
  // 5% de remise sur le lot
  const totalRemise = Math.round(totalSansRemise * 0.95)

  function recommendationsFiltrees() {
    return recommandations.filter(r => selectionnes.includes(r.id))
  }

  function toggleSelection(id: string) {
    setSelectionnes(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  function ajouterLeLot() {
    // 1. Ajouter le produit actuel
    addToCart(boutiqueId, boutiqueNom, produitActuel, whatsapp)
    // 2. Ajouter les produits complémentaires
    itemsChoisis.forEach(item => {
      addToCart(boutiqueId, boutiqueNom, item, whatsapp)
    })
    setAddedSuccess(true)
    setTimeout(() => setAddedSuccess(false), 2500)
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 20 }}>💡</span>
        <h3 style={{ margin: 0, fontSize: 16, fontFamily: 'var(--font-archivo), sans-serif', color: '#111827' }}>
          Souvent achetés ensemble (-5% sur le lot)
        </h3>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {/* Produit Principal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <span style={{ fontWeight: 800, color: '#C75B00', fontSize: 13 }}>Cet article</span>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{produitActuel.nom}</span>
          <span style={{ fontWeight: 800, fontSize: 13, color: '#059669' }}>{fcfa(produitActuel.prix)}</span>
        </div>

        {recommandations.map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, color: '#9ca3af' }}>+</span>
            <label
              style={{
                display: 'flex', alignItems: 'center', gap: 8, background: selectionnes.includes(r.id) ? '#fff7f0' : '#f8fafc',
                border: selectionnes.includes(r.id) ? '1px solid #C75B00' : '1px solid #e2e8f0',
                padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={selectionnes.includes(r.id)}
                onChange={() => toggleSelection(r.id)}
                style={{ width: 16, height: 16, accentColor: '#C75B00', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{r.nom}</span>
              <span style={{ fontWeight: 800, fontSize: 13, color: '#059669' }}>{fcfa(r.prix)}</span>
            </label>
          </div>
        ))}
      </div>

      {/* Prix total du lot & Bouton d'action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa', padding: 14, borderRadius: 10, border: '1px solid #f3f4f6', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span style={{ fontSize: 12, color: '#6b7280', display: 'block' }}>Prix du lot ({itemsChoisis.length + 1} articles) :</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#C75B00' }}>{fcfa(totalRemise)}</span>
            <span style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'line-through' }}>{fcfa(totalSansRemise)}</span>
            <span style={{ fontSize: 11, background: '#dcfce7', color: '#166534', fontWeight: 800, padding: '2px 8px', borderRadius: 12 }}>Économisez 5%</span>
          </div>
        </div>

        <button
          onClick={ajouterLeLot}
          style={{
            background: addedSuccess ? '#10b981' : '#C75B00', color: '#fff', border: 'none',
            borderRadius: 10, padding: '12px 20px', fontWeight: 800, fontSize: 14, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(199,91,0,.25)', transition: 'all 0.2s ease',
          }}
        >
          {addedSuccess ? '✅ Lot ajouté au panier !' : '🛒 Ajouter les articles au panier →'}
        </button>
      </div>
    </div>
  )
}
