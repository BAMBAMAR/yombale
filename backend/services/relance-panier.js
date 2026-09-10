// backend/services/relance-panier.js
// Service de relance automatique des commandes & paniers abandonnés via WhatsApp

const { pool } = require('../models/db');
const { sendWhatsAppText, normalisePhone } = require('./whatsapp');
const cfg = require('../lib/settingsCache');

/**
 * Parcourt les commandes restées "en_attente" entre 1 heure et 24 heures
 * et envoie un rappel courtois par WhatsApp au client pour l'aider à finaliser.
 */
async function relancerPaniersAbandonnes() {
  try {
    const relanceActive = await cfg.getBool('whatsapp_relance_panier_active').catch(() => true);
    if (!relanceActive) return;

    // Vérification / Création dynamique des colonnes de suivi si absentes
    await pool.query(`
      ALTER TABLE commandes 
      ADD COLUMN IF NOT EXISTS relance_panier_envoyee BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS date_relance_panier TIMESTAMP;
    `).catch(() => {});

    // Sélection des commandes non payées après 60 minutes
    const { rows: commandes } = await pool.query(`
      SELECT 
        c.id, c.reference, c.client_nom, c.client_telephone, c.total, c.created_at,
        b.nom AS boutique_nom, b.slug AS boutique_slug, b.whatsapp AS boutique_whatsapp
      FROM commandes c
      JOIN boutiques b ON c.boutique_id = b.id
      WHERE c.statut = 'en_attente'
        AND c.created_at <= NOW() - INTERVAL '60 minutes'
        AND c.created_at >= NOW() - INTERVAL '24 hours'
        AND (c.relance_panier_envoyee IS NULL OR c.relance_panier_envoyee = FALSE)
        AND c.client_telephone IS NOT NULL
        AND LENGTH(TRIM(c.client_telephone)) >= 9
      ORDER BY c.created_at ASC
      LIMIT 25
    `);

    if (!commandes.length) return;

    console.log(`[RELANCE PANIER] ${commandes.length} commande(s) en attente éligible(s) trouvée(s).`);

    for (const cmd of commandes) {
      const tel = normalisePhone(cmd.client_telephone);
      if (!tel) {
        await pool.query('UPDATE commandes SET relance_panier_envoyee = TRUE WHERE id = $1', [cmd.id]);
        continue;
      }

      const prenom = cmd.client_nom ? cmd.client_nom.trim().split(' ')[0] : 'Bonjour';
      const montantFmt = new Intl.NumberFormat('fr-FR').format(cmd.total || 0) + ' FCFA';
      
      const message = 
        `👋 Bonjour ${prenom} !\n\n` +
        `Votre commande *#${cmd.reference || cmd.id.slice(0, 8)}* d'un montant de *${montantFmt}* auprès de la boutique *${cmd.boutique_nom}* est bien enregistrée et réservée pour vous.\n\n` +
        `Avez-vous besoin d'assistance pour valider votre livraison ou régler par Wave ?\n` +
        `👉 Répondez directement à ce message pour confirmer votre commande en 1 clic !`;

      try {
        await sendWhatsAppText(tel, message);
        await pool.query(
          'UPDATE commandes SET relance_panier_envoyee = TRUE, date_relance_panier = NOW() WHERE id = $1',
          [cmd.id]
        );
        console.log(`[RELANCE PANIER] ✅ Notification WhatsApp envoyée à ${tel} (Commande ${cmd.reference})`);
      } catch (sendErr) {
        console.error(`[RELANCE PANIER] ❌ Échec envoi à ${tel}:`, sendErr.message);
        // Marquer comme traité pour éviter de boucler indéfiniment sur un numéro non-WhatsApp
        await pool.query(
          'UPDATE commandes SET relance_panier_envoyee = TRUE, date_relance_panier = NOW() WHERE id = $1',
          [cmd.id]
        ).catch(() => {});
      }
    }
  } catch (err) {
    console.error('[RELANCE PANIER SYSTEM ERR]:', err.message);
  }
}

module.exports = {
  relancerPaniersAbandonnes,
};
