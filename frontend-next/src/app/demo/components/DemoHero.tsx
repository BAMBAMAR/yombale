import React from 'react'
import { Play, Download } from 'lucide-react'

interface DemoHeroProps {
  tauxCommissionPourcent: number
  onScrollToSimulator: () => void
}

export default function DemoHero({
  tauxCommissionPourcent,
  onScrollToSimulator
}: DemoHeroProps) {
  return (
    <section
      style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, #0F172A 100%)',
        borderRadius: 16,
        padding: '36px 24px',
        border: '1px solid var(--navy)',
        textAlign: 'center',
        boxShadow: 'var(--shadow2)',
        position: 'relative',
        overflow: 'hidden',
        color: '#FFFFFF'
      }}
    >
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
          <span style={{ background: 'var(--accent)', color: '#FFF', padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
            Démo Commerciale Dynamique
          </span>
          <span style={{ background: 'rgba(45, 212, 191, 0.2)', color: '#2DD4BF', border: '1px solid #2DD4BF', padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
            Commission Apporteur : {tauxCommissionPourcent}% Récurrent
          </span>
          <span style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#FBBF24', border: '1px solid #FBBF24', padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
            Wave &amp; Orange Money Ready
          </span>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 900, lineHeight: 1.25, color: '#FFFFFF', margin: 0 }}>
          L&apos;Écosystème Digital Tout-en-Un <br />
          <span style={{ color: '#FF8C00' }}>
            Pour Acheter, Vendre &amp; Entreprendre au Sénégal
          </span>
        </h1>

        <p style={{ fontSize: 'clamp(14px, 2vw, 16px)', color: '#E2E8F0', maxWidth: 760, margin: '0 auto', lineHeight: 1.6 }}>
          Nopalou combine un <strong style={{ color: '#FF8C00' }}>Super-Comparateur de prix</strong>, un{' '}
          <strong style={{ color: '#FFF' }}>Logiciel de Caisse POS tactile avec Scan EAN-13 &amp; Carnet de Dettes</strong>, un{' '}
          <strong style={{ color: '#FFF' }}>Bot WhatsApp Meta Commerce</strong> et un <strong style={{ color: '#2DD4BF' }}>Programme Apporteur {tauxCommissionPourcent}% récurrent</strong>.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, paddingTop: 6 }}>
          <button
            type="button"
            onClick={onScrollToSimulator}
            style={{
              background: 'var(--accent)',
              color: '#FFFFFF',
              border: 'none',
              padding: '13px 26px',
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(199, 91, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Play size={16} fill="#fff" />
            <span>Tester le Bac à Sable Interactif</span>
          </button>

          <a
            href="/brochure-apporteur.pdf"
            target="_blank"
            download
            style={{
              background: '#FFFFFF',
              color: 'var(--navy)',
              border: 'none',
              padding: '13px 22px',
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none'
            }}
          >
            <Download size={16} />
            <span>Télécharger la Brochure PDF (13 p.)</span>
          </a>
        </div>
      </div>
    </section>
  )
}
