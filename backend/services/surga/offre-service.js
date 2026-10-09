// backend/services/surga/offre-service.js
// Offre commerciale de Surga : formules (prix, durées, avantages, visibilité) et réglages (quotas gratuits, ouverture des
// ventes). Tout vit en base et se règle depuis la console d'administration ; rien d'autre que les valeurs PAR DÉFAUT n'est
// écrit dans le code.
//
// Avant : le catalogue était écrit dans abonnement-service.js, la liste publique des formules lisait un cache mémoire que seul
// un appel de la console rechargeait (un prix modifié pouvait donc revenir à l'ancien après un redémarrage, y compris à
// l'encaissement), la console ne listait que les formules actives (une formule désactivée ne pouvait plus être réactivée),
// et les quotas gratuits (1 CV, 1 lettre par mois, 1 simulation par semaine, 1 suivi de démarche) étaient des « 1 » écrits
// dans quatre fichiers.
//
// Le schéma (tables surga_plans et surga_reglages) est créé par backend/migrate-inline.js, jamais ici.

const { pool } = require('../../models/db');

// Durée de chaque cycle. Un cycle sans tarif (0) n'est pas proposé.
const CYCLES = {
  hebdomadaire: { jours: 7, colonne: 'tarif_hebdo_xof', libelle: '7 jours' },
  mensuel: { jours: 30, colonne: 'tarif_mensuel_xof', libelle: '30 jours' },
  annuel: { jours: 365, colonne: 'tarif_annuel_xof', libelle: '12 mois' },
};

/**
 * Valeurs de départ des formules. Insérées en base une seule fois (table vide) ; ensuite la base fait foi.
 * Seuls les avantages réellement fournis par le code sont listés pour Surga Plus.
 * Les formules professionnelles sont proposées désactivées : aucun code ne lit encore un abonnement professionnel
 * (ni badge, ni mise en avant, ni statistiques). La console peut les activer le jour où elles existent.
 */
const CATALOGUE_PLANS = {
  b2c_premium: {
    id: 'b2c_premium',
    nom: 'Surga Plus',
    type: 'b2c',
    description: 'Le pôle Emploi et le suivi des démarches sans limite, pour 7 jours, 30 jours ou 12 mois.',
    tarifs: { hebdomadaire: 500, mensuel: 1500, annuel: 15000 },
    avantages: [
      'CV sans mention « Surga », sans limite',
      'Lettres de motivation sans limite',
      'Simulations d’entretien sans limite',
      'Suivi et rappels de démarches administratives sans limite',
    ],
    actif: true,
  },
  b2b_visibilite_resto: {
    id: 'b2b_visibilite_resto',
    nom: 'Surga Visibilité Bonnes Adresses',
    type: 'b2b',
    description: 'Mise en avant ciblée de votre établissement auprès des résidents et visiteurs de Dakar.',
    tarifs: { hebdomadaire: 0, mensuel: 5000, annuel: 50000 },
    avantages: [
      'Positionnement prioritaire en tête de liste dans votre quartier',
      'Badge officiel "Recommandé par Surga"',
      'Lien direct WhatsApp & appel direct vers votre standard de réservation',
      'Statistiques mensuelles de consultations et intentions d\'itinéraires',
      'Mise à jour instantanée de vos menus et promotions du jour',
    ],
    actif: false,
  },
  b2b_immo_pro: {
    id: 'b2b_immo_pro',
    nom: 'Surga Partenaire Immobilier',
    type: 'b2b',
    description: 'Diffusion prioritaire de vos mandats de location et vente aux acquéreurs qualifiés de Dakar.',
    tarifs: { hebdomadaire: 0, mensuel: 5000, annuel: 50000 },
    avantages: [
      'Alerte immédiate transmise aux abonnés ciblant votre zone géographique',
      'Mise en relation directe sans intermédiaire',
      'Badge "Agence Immobilière Vérifiée"',
      'Rapport d\'intérêt et volume d\'appels générés',
    ],
    actif: false,
  },
  b2b_education_pro: {
    id: 'b2b_education_pro',
    nom: 'Surga Prépa & Éducation Nationale',
    type: 'b2b',
    description: 'Visibilité exclusive sur les fiches des concours officiels du Sénégal auprès des candidats.',
    tarifs: { hebdomadaire: 0, mensuel: 10000, annuel: 100000 },
    avantages: [
      'Encart dédié sur les pages des concours (FASTEF, ENA, Douanes, Police, Santé...)',
      'Bouton d\'inscription directe à vos sessions de préparation intensives',
      'Badge "Centre de Préparation Partenaire"',
      'Mesure précise des clics et prospects qualifiés',
    ],
    actif: false,
  },
};

