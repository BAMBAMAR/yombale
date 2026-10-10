'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function CreerBoutiqueCtaBtn() {
  const handleClick = () => {
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', 'start_trial_click', {
        source: 'landing_creer_boutique_en_ligne',
        destination: '/creer-boutique',
      })
    }
  }

  return (
    <Link
      href="/creer-boutique"
      onClick={handleClick}
      data-event="start_trial_click"
      style={{
        background: '#C75B00',
        color: '#ffffff',
        padding: '16px 36px',
        borderRadius: 12,
        fontWeight: 800,
        fontSize: 17,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        textDecoration: 'none',
        boxShadow: '0 8px 24px rgba(199,91,0,0.4)',
        transition: 'transform 0.15s ease'
      }}
    >
      <span>Créer ma boutique gratuitement</span>
      <ArrowRight size={18} />
    </Link>
  )
}
