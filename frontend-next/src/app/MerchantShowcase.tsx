'use client'

import React from 'react'
import Link from 'next/link'
import TarifsPublicsSelector from './tarifs-boutique/TarifsPublicsSelector'
import {
  MerchantMasterStage,
  MerchantComparisonTable,
  MerchantRoiSimulator,
  MerchantDemoCtaAndTestimonials,
  MerchantFaqAccordion,
  MerchantCtaBanner
} from './showcase'

interface Props {
  prixTafTaf?: number
}

export default function MerchantShowcase({ prixTafTaf = 2500 }: Props) {
  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif' }}>
      {/* 1. Le Master Feature Stage interactif */}
      <MerchantMasterStage />

      {/* 2. Matrice comparative stratégique */}
      <MerchantComparisonTable />

      {/* 3. Chapitre unifié : Rentabilité & Tarifs */}
      <section
        style={{
          background: '#ffffff',
          borderRadius: 20,
          border: '1px solid #E2E8F0',
          padding: '32px 24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          marginBottom: 48
        }}
      >
        {/* Partie A : Le Simulateur d'Économie 0% Commission */}
        <MerchantRoiSimulator prixTafTaf={prixTafTaf} />

        {/* Partie B : La Grille Tarifaire Officielle */}
        <div style={{ marginBottom: 16 }}>
          <TarifsPublicsSelector />
        </div>

        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <Link
            href="/tarifs-boutique"
            style={{
              fontSize: 12.5,
              fontWeight: 800,
              color: 'var(--accent, #C75B00)',
              textDecoration: 'underline'
            }}
          >
            Consulter la page officielle Tarifs Forfaits Vendeurs (/tarifs-boutique) →
          </Link>
        </div>
      </section>

      {/* 4. Bac à sable démo & Témoignages */}
      <MerchantDemoCtaAndTestimonials />

      {/* 5. FAQ Accordéon */}
      <MerchantFaqAccordion />

      {/* 6. Bannière Finale d'Engagement */}
      <MerchantCtaBanner />
    </div>
  )
}
