import React from 'react'
import Link from 'next/link'
import { ArrowRight, Zap } from 'lucide-react'

export default function MerchantCtaBanner() {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        borderRadius: 20,
        padding: '32px 24px',
        color: '#ffffff',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(15,23,42,0.15)',
        border: '1px solid rgba(255,255,255,0.1)',
        marginBottom: 20
      }}
    >
      <h3 style={{ fontSize: 'clamp(20px, 2.4vw, 26px)', fontWeight: 900, margin: '0 0 8px', color: '#ffffff' }}>
        Prêt à moderniser votre boutique dès aujourd&apos;hui ?
      </h3>
      <p style={{ fontSize: 13.5, margin: '0 auto 22px', maxWidth: 520, lineHeight: 1.5, color: '#CBD5E1' }}>
        Testez la Caisse POS gratuitement ou lancez votre boutique en ligne avec 30 jours offerts. Sans carte bancaire ni engagement.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link
          href="/creer-boutique"
          style={{
            padding: '12px 24px',
            borderRadius: 12,
            background: 'var(--accent, #C75B00)',
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 900,
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(199,91,0,0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span>Créer ma Boutique (30j offerts)</span>
          <ArrowRight size={15} />
        </Link>

        <Link
          href="/boutique/caisse"
          style={{
            padding: '12px 20px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.25)',
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 800,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Zap size={15} fill="#fff" />
          <span>Ouvrir la Caisse POS</span>
        </Link>
      </div>
    </div>
  )
}
