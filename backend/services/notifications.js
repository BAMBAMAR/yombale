// backend/services/notifications.js
// Africa's Talking et SendGrid sont OPTIONNELS
// Le serveur démarre même sans les clés API

// ── Initialisation conditionnelle Africa's Talking ────────────
let SMS = null;
if (process.env.AT_API_KEY && process.env.AT_USERNAME) {
  try {
    const AfricasTalking = require('africastalking');
    const AT = AfricasTalking({
      apiKey:   process.env.AT_API_KEY,
      username: process.env.AT_USERNAME
    });
    SMS = AT.SMS;
    console.log('✅ Africa\'s Talking SMS initialisé');
  } catch (e) {
    console.warn('⚠️ Africa\'s Talking non disponible:', e.message);
  }
} else {
  console.warn('⚠️ SMS désactivé — AT_API_KEY ou AT_USERNAME manquant');
}

// ── Initialisation conditionnelle SendGrid ────────────────────
let sgMail = null;
if (process.env.SENDGRID_API_KEY) {
  try {
    sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('✅ SendGrid Email initialisé');
  } catch (e) {
    console.warn('⚠️ SendGrid non disponible:', e.message);
  }
} else {
  console.warn('⚠️ Email désactivé — SENDGRID_API_KEY manquant');
}

// ── Alerte prix baissé (SMS + Email) ─────────────────────────
async function envoyerAlertePrix(alerte, nouveauPrix) {
  const message = `[Yombale SN] Bu yombale bi !
"${alerte.produit_nom}" est a ${nouveauPrix.toLocaleString('fr')} FCFA.
Votre cible : ${alerte.prix_cible.toLocaleString('fr')} FCFA
Voir : yombale.sn
Repondre STOP pour se desabonner.`;

  // SMS — seulement si initialisé
  if (SMS && alerte.telephone) {
    try {
      await SMS.send({ to: [alerte.telephone], message, from: 'Yombale' });
      console.log('✅ SMS envoyé à', alerte.telephone);
    } catch (e) {
      console.error('❌ SMS erreur:', e.message);
    }
  }

  // Email — seulement si initialisé
  if (sgMail && alerte.email) {
    try {
      await sgMail.send({
        to:      alerte.email,
        from:    'alertes@yombale.sn',
        subject: `Bu yombale bi : ${alerte.produit_nom}`,
        html: `<div style="font-family:sans-serif;max-width:500px">
          <h2 style="color:#1d4ed8">Yombale 🇸🇳</h2>
          <p><em>"Bu yombale bi !" — Abordable, pas cher</em></p>
          <p><strong>${alerte.produit_nom}</strong> a baisse de prix !</p>
          <div style="background:#fff7ed;padding:16px;border-radius:8px;margin:16px 0">
            <div style="font-size:28px;font-weight:800;color:#f97316">
              ${nouveauPrix.toLocaleString('fr')} FCFA
            </div>
          </div>
          <a href="https://yombale.sn"
             style="background:#1d4ed8;color:#fff;padding:12px 24px;
                    border-radius:8px;text-decoration:none;font-weight:700">
            Voir l'offre
          </a>
        </div>`
      });
      console.log('✅ Email envoyé à', alerte.email);
    } catch (e) {
      console.error('❌ Email erreur:', e.message);
    }
  }

  // Désactiver l'alerte après déclenchement
  const { pool } = require('../models/db');
  await pool.query('UPDATE alertes SET active=false WHERE id=$1', [alerte.id]);
}

// ── Confirmation de commande ──────────────────────────────────
async function confirmationCommande(telephone, reference) {
  if (!SMS) {
    console.warn('⚠️ SMS non disponible pour confirmation commande', reference);
    return;
  }
  try {
    await SMS.send({
      to:      [telephone],
      message: `[Yombale] Commande #${reference} confirmee. Livraison 2-4 jours. Bu yombale bi !`,
      from:    'Yombale'
    });
  } catch (e) {
    console.error('❌ SMS confirmation erreur:', e.message);
  }
}

module.exports = { envoyerAlertePrix, confirmationCommande };
