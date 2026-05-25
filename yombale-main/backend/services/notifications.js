// backend/services/notifications.js
// VERSION SIMPLIFIEE — sans Africa's Talking ni SendGrid
// Les SMS/emails seront ajoutés plus tard quand le serveur tournera

async function envoyerAlertePrix(alerte, nouveauPrix) {
  // Log en console pour l'instant
  console.log(`[ALERTE] ${alerte.produit_nom} → ${nouveauPrix} FCFA pour ${alerte.email}`);

  // Désactiver l'alerte après déclenchement
  const { pool } = require('../models/db');
  await pool.query('UPDATE alertes SET active=false WHERE id=$1', [alerte.id]);
}

async function confirmationCommande(telephone, reference) {
  console.log(`[COMMANDE] #${reference} confirmée → ${telephone}`);
}

module.exports = { envoyerAlertePrix, confirmationCommande };
