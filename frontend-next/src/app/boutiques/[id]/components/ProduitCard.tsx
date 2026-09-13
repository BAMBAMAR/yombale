'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, Eye, Check } from 'lucide-react'
import { cloudinaryHQ } from '@/lib/cloudinary'
import ExternalImg from '@/components/ExternalImg'
import { fcfa } from '@/lib/format'
import { useCart } from '@/context/CartContext'
import CardActions from '@/app/CardActions'
import { Produit } from './types'

interface ProduitCardProps {
  p: Produit
  boutiqueId: string
  boutiqueNom: string
  whatsapp?: string | null
  viewMode?: 'grid' | 'list'
  onQuickView: (p: Produit) => void
  couleurTheme?: string
  contrastBtnText?: string
  currentRadius?: string
}

export default function ProduitCard({
  p,
  boutiqueId,
  boutiqueNom,
  whatsapp,
  viewMode = 'grid',
  onQuickView,
  couleurTheme = '#C75B00',
  contrastBtnText = '#ffffff',
  currentRadius = '10px',
}: ProduitCardProps) {
  const { addToCart } = useCart()
  const [addedCart, setAddedCart] = useState(false)
  const isEnStock = (p.quantite_stock ?? p.stock_quantite) != null
    ? Number(p.quantite_stock ?? p.stock_quantite) > 0
    : (p.en_stock !== false)

  const img = p.images?.[0] ?? null
  const remise = p.prix && p.prix_barre && p.prix_barre > p.prix
    ? Math.round((1 - p.prix / p.prix_barre) * 100)
    : null

  const hasSkus = p.variantes_skus && p.variantes_skus.length > 0
  const minSkuPrix = hasSkus ? Math.min(...p.variantes_skus!.map(v => v.prix)) : (p.prix ?? null)
  const maxSkuPrix = hasSkus ? Math.max(...p.variantes_skus!.map(v => v.prix)) : (p.prix ?? null)
  const isVariablePrice = hasSkus && minSkuPrix !== null && maxSkuPrix !== null && minSkuPrix < maxSkuPrix
  const displayPrice = isVariablePrice ? minSkuPrix : (p.prix ?? minSkuPrix)
  const uniteSuffix = p.unite_vente && p.unite_vente !== 'piece' ? ` / ${p.unite_vente}` : ''

  // Puces sectorielles (Mode tailles, Tech RAM/Stockage)
  const taillesDispo = p.variantes?.find(v => v.nom.toLowerCase().includes('taille'))?.valeurs || []
  const techSpecs = [p.caracteristiques?.stockage, p.caracteristiques?.ram].filter(Boolean).join(' · ')

  if (viewMode === 'list') {
    return (
      <div className="card-premium" style={{ display: 'flex', gap: 16, padding: 14, alignItems: 'center' }}>
        <div style={{ width: 110, height: 110, borderRadius: 10, flexShrink: 0, position: 'relative', background: '#f8fafc', overflow: 'hidden' }}>
          {img ? (
            <ExternalImg src={cloudinaryHQ(img, { width: 300 })} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
              <ShoppingCart size={28} style={{ color: 'var(--text3)' }} />
            </div>
          )}
          {remise && (
            <span style={{ position: 'absolute', top: 6, left: 6, background: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 12 }}>
              -{remise}%
            </span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href={`/boutiques/${boutiqueId}/produits/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, margin: '0 0 4px', color: 'var(--navy)' }}>{p.nom}</h3>
          </Link>
          {p.caracteristiques?.marque && (
            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase' }}>{p.caracteristiques.marque}</span>
          )}
          {techSpecs && (
            <span style={{ fontSize: 11, background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: 4, fontWeight: 600, marginLeft: 6 }}>
              {techSpecs}
            </span>
          )}
          {taillesDispo.length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
              {taillesDispo.slice(0, 4).map(t => (
                <span key={t} style={{ fontSize: 10, border: '1px solid #cbd5e1', padding: '1px 5px', borderRadius: 4, color: '#334155', fontWeight: 600 }}>
                  {t}
                </span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            {displayPrice ? (
              <span style={{ fontWeight: 900, fontSize: 17, color: couleurTheme }}>
                {isVariablePrice ? `Dès ${fcfa(displayPrice)}` : fcfa(displayPrice)}
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>{uniteSuffix}</span>
              </span>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600 }}>Prix à négocier</span>
            )}
            {p.prix_barre && <span style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'line-through' }}>{fcfa(p.prix_barre)}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => onQuickView(p)}
            style={{ padding: '7px 12px', borderRadius: currentRadius, border: '1px solid #d1d5db', background: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Eye size={14} /> Aperçu
          </button>
          <button
            onClick={() => {
              if (p.variantes && p.variantes.length > 0) {
                onQuickView(p)
              } else {
                addToCart(boutiqueId, boutiqueNom, p, whatsapp)
                setAddedCart(true)
                setTimeout(() => setAddedCart(false), 1800)
              }
            }}
            disabled={!isEnStock}
            style={{
              padding: '8px 14px',
              fontSize: 12,
              opacity: isEnStock ? 1 : 0.6,
              background: addedCart ? '#f0fdf4' : couleurTheme,
              color: addedCart ? '#166534' : contrastBtnText,
              borderRadius: currentRadius,
              border: addedCart ? '1px solid #bbf7d0' : 'none',
              fontWeight: 800,
              cursor: isEnStock ? 'pointer' : 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {addedCart ? 'Ajouté' : (isEnStock ? (p.variantes && p.variantes.length > 0 ? 'Choisir options' : <><ShoppingCart size={14} /> Ajouter</>) : 'Rupture')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card-premium" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Link href={`/boutiques/${boutiqueId}/produits/${p.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div style={{ width: '100%', aspectRatio: '1/1', position: 'relative', background: '#f8fafc', overflow: 'hidden' }}>
            {img ? (
              <ExternalImg
                src={cloudinaryHQ(img, { width: 400 })}
                alt={p.nom}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                loading="lazy"
                onMouseEnter={(e: React.MouseEvent<HTMLImageElement>) => { e.currentTarget.style.transform = 'scale(1.05)' }}
                onMouseLeave={(e: React.MouseEvent<HTMLImageElement>) => { e.currentTarget.style.transform = 'scale(1)' }}
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: 'var(--text3)' }}>
                <ShoppingCart size={32} />
              </div>
            )}

            {!isEnStock && (
              <span style={{ position: 'absolute', top: 8, right: 8, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                Rupture
              </span>
            )}
            {remise && (
              <span style={{ position: 'absolute', top: 8, left: 8, background: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>
                -{remise}%
              </span>
            )}
          </div>
        </Link>

        <button
          type="button"
          onClick={() => onQuickView(p)}
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            zIndex: 4,
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(4px)',
            border: '1px solid #e5e7eb',
            borderRadius: 20,
            padding: '5px 10px',
            fontSize: 11,
            fontWeight: 800,
            color: '#1f2937',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Eye size={12} /> Aperçu
        </button>
      </div>

      <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Link href={`/boutiques/${boutiqueId}/produits/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <p style={{ fontWeight: 700, fontSize: 14, margin: 0, lineHeight: 1.4, color: 'var(--navy)' }}>{p.nom}</p>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {p.caracteristiques?.marque && (
            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.caracteristiques.marque}</span>
          )}
          {techSpecs && (
            <span style={{ fontSize: 10.5, background: '#f1f5f9', color: '#475569', padding: '1px 5px', borderRadius: 4, fontWeight: 600 }}>
              {techSpecs}
            </span>
          )}
        </div>
        {taillesDispo.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
            {taillesDispo.slice(0, 4).map(t => (
              <span key={t} style={{ fontSize: 10, background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1px 5px', borderRadius: 4, color: '#475569', fontWeight: 600 }}>
                {t}
              </span>
            ))}
          </div>
        )}
        {p.description && (
          <p
            style={{
              fontSize: 12,
              color: 'var(--text2)',
              margin: '4px 0 0',
              lineHeight: 1.4,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {p.description}
          </p>
        )}
        <div style={{ paddingTop: 8, display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
          {displayPrice ? (
            <span style={{ fontWeight: 800, fontSize: 16, color: couleurTheme }}>
              {isVariablePrice ? `Dès ${fcfa(displayPrice)}` : fcfa(displayPrice)}
              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text3)' }}>{uniteSuffix}</span>
            </span>
          ) : (
            <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600 }}>Prix à négocier</span>
          )}
          {p.prix_barre && <span style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'line-through' }}>{fcfa(p.prix_barre)}</span>}
        </div>
      </div>

      <div style={{ padding: '0 12px 14px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <CardActions id={p.id} nom={p.nom} type="boutique_produit" boutiqueId={boutiqueId} />
        <button
          onClick={() => {
            if (p.variantes && p.variantes.length > 0) {
              onQuickView(p)
            } else {
              addToCart(boutiqueId, boutiqueNom, p, whatsapp)
              setAddedCart(true)
              setTimeout(() => setAddedCart(false), 1800)
            }
          }}
          disabled={!isEnStock}
          style={{
            width: '100%',
            fontSize: '12.5px',
            opacity: isEnStock ? 1 : 0.6,
            height: 38,
            padding: '0 8px',
            gap: 5,
            fontWeight: 800,
            letterSpacing: '-0.01em',
            background: addedCart ? '#f0fdf4' : couleurTheme,
            color: addedCart ? '#166534' : contrastBtnText,
            borderRadius: currentRadius,
            border: addedCart ? '1px solid #bbf7d0' : 'none',
            cursor: isEnStock ? 'pointer' : 'not-allowed',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {addedCart ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#0A5C36', fontWeight: 800 }}>
              <Check size={14} strokeWidth={3} />
              <span>Ajouté au panier</span>
            </span>
          ) : isEnStock ? (
            p.variantes && p.variantes.length > 0 ? (
              <span>Choisir mes options</span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <ShoppingCart size={14} />
                <span>Ajouter au panier</span>
              </span>
            )
          ) : (
            <span>Rupture de stock</span>
          )}
        </button>
      </div>
    </div>
  )
}
