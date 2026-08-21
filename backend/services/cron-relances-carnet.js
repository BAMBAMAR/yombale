// backend/services/cron-relances-carnet.js
// Service d'arrière-plan pour la relance automatique WhatsApp selon les dates d'échéance du carnet

const pool = require('../models/db');
let sendWhatsAppText;
try {
  const ws = require('./whatsapp');
  sendWhatsAppText = ws.sendWhatsAppText;
} catch (e) {
  sendWhatsAppText = null;
}

/**
 * Exécute la vérification des échéances du carnet et envoie les relances WhatsApp automatiques
 */
async function traiterRelancesAutomatiquesWhatsApp() {
  try {
    // 1. Chercher toutes les créances impayées avec échéance aujourd'hui ou dépassée (et relance_auto_whatsapp = true)
    // dont aucune relance n'a été envoyée aujourd'hui
    const query = `
      SELECT 
        h.id AS trans_id,
        h.montant,
        h.date_echeance,
        h.derniere_relance_whatsapp,
        c.id AS client_id,
        c.nom AS client_nom,
        c.telephone AS client_tel,
        c.solde AS client_solde,
        b.id AS boutique_id,
        b.nom AS boutique_nom,
        b.telephone AS boutique_tel,
        b.whatsapp AS boutique_whatsapp
      FROM caisse_credit_historique h
      JOIN caisse_clients_credits c ON h.client_id = c.id
      JOIN boutiques b ON h.boutique_id = b.id
      WHERE 
        c.solde > 0
        AND h.type = 'vente_credit'
        AND h.relance_auto_whatsapp = true
        AND h.date_echeance IS NOT NULL
        AND h.date_echeance <= CURRENT_DATE
        AND (h.derniere_relance_whatsapp IS NULL OR h.derniere_relance_whatsapp < CURRENT_DATE)
    `;

    const { rows } = await pool.query(query);
    if (!rows || rows.length === 0) {
      return { succes: true, relancesEnvoyees: 0 };
    }

    let envoyees = 0;
    for (const r of rows) {
      const soldeNum = Number(r.client_solde);
      if (soldeNum <= 0) continue;

      const dateEchFmt = new Date(r.date_echeance).toLocaleDateString('fr-FR');
      const contactBq = r.boutique_whatsapp || r.boutique_tel || '';

      const msg = `Bonjour ${r.client_nom},\n\n` +
        `Rappel amical de *${r.boutique_nom}* concernant votre carnet de crédit.\n` +
        `Montant dû : *${soldeNum.toLocaleString('fr-FR')} FCFA*\n` +
        `Date d'échéance : *${dateEchFmt}*\n\n` +
        `Merci de bien vouloir passer régler votre solde ou nous contacter.\n` +
        (contactBq ? `Tel: ${contactBq}` : '');

      if (sendWhatsAppText && typeof sendWhatsAppText === 'function') {
        try {
          await sendWhatsAppText(r.client_tel, msg);
          envoyees++;
        } catch (errApi) {
          console.warn(`[RELANCE AUTO WA] Échec envoi vers ${r.client_tel}:`, errApi.message);
        }
      }

      // Marquer la date de dernière relance
      await pool.query(
        `UPDATE caisse_credit_historique SET derniere_relance_whatsapp = NOW() WHERE id = $1`,
        [r.trans_id]
      );
    }

    console.log(`[RELANCE AUTO WA] ✅ ${envoyees} relances WhatsApp traitées avec succès.`);
    return { succes: true, relancesEnvoyees: envoyees };
  } catch (err) {
    console.error('[RELANCE AUTO WA CRON FAIL]', err);
    return { succes: false, error: err.message };
  }
}

// Planifier l'exécution quotidienne (toutes les 12 heures ou 24h)
if (process.env.NODE_ENV !== 'test') {
  setTimeout(() => {
    traiterRelancesAutomatiquesWhatsApp().catch(() => {});
    setInterval(() => {
      traiterRelancesAutomatiquesWhatsApp().catch(() => {});
    }, 12 * 60 * 60 * 1000); // 12 heures
  }, 10000);
}

module.exports = {
  traiterRelancesAutomatiquesWhatsApp
};
