'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fcfa } from '@/lib/format'
import CardActions from './CardActions'
import ExternalImg from '@/components/ExternalImg'
import { Loader2, ChevronDown, ShoppingBag, RotateCw } from 'lucide-react'

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
  erreur?: string | null
}

export default function ProduitsListe({
  initialProduits,
  total,
  q,
  categorie,
  prixMin = '',
  prixMax,
  etat = '',
  tri,
  sousType = '',
  erreur = null
}: Props) {
  const [produits, setProduits] = useState<Produit[]>(initialProduits)
  const [currentTotal, setCurrentTotal] = useState<number>(total)
  const [loading, setLoading]   = useState(false)
  const [page, setPage]         = useState(1)

  const hasFiltre = Boolean(q || categorie || prixMin || prixMax || etat || sousType)

  useEffect(() => {
    setProduits(initialProduits)
    setCurrentTotal(total)
    setPage(1)

    // Rattrapage automatique côté client si le serveur a renvoyé 0 produits (ex: timeout SSR ou latence Render)
    if (initialProduits.length === 0) {
      let isMounted = true
      setLoading(true)
      const params = new URLSearchParams({ limit: '24', page: '1' })
      if (q)         params.set('q',         q)
      if (categorie) params.set('categorie', categorie)
      if (prixMin)   params.set('prixMin',   prixMin)
      if (prixMax)   params.set('prixMax',   prixMax)
      if (etat)      params.set('etat',      etat)
      if (tri)       params.set('tri',       tri)
      if (sousType)  params.set('sousType',  sousType)

      fetch(`/api/produits?${params}`)
        .then(r => r.json())
        .then(data => {
          if (!isMounted) return
          const prods = data.produits ?? data.data ?? []
          if (prods.length > 0) {
            setProduits(prods)
            setCurrentTotal(data.total ?? prods.length)
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setLoading(false)
        })
      return () => { isMounted = false }
    }
  }, [initialProduits, total, q, categorie, prixMin, prixMax, etat, tri, sousType, erreur])

  async function recharger() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '24', page: '1' })
      if (q)         params.set('q',         q)
      if (categorie) params.set('categorie', categorie)
      if (prixMin)   params.set('prixMin',   prixMin)
      if (prixMax)   params.set('prixMax',   prixMax)
      if (etat)      params.set('etat',      etat)
      if (tri)       params.set('tri',       tri)
      if (sousType)  params.set('sousType',  sousType)

      const r = await fetch(`/api/produits?${params}`)
      const data = await r.json()
      const prods = data.produits ?? data.data ?? []
      setProduits(prods)
      setCurrentTotal(data.total ?? prods.length)
      setPage(1)
    } catch { /* silently fail */ }
    finally { setLoading(false) }
  }

  const restants = currentTotal - produits.length

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
      if (data.total != null) setCurrentTotal(data.total)
      setPage(nextPage)
    } catch { /* silently fail */ }
    finally { setLoading(false) }
  }

  return (
    <>
      {currentTotal > 0 && (
        <p className="resultats-count">
          {currentTotal.toLocaleString('fr-SN')} résultat{currentTotal > 1 ? 's' : ''}
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
            <article key={p.id} className={`card-produit${ticketClass}`}>
              <Link
                href={linkHref}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  textDecoration: 'none',
                  color: 'inherit',
                  flex: 1,
                }}
              >
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
              </Link>
              <CardActions id={p.id} nom={p.nom} categorie={p.categorie} />
            </article>
          );
        }); })()}
      </div>

      {produits.length === 0 && !loading && (
        <div className="empty-state-npl" style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--card)', borderRadius: 'var(--r-xl)', border: '1px dashed var(--border-medium)', margin: '30px 0' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--orange2)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <ShoppingBag size={28} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', margin: '0 0 8px' }}>
            {hasFiltre ? 'Aucun produit ne correspond à vos critères' : 'Catalogue en cours d\u2019actualisation'}
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-subtle)', maxWidth: 460, margin: '0 auto 20px', lineHeight: 1.5 }}>
            {hasFiltre
              ? "Essayez d'élargir votre recherche, de réinitialiser vos filtres ou de consulter nos catégories populaires."
              : "Les offres se synchronisent avec nos marchands partenaires. Cliquez sur Réessayer pour afficher les produits."}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            <a href="/" className="btn-npl btn-npl-secondary btn-npl-md" style={{ display: 'inline-flex' }}>
              <span>Voir tout le catalogue</span>
            </a>
            {!hasFiltre && (
              <button
                type="button"
                onClick={recharger}
                className="btn-npl btn-npl-primary btn-npl-md"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <RotateCw size={15} />
                <span>Réessayer</span>
              </button>
            )}
          </div>
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
