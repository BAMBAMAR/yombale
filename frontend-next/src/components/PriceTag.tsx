'use client'

import React from 'react';
import { useTranslation } from '@/i18n/context';

export interface PriceTagProps {
  price: number;
  currency?: string;
  verified?: boolean;
  timestamp?: string;
  className?: string;
}

export default function PriceTag({
  price,
  currency = 'FCFA',
  verified = false,
  timestamp,
  className = ''
}: PriceTagProps) {
  const { t, locale } = useTranslation();
  const numberLocale = locale === 'ar' ? 'ar-EG' : locale === 'en' ? 'en-US' : 'fr-SN';

  return (
    <div className={`price-tag ${className}`}>
      <span className="price-tag-value" style={{ fontFamily: 'var(--font-ibm-plex-mono, monospace)' }}>
        {price.toLocaleString(numberLocale)} {currency}
      </span>
      {verified && <span className="badge-verified">✓ {t('common.verified')}</span>}
      {timestamp && <span className="price-tag-timestamp">{timestamp}</span>}
    </div>
  );
}
