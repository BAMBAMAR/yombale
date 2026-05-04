// backend/services/notifications.js
// CORRECTION : Africa's Talking initialisé seulement si les clés existent

let SMS = null;

if (process.env.AT_API_KEY && process.env.AT_USERNAME) {
  try {
    const AfricasTalking = require('africastalking');
    SMS = AfricasTalking({
      apiKey:   process.env.AT_API_KEY,
      username: process.env.AT_USERNAME
    }).SMS;
    console.log('✅ SMS Africa\'s Talking prêt');
  } catch (e) {
    console.warn('⚠️ SMS non disponible:', e.message);
  }
} else {
  console.warn('⚠️ SMS désactivé — variables AT_API_KEY / AT_USERNAME manquantes');
}

let sgMail = null;
if (process.env.SENDGRID_API_KEY) {
  try {
    sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('✅ Email SendGrid prêt');
  } catch (e) {
    console.warn('⚠️ Email non disponible:', e.message);
  }
} else {
  console.warn('⚠️ Email désactivé — SENDGRID_API_KEY manquant');
}

async function envoyerAlertePrix(alerte, nouveauPrix) {
  const message = `[Yombale SN] Bu yombale bi !
"${alerte.produit_nom}" est a ${nouveauPrix.toLocaleString('fr')} FCFA.
Votre cible : ${alerte.prix_cible.toLocaleString('fr')} FCFA
Voir : yombale.sn`;

  if (SMS && alerte.telephone) {
    try {
      await SMS.send({ to: [alerte.telephone], message, from: 'Yombale' });
    } catch (e) { console.error('SMS erreur:', e.message); }
  }

  if (sgMail && alerte.email) {
    try {
      await sgMail.send({
        to: alerte.email,
        from: 'alertes@yombale.sn',
        subject: `Bu yombale bi : ${alerte.produit_nom}`,
        text: message
      });
    } catch (e) { console.error('Email erreur:', e.message); }
  }

  const { pool } = require('../models/db');
  await pool.query('UPDATE alertes SET active=false WHERE id=$1', [alerte.id]);
}

async function confirmationCommande(telephone, reference) {
  if (!SMS) return;
  try {
    await SMS.send({
      to: [telephone],
      message: `[Yombale] Commande #${reference} confirmee. Merci !`,
      from: 'Yombale'
    });
  } catch (e) { console.error('SMS confirmation erreur:', e.message); }
}

module.exports = { envoyerAlertePrix, confirmationCommande };
