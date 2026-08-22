// backend/services/cron-relances-marchands.js — Moteur de relances et d'onboarding marchands (J+1, J+7, J+25)
const { pool } = require('../models/db');
let sendWhatsAppText;
let estDesinscrit;
try {
  const ws = require('./whatsapp');
  sendWhatsAppText = ws.sendWhatsAppText;
  estDesinscrit = ws.estDesinscrit;
} catch (e) {
  sendWhatsAppText = null;
  estDesinscrit = async () => false;
}

const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';

/**
 * Exécute les vagues de relances marchands automatiques (J+1, J+7, J+25)
 */
async function traiterRelancesMarchands() {
  const stats = { j1: 0, j7: 0, j25: 0, total: 0, erreurs: [] };

  try {
    // ── 1. Relance J+1 : Partage Statut WhatsApp (Créée il y a ~24h) ───────────
    const qJ1 = `
      SELECT b.id, b.nom, b.slug, COALESCE(b.whatsapp, b.telephone) AS telephone, u.nom AS gerant_nom
      FROM boutiques b
      JOIN utilisateurs u ON u.id = b.utilisateur_id
      WHERE b.actif = true
        AND b.created_at::date = (CURRENT_DATE - INTERVAL '1 day')::date
        AND NOT EXISTS (
          SELECT 1 FROM prospection_messages_log 
          WHERE destinataire = COALESCE(b.whatsapp, b.telephone) 
            AND message_envoye LIKE '%Astuce N°1%'
        )
    `;
    const resJ1 = await pool.query(qJ1);

    for (const b of resJ1.rows) {
      if (!b.telephone) continue;
      if (estDesinscrit && (await estDesinscrit(b.telephone))) continue;

      const msg =
        `Salam ${b.nom} ! 🎉 Félicitations pour votre 1er jour sur Nopalou.\n\n` +
        `💡 *Astuce N°1 pour faire votre première vente aujourd'hui :*\n` +
        `Partagez le lien de votre vitrine dans votre statut WhatsApp :\n` +
        `👉 ${SITE}/boutiques/${b.slug}\n\n` +
        `Vos clients pourront voir l'ensemble de vos articles et commander directement en 1 clic.\n\n` +
        `_Pour ne plus recevoir de rappel, répondez simplement STOP._`;

      if (sendWhatsAppText && typeof sendWhatsAppText === 'function') {
        try {
          await sendWhatsAppText(b.telephone, msg);
          stats.j1++;
          stats.total++;
          await pool.query(
            `INSERT INTO prospection_messages_log (canal, destinataire, message_envoye, statut)
             VALUES ('whatsapp', $1, $2, 'envoye')`,
            [b.telephone, msg]
          );
        } catch (e) {
          stats.erreurs.push({ bq: b.nom, type: 'J+1', err: e.message });
        }
      }
    }

    // ── 2. Relance J+7 : Découverte Carnet de Dettes & Caisse POS ──────────────
    const qJ7 = `
      SELECT b.id, b.nom, b.slug, COALESCE(b.whatsapp, b.telephone) AS telephone, u.nom AS gerant_nom
      FROM boutiques b
      JOIN utilisateurs u ON u.id = b.utilisateur_id
      WHERE b.actif = true
        AND b.created_at::date = (CURRENT_DATE - INTERVAL '7 days')::date
        AND NOT EXISTS (
          SELECT 1 FROM prospection_messages_log 
          WHERE destinataire = COALESCE(b.whatsapp, b.telephone) 
            AND message_envoye LIKE '%Carnet de Dettes%'
        )
    `;
    const resJ7 = await pool.query(qJ7);

    for (const b of resJ7.rows) {
      if (!b.telephone) continue;
      if (estDesinscrit && (await estDesinscrit(b.telephone))) continue;

      const msg =
        `Salam ${b.nom} ! 👋\n\n` +
        `Saviez-vous que Nopalou intègre une *Caisse Tactile POS* et un *Carnet de Dettes intelligent* ?\n\n` +
        `📒 Notez les crédits de vos clients et relancez-les poliment sur WhatsApp en 1 seul clic sans effort !\n\n` +
        `👉 Accédez à votre caisse ici : ${SITE}/boutique/caisse\n\n` +
        `_Pour ne plus recevoir de rappel, répondez simplement STOP._`;

      if (sendWhatsAppText && typeof sendWhatsAppText === 'function') {
        try {
          await sendWhatsAppText(b.telephone, msg);
          stats.j7++;
          stats.total++;
          await pool.query(
            `INSERT INTO prospection_messages_log (canal, destinataire, message_envoye, statut)
             VALUES ('whatsapp', $1, $2, 'envoye')`,
            [b.telephone, msg]
          );
        } catch (e) {
          stats.erreurs.push({ bq: b.nom, type: 'J+7', err: e.message });
        }
      }
    }

    // ── 3. Relance J+25 : Expiration Essai & Offre Annuelle -25% Wave ──────────
    const qJ25 = `
      SELECT a.id, a.fin, b.nom, b.slug, COALESCE(b.whatsapp, b.telephone, u.telephone) AS telephone
      FROM abonnements a
      JOIN utilisateurs u ON u.id = a.utilisateur_id
      JOIN boutiques b ON b.utilisateur_id = u.id
      WHERE a.statut = 'actif'
        AND a.fin::date = (CURRENT_DATE + INTERVAL '5 days')::date
        AND NOT EXISTS (
          SELECT 1 FROM prospection_messages_log 
          WHERE destinataire = COALESCE(b.whatsapp, b.telephone, u.telephone) 
            AND message_envoye LIKE '%Offre Exclusive%'
        )
    `;
    const resJ25 = await pool.query(qJ25);

    for (const a of resJ25.rows) {
      if (!a.telephone) continue;
      if (estDesinscrit && (await estDesinscrit(a.telephone))) continue;

      const msg =
        `Salam ${a.nom} ! ⏳\n\n` +
        `Vos 30 jours d'essai gratuit sur Nopalou se terminent dans 5 jours.\n\n` +
        `🎁 *Offre Exclusive de Renouvellement :*\n` +
        `Profitez de *-25% (3 mois offerts)* sur l'abonnement annuel avec paiement Wave direct !\n\n` +
        `👉 Renouvelez en 1 clic ici : ${SITE}/tarifs-boutique\n\n` +
        `_Pour ne plus recevoir de rappel, répondez simplement STOP._`;

      if (sendWhatsAppText && typeof sendWhatsAppText === 'function') {
        try {
          await sendWhatsAppText(a.telephone, msg);
          stats.j25++;
          stats.total++;
          await pool.query(
            `INSERT INTO prospection_messages_log (canal, destinataire, message_envoye, statut)
             VALUES ('whatsapp', $1, $2, 'envoye')`,
            [a.telephone, msg]
          );
        } catch (e) {
          stats.erreurs.push({ bq: a.nom, type: 'J+25', err: e.message });
        }
      }
    }

    console.log(`[CRON RELANCES MARCHANDS] ✅ Traité : ${stats.total} envois (J+1: ${stats.j1}, J+7: ${stats.j7}, J+25: ${stats.j25})`);
    return { succes: true, stats };
  } catch (err) {
    console.error('[CRON RELANCES MARCHANDS FAIL]', err);
    return { succes: false, error: err.message, stats };
  }
}

// Planification automatique quotidienne
if (process.env.NODE_ENV !== 'test') {
  setTimeout(() => {
    traiterRelancesMarchands().catch(() => {});
    setInterval(() => {
      traiterRelancesMarchands().catch(() => {});
    }, 24 * 60 * 60 * 1000); // 24 heures
  }, 15000);
}

module.exports = {
  traiterRelancesMarchands,
};
