"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Store, ShoppingCart, MessageCircle, ShieldCheck, ChevronRight, ChevronLeft } from 'lucide-react'

const SLIDES = [
  {
    id: 'taftaf',
    bg: '#0f172a',
    color: '#f8fafc',
    border: '1px solid #1e293b',
    badgeBg: 'rgba(199,91,0,0.2)',
    badgeColor: '#fed7aa',
    badgeBorder: '1px solid rgba(199,91,0,0.3)',
    badgeText: '🚀 NOUVEAU',
    title: 'Boutique Taf Taf',
    desc: 'Créez votre boutique complète en 30 secondes chrono pour 2 500 FCFA !',
    features: [
      'Lien personnalisé (nopalou.com/shop)',
      'Gestionnaire de commandes Web',
      'Visibilité accrue sur Nopalou'
    ],
    ctaText: 'Créer ma vitrine →',
    ctaLink: '/creer-boutique',
    ctaBg: '#C75B00',
    ctaColor: '#fff'
  },
  {
    id: 'pos',
    bg: '#f0fdf4',
    color: '#064e3b',
    border: '1px solid #bbf7d0',
    badgeBg: '#dcfce7',
    badgeColor: '#166534',
    badgeBorder: '1px solid #bbf7d0',
    badgeText: '🏪 GRATUIT',
    title: 'Gérez vos ventes (POS)',
    desc: 'Un système de caisse ultra-rapide pour gérer vos ventes physiques et en ligne au même endroit.',
    features: [
      'Suivi des stocks en temps réel',
      'Tickets de caisse numériques',
      'Statistiques de vente détaillées'
    ],
    ctaText: 'Tester la Démo POS →',
    ctaLink: '/demo?role=marchand',
    ctaBg: '#16a34a',
    ctaColor: '#fff'
  },
  {
    id: 'whatsapp',
    bg: '#fff7ed',
    color: '#7c2d12',
    border: '1px solid #ffedd5',
    badgeBg: '#ffedd5',
    badgeColor: '#9a3412',
    badgeBorder: '1px solid #fdba74',
    badgeText: '💬 DIRECT',
    title: '0% de Commission',
    desc: 'Les clients vous contactent et commandent directement sur votre numéro WhatsApp.',
    features: [
      'Aucun intermédiaire',
      'Paiements directs avec le client',
      'Relation client privilégiée'
    ],
    ctaText: 'Rejoindre Nopalou →',
    ctaLink: '/creer-boutique',
    ctaBg: '#ea580c',
    ctaColor: '#fff'
  },
  {
    id: 'verified',
    bg: '#f8fafc',
    color: '#0f172a',
    border: '1px solid #e2e8f0',
    badgeBg: '#e0f2fe',
    badgeColor: '#0369a1',
    badgeBorder: '1px solid #bae6fd',
    badgeText: '🛡️ CONFIANCE',
    title: 'Vendeurs Vérifiés',
    desc: 'Achetez en toute confiance. Nos marchands "Pro" et "Business" sont rigoureusement vérifiés.',
    features: [
      'Identité du vendeur confirmée',
      'Boutiques physiques vérifiées',
      'Avis clients authentiques'
    ],
    ctaText: 'Voir les Vendeurs Pro →',
    ctaLink: '/boutiques?plan=pro',
    ctaBg: '#0284c7',
    ctaColor: '#fff'
  }
]

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Auto-scroll effect
  useEffect(() => {
    if (isHovered) return

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length)
    }, 4500) // Change every 4.5 seconds

    return () => clearInterval(timer)
  }, [isHovered])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % SLIDES.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)

  const slide = SLIDES[currentSlide]

  return (
    <div 
      style={{ position: 'relative', width: '100%', height: '100%' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Container with explicit minimum height to avoid jumping */}
      <div 
        style={{ 
          background: slide.bg, 
          padding: '16px 18px 12px 18px', 
          borderRadius: 20, 
          color: slide.color, 
          border: slide.border, 
          boxShadow: '0 6px 20px rgba(0,0,0,0.06)', 
          display: 'flex', 
          flexDirection: 'column',
          transition: 'all 0.4s ease-in-out',
          minHeight: 225,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Navigation Buttons */}
        <button 
          onClick={prevSlide}
          style={{ position: 'absolute', top: '50%', left: 4, transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, color: slide.color }}
          aria-label="Previous"
        >
          <ChevronLeft size={16} />
        </button>
        <button 
          onClick={nextSlide}
          style={{ position: 'absolute', top: '50%', right: 4, transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, color: slide.color }}
          aria-label="Next"
        >
          <ChevronRight size={16} />
        </button>

        <div style={{ marginLeft: 12, marginRight: 12, display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
          <div>
            <span style={{ display: 'inline-block', background: slide.badgeBg, color: slide.badgeColor, padding: '3px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800, marginBottom: 6, border: slide.badgeBorder }}>
              {slide.badgeText}
            </span>
          </div>
          
          <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 4, color: slide.color, transition: 'color 0.3s' }}>
            {slide.title}
          </h3>
          
          <p style={{ fontSize: 12, opacity: 0.88, margin: '0 0 10px', lineHeight: 1.4 }}>
            {slide.desc}
          </p>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {slide.features.map((feat, idx) => (
              <li key={idx} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: slide.ctaBg, fontWeight: 'bold' }}>✓</span> {feat}
              </li>
            ))}
          </ul>

          <Link 
            href={slide.ctaLink} 
            style={{ 
              display: 'block', 
              textAlign: 'center', 
              background: slide.ctaBg, 
              color: slide.ctaColor, 
              fontWeight: 800, 
              fontSize: 13, 
              padding: '9px 12px', 
              borderRadius: 10, 
              textDecoration: 'none', 
              marginTop: 10, 
              boxShadow: `0 3px 10px ${slide.ctaBg}40`, 
              transition: 'transform 0.2s, opacity 0.2s',
            }}
          >
            {slide.ctaText}
          </Link>
        </div>

        {/* Carousel Indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 10 }}>
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              style={{
                width: currentSlide === idx ? 14 : 5,
                height: 5,
                borderRadius: 5,
                background: currentSlide === idx ? slide.ctaBg : `${slide.color}30`,
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
