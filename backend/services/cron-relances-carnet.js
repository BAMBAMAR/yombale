// backend/services/cron-relances-carnet.js
// Service d'arrière-plan pour la relance automatique WhatsApp selon les dates d'échéance du carnet

const db = require('../models/db');
const pool = db.pool || db;
const whatsappHealth = require('./whatsapp-health');

let whatsappService;
try {
  whatsappService = require('./whatsapp');
} catch (e) {
  whatsappService = null;
}

const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';

function normaliserTelephone(phone) {
  if (!phone) return null;
  let num = String(phone).replace(/[^\d]/g, '');
  if (num.startsWith('00221')) num = num.slice(2);
  if (num.length === 9) num = '221' + num;
  return num;
}

function estNumeroValide(phone) {
  const norm = normaliserTelephone(phone);
  if (!norm) return false;
  // Numéro valide international ou sénégalais (10 à 15 chiffres)
  return norm.length >= 10 && norm.length <= 15;
}

/**
 * Exécute la vérification des échéances du carnet et envoie les relances WhatsApp automatiques.
 * Si boutiqueId est fourni, traite uniquement cette boutique. Sinon, traite toutes les boutiques.
 */
async function traiterRelancesAutomatiquesWhatsApp(boutiqueId = null) {
  try {
    // Vérifier l'état du service WhatsApp avant de lancer des relances par lot
    if (whatsappHealth.isDegraded()) {
      console.warn('[RELANCE AUTO WA] Service WhatsApp actuellement dégradé. Relances reportées.');
      return { succes: false, reporte: true, raison: 'whatsapp_degrade', relancesEnvoyees: 0 };
    }

    if (!whatsappService) {
      console.warn('[RELANCE AUTO WA] Module WhatsApp non disponible.');
      return { succes: false, error: 'Module WhatsApp manquant', relancesEnvoyees: 0 };
    }

    // 1. Chercher toutes les créances impayées avec échéance aujourd'hui ou dépassée (relance_auto_whatsapp = true)
    // dont aucune relance n'a été envoyée aujourd'hui.
    // DÉDUPLICATION PAR CLIENT pour éviter de spammer un client ayant plusieurs factures le même jour.
    const params = [];
    let boutiqueCondition = '';
    if (boutiqueId) {
      params.push(boutiqueId);
      boutiqueCondition = `AND b.id = $${params.length}`;
    }

    const query = `
      SELECT 
        c.id AS client_id,
        c.nom AS client_nom,
        c.telephone AS client_tel,
        c.solde AS client_solde,
        b.id AS boutique_id,
        b.nom AS boutique_nom,
        b.slug AS boutique_slug,
        b.telephone AS boutique_tel,
        b.whatsapp AS boutique_whatsapp,
        MIN(h.date_echeance) AS plus_ancienne_echeance,
        COUNT(h.id) AS nb_creances,
        ARRAY_AGG(h.id) AS trans_ids
      FROM caisse_credit_historique h
      JOIN caisse_clients_credits c ON h.client_id = c.id
      JOIN boutiques b ON h.boutique_id = b.id
      WHERE 
        c.solde > 0
        AND h.type = 'vente_credit'
        AND h.relance_auto_whatsapp = true
        AND h.date_echeance IS NOT NULL
        AND h.date_echeance <= CURRENT_DATE
        AND (h.derniere_relance_whatsapp IS NULL OR h.derniere_relance_whatsapp < CURRENT_DATE)
        ${boutiqueCondition}
      GROUP BY c.id, c.nom, c.telephone, c.solde, b.id, b.nom, b.slug, b.telephone, b.whatsapp
    `;

    const { rows } = await pool.query(query, params);
    if (!rows || rows.length === 0) {
      console.log(`[RELANCE AUTO WA] Aucune créance échue à relancer aujourd'hui${boutiqueId ? ` (boutique ${boutiqueId})` : ''}.`);
      return { succes: true, relancesEnvoyees: 0 };
    }

    console.log(`[RELANCE AUTO WA] 📋 ${rows.length} client(s) débiteur(s) avec échéance dépassée détectés.`);

    // Numéro d'envoi officiel Nopalou pour éviter de s'envoyer des messages à soi-même (Erreur Meta 100)
    const telNopalouPlateforme = '221708717942';

    let envoyees = 0;
    for (const r of rows) {
      const soldeNum = Number(r.client_solde);
      if (soldeNum <= 0) continue;

      const normClientTel = normaliserTelephone(r.client_tel);
      if (!normClientTel || !estNumeroValide(r.client_tel)) {
        console.warn(`[RELANCE AUTO WA] Numéro invalide ou incomplet (${r.client_tel}) pour le client ${r.client_nom}.`);
        continue;
      }

      // Éviter l'envoi vers le numéro de la plateforme elle-même (évite l'erreur Meta 100)
      if (normClientTel === telNopalouPlateforme) {
        console.warn(`[RELANCE AUTO WA] Numéro client identique au numéro Nopalou (${normClientTel}), relance ignorée.`);
        continue;
      }

      const dateEchFmt = r.plus_ancienne_echeance ? new Date(r.plus_ancienne_echeance).toLocaleDateString('fr-FR') : 'échéance dépassée';
      const contactBq = r.boutique_whatsapp || r.boutique_tel || '';
      const bqParam = r.boutique_slug || r.boutique_id;
      const bqUrl = `${SITE}/boutiques/${bqParam}`;

      const textMessage = `Bonjour ${r.client_nom},\n\n` +
        `Rappel amical de *${r.boutique_nom}* concernant votre carnet de crédit.\n` +
        `Montant dû : *${soldeNum.toLocaleString('fr-FR')} FCFA*\n` +
        `Date d'échéance : *${dateEchFmt}*\n\n` +
        `Merci de bien vouloir passer régler votre solde ou nous contacter.\n` +
        (contactBq ? `Tel boutique : ${contactBq}\n` : '') +
        `Lien : ${bqUrl}`;

      const templateTitle = `💳 Rappel de solde — ${r.boutique_nom}`.slice(0, 60);
      const templateDetail = `Bonjour ${r.client_nom}. Rappel amical de ${r.boutique_nom} : votre solde impayé s'élève à ${soldeNum.toLocaleString('fr-FR')} FCFA (échéance : ${dateEchFmt}). Merci de régulariser.`.slice(0, 1000);

      try {
        let sent = false;

        // Priorité : sendWhatsAppNotification qui combine texte libre + template certifié Meta 'nopalou_fiche_texte'
        // permettant de contourner la restriction de fenêtre 24h Meta (anti-erreur 131047).
        if (typeof whatsappService.sendWhatsAppNotification === 'function') {
          const resNotif = await whatsappService.sendWhatsAppNotification(normClientTel, {
            textMessage,
            title: templateTitle,
            detail: templateDetail,
            url: bqUrl,
            buttonParam: bqParam,
          });
          if (resNotif) sent = true;
        } else if (typeof whatsappService.sendWhatsAppText === 'function') {
          await whatsappService.sendWhatsAppText(normClientTel, textMessage);
          sent = true;
        }

        if (sent) {
          envoyees++;
          // Marquer la date de dernière relance sur TOUTES les transactions échues de ce client
          if (Array.isArray(r.trans_ids) && r.trans_ids.length > 0) {
            await pool.query(
              `UPDATE caisse_credit_historique SET derniere_relance_whatsapp = NOW() WHERE id = ANY($1::uuid[])`,
              [r.trans_ids]
            );
          }
        }
      } catch (errApi) {
        console.warn(`[RELANCE AUTO WA] Échec envoi vers ${normClientTel}:`, errApi.message);
        if (whatsappHealth.isDegraded()) {
          console.warn('[RELANCE AUTO WA] WhatsApp en panne critique, arrêt des relances.');
          break;
        }
      }
    }

    console.log(`[RELANCE AUTO WA] ✅ ${envoyees} relances WhatsApp traitées avec succès.`);
    return { succes: true, relancesEnvoyees: envoyees };
  } catch (err) {
    console.error('[RELANCE AUTO WA CRON FAIL]', err);
    return { succes: false, error: err.message, relancesEnvoyees: 0 };
  }
}

// Planifier l'exécution quotidienne (toutes les 12 heures)
if (process.env.NODE_ENV !== 'test') {
  setTimeout(() => {
    traiterRelancesAutomatiquesWhatsApp().catch(() => {});
    setInterval(() => {
      traiterRelancesAutomatiquesWhatsApp().catch(() => {});
    }, 12 * 60 * 60 * 1000); // 12 heures
  }, 10000);
}

module.exports = {
  traiterRelancesAutomatiquesWhatsApp,
  normaliserTelephone,
  estNumeroValide
};
