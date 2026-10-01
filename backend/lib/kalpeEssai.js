// backend/lib/kalpeEssai.js
// Sama Xaalis : durée d'accès accordée à l'activation = réglage admin `kalpe_essai_jours` (plus de 365 jours en dur).
// Un compte déjà activé garde sa date de fin : réactiver ne prolonge jamais l'essai (un seul essai par utilisateur).

const ESSAI_DEFAUT = 30;

/** Durée d'essai valide (1 à 365 jours) ; repli sur 30 si le réglage est absent ou invalide. */
function dureeEssaiKalpe(valeur) {
  const n = Math.round(Number(valeur));
  return Number.isFinite(n) && n >= 1 && n <= 365 ? n : ESSAI_DEFAUT;
}

/** Crée l'abonnement d'essai, ou renvoie l'existant sans en modifier la date de fin. */
async function activerKalpe(pool, userId, jours) {
  const { rows } = await pool.query(
    `INSERT INTO kalpe_abonnements (utilisateur_id, statut, type_acces, is_trial, debut, fin)
     VALUES ($1, 'actif', 'standard', true, NOW(), NOW() + ($2 || ' days')::interval)
     ON CONFLICT (utilisateur_id) DO UPDATE SET
       statut = 'actif',
       updated_at = NOW()
     RETURNING *`,
    [userId, String(dureeEssaiKalpe(jours))]
  );
  return rows[0];
}

module.exports = { dureeEssaiKalpe, activerKalpe, ESSAI_DEFAUT };
