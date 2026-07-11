// backend/lib/affiliate-params.js
// Générateur URLs paramétriques pour l'affiliation
// Usage : const url = affiliateUrl(baseUrl, { aff_id, geo, utm_source, ... })

function affiliateUrl(baseUrl, params = {}) {
  try {
    const url = new URL(baseUrl);
    const searchParams = url.searchParams;

    // Paramètres affiliation standards
    if (params.aff_id) searchParams.set('aff_id', params.aff_id);
    if (params.geo) searchParams.set('geo', params.geo);
    if (params.device) searchParams.set('device', params.device);
    if (params.utm_source) searchParams.set('utm_source', params.utm_source || 'nopalou');
    if (params.utm_campaign) searchParams.set('utm_campaign', params.utm_campaign);
    if (params.utm_medium) searchParams.set('utm_medium', params.utm_medium || 'affiliate');

    // Référence de clic interne Nopalou (pour tracking post-clic)
    if (params.click_ref) searchParams.set('click_ref', params.click_ref);

    return url.toString();
  } catch (err) {
    console.error('[affiliateUrl] ❌', err.message);
    return baseUrl; // Fallback URL brute
  }
}

function buildAffiliateParams({ boutique, apporteur, geo = 'SN', device = 'web' }) {
  return {
    aff_id: apporteur?.code_apporteur || null,
    geo,
    device,
    utm_source: 'nopalou',
    utm_medium: 'affiliate',
    utm_campaign: apporteur?.id ? `apporteur_${apporteur.id}` : null,
  };
}

module.exports = { affiliateUrl, buildAffiliateParams };