/**
 * Réglages modifiables depuis la console. « defaut » s'applique tant qu'aucune valeur n'est enregistrée ou si la valeur
 * enregistrée est invalide.
 */
const DEFINITIONS_REGLAGES = {
  ventes_ouvertes: {
    type: 'booleen', defaut: true, groupe: 'ventes',
    libelle: 'Ventes ouvertes',
    aide: 'Désactivé : plus aucune souscription ne peut être lancée ; les abonnements déjà payés restent valables.',
  },
  acces_total_abonnes_nopalou: {
    type: 'booleen', defaut: true, groupe: 'nopalou',
    libelle: 'Accès total à Surga pour les abonnés Nopalou',
    aide: 'Activé : tout compte ayant un abonnement Nopalou en cours (boutique Taf Taf, Pro, Business, agence, essai gratuit compris) a Surga Plus sans payer. L’accès cesse avec l’abonnement Nopalou.',
  },
  emploi_cv_gratuits: {
    type: 'entier', defaut: 1, min: 0, max: 20, groupe: 'gratuit',
    libelle: 'CV gratuits par compte (avec la mention « Surga »)',
    aide: 'Nombre total de CV qu’un compte peut générer sans payer. 0 : les CV sont réservés aux abonnés.',
  },
  emploi_lettres_gratuites_mois: {
    type: 'entier', defaut: 1, min: 0, max: 50, groupe: 'gratuit',
    libelle: 'Lettres de motivation gratuites par mois',
    aide: 'Par compte et par mois civil. 0 : les lettres sont réservées aux abonnés.',
  },
  emploi_simulations_gratuites_semaine: {
    type: 'entier', defaut: 1, min: 0, max: 50, groupe: 'gratuit',
    libelle: 'Simulations d’entretien gratuites par semaine',
    aide: 'Par compte et par semaine. 0 : les simulations sont réservées aux abonnés.',
  },
  demarches_suivis_gratuits: {
    type: 'entier', defaut: 1, min: 0, max: 50, groupe: 'gratuit',
    libelle: 'Démarches suivies gratuitement (avec rappel)',
    aide: 'Nombre de démarches qu’un compte peut suivre à la fois sans payer.',
  },
  whatsapp_commandes_gratuites_jour: {
    type: 'entier', defaut: 2, min: 0, max: 100, groupe: 'whatsapp',
    libelle: 'Commandes WhatsApp gratuites par jour',
    aide: 'Sans effet tant que WhatsApp est éteint (interrupteur SURGA_WHATSAPP_ACTIF côté serveur).',
  },
};

const TTL_CACHE_MS = 15000;
let cachePlans = null; // { t, plans }
let cacheReglages = null; // { t, lignes }

const erreur = (code, message) => Object.assign(new Error(message), { code });

function invaliderCache() {
  cachePlans = null;
  cacheReglages = null;
}

// ───────────────────────────── Formules

const copie = (x) => JSON.parse(JSON.stringify(x));

function ligneVersPlan(r) {
  let avantages = r.avantages;
  if (typeof avantages === 'string') { try { avantages = JSON.parse(avantages); } catch { avantages = []; } }
  return {
    id: r.id,
    nom: r.nom,
    type: r.type,
    description: r.description || '',
    tarifs: {
      hebdomadaire: Number(r.tarif_hebdo_xof) || 0,
      mensuel: Number(r.tarif_mensuel_xof) || 0,
      annuel: Number(r.tarif_annuel_xof) || 0,
    },
    avantages: Array.isArray(avantages) ? avantages : [],
    actif: r.actif !== false,
    badge_promo: r.badge_promo || '',
    ordre: Number(r.ordre) || 0,
  };
}

