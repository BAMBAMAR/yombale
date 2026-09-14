'use client';

import { useReportWebVitals } from 'next/web-vitals';

export default function WebVitals() {
  useReportWebVitals((metric) => {
    // Ne pas polluer l'affichage de développement sauf si debug activé
    if (process.env.NODE_ENV === 'development') {
      // Optionnel: console.debug('[Web Vitals]', metric.name, metric.value);
    }

    try {
      const payload = JSON.stringify({
        id: metric.id,
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        navigationType: metric.navigationType,
        pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
      });

      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/vitals', payload);
      } else {
        fetch('/api/vitals', {
          body: payload,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Silencieux pour ne jamais impacter l'expérience utilisateur
    }
  });

  return null;
}
