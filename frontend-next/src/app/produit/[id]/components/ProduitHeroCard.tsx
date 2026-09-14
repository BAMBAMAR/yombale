import React from 'react'
import Link from 'next/link'
import ExternalImg from '@/components/ExternalImg'
import { fcfa } from '@/lib/format'
import { Produit, Offre } from './types'

interface ProduitHeroCardProps {
  produit: Produit
  prixMin: number | null
  best?: Offre
}

export default function ProduitHeroCard({ produit, prixMin, best }: ProduitHeroCardProps) {
  return (
    <div className="produit-hero-card">
      {produit.image_url && (
        <div className="produit-hero-visual">
          <div className="produit-hero-visual-inner">
            <ExternalImg
              src={produit.image_url}
              alt={produit.nom}
              watermark={true}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              loading="eager"
            />
          </div>
        </div>
      )}
      <div className="produit-hero-body">
        <div>
          <div className="produit-hero-top">
            {produit.marque && <span className="marque-badge">{produit.marque}</span>}
            {(produit.categorie_nom ?? produit.categorie) && (
              <Link href={`/?categorie=${produit.categorie}`} className="categ-tag">
                {produit.categorie_nom ?? produit.categorie}
              </Link>
            )}
          </div>
          <h1 className="produit-hero-title" style={{ marginTop: 10 }}>
            {produit.nom}
          </h1>
        </div>

        <div className="produit-hero-buybox">
          <div className="produit-hero-price-wrap">
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 800,
                color: 'var(--text3)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Meilleure offre
            </span>
            <span className="produit-hero-price">{prixMin ? fcfa(prixMin) : '—'}</span>
            {best?.marchand_nom && (
              <span className="produit-hero-seller">chez {best.marchand_nom}</span>
            )}
          </div>

          {best?.url_achat && (
            <a
              href={`/api/click/${best.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="produit-hero-cta"
              aria-label={`Acheter au meilleur prix${best.marchand_nom ? ` chez ${best.marchand_nom}` : ''}`}
            >
              <span>Acheter au meilleur prix</span>
              <span>→</span>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
