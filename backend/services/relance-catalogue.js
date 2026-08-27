// backend/services/relance-catalogue.js — Moteur de relance & onboarding catalogue marchands
const cron = require('node-cron');
const { pool } = require('../models/db');
const { sendWhatsAppNotification, normalisePhone } = require('./whatsapp');
const settingsCache = require('../lib/settingsCache');

const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';

/**
 * Compile le message de relance en remplaçant les variables dynamiques
 */
function genererMessageRelance({ boutique, nbProduits = 0, template, titre }) {
  const prenom = boutique.proprietaire_prenom
    || (boutique.proprietaire_nom ? boutique.proprietaire_nom.trim().split(' ')[0] : 'Cher Marchand');
  const nom = boutique.proprietaire_nom || 'Marchand';
  const boutiqueNom = boutique.nom || 'Votre boutique';
  const lienBoutique = `${SITE}/boutique?tab=produits&id=${boutique.id}`;
  const lienCaisse = `${SITE}/boutique/caisse?manage=${boutique.id}`;
  const lienAccueil = `${SITE}/boutiques/${boutique.slug || boutique.id}`;

  const tpl = template || `👋 Bonjour {prenom}, félicitations pour la création de votre boutique *{boutique_nom}* sur Nopalou ! 🎉\n\nActuellement, votre boutique compte {nb_produits} produit(s). Pour commencer à recevoir des commandes et attirer des clients, voici les 5 façons rapides d'ajouter vos articles :\n\n1️⃣ 🪄 *L'Import Magique par Photo (IA)* :\nPrenez en photo vos articles ou une facture/catalogue et envoyez-les directement ici sur WhatsApp ou dans votre espace. L'IA crée la fiche produit (titre, description, prix) en 3 secondes !\n\n2️⃣ 🛍️ *Depuis votre Espace Marchand* :\nRendez-vous sur : {lien_boutique}\nCliquez sur « Ajouter un produit » pour renseigner photos, prix et stock.\n\n3️⃣ ⚡ *La Saisie Express (Caisse POS)* :\nEnregistrez vos articles en 1 clic lors de vos ventes au comptoir : {lien_caisse}\n\n4️⃣ 📊 *L'Import Excel / CSV* :\nImportez tout votre catalogue d'un coup si vous avez déjà un fichier.\n\n5️⃣ 🤖 *Discussion avec l'Assistant WhatsApp* :\nÉcrivez simplement les noms et prix de vos articles à ce numéro, l'assistant les enregistre directement.\n\nBesoin d'aide ou d'un conseil ? Répondez directement à ce message, l'équipe Nopalou vous accompagne ! 🤝`;

  const textMessage = tpl
    .replace(/\{prenom\}/gi, prenom)
    .replace(/\{nom\}/gi, nom)
    .replace(/\{boutique_nom\}/gi, boutiqueNom)
    .replace(/\{nb_produits\}/gi, String(nbProduits))
    .replace(/\{lien_boutique\}/gi, lienBoutique)
    .replace(/\{lien_caisse\}/gi, lienCaisse)
    .replace(/\{lien_accueil\}/gi, lienAccueil);

  const cleanTitle = (titre || `🛍️ ${boutiqueNom} — Ajoutez vos produits`).slice(0, 60);
  const detail = `Votre boutique "${boutiqueNom}" a ${nbProduits} produit(s). Ajoutez vos articles via Import IA, POS Caisse ou le catalogue en ligne pour lancer vos ventes.`;

  return {
    textMessage,
    title: cleanTitle,
    detail,
    url: lienBoutique,
    buttonParam: `boutique?tab=produits&id=${boutique.id}`,
  };
}

/**
 * Envoie la relance catalogue à une boutique spécifique
 */
async function envoyerRelanceCatalogueBoutique(boutiqueId, { messageCustom, titreCustom } = {}) {
  const { rows } = await pool.query(
    `SELECT b.id, b.nom, b.slug, b.telephone, b.whatsapp, b.actif,
            b.derniere_relance_catalogue_at, b.nb_relances_catalogue,
            u.nom AS proprietaire_nom, u.prenom AS proprietaire_prenom, u.telephone AS proprietaire_telephone,
            (SELECT COUNT(*)::int FROM boutique_produits WHERE boutique_id = b.id) AS nb_produits
     FROM boutiques b
     LEFT JOIN utilisateurs u ON u.id = b.utilisateur_id
     WHERE b.id = $1`,
    [boutiqueId]
  );

  if (!rows[0]) {
    throw new Error('Boutique introuvable');
  }

  const boutique = rows[0];
  const tel = boutique.whatsapp || boutique.telephone || boutique.proprietaire_telephone;
  if (!tel) {
    throw new Error(`Aucun numéro de téléphone WhatsApp disponible pour la boutique "${boutique.nom}"`);
  }

  const defaultTemplate = await settingsCache.get('relance_catalogue_template');
  const defaultTitre = await settingsCache.get('relance_catalogue_titre');

  const compiled = genererMessageRelance({
    boutique,
    nbProduits: boutique.nb_produits || 0,
    template: messageCustom || defaultTemplate,
    titre: titreCustom || defaultTitre,
  });

  const resNotif = await sendWhatsAppNotification(tel, {
    textMessage: compiled.textMessage,
    title: compiled.title,
    detail: compiled.detail,
    url: compiled.url,
    buttonParam: compiled.buttonParam,
  });

  await pool.query(
    `UPDATE boutiques 
     SET derniere_relance_catalogue_at = NOW(), 
         nb_relances_catalogue = COALESCE(nb_relances_catalogue, 0) + 1 
     WHERE id = $1`,
    [boutique.id]
  );

  return {
    success: true,
    boutiqueId: boutique.id,
    boutiqueNom: boutique.nom,
    telephone: normalisePhone(tel),
    nb_produits: boutique.nb_produits || 0,
    notification: resNotif,
    message: compiled.textMessage,
  };
}

