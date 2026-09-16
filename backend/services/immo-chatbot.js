// backend/services/immo-chatbot.js
// Assistant Immobilier Intelligent WhatsApp Nopalou (Bimodal : Public Visiteur & Agent Pro)

const { pool } = require('../models/db');
const { sendWhatsAppText, sendWhatsAppCarousel } = require('./whatsapp');

const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';
const prixFmt = (p) => (p ? new Intl.NumberFormat('fr-FR').format(p) + ' FCFA' : 'N/C');

// Mots-clés déclencheurs d'intention immobilière spécifiques
const MOTS_CLES_IMMO = [
  'immo', 'immobilier', 'immobiliere', 'appartement', 'appartements', 'appart', 'apparts',
  'villa', 'villas', 'maison', 'maisons', 'terrain', 'terrains',
  'studio', 'studios', 'immeuble', 'immeubles', 'hangar', 'duplex',
  'louer', 'location', 'a louer', 'bail', 'baux', 'loyer', 'loyers', 'quittance',
  'a vendre', 'agence immo', 'visite', 'visites', 'prospect', 'prospects', 'rdv visite'
];

// Termes géographiques à combiner avec verbes ou recherche
const QUARTIERS_IMMO = [
  'almadies', 'ngor', 'ouakam', 'mermoz', 'fann', 'plateau', 'point e',
  'yoff', 'nord foire', 'sud foire', 'sacré coeur', 'sacre coeur', 'maristes',
  'liberté', 'liberte', 'vdn', 'saly', 'somone', 'ngaparou'
];

/**
 * Détecte si le message de l'utilisateur exprime une intention immobilière.
 */
function detecterIntentionImmo(texte) {
  if (!texte || typeof texte !== 'string') return false;
  const t = texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // 1. Mots-clés immo explicites
  const hasImmoDirect = MOTS_CLES_IMMO.some((mot) => {
    const normMot = mot.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const regex = new RegExp(`(^|\\s|[^a-zA-Z0-9])${normMot}($|\\s|[^a-zA-Z0-9])`, 'i');
    return regex.test(t);
  });
  if (hasImmoDirect) return true;

  // 2. Termes d'achat / recherche associés à un quartier spécifique
  const hasVerbe = /\b(cherche|trouve|visiter|achat|acheter|vendre|vente)\b/i.test(t);
  const hasQuartier = QUARTIERS_IMMO.some((q) => {
    const normQ = q.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return new RegExp(`(^|\\s|[^a-zA-Z0-9])${normQ}($|\\s|[^a-zA-Z0-9])`, 'i').test(t);
  });

  return hasVerbe && hasQuartier;
}

/**
 * Identifie si un numéro de téléphone appartient à un dirigeant ou agent d'une agence.
 */
async function trouverAgenceAgentParTelephone(phone) {
  try {
    const cleanPh = String(phone || '').replace(/\D/g, '');
    const shortPh = cleanPh.slice(-9);

    const { rows } = await pool.query(
      `SELECT a.id, a.nom, a.slug, a.telephone, a.whatsapp, 'owner' AS role
       FROM agences_immo a
       WHERE a.statut = 'actif'
         AND (REPLACE(REPLACE(a.telephone, ' ', ''), '+', '') LIKE '%' || $1
           OR REPLACE(REPLACE(a.whatsapp, ' ', ''), '+', '') LIKE '%' || $1)
       UNION
       SELECT a.id, a.nom, a.slug, a.telephone, a.whatsapp, am.role
       FROM agence_membres am
       JOIN agences_immo a ON am.agence_id = a.id
       JOIN utilisateurs u ON am.utilisateur_id = u.id
       WHERE a.statut = 'actif' AND am.actif = true
         AND REPLACE(REPLACE(u.telephone, ' ', ''), '+', '') LIKE '%' || $1
       LIMIT 1`,
      [shortPh]
    );

    return rows[0] || null;
  } catch (err) {
    console.error('[IMMO_CHATBOT:trouverAgenceAgentParTelephone]', err.message);
    return null;
  }
}

