'use client'

import { useState } from 'react'
import Link from 'next/link'
import { fcfa } from '@/lib/format'
import CardActions from './CardActions'

interface Produit {
  id: number
  nom: string
  marque: string | null
  categorie: string | null
  prix_min: number | null
  prix_max: number | null
  nb_offres: number | null
  image_url: string | null
}

interface Props {
  initialProduits: Produit[]
  total: number
  q: string
  categorie: string
  prixMax: string
}

export default function ProduitsListe({ initialProduits, total, q, categorie, prixMax }: Props) {
  const [produits, setProduits] = useState<Produit[]>(initialProduits)
  const [loading, setLoading]   = useState(false)
  const [page, setPage]         = useState(1)

  const restants = total - produits.length

  async function voirPlus() {
    setLoading(true)
    try {
      const nextPage = page + 1
      const params   = new URLSearchParams({ limit: '24', page: String(nextPage) })
      if (q)         params.set('q',         q)
      if (categorie) params.set('categorie', categorie)
      if (prixMax)   params.set('prixMax',   prixMax)

      const r    = await fetch(`/api/produits?${params}`)
      const data = await r.json()
      const next: Produit[] = data.produits ?? data.data ?? []
      setProduits(prev => [...prev, ...next])
      setPage(nextPage)
    } catch { /* silently fail */ }
    finally { setLoading(false) }
  }

  return (
    <>
      {total > 0 && (
        <p className="resultats-count">
          {total.toLocaleString('fr-SN')} résultat{total > 1 ? 's' : ''}
        </p>
      )}

      <div className="grid-produits">
        {produits.map((p) => (
          <Link key={p.id} href={`/produit/${p.id}`} style={{ display: 'contents' }}>
            <article className="card-produit">
              <div className="card-img">
                {p.prix_min && p.prix_max && p.prix_max > p.prix_min * 1.1 && (
                  <span className="badge-promo">
                    -{Math.round((1 - p.prix_min / p.prix_max) * 100)}%
                  </span>
                )}
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt={p.nom} loading="lazy" />
                ) : (
                  <span className="card-img-placeholder">📦</span>
                )}
              </div>
              {p.marque && <p className="marque">{p.marque}</p>}
              <p className="nom">{p.nom}</p>
              <p className="prix">{fcfa(p.prix_min)}</p>
              {p.nb_offres != null && p.nb_offres > 0 && (
                <p style={{ fontSize: '12px', color: 'var(--text3)' }}>
                  {p.nb_offres} offre{p.nb_offres > 1 ? 's' : ''}
                </p>
              )}
              <CardActions id={p.id} nom={p.nom} />
            </article>
          </Link>
        ))}
      </div>

      {restants > 0 && (
        <div className="voir-plus-wrap">
          <button
            className="voir-plus-btn"
            onClick={voirPlus}
            disabled={loading}
          >
            {loading
              ? '⏳ Chargement…'
              : `⬇ Voir plus (${restants.toLocaleString('fr-SN')} restant${restants > 1 ? 's' : ''})`}
          </button>
        </div>
      )}
    </>
  )
}
