'use client'

import React from 'react'
import Link from 'next/link'
import ExternalImg from '@/components/ExternalImg'
import {
  Sparkles, Star, MapPin, Building2, MessageCircle, ArrowRight,
  ShoppingBag, ShieldCheck, CheckCircle2
} from 'lucide-react'
import { getCategoryCoverPhoto } from '@/lib/boutique-covers'
import { BoutiqueItem } from './BoutiqueCard'

function formatPrixFCFA(val: number | string | undefined | null) {
  if (val === undefined || val === null || val === '') return ''
  const num = typeof val === 'number' ? val : parseFloat(val)
  if (isNaN(num)) return `${val} F`
  return new Intl.NumberFormat('fr-SN').format(num) + ' F'
}

export default function BoutiqueSpotlight({
  boutique,
}: {
  boutique?: BoutiqueItem | null
}) {
  if (!boutique) return null

  const b = boutique
  const coverImageSrc = b.cover_url || getCategoryCoverPhoto(b.nom, b.categorie)
  const words = b.nom.trim().split(/\s+/)
  const initials = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : b.nom.slice(0, 2).toUpperCase()
  const boutiqueLien = `/boutiques/${b.slug || b.id}`
  const whatsappNumber = b.whatsapp || b.telephone
  const produits = b.produits_apercu || []

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1C2B4A 0%, #152238 60%, #0F172A 100%)',
        borderRadius: 24,
        color: '#ffffff',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
        border: '1.5px solid rgba(254, 215, 170, 0.3)',
        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.18)',
      }}
    >
      {/* Halo lumineux de fond */}
      <div style={{
        position: 'absolute', right: -40, top: -40, width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(199, 91, 0, 0.22) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <style>{`
        .spotlight-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
          gap: 24px;
          align-items: center;
          padding: 24px 28px;
        }
        @media (max-width: 900px) {
          .spotlight-grid {
            display: flex;
            flex-direction: column;
            gap: 20px;
            padding: 20px;
          }
        }
      `}</style>

      <div className="spotlight-grid" style={{ position: 'relative', zIndex: 2 }}>
        
        {/* COLONNE GAUCHE : IDENTITÉ & SPOTLIGHT */}
        <div>
          {/* Badge En Exergue */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(199, 91, 0, 0.25)', color: '#fed7aa',
            padding: '5px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 800,
            marginBottom: 14, border: '1px solid rgba(254, 215, 170, 0.4)',
            letterSpacing: '0.02em', textTransform: 'uppercase'
          }}>
            <Sparkles size={13} style={{ color: '#fed7aa' }} />
            <span>Boutique Vedette du Moment</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, overflow: 'hidden',
              border: '2.5px solid rgba(255, 255, 255, 0.9)', background: '#fff',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)', flexShrink: 0
            }}>
              <ExternalImg src={b.logo_url} alt={b.nom} fallback={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.01em' }}>
                  <Link href={boutiqueLien} prefetch={false} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {b.nom}
                  </Link>
                </h2>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7',
                  padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  <ShieldCheck size={12} />
                  <span>Vérifié</span>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, fontSize: 12, color: '#cbd5e1' }}>
                {b.ville && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} style={{ color: '#fed7aa' }} /> {b.ville}
                  </span>
                )}
                {b.total_avis && b.total_avis > 0 && b.note_moyenne ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#fbbf24', fontWeight: 800 }}>
                    <Star size={12} style={{ fill: '#fbbf24' }} /> {Number(b.note_moyenne).toFixed(1)} / 5 ({b.total_avis} avis)
                  </span>
                ) : (
                  <span style={{ color: '#94a3b8' }}>Partenaire certifié</span>
                )}
              </div>
            </div>
          </div>

          <p style={{
            margin: '0 0 16px', fontSize: 13, color: '#e2e8f0', lineHeight: 1.5,
            maxWidth: 500, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
          }}>
            {b.description || "Découvrez notre catalogue complet avec livraison rapide et service client direct sans intermédiaire."}
          </p>

          {/* Boutons d'action */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link
              href={boutiqueLien}
              prefetch={false}
              style={{
                background: 'var(--accent, #C75B00)', color: '#ffffff',
                padding: '9px 18px', borderRadius: 12, textDecoration: 'none',
                fontWeight: 800, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6,
                boxShadow: '0 3px 12px rgba(199, 91, 0, 0.35)', transition: 'transform 0.15s ease'
              }}
            >
              <span>Explorer la vitrine</span>
              <ArrowRight size={14} />
            </Link>

            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${b.nom}, j'ai vu votre vitrine vedette sur Nopalou !`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'rgba(37, 211, 102, 0.2)', color: '#4ade80',
                  padding: '9px 16px', borderRadius: 12, textDecoration: 'none',
                  fontWeight: 800, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6,
                  border: '1px solid rgba(37, 211, 102, 0.4)'
                }}
              >
                <MessageCircle size={15} />
                <span>WhatsApp Direct</span>
              </a>
            )}
          </div>
        </div>

        {/* COLONNE DROITE : 4 PRODUITS PHARES DE LA BOUTIQUE EN EXERGUE */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: 18,
          padding: '14px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: '#fed7aa', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Articles phares en rayon
            </span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              {b.total_produits ? `${b.total_produits} au catalogue` : 'En stock'}
            </span>
          </div>

          {produits.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {produits.slice(0, 4).map(prod => (
                <Link
                  key={prod.id}
                  href={`${boutiqueLien}/produits/${prod.id}`}
                  prefetch={false}
                  title={`${prod.nom} — ${formatPrixFCFA(prod.prix)}`}
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: 12,
                    padding: '8px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'transform 0.15s ease, background 0.15s ease',
                    color: '#0f172a',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 8, overflow: 'hidden',
                    background: '#f1f5f9', flexShrink: 0, position: 'relative'
                  }}>
                    {prod.image ? (
                      <ExternalImg src={prod.image} alt={prod.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                        <ShoppingBag size={18} />
                      </div>
                    )}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{
                      margin: '0 0 2px', fontSize: 11.5, fontWeight: 700, color: '#0f172a',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {prod.nom}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: 'var(--price, #0A5C36)' }}>
                      {formatPrixFCFA(prod.prix)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 10px', color: '#94a3b8', fontSize: 12 }}>
              Consultez le catalogue de cette boutique vedette via WhatsApp
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
