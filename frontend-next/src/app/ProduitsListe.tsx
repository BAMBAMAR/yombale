'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fcfa } from '@/lib/format'
import CardActions from './CardActions'
import ExternalImg from '@/components/ExternalImg'
import { Loader2, ChevronDown, ShoppingBag } from 'lucide-react'

interface Produit {
  id: number
  nom: string
  marque: string | null
  categorie: string | null
  prix_min: number | null
  prix_max: number | null
  nb_offres: number | null
  image_url: string | null
  boutique_id?: string
  boutique_slug?: string
}

interface Props {
  initialProduits: Produit[]
  total: number
  q: string
  categorie: string
  prixMin?: string
  prixMax: string
  etat?: string
  tri: string
  sousType?: string
}

export default function ProduitsListe({ initialProduits, total, q, categorie, prixMin = '', prixMax, etat = '', tri, sousType = '' }: Props) {
  const [produits, setProduits] = useState<Produit[]>(initialProduits)
  const [loading, setLoading]   = useState(false)
  const [page, setPage]         = useState(1)

  useEffect(() => {
    setProduits(initialProduits)
    setPage(1)
  }, [initialProduits])

  const restants = total - produits.length

  async function voirPlus() {
    setLoading(true)
    try {
      const nextPage = page + 1
      const params   = new URLSearchParams({ limit: '24', page: String(nextPage) })
      if (q)         params.set('q',         q)
      if (categorie) params.set('categorie', categorie)
      if (prixMin)   params.set('prixMin',   prixMin)
      if (prixMax)   params.set('prixMax',   prixMax)
      if (etat)      params.set('etat',      etat)
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
            
          const linkHref = p.boutique_id 
            ? `/boutiques/${p.boutique_slug || p.boutique_id}/produits/${p.id}` 
            : `/produit/${p.id}`;
            
          return (
          <Link key={p.id} href={linkHref} style={{ display: 'contents' }}>
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

      {produits.length === 0 && !loading && (
        <div className="empty-state-npl" style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--card)', borderRadius: 'var(--r-xl)', border: '1px dashed var(--border-medium)', margin: '30px 0' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--orange2)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <ShoppingBag size={28} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', margin: '0 0 8px' }}>
            Aucun produit ne correspond à vos critères
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-subtle)', maxWidth: 460, margin: '0 auto 20px', lineHeight: 1.5 }}>
            Essayez d&apos;élargir votre recherche, de réinitialiser vos filtres ou de consulter nos catégories populaires.
          </p>
          <Link href="/" className="btn-npl btn-npl-secondary btn-npl-md" style={{ display: 'inline-flex' }}>
            <span>Voir tout le catalogue</span>
          </Link>
        </div>
      )}

      {loading && (
        <div className="grid-produits" aria-busy="true" aria-label="Chargement des produits supplémentaires">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-produit skeleton-card" style={{ opacity: 0.9, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
              <div className="skeleton skeleton-img" style={{ aspectRatio: '4/3', width: '100%', borderRadius: 6 }} />
              <div className="skeleton skeleton-line skeleton-line--short" style={{ height: 12, marginTop: 10, width: '40%' }} />
              <div className="skeleton skeleton-line" style={{ height: 16, marginTop: 6, width: '85%' }} />
              <div className="skeleton skeleton-price" style={{ height: 20, marginTop: 8, width: '50%' }} />
            </div>
          ))}
        </div>
      )}

      {restants > 0 && (
        <div className="voir-plus-wrap" style={{ marginTop: 24 }}>
          <button
            className="voir-plus-btn btn-npl btn-npl-secondary btn-npl-lg"
            onClick={voirPlus}
            disabled={loading}
            aria-label={`Charger les ${restants.toLocaleString('fr-SN')} produits suivants`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin" />
                <span>Chargement des offres…</span>
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                <span>Voir plus ({restants.toLocaleString('fr-SN')} restant{restants > 1 ? 's' : ''})</span>
              </>
            )}
          </button>
        </div>
      )}
    </>
  )
}
