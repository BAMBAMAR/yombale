'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fcfa } from '@/lib/format'

interface Produit {
  id: string
  nom: string
  marque: string | null
  categorie: string | null
  prix_min: number | null
  image_url: string | null
}

export default function FavorisClient() {
  const [ids, setIds]           = useState<string[]>([])
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    try {
      const stored: string[] = JSON.parse(localStorage.getItem('nopalou_favs') || '[]')
      setIds(stored)
      if (stored.length === 0) { setLoading(false); return }

      Promise.all(
        stored.map(id =>
          fetch(`/api/produits/${id}`)
            .then(r => r.ok ? r.json() as Promise<Produit> : null)
            .catch(() => null)
        )
      ).then(results => {
        setProduits(results.filter((p): p is Produit => p !== null))
        setLoading(false)
      })
    } catch {
      setLoading(false)
    }
  }, [])

  function removeFav(id: string) {
    try {
      const next = ids.filter(i => i !== id)
      localStorage.setItem('nopalou_favs', JSON.stringify(next))
      setIds(next)
      setProduits(p => p.filter(pr => String(pr.id) !== id))
    } catch {}
  }

  if (loading) {
    return (
      <div className="empty-state">
        <span style={{ fontSize: 36, opacity: .4 }}>♥</span>
        <p>Chargement…</p>
      </div>
    )
  }

  if (ids.length === 0 || produits.length === 0) {
    return (
      <div className="empty-state">
        <span style={{ fontSize: 48 }}>♥</span>
        <p>Vous n&apos;avez pas encore de favoris.</p>
        <p style={{ fontSize: 13, color: 'var(--text3)' }}>
          Cliquez sur ♥ sur n&apos;importe quel produit pour l&apos;ajouter ici.
        </p>
        <Link href="/" className="budget-pill active" style={{ marginTop: 12 }}>
          Parcourir les produits
        </Link>
      </div>
    )
  }

  return (
    <div className="favs-grid">
      {produits.map(p => (
        <div key={p.id} className="fav-card">
          <div className="fav-card-img">
            {p.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image_url} alt={p.nom} loading="lazy" />
            ) : (
              <span className="fav-img-placeholder">📦</span>
            )}
          </div>
          <div className="fav-card-body">
            {p.marque && <span className="fav-marque">{p.marque}</span>}
            <h3 className="fav-nom">{p.nom}</h3>
            <p className="fav-prix">
              {p.prix_min ? `À partir de ${fcfa(p.prix_min)}` : 'Prix non disponible'}
            </p>
          </div>
          <div className="fav-card-actions">
            <Link href={`/produit/${p.id}`} className="fav-btn-voir">
              Voir les offres →
            </Link>
            <button
              onClick={() => removeFav(String(p.id))}
              className="fav-btn-remove"
              title="Retirer des favoris"
            >
              ♥ Retirer
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
