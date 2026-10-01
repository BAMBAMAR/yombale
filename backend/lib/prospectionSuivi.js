// backend/lib/prospectionSuivi.js
// AUD-112 : suivi des liens et traçabilité de ce qui est réellement envoyé en prospection.

/**
 * Ajoute les paramètres de suivi à un chemin de bouton de gabarit (suffixe dynamique d'URL).
 * Aucun paramètre n'est ajouté si le chemin en contient déjà.
 */
function ajouterSuiviUtm(chemin, { campagneId = null, leadId = null } = {}) {
  if (!chemin || typeof chemin !== 'string' || /utm_source=/.test(chemin)) return chemin;
  const params = new URLSearchParams({ utm_source: 'prospection', utm_medium: 'whatsapp' });
  params.set('utm_campaign', campagneId ? String(campagneId).slice(0, 8) : 'sans_campagne');
  if (leadId) params.set('l', String(leadId).replace(/-/g, '').slice(0, 8));
  return `${chemin}${chemin.includes('?') ? '&' : '?'}${params.toString()}`;
}

/** Texte réellement remis au destinataire par un gabarit Meta à deux paramètres (et non le gabarit libre). */
function contenuGabaritEnvoye({ features, googleProof } = {}) {
  return [features, googleProof].filter(Boolean).join('\n');
}

module.exports = { ajouterSuiviUtm, contenuGabaritEnvoye };
