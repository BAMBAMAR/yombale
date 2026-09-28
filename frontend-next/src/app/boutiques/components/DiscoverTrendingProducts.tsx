'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import ExternalImg from '@/components/ExternalImg'
import { Sparkles, MessageCircle, ChevronLeft, ChevronRight, Store, MapPin } from 'lucide-react'

export interface TrendingProduct {
  id: string
  nom: string
  prix: number | string
  prix_barre?: number | string | null
  image: string | null
  categorie: string | null
  boutique_id: string
  boutique_nom: string
  boutique_slug: string | null
  boutique_logo: string | null
  boutique_ville: string | null
  boutique_whatsapp: string | null
  boutique_telephone: string | null
}

function formatPrixFCFA(val: number | string | undefined | null) {
  if (val === undefined || val === null || val === '') return ''
  const num = typeof val === 'number' ? val : parseFloat(val)
  if (isNaN(num)) return `${val} F`
  return new Intl.NumberFormat('fr-SN').format(num) + ' F'
}

export default function DiscoverTrendingProducts({
  produits,
}: {
  produits: TrendingProduct[]
}) {
  const trackRef = useRef<HTMLDivElement>(null)

  if (!produits || produits.length === 0) return null

  const items = produits.slice(0, 12)

  const scrollLeft = () => {
    trackRef.current?.scrollBy({ left: -360, behavior: 'smooth' })
  }

  const scrollRight = () => {
    trackRef.current?.scrollBy({ left: 360, behavior: 'smooth' })
  }

  return (
    <div
      style={{
        marginBottom: 24,
        background: '#ffffff',
        border: '1px solid var(--border, #E8DDD2)',
        borderRadius: 16,
        padding: '14px 16px 12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}
    >
      <style>{`
        .prods-pepites-track {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding-bottom: 4px;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          width: 100%;
        }
        .prods-pepites-track::-webkit-scrollbar {
          display: none;
        }
        .prod-compact-card {
          flex: 0 0 180px;
          scroll-snap-align: start;
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .prod-compact-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.06);
          border-color: #cbd5e1;
        }
        .prod-img-box {
          height: 85px;
          position: relative;
          background: #f8fafc;
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .prod-compact-card {
            flex: 0 0 155px !important;
          }
          .prod-img-box {
            height: 75px !important;
          }
        }
      `}</style>

      {/* Header Carrousel avec flèches */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div
            style={{
              background: '#fff7ed',
              width: 28,
              height: 28,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={15} style={{ color: 'var(--accent, #C75B00)' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 14.5,
                  fontWeight: 900,
                  color: '#0f172a',
                  lineHeight: 1.2,
                }}
              >
                Nouveautés & Pépites Produits
              </h2>
              <span
                style={{
                  background: 'rgba(199, 91, 0, 0.1)',
                  color: 'var(--accent, #C75B00)',
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: 10,
                  whiteSpace: 'nowrap',
                }}
              >
                {items.length} articles
              </span>
            </div>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 11,
                color: '#64748b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Glissez pour parcourir les nouveautés sans allonger la page
            </p>
          </div>
        </div>

        {/* Boutons Flèches Navigation */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            type="button"
            onClick={scrollLeft}
            aria-label="Faire défiler vers la gauche"
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={scrollRight}
            aria-label="Faire défiler vers la droite"
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Track Horizontal Carrousel */}
      <div ref={trackRef} className="prods-pepites-track">
        {items.map(prod => {
          const bSlug = prod.boutique_slug || prod.boutique_id
          const whatsappNum = (prod.boutique_whatsapp || prod.boutique_telephone || '').replace(/[^0-9]/g, '')
          const words = (prod.boutique_nom || 'Boutique').trim().split(/\s+/)
          const bInitials = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : (prod.boutique_nom || 'BO').slice(0, 2).toUpperCase()
          const hasPromo = Boolean(prod.prix_barre && Number(prod.prix_barre) > Number(prod.prix))

          return (
            <div key={prod.id} className="prod-compact-card">
              {/* Photo compacte */}
              <div className="prod-img-box">
                <Link
                  href={`/boutiques/${bSlug}/produits/${prod.id}`}
                  prefetch={false}
                  style={{ display: 'block', width: '100%', height: '100%' }}
                >
                  {prod.image ? (
                    <ExternalImg
                      src={prod.image}
                      alt={prod.nom}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8',
                        padding: 6,
                        textAlign: 'center',
                      }}
                    >
                      <Store size={22} style={{ color: '#fed7aa', marginBottom: 2 }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>
                        {prod.categorie || 'Article'}
                      </span>
                    </div>
                  )}
                </Link>

                {/* Badge Promo / Nouveauté */}
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    left: 4,
                    background: hasPromo ? '#dc2626' : '#16a34a',
                    color: '#fff',
                    fontSize: 8,
                    fontWeight: 800,
                    padding: '1.5px 5px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}
                >
                  {hasPromo ? 'Promo' : 'Nouveau'}
                </div>

                {/* Badge Ville / Quartier */}
                {prod.boutique_ville && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 4,
                      left: 4,
                      background: 'rgba(15, 23, 42, 0.82)',
                      backdropFilter: 'blur(3px)',
                      color: '#ffffff',
                      padding: '2px 5px',
                      borderRadius: 4,
                      fontSize: 8.5,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      maxWidth: '90%',
                    }}
                  >
                    <MapPin size={9} style={{ color: '#fed7aa', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {prod.boutique_ville}
                    </span>
                  </div>
                )}
              </div>

              {/* Contenu compact */}
              <div
                style={{
                  padding: '7px 8px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h4
                    style={{
                      margin: '0 0 3px',
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#0f172a',
                      lineHeight: 1.25,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={prod.nom}
                  >
                    <Link
                      href={`/boutiques/${bSlug}/produits/${prod.id}`}
                      prefetch={false}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {prod.nom}
                    </Link>
                  </h4>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 3 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 900,
                        color: 'var(--price, #0A5C36)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatPrixFCFA(prod.prix)}
                    </span>
                    {prod.prix_barre && Number(prod.prix_barre) > Number(prod.prix) && (
                      <span
                        style={{
                          fontSize: 9.5,
                          color: '#94a3b8',
                          textDecoration: 'line-through',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatPrixFCFA(prod.prix_barre)}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 9.5,
                      color: '#64748b',
                      marginBottom: 6,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {prod.categorie || 'Produit direct'}
                  </div>
                </div>

                {/* Footer compact : Boutique + WhatsApp */}
                <div
                  style={{
                    paddingTop: 5,
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 4,
                  }}
                >
                  <Link
                    href={`/boutiques/${bSlug}`}
                    prefetch={false}
                    title={prod.boutique_nom}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      textDecoration: 'none',
                      color: '#475569',
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: 17,
                        height: 17,
                        borderRadius: 4,
                        overflow: 'hidden',
                        background: '#e2e8f0',
                        color: '#1C2B4A',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 8,
                        fontWeight: 800,
                      }}
                    >
                      <ExternalImg
                        src={prod.boutique_logo}
                        alt={prod.boutique_nom}
                        fallback={bInitials}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: '#1e293b',
                      }}
                    >
                      {prod.boutique_nom}
                    </span>
                  </Link>

                  {whatsappNum && (
                    <a
                      href={`https://wa.me/${whatsappNum}?text=${encodeURIComponent(
                        `Bonjour ${prod.boutique_nom}, je suis intéressé par votre article "${prod.nom}" (${formatPrixFCFA(
                          prod.prix
                        )}) vu sur Nopalou !`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: '#16a34a',
                        color: '#fff',
                        textDecoration: 'none',
                        flexShrink: 0,
                      }}
                      title="Contacter sur WhatsApp"
                    >
                      <MessageCircle size={11} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

