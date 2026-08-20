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
    badgeText: '💬 WHATSAPP SHOPPING',
    badgeBg: '#DCFCE7',
    badgeColor: '#166534',
    badgeBorder: '#BBF7D0',
    iconType: 'whatsapp',
    iconColor: '#25D366',
    title: 'Commandez sur WhatsApp',
    desc: 'Trouvez le produit et passez commande directement au vendeur en un clic.',
    features: [
      'Sans inscription',
      'Contact direct vendeur',
      'Suivi de livraison en temps réel',
    ],
    ctaText: 'Comment ça marche ? →',
    ctaLink: '/assistant-whatsapp',
    ctaColor: '#25D366',
  },
  {
    id: 'parrainage-20',
    badgeText: '🤝 REVENUS PASSIFS',
    badgeBg: '#FFEDD5',
    badgeColor: '#9A3412',
    badgeBorder: '#FDBA74',
    iconType: 'parrainage',
    iconColor: '#C75B00',
    title: 'Parrainez & Gagnez 20%',
    desc: 'Recommandez Nopalou aux commerçants et touchez 20% chaque mois à vie.',
    features: [
      'Code parrain instantané',
      '1er mois 100% offert au commerçant',
      'Commissions versées par Wave / OM',
    ],
    ctaText: 'Voir mon code parrain →',
    ctaLink: '/compte/apporteur',
    ctaColor: '#C75B00',
  },
  {
    id: 'bot-assistant',
    badgeText: '🤖 BOT 24/7',
    badgeBg: '#E0F2FE',
    badgeColor: '#0369A1',
    badgeBorder: '#BAE6FD',
    iconType: 'bot',
    iconColor: '#0284C7',
    title: 'Assistant Prix WhatsApp',
    desc: 'Envoyez le nom d\'un produit au +221 70 871 79 42 pour comparer les prix de Dakar.',
    features: [
      'Comparateur 100% gratuit',
      'Prix vérifiés toutes les 6 heures',
      'Réponse immédiate sur WhatsApp',
    ],
    ctaText: 'Discuter sur WhatsApp →',
    ctaLink: 'https://wa.me/221708717942',
    ctaColor: '#0284C7',
    ctaExternal: true,
  },
  {
    id: 'pos-vendeur',
    badgeText: '🏪 COMMERCE & CAISSE',
    badgeBg: '#FEF3C7',
    badgeColor: '#92400E',
    badgeBorder: '#FDE68A',
    iconType: 'pos',
    iconColor: '#D97706',
    title: 'Caisse POS & Vente Web',
    desc: 'Digitalisez votre boutique : Caisse Offline, Carnet Dettes, Factures OHADA.',
    features: [
      '30 jours 100% offerts',
      '0% de commission sur vos ventes',
      '3 scanners de codes-barres',
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
        maxWidth: isMobile ? '100%' : 300,
        textAlign: 'left',
        background: '#ffffff',
        padding: isMobile ? '16px 18px' : '20px',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        minHeight: isMobile ? 'auto' : 320,
        transition: 'box-shadow 0.2s ease',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* En-tête : Badge + Navigation Flèches */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            padding: '3px 10px',
            borderRadius: 12,
            background: slide.badgeBg,
            color: slide.badgeColor,
            border: `1px solid ${slide.badgeBorder}`,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {slide.badgeText}
        </span>

        {/* Contrôles Précédent / Suivant */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Slide précédente"
            style={{
              width: 24,
              height: 24,
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
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Slide suivante"
            style={{
              width: 24,
              height: 24,
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
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Icône du Slide */}
      <div style={{ fontSize: 24, marginBottom: 8, color: slide.iconColor, display: 'flex', alignItems: 'center', gap: 8 }}>
        {slide.iconType === 'whatsapp' && (
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a5.22 5.22 0 0 0-.571-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.052 0C5.495 0 .16 5.333.158 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.332 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
          </svg>
        )}
        {slide.iconType === 'parrainage' && <span style={{ fontSize: 26 }}>🤝</span>}
        {slide.iconType === 'bot' && <span style={{ fontSize: 26 }}>🤖</span>}
        {slide.iconType === 'pos' && <span style={{ fontSize: 26 }}>🏪</span>}
      </div>

      {/* Titre & Description */}
      <h3 style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.3 }}>
        {slide.title}
      </h3>
      <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.45 }}>
        {slide.desc}
      </p>

      {/* Liste des Avantages */}
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {slide.features.map((feat, idx) => (
          <li key={idx} style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: slide.iconColor, fontWeight: 900 }}>✓</span> {feat}
          </li>
        ))}
      </ul>

      {/* Bouton d'Action / Lien */}
      {slide.ctaExternal ? (
        <a
          href={slide.ctaLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            marginTop: 14,
            fontSize: 13,
            fontWeight: 800,
            color: slide.ctaColor,
            textDecoration: 'none',
          }}
        >
          {slide.ctaText}
        </a>
      ) : (
        <Link
          href={slide.ctaLink}
          style={{
            display: 'inline-block',
            marginTop: 14,
            fontSize: 13,
            fontWeight: 800,
            color: slide.ctaColor,
            textDecoration: 'none',
          }}
        >
          {slide.ctaText}
        </Link>
      )}

      {/* Indicateurs de pagination (Dots) */}
      <div style={{ display: 'flex', gap: 6, marginTop: 14, alignItems: 'center', justifyContent: 'center' }}>
        {SLIDES.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setCurrent(idx)}
            aria-label={`Aller au slide ${idx + 1}`}
            style={{
              width: current === idx ? 18 : 6,
              height: 6,
              borderRadius: 4,
              border: 'none',
              background: current === idx ? slide.ctaColor : '#cbd5e1',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.25s ease',
            }}
          />
        ))}
      </div>
    </div>
  )
}
