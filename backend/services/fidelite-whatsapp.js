// backend/services/fidelite-whatsapp.js
// Automatisation Fidélité WhatsApp Nopalou (Audit 94+/100)
// Détecte le 5ème achat client -> Génère un coupon de 10% -> Envoie automatiquement via WhatsApp

const { pool } = require('../models/db');
const { sendWhatsAppText, normalisePhone, estDesinscrit } = require('./whatsapp');

/**
 * Génère une chaîne aléatoire courte pour le code promo
 */
function genererCodeCourt(longueur = 4) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = '';
  for (let i = 0; i < longueur; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

/**
 * Traite la fidélité d'un client après une commande ou vente POS finalisée
 * @param {string} boutiqueId - ID UUID de la boutique
 * @param {Object} options
 * @param {string} options.telephone - Téléphone du client
 * @param {string} [options.nom] - Nom du client
 * @param {number} [options.montant=0] - Montant de la vente
 * @param {string} [options.referenceVente] - Numéro de commande ou reçu
 */
async function traiterFideliteApresVente(boutiqueId, { telephone, nom = 'Cher(e) client(e)', montant = 0, referenceVente = '' }) {
  if (!boutiqueId || !telephone) return null;

  const telNorm = normalisePhone(telephone);
  if (!telNorm || telNorm.length < 9) return null;

  try {
    // 1. Récupérer les informations de la boutique (nom, statut fidélité)
    const bqRes = await pool.query(
      `SELECT id, nom, slug, COALESCE(fidelite_actif, true) AS fidelite_actif
       FROM boutiques WHERE id = $1`,
      [boutiqueId]
    );
    if (!bqRes.rows.length) return null;
    const boutique = bqRes.rows[0];

    // Si la fidélité est désactivée par le marchand
    if (!boutique.fidelite_actif) return null;

    // 2. Mettre à jour ou insérer le client dans boutique_clients_fidelite
    const clientRes = await pool.query(
      `INSERT INTO boutique_clients_fidelite (
        boutique_id, telephone, nom, nb_visites, total_depense, derniere_visite, updated_at
      ) VALUES ($1, $2, $3, 1, $4, NOW(), NOW())
      ON CONFLICT (boutique_id, telephone)
      DO UPDATE SET
        nb_visites = boutique_clients_fidelite.nb_visites + 1,
        total_depense = boutique_clients_fidelite.total_depense + $4,
        derniere_visite = NOW(),
        updated_at = NOW(),
        nom = CASE WHEN EXCLUDED.nom != 'Cher(e) client(e)' THEN EXCLUDED.nom ELSE boutique_clients_fidelite.nom END
      RETURNING id, nom, telephone, nb_visites, total_depense`,
      [boutiqueId, telNorm, nom, Math.max(0, Number(montant) || 0)]
    );

    const clientFidelite = clientRes.rows[0];
    const nbVisites = Number(clientFidelite.nb_visites || 1);

    // 3. Vérifier si c'est un palier de fidélité (5ème achat, 10ème, 15ème...)
    const estPalierFidelite = (nbVisites % 5 === 0);

    if (estPalierFidelite) {
      console.log(`[FIDÉLITÉ WHATSAPP] 🎁 Palier atteint (${nbVisites} commandes) pour ${telNorm} chez "${boutique.nom}"`);

      // Générer un code promo unique de -10% valable 30 jours
      const suffixe = genererCodeCourt(4);
      const codePromo = `FID${nbVisites}-${suffixe}`;
      const dateExpiration = new Date(Date.now() + 30 * 24 * 3600 * 1000); // 30 jours

      try {
        await pool.query(
          `INSERT INTO boutique_promotions (
            boutique_id, code, type_remise, valeur, min_achat, debut, fin, actif, created_at
          ) VALUES ($1, $2, 'pourcentage', 10, 0, NOW(), $3, true, NOW())
          ON CONFLICT DO NOTHING`,
          [boutiqueId, codePromo, dateExpiration]
        );
      } catch (errPromo) {
        console.warn('[FIDÉLITÉ WHATSAPP] Erreur insertion promotion:', errPromo.message);
      }

      // Enregistrer le mouvement dans l'historique
      try {
        await pool.query(
          `INSERT INTO boutique_fidelite_mouvements (
            boutique_id, client_fidelite_id, vente_reference, type_mouvement, valeur_fcfa, description, created_at
          ) VALUES ($1, $2, $3, 'coupon_5eme_achat', 10, $4, NOW())`,
          [boutiqueId, clientFidelite.id, referenceVente, `Bon de fidélité 10% attribué au ${nbVisites}ème achat (${codePromo})`]
        );
      } catch (errMouv) {
        console.warn('[FIDÉLITÉ WHATSAPP] Erreur mouvement fidélité:', errMouv.message);
      }

      // Vérifier si le client n'est pas désinscrit
      const optout = await estDesinscrit(telNorm);
      if (!optout) {
        const prenom = (clientFidelite.nom && clientFidelite.nom !== 'Cher(e) client(e)')
          ? clientFidelite.nom.split(' ')[0]
          : 'Cher(e) client(e)';

        const messageFidelite = 
`🎉 *Jërejëf ${prenom} pour votre fidélité !*

C'est votre *${nbVisites}ème commande* chez *${boutique.nom}* ! 👏

Pour vous remercier, nous vous offrons une remise immédiate exclusive de *-10%* sur votre prochain achat :

🏷️ Votre Code Promo : *${codePromo}*
⏳ Valable pendant 30 jours sur notre boutique :
🔗 https://nopalou.com/b/${boutique.slug || boutique.id}

Nopalou vous remercie de votre confiance ! 🌟`;

        await sendWhatsAppText(telNorm, messageFidelite).catch(err => {
          console.warn('[FIDÉLITÉ WHATSAPP] Échec envoi WhatsApp:', err.message);
        });
      }

      return {
        succes: true,
        palierAtteint: true,
        nbVisites,
        codePromo,
        client: clientFidelite
      };
    }

    return {
      succes: true,
      palierAtteint: false,
      nbVisites,
      client: clientFidelite
    };

  } catch (errGlobal) {
    console.error('[FIDÉLITÉ WHATSAPP] Erreur traitement:', errGlobal);
    return null;
  }
}

/**
 * Vérifie l'éligibilité et l'état de fidélité d'un client
 */
async function verifierEligibiliteFidelite(boutiqueId, telephone) {
  if (!boutiqueId || !telephone) return null;
  const telNorm = normalisePhone(telephone);
  try {
    const res = await pool.query(
      `SELECT * FROM boutique_clients_fidelite WHERE boutique_id = $1 AND telephone = $2`,
      [boutiqueId, telNorm]
    );
    return res.rows[0] || null;
  } catch (err) {
    console.error('[FIDÉLITÉ WHATSAPP] Erreur verif eligibilite:', err);
    return null;
  }
}

module.exports = {
  traiterFideliteApresVente,
  verifierEligibiliteFidelite
};
