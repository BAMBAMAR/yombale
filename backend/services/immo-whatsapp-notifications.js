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
    const lienPaiement = `${SITE_URL}/payer-loyer/${l.id}`;
    const msg = [
      `📋 *RAPPEL D'ÉCHÉANCE DE LOYER — ${l.agence_nom.toUpperCase()}*`,
      ``,
      `Bonjour ${l.locataire_nom},`,
      `Nous vous informons que le loyer pour la période *${l.periode}* d'un montant de *${montantFmt} FCFA* (${l.bien_titre}) est en attente de règlement.`,
      ``,
      `👉 *Régler en 1 clic par Wave ou Orange Money & obtenir votre quittance :*`,
      lienPaiement,
      ``,
      `Si votre paiement a déjà été effectué, vous pouvez télécharger directement votre quittance sur ce même lien.`,
      ``,
      `Cordialement,\nL'équipe de gestion ${l.agence_nom}${l.agence_tel ? ` (Tél: ${l.agence_tel})` : ''}`
    ].join('\n');

    await sendWhatsAppNotification(l.locataire_tel, {
      textMessage: msg,
      title: `Échéance de loyer ${l.periode}`,
      montant: `${montantFmt} FCFA`,
      detail: `Loyer en attente de règlement pour "${(l.bien_titre || '').slice(0, 40)}" (${l.periode}).`,
      url: lienPaiement,
      buttonParam: 'boutique'
    });

    return true;
  } catch (err) {
    console.error('[IMMO_WA_RELANCE_ERR] Erreur relance loyer WhatsApp:', err.message);
    return false;
  }
}

/**
 * Notifie le locataire et l'agence par WhatsApp lors de la confirmation d'un paiement de loyer.
 */
async function notifierConfirmationPaiementLoyerWhatsApp({ loyerId, methodePaiement }) {
  try {
    const { rows } = await pool.query(
      `SELECT le.id, le.montant_paye, le.periode, le.quittance_url,
              b.titre AS bien_titre,
              c.nom AS locataire_nom, c.telephone AS locataire_tel, c.whatsapp AS locataire_wa,
              a.nom AS agence_nom, a.telephone AS agence_tel, a.whatsapp AS agence_wa
       FROM loyers_echeances le
       JOIN baux_immo ba ON le.bail_id = ba.id
       JOIN biens_immo b ON ba.bien_id = b.id
       JOIN contacts_immo c ON ba.locataire_id = c.id
       JOIN agences_immo a ON le.agence_id = a.id
       WHERE le.id = $1`,
      [loyerId]
    );

    if (rows.length === 0) return false;
    const l = rows[0];
    const telLocataire = (l.locataire_wa && l.locataire_wa.trim()) || (l.locataire_tel && l.locataire_tel.trim());
    const telAgence = (l.agence_wa && l.agence_wa.trim()) || (l.agence_tel && l.agence_tel.trim());
    const montantFmt = Number(l.montant_paye || 0).toLocaleString('fr-FR');
    const lienQuittance = `${SITE_URL}/api/locatif-immo/mes-locations/quittance/${l.id}.pdf`;

    if (telLocataire) {
      const msgLocataire = [
        `✅ *NOPALOU IMMO — QUITTANCE DE LOYER DISPONIBLE*`,
        ``,
        `Bonjour ${l.locataire_nom},`,
        `Votre règlement de loyer pour la période *${l.periode}* d'un montant de *${montantFmt} FCFA* (${l.bien_titre}) a été validé avec succès (${methodePaiement || 'Wave'}).`,
        ``,
        `📄 *Télécharger votre quittance officielle certifiée* :`,
        lienQuittance,
        ``,
        `Merci de votre confiance,\nL'agence ${l.agence_nom}`
      ].join('\n');

      sendWhatsAppNotification(telLocataire, {
        textMessage: msgLocataire,
        title: `Quittance de loyer ${l.periode}`,
        montant: `${montantFmt} FCFA`,
        detail: `Paiement validé pour "${(l.bien_titre || '').slice(0, 40)}" (${l.periode}).`,
        url: lienQuittance,
        buttonParam: 'boutique'
      }).catch(() => {});
    }

    if (telAgence) {
      const msgAgence = [
        `🔔 *NOPALOU IMMO — ENCAISSEMENT DE LOYER REÇU !*`,
        ``,
        `👤 *Locataire* : ${l.locataire_nom}`,
        `🏠 *Bien* : ${l.bien_titre}`,
        `💰 *Montant encaissé* : *${montantFmt} FCFA* (${l.periode})`,
        `💳 *Mode* : ${methodePaiement || 'Wave'}`,
        ``,
        `La quittance de loyer a été émise automatiquement.`
      ].join('\n');

      sendWhatsAppNotification(telAgence, {
        textMessage: msgAgence,
        title: `Loyer encaissé ${l.periode}`,
        montant: `${montantFmt} FCFA`,
        detail: `Encaissement loyer de ${l.locataire_nom} (${l.periode}).`,
        url: `${SITE_URL}/agence`,
        buttonParam: 'boutique'
      }).catch(() => {});
    }

    return true;
  } catch (err) {
    console.error('[IMMO_WA_PAIEMENT_CONFIRM_ERR]:', err.message);
    return false;
  }
}

