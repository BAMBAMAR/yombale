'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Slide {
  id: string
  badgeText: string
  badgeBg: string
  badgeColor: string
  badgeBorder: string
  iconType: 'whatsapp' | 'parrainage' | 'bot' | 'pos'
  iconColor: string
  title: string
  desc: string
  features: string[]
  ctaText: string
  ctaLink: string
  ctaColor: string
  ctaExternal?: boolean
}

const SLIDES: Slide[] = [
  {
    id: 'whatsapp-order',
    badgeText: 'WHATSAPP DIRECT',
    badgeBg: '#DCFCE7',
    badgeColor: '#166534',
    badgeBorder: '#BBF7D0',
    iconType: 'whatsapp',
    iconColor: '#25D366',
    title: 'Commandez sur WhatsApp',
    desc: 'Trouvez le produit et commandez direct au vendeur.',
    features: [
      'Sans inscription requise',
      'Contact direct avec le vendeur',
    ],
    ctaText: 'Comment ça marche ? →',
    ctaLink: '/assistant-whatsapp',
    ctaColor: '#25D366',
  },
  {
    id: 'parrainage-20',
    badgeText: 'REVENUS 20%',
    badgeBg: '#FFEDD5',
    badgeColor: '#9A3412',
    badgeBorder: '#FDBA74',
    iconType: 'parrainage',
    iconColor: '#C75B00',
    title: 'Parrainez & Gagnez 20%',
    desc: 'Recommandez Nopalou et touchez 20% chaque mois.',
    features: [
      'Code parrain instantané',
      'Commissions par Wave / OM',
    ],
    ctaText: 'Voir mon code parrain →',
    ctaLink: '/compte/apporteur',
    ctaColor: '#C75B00',
  },
  {
    id: 'bot-assistant',
    badgeText: 'ASSISTANT 24/7',
    badgeBg: '#E0F2FE',
    badgeColor: '#0369A1',
    badgeBorder: '#BAE6FD',
    iconType: 'bot',
    iconColor: '#0284C7',
    title: 'Assistant Prix WhatsApp',
    desc: 'Envoyez un produit au +221 70 871 79 42.',
    features: [
      'Comparateur 100% gratuit',
      'Réponse immédiate sur WhatsApp',
    ],
    ctaText: 'Discuter sur WhatsApp →',
    ctaLink: 'https://wa.me/221708717942',
    ctaColor: '#0284C7',
    ctaExternal: true,
  },
  {
    id: 'pos-vendeur',
    badgeText: 'COMMERCE & POS',
    badgeBg: '#FEF3C7',
    badgeColor: '#92400E',
    badgeBorder: '#FDE68A',
    iconType: 'pos',
    iconColor: '#D97706',
    title: 'Caisse POS & Vente Web',
    desc: 'Gérez votre caisse, stock, dettes et factures.',
    features: [
      '30 jours 100% offerts',
      '0% de commission sur vos ventes',
    ],
    ctaText: 'Créer ma boutique →',
    ctaLink: '/creer-boutique',
    ctaColor: '#D97706',
  },
]

export default function HeroWhatsAppCarousel({ isMobile = false }: { isMobile?: boolean }) {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const slide = SLIDES[current]

  // Défilement automatique doux (7 secondes)
  useEffect(() => {
    if (isPaused) return
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % SLIDES.length)
    }, 7000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused])

  function prevSlide() {
    setCurrent(prev => (prev === 0 ? SLIDES.length - 1 : prev - 1))
  }

  function nextSlide() {
    setCurrent(prev => (prev + 1) % SLIDES.length)
  }

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      style={{
        width: '100%',
        maxWidth: isMobile ? '100%' : 275,
        textAlign: 'left',
        background: '#ffffff',
        padding: '11px 14px',
        borderRadius: 14,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 148,
        height: '100%',
        position: 'relative',
        boxSizing: 'border-box',
        transition: 'box-shadow 0.2s ease',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div>
        {/* En-tête compact : Icône + Badge + Flèches */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {slide.iconType === 'whatsapp' && (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="#25D366" style={{ flexShrink: 0 }}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a5.22 5.22 0 0 0-.571-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.052 0C5.495 0 .16 5.333.158 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.332 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
              </svg>
            )}
            {slide.iconType === 'parrainage' && <span style={{ fontSize: 13 }}>🤝</span>}
            {slide.iconType === 'bot' && <span style={{ fontSize: 13 }}>🤖</span>}
            {slide.iconType === 'pos' && <span style={{ fontSize: 13 }}>🏪</span>}
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 8,
                background: slide.badgeBg,
                color: slide.badgeColor,
                border: `1px solid ${slide.badgeBorder}`,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {slide.badgeText}
            </span>
          </div>

          {/* Contrôles Précédent / Suivant */}
          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Slide précédente"
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                padding: 0,
              }}
            >
              <ChevronLeft size={11} />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Slide suivante"
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                padding: 0,
              }}
            >
              <ChevronRight size={11} />
            </button>
          </div>
        </div>

        {/* Titre & Description */}
        <h3 style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', margin: '0 0 2px', lineHeight: 1.2 }}>
          {slide.title}
        </h3>
        <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 6px', lineHeight: 1.3 }}>
          {slide.desc}
        </p>

        {/* Liste des Avantages */}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {slide.features.map((feat, idx) => (
            <li key={idx} style={{ fontSize: 11, color: '#334155', display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1.3 }}>
              <span style={{ color: slide.iconColor, fontWeight: 900 }}>✓</span> {feat}
            </li>
          ))}
        </ul>
      </div>

      {/* Ligne du bas : CTA à gauche, Dots à droite */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 2 }}>
        {slide.ctaExternal ? (
          <a
            href={slide.ctaLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11.5,
              fontWeight: 800,
              color: slide.ctaColor,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {slide.ctaText}
          </a>
        ) : (
          <Link
            href={slide.ctaLink}
            style={{
              fontSize: 11.5,
              fontWeight: 800,
              color: slide.ctaColor,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {slide.ctaText}
          </Link>
        )}

        {/* Indicateurs de pagination (Dots) */}
        <div style={{ display: 'flex', gap: 3.5, alignItems: 'center', flexShrink: 0 }}>
          {SLIDES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrent(idx)}
              aria-label={`Aller au slide ${idx + 1}`}
              style={{
                width: current === idx ? 10 : 3.5,
                height: 3.5,
                borderRadius: 2,
                border: 'none',
                background: current === idx ? slide.ctaColor : '#cbd5e1',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
