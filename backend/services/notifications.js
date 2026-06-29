// backend/services/notifications.js
const { envoyerEmail }    = require('./email');
const { sendWhatsAppText, sendWhatsAppCarousel, sendWhatsAppTemplate } = require('./whatsapp');

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
  const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';

  if (annonce.rejete) {
    const msg = `❌ *Annonce refusée — Nopalou*\n\nVotre annonce *"${annonce.titre}"* n'a pas pu être publiée.\n\n📝 Motif : ${annonce.motif_rejet || 'Non précisé'}\n\nVous pouvez la corriger et la soumettre à nouveau sur Nopalou.`;
    return sendWhatsAppText(annonce.contact_tel, msg).catch(() => {});
  }

  if (annonce.actif) {
    const card = {
      imageUrl: annonce.photos?.[0] || null,
      title:    annonce.titre,
      detail:   annonce.prix
        ? new Intl.NumberFormat('fr-FR').format(annonce.prix) + ' FCFA'
        : 'Prix non précisé',
      pageUrl: `${SITE}/immo/${annonce.id}`,
    };
    if (card.imageUrl) {
      return sendWhatsAppCarousel(annonce.contact_tel, 'nopalou_carousel_immo', [card]).catch(() => {});
    }
    return sendWhatsAppTemplate(annonce.contact_tel, 'nopalou_fiche_texte', [
      { type: 'body', parameters: [
        { type: 'text', text: card.title },
        { type: 'text', text: card.detail },
        { type: 'text', text: card.pageUrl },
      ]},
    ]).catch(() => {});
  }
}

module.exports = { envoyerAlertePrix, confirmationCommande, notifierModerationImmo };
