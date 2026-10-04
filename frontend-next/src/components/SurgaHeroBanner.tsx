'use client'

import React from 'react'
import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'

export default function SurgaHeroBanner() {
  return (
    <aside
      className="surga-home-banner"
      aria-label="Découverte de Surga, assistant de poche Nopalou"
    >
      <div className="surga-home-banner-text">
        <h3>
          <Sparkles size={18} color="var(--accent, #C75B00)" />
          <span>Surga — Votre Assistant du Quotidien</span>
        </h3>
        <p>
          Briefing personnalisé, notes, gestion des dépenses en FCFA et calculs exacts réunis au même endroit.
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
