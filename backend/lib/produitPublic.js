// AUD-142 : ce qu'une vitrine publique a le droit de montrer d'un produit de boutique.
// Le propriétaire et l'équipe voient toujours la fiche complète (caisse, catalogue, hors-ligne).
// Pour le public : plus de quantité exacte en stock (renseignement commercial pour un concurrent : on suit les ventes
// par différence), plus de motifs de modération, d'état de synchronisation WhatsApp, de code-barres ni de date de partage.
const CHAMPS_INTERNES = [
  'statut_moderation', 'motif_moderation', 'modere_le',
  'whatsapp_sync_statut', 'whatsapp_sync_erreur', 'partage_le', 'code_barre',
];

/** 0 = indisponible, 1 = disponible : même sémantique « > 0 » que l'ancienne quantité, sans la révéler. */
function drapeauDisponible(q) {
  return q === null || q === undefined ? q : (Number(q) > 0 ? 1 : 0);
}

function etatStock(quantite, enStock) {
  if (quantite === null || quantite === undefined) return enStock === false ? 'rupture' : 'disponible';
  const q = Number(quantite);
  if (q <= 0) return 'rupture';
  return q <= 5 ? 'faible' : 'disponible';
}

function versProduitPublic(p) {
  if (!p || typeof p !== 'object') return p;
  const out = { ...p };
  for (const k of CHAMPS_INTERNES) delete out[k];
  out.stock_etat = etatStock(p.stock_quantite, p.en_stock);
  out.stock_quantite = drapeauDisponible(p.stock_quantite);
  if (Array.isArray(p.variantes_skus)) {
    out.variantes_skus = p.variantes_skus.map((s) => {
      const { code_barre, ...reste } = s || {};
      return { ...reste, stock_quantite: drapeauDisponible(s && s.stock_quantite) };
    });
  }
  return out;
}

module.exports = { versProduitPublic, etatStock, CHAMPS_INTERNES };
