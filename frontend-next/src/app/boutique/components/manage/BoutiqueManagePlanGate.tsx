'use client'

import React from 'react'
import { Lock } from 'lucide-react'

interface BoutiqueManagePlanGateProps {
  minPlan?: 'pro' | 'business'
  t: (key: string, params?: any) => string
}

export default function BoutiqueManagePlanGate({
  minPlan = 'pro',
  t,
}: BoutiqueManagePlanGateProps) {
  const planLabel = minPlan === 'business' ? 'Business' : 'Pro'

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl, 16px)',
        padding: '40px 24px',
        textAlign: 'center',
        maxWidth: 560,
        margin: '40px auto',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'var(--orange2)',
          color: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}
      >
        <Lock size={32} />
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy)', margin: '0 0 8px' }}>
        {t('shop.featureLockedTitle', { plan: planLabel })}
      </h3>
      <p style={{ color: 'var(--text-subtle)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
        {t('shop.featureLockedDesc')}
      </p>
      <a
        href="/boutique/abonnement"
        className="btn-npl btn-npl-primary btn-npl-lg"
        style={{
          display: 'inline-flex',
          background: minPlan === 'business' ? 'var(--navy)' : 'var(--accent)',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: 12,
          fontWeight: 800,
          textDecoration: 'none',
          boxShadow: '0 4px 14px rgba(199,91,0,0.25)',
        }}
      >
        {t('shop.upgradePlanBtn')}
      </a>
    </div>
  )
}
