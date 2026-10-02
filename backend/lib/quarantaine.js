// backend/lib/quarantaine.js : AUD-180. Quarantaine des offres suspectes, enfin réversible.
// Constat à T0 (copie de production du 24/09/2026) : 723 offres en quarantaine (5,9 %), 786 lignes de journal toutes au
// statut `quarantined`, aucune revue ; 57 % des lignes étaient des BAISSES de prix (des promotions possibles) ; 331 offres
// re-scrapées dans la semaine restaient en quarantaine. La route de validation manuelle n'a jamais fonctionné
// (`UPDATE ... ORDER BY ... LIMIT` est une erreur de syntaxe PostgreSQL).
//
// Règles :
//  - une HAUSSE de plus de 50 % par rapport à la moyenne des 30 derniers jours reste suspecte ;
//  - une BAISSE de plus de 50 % n'est suspecte que si elle sort de ce qui est crédible : sous 35 % de la médiane des autres
//    offres du même produit, ou sous le plancher de prix de la catégorie ; sinon c'est une promotion plausible ;
//  - une offre en quarantaine est relâchée automatiquement quand elle a été re-scrapée depuis, que sa raison ne tient plus
//    et que son prix est confirmé (inchangé, relevé de nouveau au moins un jour après la quarantaine) ;
//  - toute décision (automatique ou manuelle) est journalisée dans quarantines_log (`released_auto`, `validated`, `rejected`).

const SEUIL_VARIATION = 0.5;
const RATIO_SOUS_MEDIANE = 0.35;

/** Raison de quarantaine d'une variation de prix, ou null si elle est plausible. Fonction pure. */
function raisonVariation({ prix, prixMoyen30j, medianeAutres, nbAutres = 0, plancher }) {
  prix = Number(prix); prixMoyen30j = Number(prixMoyen30j);
  if (!prix || !prixMoyen30j) return null;
  const variation = Math.abs(prix - prixMoyen30j) / prixMoyen30j;
  if (variation <= SEUIL_VARIATION) return null;
  const pct = Math.round(variation * 100);
  if (prix > prixMoyen30j) return `variation_hausse_${pct}pct`;
  if (nbAutres >= 1 && Number(medianeAutres) > 0 && prix < Number(medianeAutres) * RATIO_SOUS_MEDIANE) return `baisse_sous_mediane_autres_${pct}pct`;
  if (plancher && prix < plancher) return `baisse_sous_plancher_${pct}pct`;
  return null; // promotion plausible : l'offre reste visible
}

async function recalculerProduits(pool, produitIds) {
  if (!produitIds.length) return;
  await pool.query(
    `UPDATE produits p SET prix_min = sub.prix_min, nb_offres = sub.nb_offres
     FROM (
       SELECT p2.id,
              MIN(CASE WHEN o.stock = true AND o.quarantinee = false THEN o.prix END) AS prix_min,
              COUNT(CASE WHEN o.stock = true AND o.quarantinee = false THEN o.id END) AS nb_offres
       FROM produits p2 LEFT JOIN offres o ON o.produit_id = p2.id
       WHERE p2.id = ANY($1::uuid[]) GROUP BY p2.id
     ) sub WHERE p.id = sub.id`, [produitIds]);
}

/**
 * Relâche des offres (décision manuelle ou automatique) : remet `quarantinee` à false, journalise, recalcule les produits.
 * @param {{par?: string, statut?: 'validated'|'released_auto'|'rejected'}} opts `rejected` garde l'offre en quarantaine.
 */
async function relacherOffres(pool, offreIds, { par = 'admin', statut = 'validated' } = {}) {
  if (!offreIds.length) return { relachees: 0 };
  const garder = statut === 'rejected';
  await pool.query(
    `UPDATE quarantines_log SET status = $1, validated_by = $2, validated_at = NOW()
     WHERE status = 'quarantined' AND offre_id = ANY($3::uuid[])`, [statut, par, offreIds]);
  if (garder) return { relachees: 0 };
  const { rows } = await pool.query('UPDATE offres SET quarantinee = false WHERE id = ANY($1::uuid[]) RETURNING produit_id', [offreIds]);
  await recalculerProduits(pool, [...new Set(rows.map((r) => r.produit_id).filter(Boolean))]);
  return { relachees: rows.length };
}

/**
 * Parcourt les offres en quarantaine et relâche celles dont la raison ne tient plus et dont le prix est confirmé.
 * `plancherDe(titre)` : plancher de prix de la catégorie (prixPlancher de scraper.js), injecté pour éviter une dépendance circulaire.
 */
async function reevaluerQuarantaines(pool, { plancherDe = () => null } = {}) {
  const { rows } = await pool.query(`
    SELECT o.id, o.produit_id, o.prix, COALESCE(o.titre_marchand, p.nom) AS titre,
           COALESCE((SELECT AVG(h.prix) FROM historique_prix h WHERE h.offre_id = o.id AND h.date > NOW() - INTERVAL '30 days'), o.prix) AS prix_moyen_30j,
           (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o2.prix) FROM offres o2
              WHERE o2.produit_id = o.produit_id AND o2.id <> o.id AND o2.stock AND NOT o2.quarantinee) AS mediane_autres,
           (SELECT COUNT(*) FROM offres o2 WHERE o2.produit_id = o.produit_id AND o2.id <> o.id AND o2.stock AND NOT o2.quarantinee)::int AS nb_autres,
           l.prix AS prix_quarantaine, l.created_at AS date_quarantaine, o.scraped_at
    FROM offres o
    JOIN produits p ON p.id = o.produit_id
    JOIN LATERAL (SELECT prix, created_at FROM quarantines_log WHERE offre_id = o.id AND status = 'quarantined' ORDER BY created_at DESC LIMIT 1) l ON true
    WHERE o.quarantinee = true AND o.stock = true AND o.scraped_at > l.created_at`);

  const aRelacher = [];
  for (const r of rows) {
    // prix confirmé : inchangé depuis la quarantaine et relevé de nouveau au moins un jour après celle-ci
    // (l'historique n'enregistre plus un relevé identique : on ne peut pas compter deux lignes égales)
    const confirme = Number(r.prix) === Number(r.prix_quarantaine) && new Date(r.scraped_at) - new Date(r.date_quarantaine) >= 24 * 3600 * 1000;
    if (!confirme) continue;
    const raison = raisonVariation({ prix: r.prix, prixMoyen30j: r.prix_moyen_30j, medianeAutres: r.mediane_autres, nbAutres: r.nb_autres, plancher: plancherDe(r.titre) });
    if (raison === null) aRelacher.push(r.id);
  }
  const res = await relacherOffres(pool, aRelacher, { par: 'systeme', statut: 'released_auto' });
  return { examinees: rows.length, relachees: res.relachees };
}

module.exports = { raisonVariation, relacherOffres, reevaluerQuarantaines, recalculerProduits, SEUIL_VARIATION, RATIO_SOUS_MEDIANE };
