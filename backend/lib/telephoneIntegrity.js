// backend/lib/telephoneIntegrity.js
// AUD-052 : utilisateurs.telephone n'a aucune contrainte d'unicité en base et les requêtes de
// résolution OTP (WHERE telephone=$1 OR telephone=$2 OR ...) n'ont pas d'ORDER BY : si deux comptes
// partagent un numéro (ex. via PUT /profil, voir AUD-052/AUD-055), le compte authentifié dépend de
// l'ordre physique des tuples PostgreSQL, qui change à chaque UPDATE sur l'une des deux lignes.
// Ce module centralise la résolution "compte(s) correspondant à un numéro" et fait échouer
// explicitement (plutôt que de choisir au hasard) toute résolution ambiguë.

/**
 * Résout un ou plusieurs comptes utilisateurs correspondant à un numéro de téléphone, sous ses
 * variantes de format connues, de façon déterministe (ORDER BY id) et en signalant l'ambiguïté.
 * @param {import('pg').Pool} pool
 * @param {string} cleanPhone   ex: "221771234567"
 * @param {string} colonnes     colonnes SQL à sélectionner (ex: 'id, suspendu, supprime_le')
 * @returns {Promise<{rows: object[], ambigu: boolean}>}
 */
async function resolverComptesParTelephone(pool, cleanPhone, colonnes = 'id') {
  const withPlus = '+' + cleanPhone;
  const raw9Digits = cleanPhone.startsWith('221') ? cleanPhone.slice(3) : cleanPhone;
  const { rows } = await pool.query(
    `SELECT ${colonnes} FROM utilisateurs
     WHERE telephone=$1 OR telephone=$2 OR telephone=$3 OR REPLACE(telephone, '+', '')=$1
     ORDER BY id`,
    [cleanPhone, withPlus, raw9Digits]
  );
  return { rows, ambigu: rows.length > 1 };
}

/**
 * Vérifie qu'un numéro de téléphone donné n'appartient pas déjà à un AUTRE compte que celui fourni.
 * Utilisé par PUT /api/auth/profil avant d'accepter l'écriture (AUD-052/AUD-055 : un compte ne doit
 * jamais pouvoir revendiquer le numéro d'un autre compte existant sans preuve de possession).
 * @returns {Promise<boolean>} true si le numéro est libre (ou déjà à ce même compte)
 */
async function telephoneEstLibrePourCompte(pool, cleanPhone, userId) {
  if (!cleanPhone) return true;
  const { rows } = await resolverComptesParTelephone(pool, cleanPhone, 'id');
  return rows.every(r => String(r.id) === String(userId));
}

module.exports = { resolverComptesParTelephone, telephoneEstLibrePourCompte };
