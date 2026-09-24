// backend/services/relance-panier.js
// Nopalou — Relance Automatique de Panier Abandonné via WhatsApp (Audit P1)
// Récupère les ventes/commandes abandonnées après 45 minutes et relance le client avec son lien Wave

const { pool } = require('../models/db');
const { sendWhatsAppText, normalisePhone, estDesinscrit } = require('./whatsapp');

let _migrated = false;
async function assurerColonnesRelance() {
  if (_migrated) return;
  try {
    await pool.query(`
      ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS relance_panier_envoyee BOOLEAN DEFAULT FALSE;
      ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS date_relance_panier TIMESTAMPTZ;
    `);
    _migrated = true;
  } catch (e) {
    _migrated = true;
  }
}

/**
 * Exécute une passe de détection et relance des paniers abandonnés
 */
async function executerRelancePaniers() {
  try {
    await assurerColonnesRelance();

    // Commandes en attente de paiement créées il y a entre 45 minutes et 24 heures
    const { rows } = await pool.query(`
      SELECT c.id, c.reference, c.client_nom, c.client_telephone, c.montant_total, c.nom_produit, c.quantite,
             b.nom as boutique_nom, b.telephone as boutique_tel
      FROM commandes_boutique c
      LEFT JOIN boutiques b ON b.id = c.boutique_id
      WHERE (c.statut = 'en_attente' OR c.statut = 'attente_paiement')
        AND (c.relance_panier_envoyee IS NOT TRUE)
        AND c.client_telephone IS NOT NULL
        AND length(trim(c.client_telephone)) >= 9
        AND c.created_at <= NOW() - INTERVAL '45 minutes'
        AND c.created_at >= NOW() - INTERVAL '24 hours'
      LIMIT 15
    `);

    if (!rows.length) {
      return { count: 0, message: 'Aucun panier abandonné éligible' };
    }

    let relancesEnvoyees = 0;

    for (const cmd of rows) {
      try {
        const phone = normalisePhone(cmd.client_telephone);
        if (await estDesinscrit(phone)) {
          await pool.query('UPDATE commandes_boutique SET relance_panier_envoyee = TRUE WHERE id = $1', [cmd.id]);
          continue;
        }

        const prenom = cmd.client_nom ? cmd.client_nom.split(' ')[0] : 'Bonjour';
        const montantFmt = new Intl.NumberFormat('fr-FR').format(cmd.montant_total);
        const nomBoutique = cmd.boutique_nom || 'Nopalou Sénégal';

        const msg = 
`👋 *${prenom}, avez-vous oublié vos articles chez ${nomBoutique} ?*

Votre commande *${cmd.reference}* (${cmd.quantite}x ${cmd.nom_produit || 'Produit'} — *${montantFmt} FCFA*) est réservée et prête pour expédition !

⚡ *Pour finaliser votre commande en 1 clic :*
Vous pouvez régler par Wave ou Orange Money, ou nous confirmer la livraison cash.

Besoin d'un renseignement ? Répondez directement à ce message pour échanger avec notre service client.`;

        await sendWhatsAppText(phone, msg);

        await pool.query(`
          UPDATE commandes_boutique
          SET relance_panier_envoyee = TRUE, date_relance_panier = NOW()
          WHERE id = $1
        `, [cmd.id]);

        relancesEnvoyees++;
      } catch (errCmd) {
        console.warn(`[RELANCE PANIER] Erreur pour commande ${cmd.reference}:`, errCmd.message);
      }
    }

    return { count: relancesEnvoyees, message: `${relancesEnvoyees} relances envoyées avec succès` };
  } catch (err) {
    console.error('[RELANCE PANIER CRON ERR]:', err.message);
    return { count: 0, error: err.message };
  }
}

module.exports = {
  executerRelancePaniers,
  relancerPaniersAbandonnes: executerRelancePaniers,
  assurerColonnesRelance
};