/**
 * Envoie la relance à un groupe de boutiques (batch) avec temporisation
 */
async function batchRelancerCatalogueBoutiques(boutiqueIds, { messageCustom, titreCustom } = {}) {
  if (!Array.isArray(boutiqueIds) || boutiqueIds.length === 0) {
    return { successCount: 0, errorCount: 0, errors: [] };
  }

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const id of boutiqueIds) {
    try {
      await envoyerRelanceCatalogueBoutique(id, { messageCustom, titreCustom });
      successCount++;
      // Petite temporisation anti-saturation
      await new Promise(r => setTimeout(r, 400));
    } catch (err) {
      errorCount++;
      errors.push({ id, error: err.message });
    }
  }

  return { successCount, errorCount, errors };
}

/**
 * Récupère les boutiques éligibles à la relance selon les règles de configuration
 */
async function recupererBoutiquesEligiblesRelance() {
  const seuil = await settingsCache.getNum('relance_catalogue_seuil', 1);
  const delaiHeures = await settingsCache.getNum('relance_catalogue_delai_heures', 24);
  const intervalleJours = await settingsCache.getNum('relance_catalogue_intervalle_jours', 7);

  const query = `
    SELECT b.id, b.nom, b.slug, b.telephone, b.whatsapp, b.created_at,
           b.derniere_relance_catalogue_at, b.nb_relances_catalogue,
           u.nom AS proprietaire_nom, u.prenom AS proprietaire_prenom, u.telephone AS proprietaire_telephone,
           (SELECT COUNT(*)::int FROM boutique_produits WHERE boutique_id = b.id) AS nb_produits
    FROM boutiques b
    LEFT JOIN utilisateurs u ON u.id = b.utilisateur_id
    WHERE b.actif = true
      AND b.created_at <= NOW() - ($1 * INTERVAL '1 hour')
      AND (
        b.derniere_relance_catalogue_at IS NULL 
        OR b.derniere_relance_catalogue_at <= NOW() - ($2 * INTERVAL '1 day')
      )
      AND (SELECT COUNT(*)::int FROM boutique_produits WHERE boutique_id = b.id) <= $3
      AND (b.whatsapp IS NOT NULL OR b.telephone IS NOT NULL OR u.telephone IS NOT NULL)
    ORDER BY b.created_at DESC
    LIMIT 200
  `;

  const { rows } = await pool.query(query, [delaiHeures, intervalleJours, seuil]);
  return rows;
}

/**
 * Exécute la tâche automatisée de relance catalogue (Cron)
 */
async function executerCronRelanceCatalogue() {
  const actif = await settingsCache.getBool('relance_catalogue_actif', false);
  if (!actif) {
    return { skipped: true, reason: 'Cron relance catalogue désactivé' };
  }

  console.log('[CRON RELANCE CATALOGUE] 🚀 Vérification des boutiques sans produits...');
  const boutiques = await recupererBoutiquesEligiblesRelance();
  console.log(`[CRON RELANCE CATALOGUE] 🎯 ${boutiques.length} boutique(s) éligible(s) trouvée(s)`);

  if (boutiques.length === 0) {
    return { count: 0, message: 'Aucune boutique éligible' };
  }

  const ids = boutiques.map(b => b.id);
  const res = await batchRelancerCatalogueBoutiques(ids);
  console.log(`[CRON RELANCE CATALOGUE] ✅ Terminé : ${res.successCount} envoyés, ${res.errorCount} erreurs`);
  return res;
}

/**
 * Initialise la planification du Cron quotidien
 */
function demarrerCronRelanceCatalogue() {
  // Exécution tous les jours à 10h00
  cron.schedule('0 10 * * *', () => {
    executerCronRelanceCatalogue().catch(err => {
      console.error('[CRON RELANCE CATALOGUE ERR]:', err.message);
    });
  });
  console.log('[CRON] ⏰ Cron Relance Catalogue Marchands planifié (0 10 * * *)');
}

module.exports = {
  genererMessageRelance,
  envoyerRelanceCatalogueBoutique,
  batchRelancerCatalogueBoutiques,
  recupererBoutiquesEligiblesRelance,
  executerCronRelanceCatalogue,
  demarrerCronRelanceCatalogue,
};
