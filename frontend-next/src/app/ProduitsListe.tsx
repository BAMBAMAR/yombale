'use client'

import { useState } from 'react'
import Link from 'next/link'
import { fcfa } from '@/lib/format'
import CardActions from './CardActions'
import ExternalImg from '@/components/ExternalImg'

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
  tri: string
  sousType?: string
}

export default function ProduitsListe({ initialProduits, total, q, categorie, prixMax, tri, sousType = '' }: Props) {
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
      if (tri)       params.set('tri',       tri)
      if (sousType)  params.set('sousType',  sousType)

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
        {(() => { let promoIdx = 0; return produits.map((p) => {
          const estPromo = !!(p.prix_min && p.prix_max && p.prix_max > p.prix_min * 1.1);
          const ticketClass = estPromo
            ? ` card-produit--ticket ${promoIdx++ % 2 === 0 ? 'tilt-a' : 'tilt-b'}`
            : '';
          return (
          <Link key={p.id} href={`/produit/${p.id}`} style={{ display: 'contents' }}>
            <article className={`card-produit${ticketClass}`}>
              <div className="card-img">
                {estPromo && p.prix_min && p.prix_max && (
                  <span className="badge-promo">
                    -{Math.round((1 - p.prix_min / p.prix_max) * 100)}%
                  </span>
                )}
                <ExternalImg src={p.image_url} alt={p.nom} fallbackClassName="card-img-placeholder" />
              </div>
              {p.marque && <p className="marque">{p.marque}</p>}
              <p className="nom">{p.nom}</p>
              <p className="prix">{fcfa(p.prix_min)}</p>
              {p.nb_offres != null && p.nb_offres > 0 && (
                <p style={{ fontSize: '12px', color: 'var(--text3)' }}>
                  {p.nb_offres} offre{p.nb_offres > 1 ? 's' : ''}
                </p>
              )}
              <CardActions id={p.id} nom={p.nom} categorie={p.categorie} />
            </article>
          </Link>
          );
        }); })()}
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
