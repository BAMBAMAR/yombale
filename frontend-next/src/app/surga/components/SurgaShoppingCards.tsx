'use client'

import React from 'react'
import {
  ExternalLink,
  MessageCircle,
  MapPin,
  CheckCircle2,
  ShoppingBag,
} from 'lucide-react'

export interface BoutiqueItem {
  id: string
  nom: string
  slug: string
  description: string
  categorie: string
  logo?: string
  couverture?: string
  ville?: string
  telephone?: string
  certifie?: boolean
  total_produits?: number
}

export interface ProduitItem {
  id: string
  nom: string
  prix: number
  categorie: string
  images: string[]
  description?: string
  boutique_id: string
  boutique_nom: string
  boutique_slug: string
  boutique_tel?: string
}

export function BoutiqueCard({
  boutique,
  onWhatsApp,
}: {
  boutique: BoutiqueItem
  onWhatsApp: (tel?: string, nom?: string) => void
}) {
  return (
    <div
      style={{
        border: '1px solid var(--surga-border, #E2E8F0)',
        borderRadius: 12,
        padding: 14,
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {boutique.logo ? (
            <img
              src={boutique.logo}
              alt={boutique.nom}
              style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                backgroundColor: 'var(--navy, #1C2B4A)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              {boutique.nom.charAt(0)}
            </div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--navy, #1C2B4A)' }}>
                {boutique.nom}
              </h3>
              {boutique.certifie && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--price, #0A5C36)',
                    backgroundColor: 'rgba(10, 92, 54, 0.08)',
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}
                >
                  <CheckCircle2 size={11} /> Certifié
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text3, #73675E)', marginTop: 2 }}>
              <span style={{ fontWeight: 600, color: 'var(--surga-accent-ink, #A64B08)' }}>{boutique.categorie}</span>
              {boutique.ville && (
                <>
                  <span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <MapPin size={11} /> {boutique.ville}
                  </span>
                </>
              )}
              {boutique.total_produits !== undefined && (
                <>
                  <span>•</span>
                  <span>{boutique.total_produits} articles</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {boutique.description && (
        <p style={{ fontSize: 12, color: 'var(--text2, #475569)', margin: 0, lineHeight: 1.4 }}>
          {boutique.description}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
        <a
          href={`/boutiques/${boutique.slug || boutique.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRadius: 6,
            backgroundColor: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          <ExternalLink size={13} /> Visiter la boutique
        </a>
        <button
          type="button"
          onClick={() => onWhatsApp(boutique.telephone, boutique.nom)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRadius: 6,
            backgroundColor: '#25D366',
            color: '#FFFFFF',
            border: 'none',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <MessageCircle size={13} /> WhatsApp Vendeur
        </button>
      </div>
    </div>
  )
}

export function ProduitCard({
  produit,
  onWhatsApp,
}: {
  produit: ProduitItem
  onWhatsApp?: (p: ProduitItem) => void
}) {
  const productUrl = produit.boutique_slug || produit.boutique_id
    ? `/boutiques/${produit.boutique_slug || produit.boutique_id}/produits/${produit.id}`
    : `/produit/${produit.id}`

  return (
    <div
      style={{
        border: '1px solid var(--surga-border, #E2E8F0)',
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <a
        href={productUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        title="Voir le produit"
      >
        {produit.images && produit.images[0] ? (
          <img
            src={produit.images[0]}
            alt={produit.nom}
            style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: 140,
              backgroundColor: 'var(--surga-bg, #F8FAFC)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text3, #73675E)',
            }}
          >
            <ShoppingBag size={28} />
          </div>
        )}
        <div style={{ padding: '10px 12px' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--surga-accent-ink, #A64B08)', textTransform: 'uppercase' }}>
            {produit.categorie}
          </span>
          <h4
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--navy, #1C2B4A)',
              margin: '4px 0',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {produit.nom}
          </h4>
          <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', marginBottom: 6 }}>
            Par <strong>{produit.boutique_nom}</strong>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--price, #0A5C36)' }}>
            {produit.prix.toLocaleString('fr-FR')} FCFA
          </div>
        </div>
      </a>

      <div style={{ padding: '0 12px 12px 12px', display: 'flex', gap: 6 }}>
        <a
          href={productUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Voir la fiche produit complète et commander"
          style={{
            flex: 1,
            padding: '7px 10px',
            borderRadius: 6,
            backgroundColor: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            textDecoration: 'none',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <ShoppingBag size={13} />
          <span>Commander</span>
        </a>
        {onWhatsApp && produit.boutique_tel && (
          <button
            type="button"
            onClick={() => onWhatsApp(produit)}
            title="Poser une question sur WhatsApp"
            aria-label="Contacter le vendeur sur WhatsApp"
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              backgroundColor: 'rgba(37, 211, 102, 0.1)',
              border: '1px solid rgba(37, 211, 102, 0.25)',
              color: '#25D366',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              padding: 0,
            }}
          >
            <MessageCircle size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
