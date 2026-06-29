// backend/services/notifications.js
const { envoyerEmail }    = require('./email');
const { sendWhatsAppText } = require('./whatsapp');

const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';

async function envoyerAlertePrix(alerte, nouveauPrix) {
  const { pool } = require('../models/db');
  const prixFmt  = new Intl.NumberFormat('fr-FR').format(nouveauPrix);
  const cibleFmt = new Intl.NumberFormat('fr-FR').format(alerte.prix_cible);

  if (alerte.email) {
    await envoyerEmail({
      to: alerte.email,
      subject: `📉 Baisse de prix : ${alerte.produit_nom}`,
      html: `<p>Bonne nouvelle !</p>
             <p><b>${alerte.produit_nom}</b> est maintenant à <b>${prixFmt} FCFA</b>
             (votre prix cible : ${cibleFmt} FCFA).</p>
             <p><a href="${SITE}/?produit=${alerte.produit_id}">Voir l'offre sur Nopalou</a></p>`,
    }).catch(err => console.error('[ALERTE] Erreur envoi email:', err.message));
  }

  if (alerte.telephone) {
    await sendWhatsAppText(
      alerte.telephone,
      `📉 *Baisse de prix — Nopalou*\n\n*${alerte.produit_nom}* est passé à *${prixFmt} FCFA* (votre cible : ${cibleFmt} FCFA).\n\n👉 ${SITE}/?produit=${alerte.produit_id}`
    ).catch(() => {});
  }

  await pool.query('UPDATE alertes SET active=false WHERE id=$1', [alerte.id]);
}

async function confirmationCommande(telephone, reference) {
  console.log(`[COMMANDE] #${reference} confirmée → ${telephone}`);
  if (telephone) {
    await sendWhatsAppText(
      telephone,
      `✅ *Paiement confirmé — Nopalou*\n\nVotre paiement (réf. *${reference}*) a bien été reçu et traité. Merci de votre confiance !\n\n👉 ${SITE}`
    ).catch(() => {});
  }
}

async function notifierModerationImmo(annonce) {
  if (!annonce.contact_tel) return;
  const msg = annonce.actif
    ? `✅ *Annonce validée — Nopalou*\n\nVotre annonce *"${annonce.titre}"* est maintenant en ligne !\n\n👉 ${SITE}/immo/${annonce.id}`
    : annonce.rejete
      ? `❌ *Annonce refusée — Nopalou*\n\nVotre annonce *"${annonce.titre}"* n'a pas pu être publiée.\n\n📝 Motif : ${annonce.motif_rejet || 'Non précisé'}\n\nVous pouvez la corriger et la soumettre à nouveau sur Nopalou.`
      : null;
  if (msg) await sendWhatsAppText(annonce.contact_tel, msg).catch(() => {});
}

module.exports = { envoyerAlertePrix, confirmationCommande, notifierModerationImmo };
