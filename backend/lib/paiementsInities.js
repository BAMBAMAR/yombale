// backend/lib/paiementsInities.js
// AUD-120 : trace des paiements initiés. Avant, rien n'était écrit tant que le paiement n'aboutissait pas :
// l'abandon au paiement était invisible et aucune relance n'était possible. Ces fonctions ne lèvent jamais
// d'exception : un échec de traçage ne doit jamais bloquer un paiement.

async function enregistrerInitiation(pool, { reference, utilisateurId = null, type = 'abonnement', plan = null, montant = null, methode = 'wave', statut = 'initie' }) {
  try {
    await pool.query(
      `INSERT INTO paiements_inities (reference, utilisateur_id, type, plan, montant, methode, statut)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (reference) DO NOTHING`,
      [reference, utilisateurId, type, plan, montant, methode, statut]
    );
  } catch (e) {
    console.warn('[PAIEMENTS INITIES] enregistrement ignoré:', e.message);
  }
}

async function marquerPaye(pool, reference) {
  try {
    await pool.query(
      `UPDATE paiements_inities SET statut = 'paye', paye_le = NOW() WHERE reference = $1 AND statut <> 'paye'`,
      [reference]
    );
  } catch (e) {
    console.warn('[PAIEMENTS INITIES] marquage payé ignoré:', e.message);
  }
}

module.exports = { enregistrerInitiation, marquerPaye };
