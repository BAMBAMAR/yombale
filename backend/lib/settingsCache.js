// Cache mémoire pour la table settings — évite une requête DB à chaque paiement
const { pool } = require('../models/db');

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cache = {};
let lastLoaded = 0;

// Valeurs par défaut si la table settings est vide
const DEFAULTS = {
  quota_annonces_gratuit: '2',
  prix_annonce:        '1500',
  prix_sponsoring:     '5000',
  prix_boost:          '500',
  boost_duree_jours:   '7',
  plan_decouverte_prix: '2500',
  plan_pro_prix:       '5000',
  plan_business_prix:  '10000',
  plan_decouverte_label: 'Boutique Taf Taf',
  abonnement_essai_jours: '30',
  plan_pro_label:      'Boutique Pro',
  plan_business_label: 'Boutique Business',
  reduc_3_mois:        '10',
  reduc_6_mois:        '15',
  reduc_12_mois:       '25',
  commission_business: '2.0',
  paiement_wave:       'true',
  paiement_orange:     'true',
  paiement_manuel_actif:      'true',
  paiement_manuel_numero_wave: '',
  paiement_manuel_numero_om:   '',
  promo_active:        'false',
  promo_code:          '',
  promo_reduction:     '0',      // pourcentage de réduction
  promo_expiry:        '',
  whatsapp_enabled:    'true',
  whatsapp_chatbot:    'true',
  apporteur_actif:            'true',
  apporteur_taux_commission:  '20',
  apporteur_seuil_paiement:   '3000',
  apporteur_cookie_jours:     '30',
  max_boutiques_par_compte:   '3',
  max_boutiques_par_telephone:'3',
  alertes_abonnement_jours_avant: '7',
  alertes_abonnement_whatsapp: 'true',
  alertes_abonnement_email:   'true',
  contrat_vendeur_requis:     'true',
  contrat_vendeur_texte:      `CONTRAT DE SERVICES & CHARTE VENDEUR NOPALOU\n(Conditions Générales de Vente et d'Utilisation Marchand)\n\nARTICLE 1 : OBJET DU CONTRAT\nLe présent contrat définit les conditions juridiques, financières et techniques selon lesquelles la plateforme NOPALOU met à disposition du Marchand ses outils SaaS de création de boutique en ligne, de caisse enregistreuse (POS), de gestion de catalogue et de passerelle d'encaissement (Wave / Orange Money).\n\nARTICLE 2 : FORFAITS & PÉRIODE D'ESSAI\n1. Période d'Essai Offerte : Toute nouvelle boutique bénéficie de son premier mois (30 jours) 100% OFFERT sur le forfait souscrit.\n2. Plans & Abonnements : À l'issue des 30 jours offerts, l'abonnement mensuel est tacitement reconduit selon le tarif en vigueur du plan choisi.\n3. Modifications : Les tarifs d'abonnement sont ajustables depuis les paramètres généraux de la plateforme.\n\nARTICLE 3 : COMMISSIONS & FRAIS D'ENCAISSEMENT\n1. Calcul du Net Vendeur : Pour toute commande en ligne payée par le client via la passerelle Nopalou, le montant net à reverser au Marchand est calculé comme suit : Net Vendeur = Total Recouvré - Commission Nopalou - Frais Opérateur (2%).\n2. Détail des Prélèvements : Une déduction forfaitaire de 2% est appliquée sur la transaction globale (1% au titre des frais d'encaissement Checkout + 1% au titre des frais de virement Payout).\n\nARTICLE 4 : MODALITÉS DE REVERSEMENT DES FONDS (PAYOUT)\n1. Déclenchement du Reversement : Le reversement des sommes encaissées vers le compte Wave / Mobile Money du Marchand est effectué dès la validation de la livraison ou confirmation de la commande.\n2. Coordonnées de Réception : Les versements sont transmis exclusivement vers le numéro de téléphone Wave / Mobile Money associé à la boutique du Marchand.\n3. Retenue de Sécurité : En cas de réclamation client pour non-livraison ou non-conformité, Nopalou se réserve le droit de geler le reversement concerné le temps de la résolution du litige.\n\nARTICLE 5 : ENGAGEMENTS & RESPONSABILITÉ DU MARCHAND\n1. Authenticité des Produits : Le Marchand garantit être le propriétaire ou distributeur autorisé des marchandises mises en vente. Interdiction absolue de vendre des produits contrefaits, volés, périmés ou dangereux.\n2. Responsabilité Exclusive : Le Marchand est seul responsable civilement et pénalement de ses produits. Nopalou décline toute responsabilité liée aux articles vendus.\n3. Respect des Données Clients : Le Marchand s'interdit formellement de revendre ou d'utiliser les coordonnées des acheteurs (nom, téléphone, adresse) à d'autres fins que le traitement de la commande.\n\nARTICLE 6 : RÉSILIATION & SUSPENSION\nNopalou se réserve le droit de suspendre ou fermer immédiatement toute boutique en cas de fraude, fausse publicité, réclamations clients non réglées ou non-respect de la présente charte.`,
};

async function loadSettings() {
  const { rows } = await pool.query('SELECT key, value FROM settings');
  cache = { ...DEFAULTS };
  for (const row of rows) cache[row.key] = row.value;
  lastLoaded = Date.now();
}

async function get(key) {
  if (Date.now() - lastLoaded > CACHE_TTL) await loadSettings();
  return cache[key] ?? DEFAULTS[key] ?? null;
}

async function getAll() {
  if (Date.now() - lastLoaded > CACHE_TTL) await loadSettings();
  return { ...cache };
}

async function set(key, value) {
  await pool.query(
    `INSERT INTO settings (key, value, updated_at) VALUES ($1,$2,NOW())
     ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=NOW()`,
    [key, String(value)]
  );
  cache[key] = String(value);
}

async function setMany(obj) {
  for (const [key, value] of Object.entries(obj)) {
    await set(key, value);
  }
}

// Invalider le cache (après une mise à jour admin)
function invalidate() { lastLoaded = 0; }

// Helpers typés
async function getNum(key) { return parseFloat(await get(key)) || 0; }
async function getBool(key) { return (await get(key)) === 'true'; }

module.exports = { get, getAll, set, setMany, getNum, getBool, invalidate, DEFAULTS };
