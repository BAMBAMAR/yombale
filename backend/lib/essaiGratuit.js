// backend/lib/essaiGratuit.js
// AUD-109 : un seul essai gratuit par utilisateur, et jamais d'annulation d'un abonnement payant.
// Avant : chaque création de boutique annulait tout abonnement actif puis recréait un essai.

/**
 * Démarre l'essai gratuit uniquement si l'utilisateur n'a jamais eu d'essai ni d'abonnement actif.
 * @returns {Promise<{ cree: boolean, raison?: string }>}
 */
async function demarrerEssaiSiPremiereFois(pool, { userId, plan, prix, jours }) {
  const { rows } = await pool.query(
    `SELECT
       EXISTS (SELECT 1 FROM abonnements WHERE utilisateur_id = $1 AND is_trial = TRUE) AS a_deja_eu_essai,
       EXISTS (SELECT 1 FROM abonnements WHERE utilisateur_id = $1 AND statut = 'actif' AND fin > NOW()) AS a_abonnement_actif`,
    [userId]
  );
  if (rows[0].a_deja_eu_essai) return { cree: false, raison: 'essai_deja_utilise' };
  if (rows[0].a_abonnement_actif) return { cree: false, raison: 'abonnement_actif' };

  await pool.query(
    `INSERT INTO abonnements (utilisateur_id, plan, statut, prix_mensuel, fin, is_trial)
     VALUES ($1, $2, 'actif', $3, NOW() + INTERVAL '1 day' * $4, TRUE)`,
    [userId, plan, prix, jours]
  );
  return { cree: true };
}

module.exports = { demarrerEssaiSiPremiereFois };
