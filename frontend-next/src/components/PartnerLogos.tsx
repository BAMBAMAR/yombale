'use client'

import React from 'react'
import { useTranslation } from '@/i18n/context'

export interface PartnerLogosProps {
  className?: string;
}

const PARTNERS = [
  { name: 'Jumia Senegal' },
  { name: 'CoinAfrique' },
  { name: 'Expat-Dakar' },
  { name: 'Dakar-Deal' },
  { name: 'SenMarket' },
];

export default function PartnerLogos({ className = '' }: PartnerLogosProps) {
  const { t } = useTranslation()

  return (
    <div className={`partner-logos ${className}`}>
      <p className="partner-logos-titre">{t('common.trustedPartners')}</p>
      <div className="partner-logos-grid">
        {PARTNERS.map((p) => (
          <div key={p.name} className="partner-logo-item">
            <span className="partner-logo-name">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
