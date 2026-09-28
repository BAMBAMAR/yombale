'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CreditCard,
  ShieldCheck,
  Building2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Plus
} from 'lucide-react'

const SLIDES = [
  {
    id: 'loyers',
    bg: '#0f172a',
    color: '#f8fafc',
    border: '1px solid #1e293b',
    badgeBg: 'rgba(16, 185, 129, 0.2)',
    badgeColor: '#6ee7b7',
    badgeBorder: '1px solid rgba(16, 185, 129, 0.3)',
    badgeText: 'CONTRATS SÉCURISÉS',
    title: 'Paiement Loyers Sécurisé',
    desc: 'Encaissement automatique via Wave et Orange Money avec quittances de loyer certifiées.',
    features: [
      'Quittances certifiées instantanées',
      'Zéro litige propriétaire / locataire',
      'Historique comptable téléchargeable'
    ],
    ctaText: 'Payer mon loyer →',
    ctaLink: '/payer-loyer',
    ctaBg: '#10b981',
    ctaColor: '#fff',
    icon: CreditCard
  },
  {
    id: 'agrement',
    bg: '#f8fafc',
    color: '#0f172a',
    border: '1px solid #e2e8f0',
    badgeBg: '#e0f2fe',
    badgeColor: '#0369a1',
    badgeBorder: '1px solid #bae6fd',
    badgeText: 'CONFIANCE & LÉGALITÉ',
    title: 'Agences Agréées de l’État',
    desc: 'Partenaires disposant d’un numéro d’agrément officiel vérifié auprès des autorités.',
    features: [
      'Agrément ministériel contrôlé',
      'Mandats de gestion officiels',
      'Transparence totale des honoraires'
    ],
    ctaText: 'Agences agréées →',
    ctaLink: '/agences?agree=1',
    ctaBg: '#1C2B4A',
    ctaColor: '#fff',
    icon: ShieldCheck
  },
  {
    id: 'direct',
    bg: '#fff7ed',
    color: '#7c2d12',
    border: '1px solid #ffedd5',
    badgeBg: '#ffedd5',
    badgeColor: '#9a3412',
    badgeBorder: '1px solid #fdba74',
    badgeText: 'PORTFOLIO VÉRIFIÉ',
    title: 'Zéro Faux Courtier',
    desc: 'Offres réelles de villas, appartements et terrains avec photos et contact WhatsApp direct.',
    features: [
      'Disponibilités en direct sans intermédiaire',
      'Contact WhatsApp avec agents accrédités',
      'Visites planifiées rapidement'
    ],
    ctaText: 'Explorer les biens →',
    ctaLink: '/immo',
    ctaBg: '#ea580c',
    ctaColor: '#fff',
    icon: Building2
  },
  {
    id: 'pro',
    bg: '#f0fdf4',
    color: '#064e3b',
    border: '1px solid #bbf7d0',
    badgeBg: '#dcfce7',
    badgeColor: '#166534',
    badgeBorder: '1px solid #bbf7d0',
    badgeText: 'ESPACE PRO IMMO',
    title: 'Digitalisez votre Agence',
    desc: 'Vitrine Web dédiée, gestion de parc locatif, baux numériques et encaissement mobile.',
    features: [
      'Vitrine web officielle nopalou.com/agences',
      'Gestion des baux & quittances automatiques',
      'Diffusion directe de vos mandats'
    ],
    ctaText: 'Rejoindre le Réseau →',
    ctaLink: '/agence',
    ctaBg: '#16a34a',
    ctaColor: '#fff',
    icon: Plus
  }
]

export default function ImmoHeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (isHovered) return

    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % SLIDES.length)
    }, 4500)

    return () => clearInterval(timer)
  }, [isHovered])

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % SLIDES.length)
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + SLIDES.length) % SLIDES.length)

  const slide = SLIDES[currentSlide]
  const SlideIcon = slide.icon

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <style>{`
        @media (max-width: 768px) {
          .immo-hero-carousel-card {
            min-height: 185px !important;
            padding: 12px 12px 10px 12px !important;
            border-radius: 16px !important;
          }
          .immo-hero-carousel-title {
            font-size: 15px !important;
          }
          .immo-hero-carousel-desc {
            font-size: 11.5px !important;
            margin-bottom: 6px !important;
          }
          .immo-hero-carousel-feat-2 {
            display: none !important;
          }
        }
      `}</style>
      <div
        className="immo-hero-carousel-card"
        style={{
          background: slide.bg,
          padding: '12px 14px 10px 14px',
          borderRadius: 18,
          color: slide.color,
          border: slide.border,
          boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.4s ease-in-out',
          minHeight: 175,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Navigation Buttons */}
        <button
          onClick={prevSlide}
          style={{
            position: 'absolute',
            top: '50%',
            left: 4,
            transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,0.05)',
            border: 'none',
            borderRadius: '50%',
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            color: slide.color,
          }}
          aria-label="Précédent"
        >
          <ChevronLeft size={15} />
        </button>
        <button
          onClick={nextSlide}
          style={{
            position: 'absolute',
            top: '50%',
            right: 4,
            transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,0.05)',
            border: 'none',
            borderRadius: '50%',
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            color: slide.color,
          }}
          aria-label="Suivant"
        >
          <ChevronRight size={15} />
        </button>

        {/* Header Slide */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, paddingLeft: 10, paddingRight: 10 }}>
          <span
            style={{
              background: slide.badgeBg,
              color: slide.badgeColor,
              border: slide.badgeBorder,
              fontSize: 9.5,
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: 6,
              letterSpacing: '0.04em',
            }}
          >
            {slide.badgeText}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <SlideIcon size={13} style={{ opacity: 0.8 }} />
            <span style={{ fontSize: 10.5, opacity: 0.7, fontWeight: 700 }}>
              {currentSlide + 1} / {SLIDES.length}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, paddingLeft: 10, paddingRight: 10 }}>
          <h3
            className="immo-hero-carousel-title"
            style={{
              fontSize: 14.5,
              fontWeight: 900,
              margin: '0 0 2px',
              color: slide.color,
              lineHeight: 1.2,
            }}
          >
            {slide.title}
          </h3>
          <p
            className="immo-hero-carousel-desc"
            style={{
              fontSize: 11.5,
              margin: '0 0 6px',
              opacity: 0.88,
              lineHeight: 1.3,
            }}
          >
            {slide.desc}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 }}>
            {slide.features.map((feat, idx) => (
              <div
                key={idx}
                className={idx === 2 ? 'immo-hero-carousel-feat-2' : ''}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}
              >
                <CheckCircle2 size={11} style={{ flexShrink: 0, opacity: 0.8 }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {feat}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 8,
            borderTop: '1px solid rgba(0,0,0,0.05)',
            paddingLeft: 12,
            paddingRight: 12,
          }}
        >
          <div style={{ display: 'flex', gap: 4 }}>
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                style={{
                  width: currentSlide === idx ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: currentSlide === idx ? slide.ctaBg : 'rgba(0,0,0,0.2)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                aria-label={`Aller au slide ${idx + 1}`}
              />
            ))}
          </div>

          <Link
            href={slide.ctaLink}
            className="immo-hero-carousel-cta"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: slide.ctaBg,
              color: slide.ctaColor,
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <span>{slide.ctaText}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