// Première utilisation : la table est vide, elle reçoit les valeurs de départ. Ensuite la base fait foi.
async function amorcerPlans() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM surga_plans');
  if (rows[0].n > 0) return;
  let ordre = 0;
  for (const p of Object.values(CATALOGUE_PLANS)) {
    ordre += 1;
    await pool.query(
      `INSERT INTO surga_plans (id, nom, type, description, tarif_hebdo_xof, tarif_mensuel_xof, tarif_annuel_xof, avantages, actif, ordre)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [p.id, p.nom, p.type, p.description, p.tarifs.hebdomadaire, p.tarifs.mensuel, p.tarifs.annuel, JSON.stringify(p.avantages), p.actif, ordre]
    );
  }
}

/**
 * Formules, lues en base (cache de 15 secondes, vidé à chaque modification). Sans base, repli sur les valeurs de départ.
 * @param {{inclureInactifs?: boolean, frais?: boolean}} options
 */
async function chargerPlans({ inclureInactifs = false, frais = false } = {}) {
  let plans = !frais && cachePlans && Date.now() - cachePlans.t < TTL_CACHE_MS ? cachePlans.plans : null;
  if (!plans) {
    if (pool) {
      try {
        await amorcerPlans();
        const { rows } = await pool.query('SELECT * FROM surga_plans ORDER BY ordre ASC, created_at ASC');
        if (rows.length > 0) plans = rows.map(ligneVersPlan);
      } catch (err) {
        console.warn('[SURGA OFFRE] Lecture des formules impossible, valeurs de départ utilisées :', err.message);
      }
    }
    if (!plans) plans = Object.values(copie(CATALOGUE_PLANS));
    cachePlans = { t: Date.now(), plans };
  }
  return inclureInactifs ? plans : plans.filter((p) => p.actif);
}

// Version synchrone conservée pour les appelants qui n'attendent pas : cache s'il existe, sinon valeurs de départ.
function getCataloguePlans() {
  return cachePlans ? cachePlans.plans : Object.values(copie(CATALOGUE_PLANS));
}

function entierPositif(valeur, nom, max = 1000000) {
  const n = typeof valeur === 'string' && valeur.trim() !== '' ? Number(valeur) : valeur;
  if (!Number.isInteger(n) || n < 0 || n > max) throw erreur('VALIDATION', `${nom} : un nombre entier de 0 à ${max.toLocaleString('fr-FR')} est attendu.`);
  return n;
}

function validerChamps(champs, { creation = false } = {}) {
  const out = {};
  if (champs.nom !== undefined || creation) {
    const nom = String(champs.nom ?? '').trim();
    if (nom.length < 2 || nom.length > 100) throw erreur('VALIDATION', 'Le nom de la formule doit faire de 2 à 100 caractères.');
    out.nom = nom;
  }
  if (champs.type !== undefined) {
    if (!['b2c', 'b2b'].includes(champs.type)) throw erreur('VALIDATION', 'Le type doit être « b2c » (particulier) ou « b2b » (professionnel).');
    out.type = champs.type;
  }
  if (champs.description !== undefined) {
    const d = String(champs.description ?? '').trim();
    if (d.length > 500) throw erreur('VALIDATION', 'La description est limitée à 500 caractères.');
    out.description = d;
  }
  if (champs.tarifHebdo !== undefined) out.tarif_hebdo_xof = entierPositif(champs.tarifHebdo, 'Tarif 7 jours');
  if (champs.tarifMensuel !== undefined) out.tarif_mensuel_xof = entierPositif(champs.tarifMensuel, 'Tarif 30 jours');
  if (champs.tarifAnnuel !== undefined) out.tarif_annuel_xof = entierPositif(champs.tarifAnnuel, 'Tarif 12 mois');
  if (champs.avantages !== undefined) {
    if (!Array.isArray(champs.avantages) || champs.avantages.length > 12) throw erreur('VALIDATION', 'Les avantages forment une liste de 12 lignes au plus.');
    const lignes = champs.avantages.map((a) => String(a ?? '').trim()).filter(Boolean);
    if (lignes.some((a) => a.length > 200)) throw erreur('VALIDATION', 'Un avantage est limité à 200 caractères.');
    out.avantages = lignes;
  }
  if (champs.actif !== undefined) {
    if (typeof champs.actif !== 'boolean') throw erreur('VALIDATION', 'L’état actif/inactif doit être vrai ou faux.');
    out.actif = champs.actif;
  }
  if (champs.badgePromo !== undefined) {
    const b = String(champs.badgePromo ?? '').trim();
    if (b.length > 50) throw erreur('VALIDATION', 'Le badge est limité à 50 caractères.');
    out.badge_promo = b || null;
  }
  if (champs.ordre !== undefined) out.ordre = entierPositif(champs.ordre, 'Ordre', 1000);
  return out;
}

// Une formule proposée au public doit avoir au moins un cycle payant.
function exigerUnCycle(plan) {
  if (plan.actif && !Object.values(plan.tarifs).some((t) => t > 0)) {
    throw erreur('VALIDATION', 'Une formule proposée doit avoir au moins un tarif supérieur à 0. Désactivez-la ou fixez un tarif.');
  }
}

function exigerBase() {
  if (!pool) throw erreur('BASE_INDISPONIBLE', 'La base de données est indisponible : la modification n’a pas été enregistrée.');
}

async function mettreAJourPlan(id, champs) {
  exigerBase();
  const valeurs = validerChamps(champs || {});
  const courant = (await chargerPlans({ inclureInactifs: true, frais: true })).find((p) => p.id === id);
  if (!courant) throw erreur('PLAN_INTROUVABLE', 'Cette formule n’existe pas.');
  const suivant = {
    ...courant,
    actif: valeurs.actif ?? courant.actif,
    tarifs: {
      hebdomadaire: valeurs.tarif_hebdo_xof ?? courant.tarifs.hebdomadaire,
      mensuel: valeurs.tarif_mensuel_xof ?? courant.tarifs.mensuel,
      annuel: valeurs.tarif_annuel_xof ?? courant.tarifs.annuel,
    },
  };
  exigerUnCycle(suivant);

  const cles = Object.keys(valeurs);
  if (cles.length > 0) {
    const sets = cles.map((c, i) => `${c} = $${i + 1}${c === 'avantages' ? '::jsonb' : ''}`);
    const params = cles.map((c) => (c === 'avantages' ? JSON.stringify(valeurs[c]) : valeurs[c]));
    params.push(id);
    await pool.query(`UPDATE surga_plans SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`, params);
  }
  invaliderCache();
  return (await chargerPlans({ inclureInactifs: true, frais: true })).find((p) => p.id === id);
}

async function creerPlan(champs) {
  exigerBase();
  const valeurs = validerChamps(champs || {}, { creation: true });
  const id = String(champs.id || `plan_${Date.now().toString(36)}`).toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 50);
  const plan = {
    id,
    nom: valeurs.nom,
    type: valeurs.type || 'b2c',
    description: valeurs.description || '',
    tarifs: { hebdomadaire: valeurs.tarif_hebdo_xof ?? 0, mensuel: valeurs.tarif_mensuel_xof ?? 0, annuel: valeurs.tarif_annuel_xof ?? 0 },
    avantages: valeurs.avantages || [],
    actif: valeurs.actif ?? true,
  };
  exigerUnCycle(plan);
  const existe = (await chargerPlans({ inclureInactifs: true, frais: true })).some((p) => p.id === id);
  if (existe) throw erreur('PLAN_EXISTE', 'Une formule porte déjà cet identifiant.');
  const { rows } = await pool.query('SELECT COALESCE(MAX(ordre), 0) + 1 AS o FROM surga_plans');
  await pool.query(
    `INSERT INTO surga_plans (id, nom, type, description, tarif_hebdo_xof, tarif_mensuel_xof, tarif_annuel_xof, avantages, actif, badge_promo, ordre)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11)`,
    [id, plan.nom, plan.type, plan.description, plan.tarifs.hebdomadaire, plan.tarifs.mensuel, plan.tarifs.annuel, JSON.stringify(plan.avantages), plan.actif, valeurs.badge_promo || null, valeurs.ordre ?? rows[0].o]
  );
  invaliderCache();
  return (await chargerPlans({ inclureInactifs: true, frais: true })).find((p) => p.id === id);
}

// Retire la formule de la vente : elle reste en base (les abonnés existants la gardent) et peut être réactivée.
async function supprimerPlan(id) {
  await mettreAJourPlan(id, { actif: false });
  return { success: true };
}

// ───────────────────────────── Statut Premium

async function idsPlansParticuliers() {
  return (await chargerPlans({ inclureInactifs: true })).filter((p) => p.type === 'b2c').map((p) => p.id);
}

/**
 * Un compte est abonné s'il a un abonnement actif et non expiré à une formule PARTICULIER. Une formule professionnelle
 * ne donne pas les avantages d'un particulier ; une formule désactivée à la vente continue de servir ses abonnés.
 */
/**
 * Abonnement Nopalou en cours (boutique ou agence, essai gratuit compris) : il donne l'accès total à Surga tant que le
 * réglage « acces_total_abonnes_nopalou » est ouvert dans la console. Rend la ligne de l'abonnement, ou null.
 */
async function abonnementNopalouActif(userId) {
  if (!userId || !pool) return null;
  try {
    if (!(await getReglage('acces_total_abonnes_nopalou'))) return null;
    const { rows } = await pool.query(
      `SELECT plan, fin, is_trial FROM abonnements
       WHERE utilisateur_id = $1 AND statut = 'actif' AND fin > NOW() AND plan NOT IN ('gratuit', 'decouverte')
       ORDER BY fin DESC LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  } catch (err) {
    console.warn('[SURGA OFFRE] Abonnement Nopalou illisible :', err.message);
    return null;
  }
}

