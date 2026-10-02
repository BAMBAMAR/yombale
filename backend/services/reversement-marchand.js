// backend/services/reversement-marchand.js
// Reversement Wave Payout automatique vers le marchand à la livraison d'une commande.
// Point d'entrée unique appelé par tous les chemins qui passent une commande en "livree"
// (espace marchand web, bot WhatsApp marchand, admin, déblocage Pay Safe).

const crypto = require('crypto');
const { pool } = require('../models/db');

const PAYOUT_AUTO_EN_COURS = 'auto_en_cours';

/**
 * Clé d'idempotence Wave stable par commande (format UUID v4).
 * Deux appels pour la même commande envoient la même clé : Wave renvoie le payout
 * existant au lieu d'en créer un second (retry après timeout, double déclenchement).
 */
function cleIdempotencePayout(commandeId) {
  const h = crypto.createHash('sha256').update(`nopalou_payout:${commandeId}`).digest('hex');
  const variant = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/** Net à reverser = total - commission Nopalou - frais Wave 2 % (1 % encaissement + 1 % payout). */
function calculerNetReversement(commande, commissionRate) {
  const total = Number(commande.montant_total) || 0;
  const commission = Number(commande.montant_commission) ||
    (Number(commissionRate) > 0 ? (total * Number(commissionRate)) / 100 : 0);
  const fraisWave = Math.round(total * 0.02);
  return {
    netAmount: Math.max(0, Math.round(total - commission - fraisWave)),
    fraisWave,
  };
}

async function waveAutoActif() {
  if (process.env.REVERSEMENT_AUTOMATIQUE_WAVE === 'false') return false;
  const cfg = require('../lib/settingsCache');
  const key = (process.env.WAVE_API_KEY || (await cfg.get('wave_api_key')) || '').trim();
  return Boolean(key && !key.includes('xxxxxxxx'));
}

/**
 * Déclenche le reversement automatique d'une commande livrée, payée en ligne par Wave.
 * Ne lève jamais : retourne { declenche, raison?, netAmount?, payoutId? }.
 */
async function declencherReversementAuto(commandeId, { source = 'inconnu' } = {}) {
  try {
    if (!(await waveAutoActif())) return { declenche: false, raison: 'wave_auto_inactif' };

    // Réservation atomique : une seule exécution possible par commande, uniquement si
    // livrée, encaissée par Wave (webhook) et jamais reversée.
    const { rows: [commande] } = await pool.query(
      `UPDATE commandes_boutique SET payout_ref = $2, payout_date = NOW()
        WHERE id = $1 AND statut = 'livree' AND paiement_recu = true
          AND payout_ref IS NULL AND methode_paiement ILIKE '%wave%'
        RETURNING *`,
      [commandeId, PAYOUT_AUTO_EN_COURS]
    );
    if (!commande) return { declenche: false, raison: 'non_eligible' };

    const { rows: [boutique] } = await pool.query(
      `SELECT b.nom, b.commission_rate, COALESCE(b.whatsapp, b.telephone, u.telephone) AS mobile
         FROM boutiques b
         LEFT JOIN utilisateurs u ON u.id = b.utilisateur_id
        WHERE b.id = $1`,
      [commande.boutique_id]
    );
    const mobile = boutique?.mobile;
    const { netAmount, fraisWave } = calculerNetReversement(commande, boutique?.commission_rate);
    const { alerterReversementMarchand } = require('./admin-alerts');

    if (!mobile || netAmount <= 0) {
      await liberer(commande.id);
      const motif = !mobile ? 'Numéro Wave du marchand introuvable' : 'Montant net nul';
      alerterReversementMarchand({
        reference: commande.reference, montant: netAmount, boutiqueNom: boutique?.nom || 'Marchand',
        telephone: mobile || 'N/A', statut: 'echec', motifErreur: motif, mode: 'auto_payout_wave',
      }).catch(() => {});
      return { declenche: false, raison: motif };
    }

    try {
      const wave = require('./wave');
      const payout = await wave.sendPayout({
        amount: netAmount,
        mobile,
        client_reference: `auto_payout_${commande.reference}`,
        boutique_nom: boutique.nom,
        reference_commande: commande.reference,
        idempotency_key: cleIdempotencePayout(commande.id),
      });
      const payoutId = payout?.id || `auto_payout_${commande.reference}`;

      // Le statut reste "livree" (stats/comptabilité) : payout_ref renseigné = reversement effectué.
      await pool.query(
        `UPDATE commandes_boutique SET payout_ref = $2, payout_date = NOW(), updated_at = NOW()
          WHERE id = $1 AND payout_ref = $3`,
        [commande.id, payoutId, PAYOUT_AUTO_EN_COURS]
      );
      console.log(`[AUTO PAYOUT WAVE SUCCESS] ${netAmount} FCFA -> ${boutique.nom} (cmd ${commande.reference}, source ${source}, frais Wave ${fraisWave})`);

      alerterReversementMarchand({
        reference: commande.reference, montant: netAmount, boutiqueNom: boutique.nom,
        telephone: mobile, statut: 'succes', mode: 'auto_payout_wave',
      }).catch(() => {});

      try {
        const { sendWhatsAppNotification } = require('./whatsapp');
        sendWhatsAppNotification(mobile, {
          title: 'Reversement Wave Effectué !',
          textMessage: `*Reversement effectué*\n\nBonjour *${boutique.nom}*,\nVotre virement de *${netAmount.toLocaleString('fr-FR')} FCFA* (Commande : ${commande.reference}) a été envoyé vers votre compte Wave *${mobile}*.\n\nMerci pour votre confiance sur Nopalou !`,
          detail: `Virement Wave de ${netAmount.toLocaleString('fr-FR')} FCFA pour la commande ${commande.reference}.`,
          url: 'https://nopalou.com/boutique',
        }).catch((e) => console.warn('[AUTO PAYOUT NOTIF MARCHAND ERR]:', e.message));
      } catch (_) { /* notification optionnelle */ }

      return { declenche: true, netAmount, payoutId };
    } catch (err) {
      const motif = err.response?.data?.message || err.waveErrorCode || err.message;
      console.error(`[AUTO PAYOUT WAVE ERR] cmd ${commande.reference} (source ${source}):`, motif);
      // Libération pour relance (auto ou bouton admin). Même clé d'idempotence au retry :
      // si Wave avait en réalité exécuté le payout (timeout), il ne sera pas refait.
      await liberer(commande.id);
      alerterReversementMarchand({
        reference: commande.reference, montant: netAmount, boutiqueNom: boutique.nom,
        telephone: mobile, statut: 'echec',
        motifErreur: err.response ? motif : `${motif} (réponse Wave absente : vérifier le portail Wave avant de relancer)`,
        mode: 'auto_payout_wave',
      }).catch(() => {});
      return { declenche: false, raison: motif };
    }
  } catch (err) {
    console.error('[AUTO PAYOUT WAVE FATAL]:', err.message);
    return { declenche: false, raison: err.message };
  }
}

async function liberer(commandeId) {
  await pool.query(
    `UPDATE commandes_boutique SET payout_ref = NULL, payout_date = NULL WHERE id = $1 AND payout_ref = $2`,
    [commandeId, PAYOUT_AUTO_EN_COURS]
  ).catch((e) => console.error('[AUTO PAYOUT LIBERATION ERR]:', e.message));
}

module.exports = {
  declencherReversementAuto,
  calculerNetReversement,
  cleIdempotencePayout,
};
