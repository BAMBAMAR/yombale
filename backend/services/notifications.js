const AfricasTalking = require('africastalking');
const sgMail         = require('@sendgrid/mail');

const AT  = AfricasTalking({ apiKey: process.env.AT_API_KEY, username: process.env.AT_USERNAME });
const SMS = AT.SMS;
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function envoyerAlertePrix(alerte, nouveauPrix) {
  const message = `[PrixMalin SN] Prix baisse !
"${alerte.produit_nom}" est a ${nouveauPrix.toLocaleString('fr')} FCFA.
Votre cible : ${alerte.prix_cible.toLocaleString('fr')} FCFA
Voir : prixmalin.sn
Repondre STOP pour se desabonner.`;

  if (alerte.telephone) {
    try { await SMS.send({ to: [alerte.telephone], message, from: 'PrixMalin' }); }
    catch (e) { console.error('SMS erreur:', e.message); }
  }

  if (alerte.email) {
    try {
      await sgMail.send({
        to: alerte.email, from: 'alertes@prixmalin.sn',
        subject: `Prix baisse : ${alerte.produit_nom}`,
        html: `<div style="font-family:sans-serif;max-width:500px">
          <h2 style="color:#1d4ed8">PrixMalin Senegal</h2>
          <p><strong>${alerte.produit_nom}</strong> a baisse de prix !</p>
          <div style="background:#fff7ed;padding:16px;border-radius:8px;margin:16px 0">
            <div style="font-size:28px;font-weight:800;color:#f97316">
              ${nouveauPrix.toLocaleString('fr')} FCFA
            </div>
          </div>
          <a href="https://prixmalin.sn"
             style="background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">
            Voir l'offre
          </a>
        </div>`
      });
    } catch (e) { console.error('Email erreur:', e.message); }
  }

  const { pool } = require('../models/db');
  await pool.query('UPDATE alertes SET active=false WHERE id=$1', [alerte.id]);
}

async function confirmationCommande(telephone, reference) {
  await SMS.send({
    to: [telephone],
    message: `[PrixMalin] Commande #${reference} confirmee. Livraison 2-4 jours. Merci !`,
    from: 'PrixMalin'
  });
}

module.exports = { envoyerAlertePrix, confirmationCommande };