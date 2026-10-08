// backend/lib/telephoneIntegrity.js
// AUD-052 : utilisateurs.telephone n'a aucune contrainte d'unicité en base et les requêtes de
// résolution OTP (WHERE telephone=$1 OR telephone=$2 OR ...) n'ont pas d'ORDER BY : si deux comptes
// partagent un numéro (ex. via PUT /profil, voir AUD-052/AUD-055), le compte authentifié dépend de
// l'ordre physique des tuples PostgreSQL, qui change à chaque UPDATE sur l'une des deux lignes.
// Ce module centralise la résolution "compte(s) correspondant à un numéro" et fait échouer
// explicitement (plutôt que de choisir au hasard) toute résolution ambiguë.
//
// SRG-A1-004 : la résolution comparait des écritures (« 771234567 », « +221771234567 », « 221771234567 »),
// pas des numéros. Un compte pouvait donc déclarer le numéro d'un autre sous une autre écriture ; le
// titulaire recevait ensuite « Plusieurs comptes sont associés à ce numéro » à sa demande de code.
// La comparaison se fait désormais sur une forme canonique, la même ici et dans l'index unique de la base.

/**
 * Forme canonique d'un numéro : ses chiffres au format international, sans « + ».
 * - écrit avec « + » : ses chiffres, tels quels (numéro de tout pays) ;
 * - écrit sans « + » : le préfixe « 00 » est retiré ; un numéro de neuf chiffres est un numéro sénégalais
 *   écrit sans indicatif et reçoit « 221 » (même règle que normalisePhone, utilisée par les codes WhatsApp).
 * Doit rester strictement équivalente à SQL_TEL_CANONIQUE.
 * @param {string|number|null|undefined} saisie
 * @returns {string} chiffres canoniques, ou chaîne vide
 */
function chiffresCanoniques(saisie) {
  if (saisie === null || saisie === undefined) return '';
  const brut = String(saisie);
  let chiffres = brut.replace(/\D/g, '');
  if (/^\s*\+/.test(brut)) return chiffres;
  chiffres = chiffres.replace(/^00/, '');
  return chiffres.length === 9 ? '221' + chiffres : chiffres;
}

// La même règle pour PostgreSQL, appliquée à la colonne « telephone ». Expression immuable : elle sert à
// l'index unique posé par migrate-inline.js.
const SQL_TEL_CHIFFRES = `regexp_replace(regexp_replace(telephone, '\\D', '', 'g'), '^00', '')`;
const SQL_TEL_CANONIQUE = `(CASE
  WHEN telephone ~ '^\\s*\\+' THEN regexp_replace(telephone, '\\D', '', 'g')
  WHEN length(${SQL_TEL_CHIFFRES}) = 9 THEN '221' || ${SQL_TEL_CHIFFRES}
  ELSE ${SQL_TEL_CHIFFRES}
END)`;

/**
 * Numéro à enregistrer sur un compte : format international avec « + » (numéros de tout pays).
 * @returns {string|null} « +221771234567 », ou null si la saisie n'est pas un numéro exploitable
 *   (trop court, trop long, ou numéro local d'un autre pays écrit sans indicatif : « 0612345678 »).
 */
function normaliserTelephoneCompte(saisie) {
  const chiffres = chiffresCanoniques(saisie);
  if (chiffres.length < 8 || chiffres.length > 15 || chiffres.startsWith('0')) return null;
  return '+' + chiffres;
}

/**
 * Résout le ou les comptes correspondant à un numéro, quelle que soit son écriture, de façon
 * déterministe (ORDER BY id) et en signalant l'ambiguïté.
 * Un compte actif prime sur un compte en cours de suppression : celui-ci garde son numéro pendant son
 * délai de grâce, mais ne rend pas ambigu le compte actif qui le porterait aussi (données antérieures à l'index).
 * @param {import('pg').Pool} pool
 * @param {string} telephone    toute écriture du numéro
 * @param {string} colonnes     colonnes SQL à sélectionner (ex: 'id, suspendu, supprime_le')
 * @returns {Promise<{rows: object[], ambigu: boolean}>}
 */
async function resolverComptesParTelephone(pool, telephone, colonnes = 'id') {
  const chiffres = chiffresCanoniques(telephone);
  if (chiffres.length < 8) return { rows: [], ambigu: false };
  const { rows: toutes } = await pool.query(
    `SELECT ${colonnes}, (supprime_le IS NULL) AS _compte_actif FROM utilisateurs
     WHERE telephone IS NOT NULL AND ${SQL_TEL_CANONIQUE} = $1
     ORDER BY id`,
    [chiffres]
  );
  const actifs = toutes.filter((r) => r._compte_actif);
  const rows = (actifs.length ? actifs : toutes).map(({ _compte_actif, ...reste }) => reste);
  return { rows, ambigu: rows.length > 1 };
}

/**
 * Vérifie qu'un numéro de téléphone donné n'appartient pas déjà à un AUTRE compte que celui fourni.
 * Utilisé à l'inscription et par PUT /api/auth/profil avant d'accepter l'écriture (AUD-052/AUD-055 : un
 * compte ne doit jamais pouvoir revendiquer le numéro d'un autre compte existant sans preuve de possession).
 * Un compte en cours de suppression garde son numéro : il peut encore annuler sa demande.
 * @returns {Promise<boolean>} true si le numéro est libre (ou déjà à ce même compte)
 */
async function telephoneEstLibrePourCompte(pool, telephone, userId) {
  const chiffres = chiffresCanoniques(telephone);
  if (!chiffres) return true;
  const { rows } = await pool.query(
    `SELECT id FROM utilisateurs WHERE telephone IS NOT NULL AND ${SQL_TEL_CANONIQUE} = $1`,
    [chiffres]
  );
  return rows.every(r => String(r.id) === String(userId));
}

module.exports = {
  resolverComptesParTelephone,
  telephoneEstLibrePourCompte,
  normaliserTelephoneCompte,
  chiffresCanoniques,
  SQL_TEL_CANONIQUE,
};
