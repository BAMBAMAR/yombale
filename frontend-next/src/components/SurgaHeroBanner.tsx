'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import SurgaBrandLogo from '@/app/surga/components/SurgaBrandLogo'
import '@/styles/surga-home-banner.css'

export default function SurgaHeroBanner() {
  return (
    <aside
      className="surga-home-banner"
      aria-label="Découverte de Surga, assistant de poche Nopalou"
    >
      <div className="surga-home-banner-logo">
        <SurgaBrandLogo taille={44} afficherTexte={false} />
      </div>

      <div className="surga-home-banner-text">
        <h3>Surga, votre assistant du quotidien</h3>
        <p>
          Briefing personnalisé, notes, dépenses en FCFA et calculs exacts réunis au même endroit.
        </p>
      </div>

      <Link
        href="/surga"
        className="surga-home-banner-cta"
        aria-label="Ouvrir l'application Surga"
      >
        <span>Découvrir Surga</span>
        <ArrowRight size={16} strokeWidth={2.5} />
      </Link>
    </aside>
  )
}