/**
 * Mode 1 : Assistant Interne Agent Pro (Visites, Prospects, Loyers)
 */
async function traiterRequeteAgent(phone, agence, texte) {
  const t = texte.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 1. Demande de Visites
  if (t.includes('visite') || t.includes('rdv') || t.includes('rendez-vous') || t.includes('planning')) {
    const { rows: visites } = await pool.query(
      `SELECT v.id, v.date_visite, v.statut, b.titre AS bien_titre, c.nom AS contact_nom, c.telephone AS contact_tel
       FROM visites_immo v
       JOIN biens_immo b ON v.bien_id = b.id
       JOIN contacts_immo c ON v.contact_id = c.id
       WHERE v.agence_id = $1 AND v.date_visite >= CURRENT_DATE - INTERVAL '1 day'
       ORDER BY v.date_visite ASC
       LIMIT 5`,
      [agence.id]
    );

    if (visites.length === 0) {
      await sendWhatsAppText(
        phone,
        `📅 *Planning Visites — ${agence.nom}*\n\n` +
        `Aucune visite programmée pour les prochains jours.\n\n` +
        `👉 Accédez à votre tableau de bord : ${SITE}/agence/${agence.slug}/visites`
      );
      return true;
    }

    let msg = `📅 *Vos Prochaines Visites — ${agence.nom}*\n\n`;
    visites.forEach((v, idx) => {
      const d = new Date(v.date_visite).toLocaleString('fr-FR', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
      });
      msg += `${idx + 1}. *${v.bien_titre}*\n`;
      msg += `   └ 👤 Contact : ${v.contact_nom} (${v.contact_tel})\n`;
      msg += `   └ ⏰ Date : *${d}* (${v.statut})\n\n`;
    });
    msg += `👉 Gérer le calendrier complet : ${SITE}/agence/${agence.slug}/visites`;

    await sendWhatsAppText(phone, msg);
    return true;
  }

  // 2. Demande de Prospects / Leads CRM
  if (t.includes('prospect') || t.includes('lead') || t.includes('contact') || t.includes('client')) {
    const { rows: prospects } = await pool.query(
      `SELECT nom, prenom, telephone, type_operation, budget_max, created_at, statut_crm
       FROM contacts_immo
       WHERE agence_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [agence.id]
    );

    if (prospects.length === 0) {
      await sendWhatsAppText(
        phone,
        `👥 *Prospects CRM — ${agence.nom}*\n\nAucun prospect enregistré récemment.\n👉 Gérer votre CRM : ${SITE}/agence/${agence.slug}/prospects`
      );
      return true;
    }

    let msg = `👥 *Derniers Prospects Enregistrés — ${agence.nom}*\n\n`;
    prospects.forEach((p, idx) => {
      msg += `${idx + 1}. *${p.nom} ${p.prenom || ''}*\n`;
      msg += `   └ 📞 ${p.telephone} · ${p.type_operation === 'vente' ? 'Achat' : 'Location'}\n`;
      if (p.budget_max) msg += `   └ 💰 Budget : *${prixFmt(p.budget_max)}*\n`;
      msg += `   └ 🏷️ Statut : *${p.statut_crm}*\n\n`;
    });
    msg += `👉 Voir tout le pipeline CRM : ${SITE}/agence/${agence.slug}/prospects`;

    await sendWhatsAppText(phone, msg);
    return true;
  }

  // 3. Demande d'Échéances / Loyers impayés
  if (t.includes('loyer') || t.includes('impaye') || t.includes('echeance') || t.includes('quittance')) {
    const { rows: loyers } = await pool.query(
      `SELECT le.periode, le.montant_du, le.montant_restant, le.date_echeance, le.statut,
              b.titre AS bien_titre, c.nom AS locataire_nom
       FROM loyers_echeances le
       JOIN baux_immo bx ON le.bail_id = bx.id
       JOIN biens_immo b ON bx.bien_id = b.id
       JOIN contacts_immo c ON bx.locataire_id = c.id
       WHERE le.agence_id = $1 AND le.statut IN ('en_attente', 'en_retard')
       ORDER BY le.date_echeance ASC
       LIMIT 5`,
      [agence.id]
    );

    if (loyers.length === 0) {
      await sendWhatsAppText(
        phone,
        `💳 *Gestion Locative — ${agence.nom}*\n\nTous les loyers sont à jour ! Aucun impayé en cours.\n👉 Accès gestion locative : ${SITE}/agence/${agence.slug}/locatif`
      );
      return true;
    }

    let msg = `⚠️ *Loyers en Attente / Retard — ${agence.nom}*\n\n`;
    loyers.forEach((l, idx) => {
      msg += `${idx + 1}. *${l.locataire_nom}* (${l.bien_titre})\n`;
      msg += `   └ Période : ${l.periode} · Dû : *${prixFmt(l.montant_restant || l.montant_du)}*\n`;
      msg += `   └ Statut : ${l.statut === 'en_retard' ? '🚨 En retard' : '⏳ En attente'}\n\n`;
    });
    msg += `👉 Encaisser ou envoyer quittance : ${SITE}/agence/${agence.slug}/locatif`;

    await sendWhatsAppText(phone, msg);
    return true;
  }

  // Menu Agent Pro par défaut
  await sendWhatsAppText(
    phone,
    `🏢 *Espace Agent Pro — ${agence.nom}*\n\n` +
    `Tapez une commande rapide pour gérer votre activité :\n` +
    `• *VISITES* : Voir vos prochaines visites programmées\n` +
    `• *PROSPECTS* : Consulter les derniers leads CRM reçus\n` +
    `• *LOYERS* : Consulter les impayés et échéances de loyers\n` +
    `• *BIENS* : Accéder à votre portefeuille\n\n` +
    `👉 Tableau de bord web : ${SITE}/agence/${agence.slug}`
  );
  return true;
}

/**
 * Mode 2 : Recherche Immobilière Naturelle pour le Grand Public
 */
async function traiterRechercheImmoPublic(phone, texte) {
  const t = texte.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Extraction d'intention transaction
  const isVente = t.includes('vendre') || t.includes('achat') || t.includes('acheter') || t.includes('vente');
  const transaction = isVente ? 'vente' : 'location';

  // Extraction typologie
  let typeBien = null;
  if (t.includes('villa')) typeBien = 'villa';
  else if (t.includes('appartement') || t.includes('appart')) typeBien = 'appartement';
  else if (t.includes('studio')) typeBien = 'studio';
  else if (t.includes('terrain')) typeBien = 'terrain';
  else if (t.includes('bureau')) typeBien = 'bureau';
  else if (t.includes('chambre')) typeBien = 'chambre';

  // Extraction quartier principal
  const QUARTIERS = [
    'almadies', 'ngor', 'ouakam', 'mermoz', 'fann', 'plateau', 'point e',
    'yoff', 'nord foire', 'sud foire', 'sacre coeur', 'maristes', 'liberte',
    'vdn', 'saly', 'somone', 'ngaparou', 'thies'
  ];
  let quartier = null;
  for (const q of QUARTIERS) {
    if (t.includes(q)) {
      quartier = q;
      break;
    }
  }

  // Recherche dans la base de données
  let query = `
    SELECT ai.id, ai.titre, ai.prix, ai.ville, ai.quartier, ai.type_bien, ai.transaction,
           ai.surface_m2, ai.photos, ag.nom AS agence_nom, ag.id AS agence_id
    FROM annonces_immo ai
    LEFT JOIN agences_immo ag ON ai.agence_id = ag.id
    WHERE ai.actif = true AND ai.supprimee = false
  `;
  const params = [];
  let pIdx = 1;

  if (transaction) {
    query += ` AND ai.transaction = $${pIdx++}`;
    params.push(transaction);
  }
  if (typeBien) {
    query += ` AND (LOWER(ai.type_bien) LIKE '%' || $${pIdx} || '%')`;
    params.push(typeBien);
    pIdx++;
  }
  if (quartier) {
    query += ` AND (ai.quartier ILIKE '%' || $${pIdx} || '%' OR ai.titre ILIKE '%' || $${pIdx} || '%')`;
    params.push(quartier);
    pIdx++;
  }

  query += ` ORDER BY (ai.sponsorisee = true AND ai.sponsorisee_jusqu_au > NOW()) DESC, ai.created_at DESC LIMIT 3`;

  const { rows } = await pool.query(query, params);

  if (rows.length === 0) {
    await sendWhatsAppText(
      phone,
      `🏠 *Nopalou Immobilier*\n\n` +
      `Je n'ai pas trouvé de bien correspondant exactement à votre recherche : *"${texte}"*.\n\n` +
      `💡 *Conseil :* Précisez le type et le quartier (ex: *Appartement à louer Mermoz* ou *Villa Almadies*).\n\n` +
      `👉 Parcourez toutes les annonces disponibles : ${SITE}/immo`
    );
    return true;
  }

  // Formatage des résultats
  let reponse = `🏠 *Opportunités Immobilières Nopalou (${transaction === 'vente' ? 'Vente' : 'Location'})* :\n\n`;

  rows.forEach((b, idx) => {
    reponse += `${idx + 1}. *${b.titre}*\n`;
    reponse += `   💰 Prix : *${prixFmt(b.prix)}*${b.transaction === 'location' ? ' /mois' : ''}\n`;
    reponse += `   📍 ${[b.quartier, b.ville].filter(Boolean).join(', ') || 'Sénégal'}`;
    if (b.surface_m2) reponse += ` · ${Math.round(b.surface_m2)} m²`;
    reponse += `\n`;
    if (b.agence_nom) reponse += `   🏢 Géré par : *${b.agence_nom}*\n`;
    reponse += `   👉 Fiche & Photos : ${SITE}/immo/${b.id}\n\n`;
  });

  reponse += `📞 *Envie de visiter ou de contacter l'agence ?*\n` +
    `Cliquez directement sur le lien du bien ou répondez en indiquant vos disponibilités !`;

  await sendWhatsAppText(phone, reponse);

  // Ingestion automatique en prospect si le premier bien appartient à une agence
  if (rows[0]?.agence_id) {
    try {
      const cleanPh = String(phone || '').replace(/\D/g, '');
      const noteTxt = `[${new Date().toLocaleDateString('fr-FR')} - Chatbot WhatsApp] Requête: "${texte}"`;
      await pool.query(
        `INSERT INTO contacts_immo (
          agence_id, type_contact, nom, telephone, whatsapp,
          statut_crm, type_operation, source, notes
        ) VALUES (
          $1, 'prospect', $2, $3, $4,
          'nouveau', $5, 'chatbot_whatsapp', $6
        ) ON CONFLICT DO NOTHING`,
        [rows[0].agence_id, `Prospect WA ${cleanPh.slice(-4)}`, cleanPh, cleanPh, transaction, noteTxt]
      );
    } catch (_) {}
  }

  return true;
}

/**
 * Point d'entrée principal pour le flux immobilier du chatbot.
 */
async function traiterMessageImmo(phone, texte) {
  try {
    // 1. Vérifier si l'émetteur est un Agent ou Dirigeant d'agence
    const agenceAgent = await trouverAgenceAgentParTelephone(phone);
    if (agenceAgent) {
      const t = texte.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const isCommandeAgent =
        t.includes('visite') || t.includes('rdv') || t.includes('prospect') ||
        t.includes('lead') || t.includes('loyer') || t.includes('impaye') ||
        t.includes('agence') || t.includes('gestion') || t.includes('biens');

      if (isCommandeAgent) {
        return await traiterRequeteAgent(phone, agenceAgent, texte);
      }
    }

    // 2. Traitement recherche publique visiteur
    return await traiterRechercheImmoPublic(phone, texte);
  } catch (err) {
    console.error('[IMMO_CHATBOT:traiterMessageImmo]', err.message);
    return false;
  }
}

module.exports = {
  detecterIntentionImmo,
  trouverAgenceAgentParTelephone,
  traiterMessageImmo,
};