async function estUtilisateurPremium(userId) {
  if (!userId || !pool) return false;
  if (await estAbonneSurga(userId)) return true;
  return Boolean(await abonnementNopalouActif(userId));
}

async function estAbonneSurga(userId) {
  try {
    const ids = await idsPlansParticuliers();
    if (ids.length === 0) return false;
    const { rows } = await pool.query(
      `SELECT 1 FROM surga_abonnements
       WHERE user_id = $1 AND statut = 'actif' AND (fin IS NULL OR fin > NOW()) AND plan = ANY($2::text[])
       LIMIT 1`,
      [userId, ids]
    );
    return rows.length > 0;
  } catch (err) {
    console.warn('[SURGA OFFRE] Statut d’abonnement illisible :', err.message);
    return false;
  }
}

// ───────────────────────────── Réglages

function valeurValide(def, v) {
  if (def.type === 'booleen') return typeof v === 'boolean';
  return Number.isInteger(v) && v >= def.min && v <= def.max;
}

async function lireLignesReglages() {
  if (cacheReglages && Date.now() - cacheReglages.t < TTL_CACHE_MS) return cacheReglages.lignes;
  let lignes = {};
  if (pool) {
    try {
      const { rows } = await pool.query('SELECT cle, valeur, updated_at, updated_by FROM surga_reglages');
      for (const r of rows) lignes[r.cle] = r;
    } catch (err) {
      console.warn('[SURGA OFFRE] Réglages illisibles, valeurs par défaut utilisées :', err.message);
      lignes = {};
    }
  }
  cacheReglages = { t: Date.now(), lignes };
  return lignes;
}

