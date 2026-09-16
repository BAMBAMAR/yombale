// backend/services/immo-whatsapp-notifications.js
// Service de diffusion automatique des notifications et alertes immobilières via WhatsApp Meta Cloud API

const { pool } = require('../models/db');
const { sendWhatsAppNotification, sendWhatsAppText, normalisePhone } = require('./whatsapp');

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'https://nopalou.com';

/**
 * Notifie automatiquement l'agence lorsqu'une nouvelle demande de visite est déposée
 * et accuse réception au prospect par WhatsApp.
 */
async function notifierDemandeVisiteAgence({
  agenceId,
  contactNom,
  contactTel,
  annonceTitre,
  dateVisite,
  creneau,
  message,
  visiteId
}) {
  try {
    if (!agenceId) return;

    // 1. Récupération des informations de contact de l'agence
    const { rows: agences } = await pool.query(
      `SELECT id, nom, slug, telephone, whatsapp FROM agences_immo WHERE id = $1 LIMIT 1`,
      [agenceId]
    );

    if (agences.length === 0) return;
    const agenceTel = (agence.whatsapp && agence.whatsapp.trim()) || (agence.telephone && agence.telephone.trim());

    const nomClient = (contactNom || 'Un visiteur').trim();
    const telClient = (contactTel || '').trim();
    const titreBien = (annonceTitre || 'un bien de votre agence').trim();
    const dateVoulue = dateVisite ? `le ${dateVisite}` : 'Dès que possible';
    const creneauVoulu = creneau ? `(${creneau})` : '';
    const lienGestion = `${SITE_URL}/agence/${agence.slug}/visites?tab=demandes`;

    // 2. Alerte WhatsApp automatique envoyée à l'Agence
    if (agenceTel) {
      const msgAgence = [
        `🔔 *NOPALOU IMMO — NOUVELLE DEMANDE DE VISITE !*`,
        ``,
        `👤 *Prospect* : ${nomClient}`,
        `📞 *Téléphone* : ${telClient || 'Non renseigné'}`,
        `🏠 *Bien concerné* : ${titreBien}`,
        `📅 *Date souhaitée* : ${dateVoulue} ${creneauVoulu}`,
        message ? `💬 *Message du client* : "${message}"` : null,
        ``,
        `👉 *Traiter et confirmer cette visite sur votre tableau de bord* :`,
        lienGestion
      ].filter(Boolean).join('\n');

      sendWhatsAppNotification(agenceTel, {
        textMessage: msgAgence,
        title: 'Nouvelle demande de visite reçue',
        montant: 'Nopalou Immo',
        detail: `${nomClient} souhaite visiter "${titreBien.slice(0, 50)}" (${dateVoulue}).`,
        url: lienGestion,
        buttonParam: 'visites'
      }).catch(err => {
        console.warn(`[IMMO_WA_NOTIF] Erreur notification WhatsApp agence (${agence.nom}):`, err.message);
      });
    }

    // 3. Accusé de réception WhatsApp automatique envoyé au Prospect (si téléphone fourni)
    if (telClient) {
      const msgProspect = [
        `Bonjour ${nomClient},`,
        ``,
        `Votre demande de visite pour *"${titreBien}"* a bien été transmise à l'agence *${agence.nom}*.`,
        `📅 *Créneau demandé* : ${dateVoulue} ${creneauVoulu}`,
        ``,
        `Un conseiller de l'agence vous recontactera sous peu pour confirmer définitivement le rendez-vous.`,
        ``,
        `Merci de votre confiance,\nL'équipe ${agence.nom} & Nopalou Immobilier`
      ].join('\n');

      sendWhatsAppNotification(telClient, {
        textMessage: msgProspect,
        title: 'Demande de visite transmise',
        montant: agence.nom,
        detail: `Votre demande pour "${titreBien.slice(0, 50)}" a été reçue par ${agence.nom}.`,
        url: `${SITE_URL}/agences/${agence.slug}`,
        buttonParam: 'boutique'
      }).catch(err => {
        console.warn(`[IMMO_WA_NOTIF] Erreur accusé de réception prospect (${telClient}):`, err.message);
      });
    }

    return true;
  } catch (err) {
    console.error('[IMMO_WA_NOTIF_ERR] Erreur traitement demande visite:', err.message);
    return false;
  }
}

/**
 * Notifie le visiteur par WhatsApp lorsque son rendez-vous est confirmé par l'agent.
 */