/**
 * Notifie proactivement l'agence sur WhatsApp lorsqu'un nouveau bien match avec des prospects de son CRM.
 */
async function notifierMatchingProspectsAgenceWhatsApp({ bien, prospects, agence }) {
  try {
    if (!agence || !bien || !prospects || prospects.length === 0) return false;
    const agenceTel = (agence.whatsapp && agence.whatsapp.trim()) || (agence.telephone && agence.telephone.trim());
    if (!agenceTel) return false;

    const prix = Number(bien.prix_location || bien.prix_vente || 0);
    const prixFmt = prix > 0 ? `${prix.toLocaleString('fr-FR')} FCFA` : 'Prix sur demande';
    const slugAgence = agence.slug || 'espace';
    const lienCrm = `${SITE_URL}/agence/${slugAgence}/crm`;

    const lignesProspects = prospects.slice(0, 3).map((p, idx) => {
      const tel = p.whatsapp || p.telephone || 'Non renseigné';
      const score = p.score_matching || 75;
      return `${idx + 1}. *${p.prenom ? `${p.prenom} ` : ''}${p.nom}* (${score}% match)\n   📞 ${tel}\n   🎯 ${(p.raisons || []).slice(0, 2).join(' • ') || 'Budget & critères compatibles'}`;
    });

    const msgAgence = [
      `🎯 *NOPALOU IMMO — ${prospects.length} PROSPECT(S) QUALIFIÉ(S) DÉTECTÉ(S) !*`,
      ``,
      `Un nouveau bien vient d'intégrer votre portefeuille :`,
      `🏠 *${bien.titre}* (${bien.ville || 'Dakar'}${bien.quartier ? ` - ${bien.quartier}` : ''})`,
      `💰 *Tarif* : ${prixFmt}`,
      ``,
      `*Acheteurs / Locataires ciblés prêts à visiter :*`,
      lignesProspects.join('\n\n'),
      ``,
      `👉 *Ouvrir votre CRM pour les contacter en 1 clic :*`,
      lienCrm
    ].join('\n');

    await sendWhatsAppNotification(agenceTel, {
      textMessage: msgAgence,
      title: `${prospects.length} prospect(s) qualifié(s) trouvé(s)`,
      montant: 'Nopalou Immo CRM',
      detail: `${prospects.length} contact(s) correspondent à votre bien "${(bien.titre || '').slice(0, 40)}".`,
      url: lienCrm,
      buttonParam: 'boutique'
    });

    return true;
  } catch (err) {
    console.error('[IMMO_WA_MATCHING_ERR] Erreur notification matching WhatsApp:', err.message);
    return false;
  }
}

