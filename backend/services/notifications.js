// backend/services/notifications.js
const { envoyerEmail }    = require('./email');
const { sendWhatsAppText, sendWhatsAppCarousel, sendWhatsAppTemplate, sendWhatsAppNotification } = require('./whatsapp');

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
    const textMsg = `📉 *Baisse de prix — Nopalou*\n\n*${alerte.produit_nom}* est passé à *${prixFmt} FCFA* (votre cible : ${cibleFmt} FCFA).\n\n👉 ${SITE}/?produit=${alerte.produit_id}`;
    await sendWhatsAppNotification(alerte.telephone, {
      textMessage: textMsg,
      title: `📉 Baisse de prix : ${alerte.produit_nom}`,
      detail: `Nouveau prix: ${prixFmt} FCFA (votre cible: ${cibleFmt} FCFA)`,
      url: `${SITE}/?produit=${alerte.produit_id}`,
      buttonParam: `?produit=${alerte.produit_id}`,
    }).catch(() => {});
  }

  await pool.query('UPDATE alertes SET active=false WHERE id=$1', [alerte.id]);
}

async function confirmationCommande(telephone, reference) {
  console.log(`[COMMANDE] #${reference} confirmée → ${telephone}`);
  if (telephone) {
    const textMsg = `✅ *Paiement confirmé — Nopalou*\n\nVotre paiement (réf. *${reference}*) a bien été reçu et traité. Merci de votre confiance !\n\n👉 ${SITE}`;
    await sendWhatsAppNotification(telephone, {
      textMessage: textMsg,
      title: `✅ Paiement confirmé — Nopalou`,
      detail: `Votre paiement pour la commande réf. ${reference} a bien été reçu et validé.`,
      url: SITE,
      buttonParam: 'commandes',
    }).catch(() => {});
  }
}

async function notifierModerationImmo(annonce) {
  if (!annonce.contact_tel) return;

  // Exclure les annonces issues du scraping / import externe
  const estScrape = !!(
    annonce.url_source ||
    annonce.ref_externe ||
    (annonce.source && !['site', 'utilisateur', 'manuel', 'depot_gratuit'].includes(annonce.source))
  );
  if (estScrape) {
    console.log(`[NOTIF IMMO] WhatsApp ignoré pour l'annonce immo ${annonce.id} (source scraping: ${annonce.source || 'externe'})`);
    return;
  }

  const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';

  if (annonce.rejete) {
    const msg = `❌ *Annonce refusée — Nopalou*\n\nVotre annonce *"${annonce.titre}"* n'a pas pu être publiée.\n\n📝 Motif : ${annonce.motif_rejet || 'Non précisé'}\n\nVous pouvez la corriger et la soumettre à nouveau sur Nopalou.`;
    return sendWhatsAppNotification(annonce.contact_tel, {
      textMessage: msg,
      title: `❌ Annonce refusée — Nopalou`,
      detail: `Annonce "${annonce.titre}" : ${annonce.motif_rejet || 'Non précisé'}`,
      url: `${SITE}/compte`,
      buttonParam: 'compte',
    }).catch(() => {});
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
      { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: annonce.id }] },
    ]).catch(() => {});
  }
}

module.exports = { envoyerAlertePrix, confirmationCommande, notifierModerationImmo };
