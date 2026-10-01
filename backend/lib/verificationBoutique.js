// AUD-140 : le badge « Vendeur Vérifié » repose sur des faits, plus sur l'affichage inconditionnel.
// Attribué automatiquement quand la boutique réunit :
//   1. un abonnement payant actif (Pro ou Business) issu d'un encaissement réel (abmt_), souscrit depuis au moins 30 jours
//      (les essais, les attributions de l'admin et les abonnements de test ne comptent pas) ;
//   2. au moins 20 commandes web livrées à un tiers (hors ventes POS, hors commandes de test, hors commandes passées
//      avec le numéro du marchand lui-même) ;
//   3. aucun signalement ouvert contre la boutique.
// L'administrateur garde la main : `verification_mode` = 'admin_oui' (certifiée) ou 'admin_non' (badge retiré) l'emporte
// sur le calcul ; 'auto' laisse le calcul décider. Une boutique qui ne remplit plus les critères perd son badge.
const { pool } = require('../models/db');
const { PAYANT } = require('./abonnementsSql');

const SEUIL_COMMANDES = 20;
const ANCIENNETE_JOURS = 30;
const MODES = ['auto', 'admin_oui', 'admin_non'];

const tel9 = (expr) => `RIGHT(REGEXP_REPLACE(COALESCE(${expr}, ''), '[^0-9]', '', 'g'), 9)`;
const tel9ou = (expr) => `COALESCE(NULLIF(${tel9(expr)}, ''), '#')`;

const CRITERES_AUTO_SQL = `
  EXISTS (
    SELECT 1 FROM abonnements a
    WHERE a.utilisateur_id = b.utilisateur_id AND a.statut = 'actif' AND a.fin > NOW()
      AND a.plan IN ('pro', 'business') AND a.${PAYANT}
  )
  AND (
    SELECT MIN(a2.created_at) FROM abonnements a2
    WHERE a2.utilisateur_id = b.utilisateur_id AND a2.${PAYANT}
  ) <= NOW() - INTERVAL '${ANCIENNETE_JOURS} days'
  AND (
    SELECT COUNT(DISTINCT COALESCE(c.groupe_commande::text, c.id::text))
    FROM commandes_boutique c
    WHERE c.boutique_id = b.id AND c.statut = 'livree'
      AND COALESCE(c.source, '') NOT ILIKE '%test%'
      AND COALESCE(c.client_nom, '') !~* 'test'
      AND ${tel9('c.client_telephone')} NOT IN (${tel9ou('uo.telephone')}, ${tel9ou('b.telephone')}, ${tel9ou('b.whatsapp')})
  ) >= ${SEUIL_COMMANDES}
  AND NOT EXISTS (
    SELECT 1 FROM signalements s
    WHERE LOWER(COALESCE(s.type_cible, '')) = 'boutique' AND s.cible_id::text = b.id::text
      AND COALESCE(s.statut, '') NOT IN ('traite', 'rejete')
  )`;

/**
 * Recalcule `statut_verification` d'une boutique (id) ou de toutes (null). Idempotent.
 * @returns {Promise<Array<{id: string, statut: string}>>} boutiques dont le statut a changé
 */
async function recalculerVerification(boutiqueId = null) {
  const { rows } = await pool.query(
    `WITH calc AS (
       SELECT b.id,
              CASE b.verification_mode
                WHEN 'admin_oui' THEN 'certifie'
                WHEN 'admin_non' THEN 'non_verifie'
                ELSE CASE WHEN ${CRITERES_AUTO_SQL} THEN 'verifie' ELSE 'non_verifie' END
              END AS nouveau
       FROM boutiques b
       LEFT JOIN utilisateurs uo ON uo.id = b.utilisateur_id
       WHERE ($1::uuid IS NULL OR b.id = $1::uuid)
     )
     UPDATE boutiques b
        SET statut_verification = c.nouveau,
            verifie_le = CASE WHEN c.nouveau = 'non_verifie' THEN NULL
                              WHEN b.statut_verification = 'non_verifie' THEN NOW()
                              ELSE b.verifie_le END
       FROM calc c
      WHERE b.id = c.id AND b.statut_verification IS DISTINCT FROM c.nouveau
      RETURNING b.id, c.nouveau AS statut`,
    [boutiqueId]
  );
  return rows;
}

module.exports = { recalculerVerification, MODES, SEUIL_COMMANDES, ANCIENNETE_JOURS };
