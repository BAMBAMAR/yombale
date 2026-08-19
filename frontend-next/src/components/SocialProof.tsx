'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/i18n/context';

export interface SocialProofProps {
  comparaisonsAujourdhui?: number;
  personnesFollowent?: number;
  boutiquesPartenaires?: number;
}

export default function SocialProof({
  comparaisonsAujourdhui = 2847,
  personnesFollowent = 1543,
  boutiquesPartenaires = 89,
}: SocialProofProps) {
  const { t, locale } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Optionnel : rafraîchir les compteurs toutes les 5 min
    const interval = setInterval(() => {
      // TODO: fetch /api/stats/public pour les vrais chiffres
      setMounted(true);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null; // Évite hydration mismatch

  const numberLocale = locale === 'ar' ? 'ar-EG' : locale === 'en' ? 'en-US' : 'fr-SN';

  return (
    <div className="social-proof-strip">
      <div className="social-proof-item">
        <span className="social-proof-number">{comparaisonsAujourdhui.toLocaleString(numberLocale)}</span>
        <span className="social-proof-label">{t('common.todayComparisons')}</span>
      </div>
      <div className="social-proof-separator">·</div>
      <div className="social-proof-item">
        <span className="social-proof-number">{boutiquesPartenaires}</span>
        <span className="social-proof-label">{t('common.partnerShops')}</span>
      </div>
      <div className="social-proof-separator">·</div>
      <div className="social-proof-item">
        <span className="social-proof-number">{personnesFollowent.toLocaleString(numberLocale)}</span>
        <span className="social-proof-label">{t('common.activeUsers')}</span>
      </div>
    </div>
  );
}