async function getReglage(cle) {
  const def = DEFINITIONS_REGLAGES[cle];
  if (!def) throw new Error(`Réglage inconnu : ${cle}`);
  const ligne = (await lireLignesReglages())[cle];
  return ligne && valeurValide(def, ligne.valeur) ? ligne.valeur : def.defaut;
}

/** Tous les réglages, avec leur définition, leur valeur courante et leur dernière modification. */
async function getReglagesComplets() {
  const lignes = await lireLignesReglages();
  return Object.entries(DEFINITIONS_REGLAGES).map(([cle, def]) => {
    const l = lignes[cle];
    const valide = l && valeurValide(def, l.valeur);
    return {
      cle,
      type: def.type,
      groupe: def.groupe,
      libelle: def.libelle,
      aide: def.aide,
      min: def.min ?? null,
      max: def.max ?? null,
      defaut: def.defaut,
      valeur: valide ? l.valeur : def.defaut,
      personnalise: Boolean(valide),
      modifie_le: valide ? l.updated_at : null,
      modifie_par: valide ? l.updated_by : null,
    };
  });
}

/** Enregistre un lot de réglages. Tout est validé avant la première écriture ; une valeur refusée annule le lot. */
async function definirReglages(patch, acteur = null) {
  exigerBase();
  if (!patch || typeof patch !== 'object' || Array.isArray(patch) || Object.keys(patch).length === 0) {
    throw erreur('VALIDATION', 'Aucun réglage reçu.');
  }
  const nettoyes = {};
  for (const [cle, brut] of Object.entries(patch)) {
    const def = DEFINITIONS_REGLAGES[cle];
    if (!def) throw erreur('VALIDATION', `Réglage inconnu : ${cle}.`);
    const v = def.type === 'entier' && typeof brut === 'string' && brut.trim() !== '' ? Number(brut) : brut;
    if (!valeurValide(def, v)) {
      throw erreur('VALIDATION', def.type === 'booleen'
        ? `${def.libelle} : vrai ou faux est attendu.`
        : `${def.libelle} : un nombre entier de ${def.min} à ${def.max} est attendu.`);
    }
    nettoyes[cle] = v;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [cle, valeur] of Object.entries(nettoyes)) {
      await client.query(
        `INSERT INTO surga_reglages (cle, valeur, updated_at, updated_by) VALUES ($1, $2::jsonb, NOW(), $3)
         ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur, updated_at = NOW(), updated_by = EXCLUDED.updated_by`,
        [cle, JSON.stringify(valeur), acteur ? String(acteur).slice(0, 150) : null]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
  invaliderCache();
  return getReglagesComplets();
}

/** Nom et tarifs de la formule particulier en vente, tels que la console les fixe, pour les messages (WhatsApp). */
async function libelleTarifsParticulier() {
  const plan = (await chargerPlans()).find((p) => p.type === 'b2c');
  if (!plan) return null;
  const morceaux = Object.entries(CYCLES)
    .filter(([c]) => plan.tarifs[c] > 0)
    .map(([c, d]) => `${plan.tarifs[c].toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ')} FCFA / ${d.libelle}`);
  return { nom: plan.nom, texte: morceaux.join(', ') };
}

/** Ce que l'application publique montre : formules en vente, quotas gratuits, ouverture des ventes. */
async function getOffrePublique() {
  const [plans, ventesOuvertes, cv, lettres, simulations, suivis] = await Promise.all([
    chargerPlans(),
    getReglage('ventes_ouvertes'),
    getReglage('emploi_cv_gratuits'),
    getReglage('emploi_lettres_gratuites_mois'),
    getReglage('emploi_simulations_gratuites_semaine'),
    getReglage('demarches_suivis_gratuits'),
  ]);
  return {
    ventes_ouvertes: ventesOuvertes,
    plans: plans.map((p) => ({ ...p, cycles: Object.entries(CYCLES).filter(([c]) => p.tarifs[c] > 0).map(([c, d]) => ({ cycle: c, jours: d.jours, libelle: d.libelle, montant: p.tarifs[c] })) })),
    gratuit: { cv, lettres_par_mois: lettres, simulations_par_semaine: simulations, suivis_demarche: suivis },
  };
}

module.exports = {
  CYCLES,
  CATALOGUE_PLANS,
  DEFINITIONS_REGLAGES,
  chargerPlans,
  getCataloguePlans,
  mettreAJourPlan,
  creerPlan,
  supprimerPlan,
  estUtilisateurPremium,
  abonnementNopalouActif,
  getReglage,
  getReglagesComplets,
  definirReglages,
  getOffrePublique,
  libelleTarifsParticulier,
  invaliderCache,
};
