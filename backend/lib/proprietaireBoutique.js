// AUD-214 : propriétaire d'une boutique créée par l'assistant « Taf Taf ».
// Un utilisateur DÉJÀ connecté (e-mail ou autre) crée sa boutique sur SON compte : on ne retrouve plus le propriétaire par
// le seul téléphone, et on ne remplace pas sa session. Le numéro doit toujours avoir été prouvé (OTP) par l'appelant.
const { resolverComptesParTelephone } = require('./telephoneIntegrity');

/**
 * @returns {Promise<{ user: object } | { status: number, error: string, code?: string }>}
 */
async function proprietaireDepuisSession(pool, sessionUserId, telephone, cleanPhone) {
  const { rows, ambigu } = await resolverComptesParTelephone(pool, cleanPhone, 'id');
  if (ambigu) {
    return { status: 409, error: 'Plusieurs comptes sont associés à ce numéro. Contactez le support Nopalou.' };
  }
  // Le numéro appartient à un AUTRE compte : on refuse au lieu de créer silencieusement une boutique chez un tiers
  if (rows.some((r) => String(r.id) !== String(sessionUserId))) {
    return {
      status: 409,
      code: 'TELEPHONE_AUTRE_COMPTE',
      error: 'Ce numéro est déjà lié à un autre compte Nopalou. Connectez-vous avec ce compte ou utilisez un autre numéro.',
    };
  }

  const cur = await pool.query(
    `SELECT id, nom, email, code_apporteur, suspendu, supprime_le, anonymise_le, telephone,
            COALESCE(jwt_version, 1) AS jwt_version
     FROM utilisateurs WHERE id = $1`,
    [sessionUserId]
  );
  const user = cur.rows[0];
  if (!user) return { status: 401, error: 'Session invalide. Reconnectez-vous puis réessayez.' };
  if (user.suspendu) return { status: 403, error: 'Ce compte est suspendu.' };
  if (user.anonymise_le) return { status: 403, error: 'Ce compte a été définitivement supprimé.' };

  // Le numéro vérifié rejoint le profil s'il n'en avait pas : la connexion par numéro retrouvera ce même compte
  if (!user.telephone) {
    await pool.query('UPDATE utilisateurs SET telephone = $1 WHERE id = $2', [telephone, user.id]);
  }
  return { user };
}

module.exports = { proprietaireDepuisSession };