/**
 * Notifie automatiquement un locataire par WhatsApp de la mise en place de son contrat de bail
 * et lui donne le lien direct vers son espace personnel "Mes Locations & Quittances".
 */
async function notifierNouveauBailLocataireWhatsApp({ bailId }) {
  try {
    const { rows } = await pool.query(
      `SELECT bx.id, bx.loyer_mensuel, bx.charges, bx.jour_echeance, bx.date_debut, bx.date_fin,
              b.titre AS bien_titre, b.quartier AS bien_quartier, b.ville AS bien_ville,
              c.nom AS locataire_nom, c.prenom AS locataire_prenom, c.telephone AS locataire_tel, c.whatsapp AS locataire_wa,
              a.nom AS agence_nom, a.telephone AS agence_tel, a.whatsapp AS agence_wa, a.slug AS agence_slug
       FROM baux_immo bx
       JOIN biens_immo b ON bx.bien_id = b.id
       JOIN contacts_immo c ON bx.locataire_id = c.id
       JOIN agences_immo a ON bx.agence_id = a.id
       WHERE bx.id = $1`,
      [bailId]
    );

    if (rows.length === 0) return false;
    const b = rows[0];
    const telLocataire = (b.locataire_wa && b.locataire_wa.trim()) || (b.locataire_tel && b.locataire_tel.trim());
    if (!telLocataire) return false;

    const loyerFmt = Number(b.loyer_mensuel || 0).toLocaleString('fr-FR');
    const chargesFmt = Number(b.charges || 0).toLocaleString('fr-FR');
    const totalFmt = (Number(b.loyer_mensuel || 0) + Number(b.charges || 0)).toLocaleString('fr-FR');
    const lienCompte = `${SITE_URL}/compte?tab=locations`;

    const msgLocataire = [
      `🏠 *FÉLICITATIONS ! VOTRE CONTRAT DE LOCATION EST VALIDÉ*`,
      ``,
      `Bonjour ${b.locataire_prenom ? `${b.locataire_prenom} ` : ''}${b.locataire_nom},`,
      `Votre contrat de bail pour le logement *"${b.bien_titre}"* (${b.bien_ville}${b.bien_quartier ? ` - ${b.bien_quartier}` : ''}) a été enregistré avec succès par l'agence *${b.agence_nom}*.`,
      ``,
      `📋 *Synthèse de votre bail :*`,
      `- Loyer mensuel : *${loyerFmt} FCFA*${Number(b.charges) > 0 ? ` (+ charges : ${chargesFmt} FCFA)` : ''}`,
      `- Total mensuel : *${totalFmt} FCFA*`,
      `- Échéance : le *${b.jour_echeance || 5}* de chaque mois`,
      `- Début du bail : ${new Date(b.date_debut).toLocaleDateString('fr-FR')}`,
      ``,
      `📄 *Consulter votre contrat, payer par Wave et télécharger vos quittances officielles :*`,
      lienCompte,
      ``,
      `Bienvenue dans votre nouveau logement,\nL'agence ${b.agence_nom} & Nopalou Immo`
    ].join('\n');

    await sendWhatsAppNotification(telLocataire, {
      textMessage: msgLocataire,
      title: 'Contrat de bail validé',
      montant: `${totalFmt} FCFA/mois`,
      detail: `Bail actif pour "${(b.bien_titre || '').slice(0, 40)}" chez ${b.agence_nom}.`,
      url: lienCompte,
      buttonParam: 'boutique'
    });

    return true;
  } catch (err) {
    console.error('[IMMO_WA_NOUVEAU_BAIL_ERR]:', err.message);
    return false;
  }
}

module.exports = {
  notifierDemandeVisiteAgence,
  notifierConfirmationVisite,
  notifierRelanceLoyerWhatsApp,
  notifierConfirmationPaiementLoyerWhatsApp,
  notifierMatchingProspectsAgenceWhatsApp,
  notifierNouveauBailLocataireWhatsApp,
};

