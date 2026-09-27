'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/i18n/context';

export interface SocialProofProps {
  comparaisonsAujourdhui?: number;
  personnesFollowent?: number;
  boutiquesPartenaires?: number;
}

export default function SocialProof({
  comparaisonsAujourdhui,
  personnesFollowent,
  boutiquesPartenaires,
}: SocialProofProps) {
  const { t, locale } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Évite hydration mismatch
  // Interdiction de fabriquer des preuves sociales : ne rien afficher sans données réelles transmises
  if (!comparaisonsAujourdhui && !boutiquesPartenaires && !personnesFollowent) {
    return null;
  }

  const numberLocale = locale === 'ar' ? 'ar-EG-u-nu-arab' : locale === 'en' ? 'en-US' : 'fr-SN';

  return (
    <div className="social-proof-strip">
      {typeof comparaisonsAujourdhui === 'number' && (
        <div className="social-proof-item">
          <span className="social-proof-number">{comparaisonsAujourdhui.toLocaleString(numberLocale)}</span>
          <span className="social-proof-label">{t('common.todayComparisons')}</span>
        </div>
      )}
      {typeof comparaisonsAujourdhui === 'number' && typeof boutiquesPartenaires === 'number' && (
        <div className="social-proof-separator">·</div>
      )}
      {typeof boutiquesPartenaires === 'number' && (
        <div className="social-proof-item">
          <span className="social-proof-number">{boutiquesPartenaires.toLocaleString(numberLocale)}</span>
          <span className="social-proof-label">{t('common.partnerShops')}</span>
        </div>
      )}
      {typeof boutiquesPartenaires === 'number' && typeof personnesFollowent === 'number' && (
        <div className="social-proof-separator">·</div>
      )}
      {typeof personnesFollowent === 'number' && (
        <div className="social-proof-item">
          <span className="social-proof-number">{personnesFollowent.toLocaleString(numberLocale)}</span>
          <span className="social-proof-label">{t('common.activeUsers')}</span>
        </div>
      )}
    </div>
  );
}
