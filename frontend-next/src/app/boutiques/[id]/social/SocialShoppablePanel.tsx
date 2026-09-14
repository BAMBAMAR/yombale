'use client'

import React from 'react'
import Link from 'next/link'
import { ShoppingBag, ShoppingCart, MessageCircle, Store, Check } from 'lucide-react'
import ExternalImg from '@/components/ExternalImg'
import BoutonPartager from '@/components/BoutonPartager'
import { cloudinaryHQ } from '@/lib/cloudinary'
import { fcfa } from '@/lib/format'
import { SocialPost, SocialProduct } from './types'

interface SocialShoppablePanelProps {
  selectedPost: SocialPost
  boutiqueNom: string
  boutiqueKey: string
  boutiqueId: string
  whatsappNumber?: string | null
  addedProductId: string | null
  onAddToCart: (prod: SocialProduct) => void
  onOpenCart: () => void
  getWhatsAppUrl: (post: SocialPost, prod?: SocialProduct) => string | null
}

export default function SocialShoppablePanel({
  selectedPost,
  boutiqueNom,
  boutiqueKey,
  boutiqueId,
  whatsappNumber,
  addedProductId,
  onAddToCart,
  onOpenCart,
  getWhatsAppUrl,
}: SocialShoppablePanelProps) {
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/boutiques/${boutiqueKey}?post=${selectedPost.id}`
      : selectedPost.post_url

  return (
    <div
      style={{
        flex: '1 1 360px',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
      }}
    >
      {/* Header Publication */}
      <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 14, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent, #C75B00)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {selectedPost.plateforme} · {boutiqueNom}
          </span>
          <BoutonPartager
            variant="unified"
            lien={shareUrl}
            message={`Regardez cette publication de ${boutiqueNom} sur Nopalou :\n${selectedPost.post_url}`}
          />
        </div>
        {selectedPost.caption && (
          <p style={{ margin: 0, fontSize: 13.5, color: '#334155', lineHeight: 1.5 }}>
            {selectedPost.caption}
          </p>
        )}
      </div>

      {/* SECTION ARTICLES PRÉSENTÉS DANS CETTE VIDÉO */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShoppingBag size={18} style={{ color: 'var(--accent, #C75B00)' }} />
            <span>Produits de cette publication</span>
          </h3>
          {selectedPost.produits_associes.length > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>
              {selectedPost.produits_associes.length} article(s)
            </span>
          )}
        </div>

        {selectedPost.produits_associes.length === 0 ? (
          <div
            style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              borderRadius: 16,
              padding: '20px 18px',
              border: '1.5px solid #86efac',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 4px 14px rgba(34,197,94,0.08)',
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: '#25d366',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37,211,102,0.3)',
              }}
            >
              <MessageCircle size={24} />
            </div>

            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 900, color: '#14532d' }}>
                Commander cet article directement
              </h4>
              <p style={{ margin: 0, fontSize: 12.5, color: '#166534', lineHeight: 1.45 }}>
                Cet article n&apos;est pas encore lié au catalogue, mais vous pouvez le <strong>commander immédiatement par WhatsApp</strong> auprès de la boutique !
              </p>
            </div>

            {whatsappNumber ? (
              <a
                href={getWhatsAppUrl(selectedPost) || '#'}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: '#25d366',
                  color: '#ffffff',
                  padding: '12px 20px',
                  borderRadius: 12,
                  fontSize: 13.5,
                  fontWeight: 900,
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(37,211,102,0.35)',
                  width: '100%',
                }}
              >
                <MessageCircle size={18} />
                <span>Commander par WhatsApp Direct</span>
              </a>
            ) : (
              <span style={{ fontSize: 12, color: '#64748b' }}>Numéro WhatsApp non renseigné</span>
            )}

            <Link
              href={`/boutiques/${boutiqueKey}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: '#15803d',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'underline',
                marginTop: 2,
              }}
            >
              <Store size={13} />
              <span>Ou explorer le catalogue complet</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {selectedPost.produits_associes.map(prod => (
              <div
                key={prod.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ width: 60, height: 60, borderRadius: 8, background: '#fff', overflow: 'hidden', flexShrink: 0, border: '1px solid #cbd5e1' }}>
                  {prod.images?.[0] ? (
                    <ExternalImg src={cloudinaryHQ(prod.images[0], { width: 140 })} alt={prod.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShoppingBag size={20} style={{ color: '#94a3b8' }} />
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/boutiques/${boutiqueKey}/produits/${prod.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <p style={{ margin: '0 0 2px', fontSize: 13.5, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {prod.nom}
                    </p>
                  </Link>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--accent, #C75B00)' }}>
                      {prod.prix ? fcfa(prod.prix) : 'Sur demande'}
                    </span>
                    {prod.prix_barre && (
                      <span style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'line-through' }}>
                        {fcfa(prod.prix_barre)}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => onAddToCart(prod)}
                    disabled={prod.en_stock === false}
                    style={{
                      background: addedProductId === prod.id ? '#16a34a' : '#0f172a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: prod.en_stock === false ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {addedProductId === prod.id ? (
                      <>
                        <Check size={13} />
                        <span>Ajouté !</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={13} />
                        <span>Panier</span>
                      </>
                    )}
                  </button>

                  {whatsappNumber && (
                    <a
                      href={getWhatsAppUrl(selectedPost, prod) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#25d366',
                        color: '#fff',
                        textDecoration: 'none',
                        borderRadius: 8,
                        padding: '5px 10px',
                        fontSize: 11,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        justifyContent: 'center',
                      }}
                    >
                      <MessageCircle size={12} />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER MODAL : ACTIONS DIRECTES */}
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16, marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {whatsappNumber && (
          <a
            href={getWhatsAppUrl(selectedPost) || '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: selectedPost.produits_associes.length === 0 ? '#25d366' : '#f0fdf4',
              color: selectedPost.produits_associes.length === 0 ? '#ffffff' : '#16a34a',
              border: selectedPost.produits_associes.length === 0 ? 'none' : '1.5px solid #bbf7d0',
              borderRadius: 12,
              padding: '12px 16px',
              textDecoration: 'none',
              fontSize: 13.5,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: selectedPost.produits_associes.length === 0 ? '0 4px 14px rgba(37,211,102,0.3)' : 'none',
            }}
          >
            <MessageCircle size={18} />
            <span>
              {selectedPost.produits_associes.length === 0
                ? 'Commander cet article par WhatsApp Direct'
                : 'Discuter de cette publication sur WhatsApp'}
            </span>
          </a>
        )}

        <button
          type="button"
          onClick={onOpenCart}
          style={{
            background: selectedPost.produits_associes.length === 0 ? '#f8fafc' : 'var(--accent, #C75B00)',
            color: selectedPost.produits_associes.length === 0 ? '#475569' : '#fff',
            border: selectedPost.produits_associes.length === 0 ? '1px solid #cbd5e1' : 'none',
            borderRadius: 12,
            padding: '11px 16px',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: selectedPost.produits_associes.length === 0 ? 'none' : '0 4px 14px rgba(199,91,0,0.25)',
          }}
        >
          <ShoppingCart size={15} />
          <span>Voir mon Panier d&apos;Achats</span>
        </button>
      </div>
    </div>
  )
}