async function notifierConfirmationVisite({
  agenceId,
  contactNom,
  contactTel,
  bienTitre,
  dateVisite,
  heureVisite,
  agentNom,
  agentTel
}) {
  try {
    if (!contactTel) return;

    let agenceNom = 'Votre Agence';
    let agenceSlug = '';
    if (agenceId) {
      const { rows } = await pool.query(`SELECT nom, slug FROM agences_immo WHERE id = $1`, [agenceId]);
      if (rows[0]) {
        agenceNom = rows[0].nom;
        agenceSlug = rows[0].slug;
      }
    }

    const nomClient = (contactNom || 'Bonjour').trim();
    const dateRdv = dateVisite ? `le ${new Date(dateVisite).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}` : 'à la date convenue';
    const heureRdv = heureVisite ? `à ${heureVisite}` : '';
    const titreBien = (bienTitre || 'le bien sélectionné').trim();

    const msg = [
      `✅ *VISITE CONFIRMÉE — ${agenceNom.toUpperCase()}*`,
      ``,
      `Bonjour ${nomClient},`,
      `Votre rendez-vous pour visiter *"${titreBien}"* est confirmé !`,
      ``,
      `📅 *Date & Heure* : ${dateRdv} ${heureRdv}`,
      agentNom ? `👤 *Conseiller référent* : ${agentNom}${agentTel ? ` (${agentTel})` : ''}` : null,
      ``,
      `En cas d'imprévu ou de retard, vous pouvez nous joindre directement sur ce numéro.`,
      ``,
      `À très bientôt,\n${agenceNom}`
    ].filter(Boolean).join('\n');

    await sendWhatsAppNotification(contactTel, {
      textMessage: msg,
      title: 'Visite immobilière confirmée',
      montant: agenceNom,
      detail: `Rendez-vous confirmé pour "${titreBien.slice(0, 50)}" ${dateRdv} ${heureRdv}.`,
      url: agenceSlug ? `${SITE_URL}/agences/${agenceSlug}` : SITE_URL,
      buttonParam: 'boutique'
    });

    return true;
  } catch (err) {
    console.error('[IMMO_WA_CONFIRM_ERR] Erreur envoi confirmation visite:', err.message);
    return false;
  }
}

/**
 * Notifie un locataire par WhatsApp pour un rappel d'échéance de loyer impayée.
 */
async function notifierRelanceLoyerWhatsApp({ agenceId, loyerId }) {
  try {
    const { rows } = await pool.query(
      `SELECT le.id, le.montant, le.periode, le.date_echeance,
              b.titre AS bien_titre,
              c.nom AS locataire_nom, c.telephone AS locataire_tel,
              a.nom AS agence_nom, a.telephone AS agence_tel
       FROM loyers_echeances le
       JOIN baux_immo ba ON le.bail_id = ba.id
       JOIN biens_immo b ON ba.bien_id = b.id
       JOIN contacts_immo c ON ba.locataire_id = c.id
       JOIN agences_immo a ON le.agence_id = a.id
       WHERE le.id = $1 AND le.agence_id = $2`,
      [loyerId, agenceId]
    );

    if (rows.length === 0) return false;
    const l = rows[0];
    if (!l.locataire_tel) return false;

    const montantFmt = Number(l.montant || 0).toLocaleString('fr-FR');
    const msg = [
      `📋 *RAPPEL D'ÉCHÉANCE DE LOYER — ${l.agence_nom.toUpperCase()}*`,
      ``,
      `Bonjour ${l.locataire_nom},`,
      `Nous vous informons que le loyer pour la période *${l.periode}* d'un montant de *${montantFmt} FCFA* (${l.bien_titre}) est en attente de règlement.`,
      ``,
      `Si votre paiement a déjà été effectué récemment, nous vous prions d'ignorer ce message. Sinon, merci de bien vouloir régulariser auprès de l'agence.`,
      ``,
      `Cordialement,\nL'équipe de gestion ${l.agence_nom}${l.agence_tel ? ` (Tél: ${l.agence_tel})` : ''}`
    ].join('\n');

    await sendWhatsAppNotification(l.locataire_tel, {
      textMessage: msg,
      title: `Échéance de loyer ${l.periode}`,
      montant: `${montantFmt} FCFA`,
      detail: `Loyer en attente de règlement pour "${(l.bien_titre || '').slice(0, 40)}" (${l.periode}).`,
      url: SITE_URL,
      buttonParam: 'boutique'
    });

    return true;
  } catch (err) {
    console.error('[IMMO_WA_RELANCE_ERR] Erreur relance loyer WhatsApp:', err.message);
    return false;
  }
}

module.exports = {
  notifierDemandeVisiteAgence,
  notifierConfirmationVisite,
  notifierRelanceLoyerWhatsApp,
};
