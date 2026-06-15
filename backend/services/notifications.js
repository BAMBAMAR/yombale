// backend/services/notifications.js
const { envoyerEmail } = require('./email');

async function envoyerAlertePrix(alerte, nouveauPrix) {
  const { pool } = require('../models/db');

  if (alerte.email) {
    await envoyerEmail({
      to: alerte.email,
      subject: `📉 Baisse de prix : ${alerte.produit_nom}`,
      html: `<p>Bonne nouvelle !</p>
             <p><b>${alerte.produit_nom}</b> est maintenant à <b>${new Intl.NumberFormat('fr-FR').format(nouveauPrix)} FCFA</b>
             (votre prix cible : ${new Intl.NumberFormat('fr-FR').format(alerte.prix_cible)} FCFA).</p>
             <p><a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/?produit=${alerte.produit_id}">Voir l'offre sur Nopalou</a></p>`,
    }).catch(err => console.error('[ALERTE] Erreur envoi email:', err.message));
  }

  await pool.query('UPDATE alertes SET active=false WHERE id=$1', [alerte.id]);
}

async function confirmationCommande(telephone, reference) {
  console.log(`[COMMANDE] #${reference} confirmée → ${telephone}`);
}

module.exports = { envoyerAlertePrix, confirmationCommande };
