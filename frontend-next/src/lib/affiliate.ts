// frontend-next/src/lib/affiliate.ts
// Helpers pour construire URLs paramétriques d'affiliation
// Usage : const url = getAffiliateUrl(baseUrl, apporteurCode, geo)

export function getAffiliateUrl(
  baseUrl: string,
  options?: {
    affCode?: string;
    geo?: string;
    device?: string;
    utm_source?: string;
    utm_campaign?: string;
  }
): string {
  if (!baseUrl) return '';

  try {
    const url = new URL(baseUrl);
    const sp = url.searchParams;

    if (options?.affCode) sp.set('aff_id', options.affCode);
    if (options?.geo) sp.set('geo', options.geo);
    if (options?.device) sp.set('device', options.device || 'web');
    if (options?.utm_source) sp.set('utm_source', options.utm_source || 'nopalou');
    if (options?.utm_campaign) sp.set('utm_campaign', options.utm_campaign);

    return url.toString();
  } catch {
    return baseUrl;
  }
}

export function getGeoFromBrowser(): string {
  // TODO : appeler une API de géolocalisation IP (maxmind, etc.)
  // Pour l'instant, fallback 'SN'
  if (typeof navigator !== 'undefined' && 'language' in navigator) {
    const lang = navigator.language.toLowerCase();
    if (lang.includes('fr') || lang.includes('sn')) return 'SN';
    if (lang.includes('en')) return 'EN';
  }
  return 'SN';
}

export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}
