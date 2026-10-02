// backend/lib/urlAchat.js : AUD-193. Normalise l'URL d'achat à l'insertion d'une offre.
// À T0 : 345 offres avaient une URL contenant une requête (paramètres de suivi `?utm_source=...`), et un re-scrape avec un autre
// paramètre de suivi remplaçait l'URL d'origine par la variante polluée. On retire UNIQUEMENT les paramètres de suivi connus et le
// fragment ; tout autre paramètre (`?p=123`, `?id=...`) peut identifier la fiche chez le marchand et reste intact.

const PARAMETRES_SUIVI = /^(?:utm_[a-z_]+|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|igshid|_ga|_gl|ref_src|ref_url|yclid|pos|cur_pos|ads_per_page|ads_count|lid|indexPosition)$/i;
// pos, cur_pos, ads_per_page, ads_count, lid, indexPosition : position de la carte dans la liste de résultats (constaté sur la copie T0,
// URL de type `?page=3&pos=20&cur_pos=20&ads_per_page=21&ads_count=2038&lid=...`). `page` reste conservé : il peut identifier une fiche.

function normaliserUrlAchat(url) {
  if (!url || typeof url !== 'string') return null;
  const brut = url.trim();
  if (!brut) return null;
  try {
    const u = new URL(brut);
    for (const cle of [...u.searchParams.keys()]) if (PARAMETRES_SUIVI.test(cle)) u.searchParams.delete(cle);
    u.hash = '';
    return u.toString();
  } catch (_) {
    return brut; // URL relative ou illisible : inchangée (l'appelant la rejette si elle ne commence pas par http)
  }
}

module.exports = { normaliserUrlAchat };
