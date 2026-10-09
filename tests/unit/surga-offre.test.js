// Offre de Surga : formules et réglages pilotés par la console (offre-service.js).
// ATTENDU : base locale d'audit, après la migration des tables surga_plans et surga_reglages.
//   . scripts\audit\surga\env-surga.ps1 ; npx jest tests/unit/surga-offre.test.js
// REFUS d'exécution si la base n'est pas 127.0.0.1:54329 (le .env de ce poste vise la production).

const baseLocale = /127\.0\.0\.1:54329/.test(process.env.DATABASE_URL || '');
const { pool } = require('../../backend/models/db');
const offre = require('../../backend/services/surga/offre-service');
const abonnements = require('../../backend/services/surga/abonnement-service');
const emploi = require('../../backend/services/surga/emploi-service');
const demarches = require('../../backend/services/surga/demarches-service');

const ts = Date.now().toString(36);
let userId = null;
let instantane = { plans: [], reglages: [] };
const referencesCreees = [];

async function abonner(plan, { cycle = 'mensuel', statut = 'actif', finJours = 30 } = {}) {
  const ref = `OFFRE-TEST-${ts}-${referencesCreees.length}`;
  referencesCreees.push(ref);
  await pool.query(
    `INSERT INTO surga_abonnements (user_id, plan, cycle, montant_xof, provider, statut, reference_paiement, debut, fin)
     VALUES ($1, $2, $3, 1, 'wave', $4, $5, NOW(), NOW() + ($6 || ' days')::interval)`,
    [userId, plan, cycle, statut, ref, String(finJours)]
  );
  return ref;
}
const viderAbonnements = () => pool.query('DELETE FROM surga_abonnements WHERE reference_paiement = ANY($1)', [referencesCreees]);

beforeAll(async () => {
  if (!baseLocale) throw new Error('REFUS : ces tests écrivent en base et ne tournent que sur 127.0.0.1:54329 (. scripts\\audit\\surga\\env-surga.ps1).');
  instantane.plans = (await pool.query('SELECT * FROM surga_plans')).rows;
  instantane.reglages = (await pool.query('SELECT * FROM surga_reglages')).rows;
  await pool.query('DELETE FROM surga_reglages');
  offre.invaliderCache();
  await offre.chargerPlans({ frais: true }); // amorce la table si elle est vide
  const u = await pool.query(
    `INSERT INTO utilisateurs (nom, email, mot_de_passe_hash) VALUES ('Offre Test', $1, 'x') RETURNING id`,
    [`offre.${ts}@audit.test`]
  );
  userId = u.rows[0].id;
});

afterAll(async () => {
  if (!baseLocale) return;
  await viderAbonnements();
  await pool.query('DELETE FROM surga_usages WHERE user_id = $1', [userId]).catch(() => {});
  await pool.query('DELETE FROM surga_demarches_suivis WHERE user_id = $1', [userId]).catch(() => {});
  await pool.query("DELETE FROM surga_plans WHERE id LIKE 'test_offre_%'");
  for (const p of instantane.plans) {
    await pool.query(
      `UPDATE surga_plans SET nom=$2, type=$3, description=$4, tarif_hebdo_xof=$5, tarif_mensuel_xof=$6, tarif_annuel_xof=$7, avantages=$8::jsonb, actif=$9, badge_promo=$10, ordre=$11 WHERE id=$1`,
      [p.id, p.nom, p.type, p.description, p.tarif_hebdo_xof, p.tarif_mensuel_xof, p.tarif_annuel_xof, JSON.stringify(p.avantages), p.actif, p.badge_promo, p.ordre]
    );
  }
  await pool.query('DELETE FROM surga_reglages');
  for (const r of instantane.reglages) {
    await pool.query('INSERT INTO surga_reglages (cle, valeur, updated_at, updated_by) VALUES ($1, $2::jsonb, $3, $4)', [r.cle, JSON.stringify(r.valeur), r.updated_at, r.updated_by]);
  }
  await pool.query('DELETE FROM utilisateurs WHERE id = $1', [userId]).catch(() => {});
  offre.invaliderCache();
});

beforeEach(async () => {
  await pool.query('DELETE FROM surga_reglages');
  await pool.query('DELETE FROM surga_usages WHERE user_id = $1', [userId]);
  await viderAbonnements();
  referencesCreees.length = 0;
  offre.invaliderCache();
});

describe('Réglages : quotas gratuits et ouverture des ventes', () => {
  test('sans valeur enregistrée, les valeurs par défaut s’appliquent', async () => {
    expect(await offre.getReglage('emploi_cv_gratuits')).toBe(1);
    expect(await offre.getReglage('emploi_lettres_gratuites_mois')).toBe(1);
    expect(await offre.getReglage('emploi_simulations_gratuites_semaine')).toBe(1);
    expect(await offre.getReglage('demarches_suivis_gratuits')).toBe(1);
    expect(await offre.getReglage('whatsapp_commandes_gratuites_jour')).toBe(2);
    expect(await offre.getReglage('ventes_ouvertes')).toBe(true);
  });

  test('une valeur enregistrée survit à la perte du cache (redémarrage) et se lit en base', async () => {
    await offre.definirReglages({ emploi_cv_gratuits: 3, ventes_ouvertes: false }, 'essai');
    offre.invaliderCache();
    expect(await offre.getReglage('emploi_cv_gratuits')).toBe(3);
    expect(await offre.getReglage('ventes_ouvertes')).toBe(false);
    const { rows } = await pool.query("SELECT valeur, updated_by FROM surga_reglages WHERE cle = 'emploi_cv_gratuits'");
    expect(rows[0].valeur).toBe(3);
    expect(rows[0].updated_by).toBe('essai');
  });

  test('les valeurs refusées le sont avec un message, et rien n’est écrit (lot atomique)', async () => {
    const refus = [
      [{ emploi_cv_gratuits: 21 }, /de 0 à 20/],
      [{ emploi_cv_gratuits: -1 }, /de 0 à 20/],
      [{ emploi_cv_gratuits: 1.5 }, /entier/],
      [{ emploi_cv_gratuits: 'abc' }, /entier/],
      [{ ventes_ouvertes: 'oui' }, /vrai ou faux/],
      [{ reglage_inconnu: 1 }, /inconnu/],
      [{}, /Aucun réglage/],
      [null, /Aucun réglage/],
    ];
    for (const [patch, motif] of refus) {
      await expect(offre.definirReglages(patch)).rejects.toMatchObject({ code: 'VALIDATION', message: expect.stringMatching(motif) });
    }
    // Un lot qui mêle une valeur valide et une valeur invalide n'écrit rien.
    await expect(offre.definirReglages({ emploi_lettres_gratuites_mois: 4, emploi_cv_gratuits: 99 })).rejects.toMatchObject({ code: 'VALIDATION' });
    expect((await pool.query('SELECT COUNT(*)::int n FROM surga_reglages')).rows[0].n).toBe(0);
  });

  test('une valeur invalide trouvée en base est ignorée au profit du défaut', async () => {
    await pool.query("INSERT INTO surga_reglages (cle, valeur) VALUES ('emploi_cv_gratuits', '\"beaucoup\"'::jsonb)");
    offre.invaliderCache();
    expect(await offre.getReglage('emploi_cv_gratuits')).toBe(1);
  });

  test('un réglage inconnu est une erreur, pas un silence', async () => {
    await expect(offre.getReglage('nimporte_quoi')).rejects.toThrow(/inconnu/);
  });

  test('getReglagesComplets décrit chaque réglage pour la console', async () => {
    await offre.definirReglages({ demarches_suivis_gratuits: 5 }, 'essai');
    const liste = await offre.getReglagesComplets();
    expect(liste.map((r) => r.cle)).toEqual(Object.keys(offre.DEFINITIONS_REGLAGES));
    const suivis = liste.find((r) => r.cle === 'demarches_suivis_gratuits');
    expect(suivis).toMatchObject({ valeur: 5, defaut: 1, personnalise: true, min: 0, max: 50, groupe: 'gratuit', modifie_par: 'essai' });
    const cv = liste.find((r) => r.cle === 'emploi_cv_gratuits');
    expect(cv).toMatchObject({ valeur: 1, personnalise: false, modifie_le: null });
    for (const r of liste) { expect(r.libelle).toBeTruthy(); expect(r.aide).toBeTruthy(); }
  });
});

describe('Abonnés Nopalou : accès total à Surga', () => {
  const ajouterAboNopalou = async (plan, { statut = 'actif', finJours = 30, essai = false } = {}) => {
    await pool.query(
      `INSERT INTO abonnements (utilisateur_id, plan, statut, prix_mensuel, debut, fin, is_trial, commande_ref)
       VALUES ($1, $2, $3, 1, NOW(), NOW() + ($4 || ' days')::interval, $5, $6)`,
      [userId, plan, statut, String(finJours), essai, `NPL-TEST-${ts}-${plan}-${statut}-${finJours}`]
    );
  };
  afterEach(() => pool.query("DELETE FROM abonnements WHERE commande_ref LIKE $1", [`NPL-TEST-${ts}-%`]));

  test('sans abonnement Nopalou ni Surga : pas d’accès total', async () => {
    expect(await offre.estUtilisateurPremium(userId)).toBe(false);
    expect(await abonnements.verifierStatutPremium({ userId })).toMatchObject({ estPremium: false });
  });

  test('un abonnement Nopalou en cours (payant ou essai) ouvre Surga Plus', async () => {
    for (const plan of ['taf_taf', 'pro', 'business', 'immo']) {
      await pool.query("DELETE FROM abonnements WHERE commande_ref LIKE $1", [`NPL-TEST-${ts}-%`]);
      await ajouterAboNopalou(plan);
      expect(await offre.estUtilisateurPremium(userId)).toBe(true);
    }
    await pool.query("DELETE FROM abonnements WHERE commande_ref LIKE $1", [`NPL-TEST-${ts}-%`]);
    await ajouterAboNopalou('business', { essai: true });
    expect(await offre.estUtilisateurPremium(userId)).toBe(true);
    const statut = await abonnements.verifierStatutPremium({ userId });
    expect(statut).toMatchObject({ estPremium: true, source: 'nopalou', plan: 'nopalou_business' });
    expect(statut.joursRestants).toBeGreaterThanOrEqual(29);
  });

  test('l’accès suit l’abonnement : expiré, annulé ou gratuit ne donnent rien', async () => {
    await ajouterAboNopalou('pro', { finJours: -2 });
    await ajouterAboNopalou('pro', { statut: 'annule' });
    await ajouterAboNopalou('gratuit');
    await ajouterAboNopalou('decouverte');
    expect(await offre.estUtilisateurPremium(userId)).toBe(false);
  });

  test('le droit se retrouve dans les quotas : plus de plafond gratuit pour un abonné Nopalou', async () => {
    await offre.definirReglages({ emploi_cv_gratuits: 0, emploi_lettres_gratuites_mois: 0 });
    expect((await emploi.verifierDroitCv(userId)).autorise).toBe(false);
    await ajouterAboNopalou('taf_taf');
    expect(await emploi.verifierDroitCv(userId)).toMatchObject({ autorise: true, motif: 'premium' });
    expect((await emploi.verifierDroitLettre(userId)).autorise).toBe(true);
  });

  test('la console peut couper cet accès, sans toucher aux abonnés Surga', async () => {
    await ajouterAboNopalou('pro');
    await offre.definirReglages({ acces_total_abonnes_nopalou: false }, 'essai');
    expect(await offre.estUtilisateurPremium(userId)).toBe(false);
    expect((await abonnements.verifierStatutPremium({ userId })).estPremium).toBe(false);
    await abonner('b2c_premium');
    expect(await offre.estUtilisateurPremium(userId)).toBe(true);
    expect((await abonnements.verifierStatutPremium({ userId })).source).toBe('surga');
  });
});

describe('Quotas gratuits : la console décide, le serveur applique', () => {
  test('CV : la limite réglée est appliquée, y compris 0 et la réservation atomique', async () => {
    await offre.definirReglages({ emploi_cv_gratuits: 0 });
    expect(await emploi.verifierDroitCv(userId)).toMatchObject({ autorise: false, limite: 0, message: expect.stringMatching(/réservés aux abonnés/) });

    await offre.definirReglages({ emploi_cv_gratuits: 2 });
    expect(await emploi.verifierDroitCv(userId)).toMatchObject({ autorise: true, avecMention: true, limite: 2 });
    expect(await emploi.reserverUsage(userId, 'cv_generation', 'global', 2)).toBe(true);
    expect(await emploi.reserverUsage(userId, 'cv_generation', 'global', 2)).toBe(true);
    expect(await emploi.reserverUsage(userId, 'cv_generation', 'global', 2)).toBe(false);
    const apres = await emploi.verifierDroitCv(userId);
    expect(apres.autorise).toBe(false);
    expect(apres.message).toMatch(/Surga Plus/);
    expect(apres.message).not.toMatch(/Premium|500 FCFA/);
  });

  test('lettres et simulations suivent leur réglage', async () => {
    await offre.definirReglages({ emploi_lettres_gratuites_mois: 0, emploi_simulations_gratuites_semaine: 0 });
    expect(await emploi.verifierDroitLettre(userId)).toMatchObject({ autorise: false, limite: 0 });
    expect(await emploi.verifierDroitSimulationEntretien(userId)).toMatchObject({ autorise: false, limite: 0 });

    await offre.definirReglages({ emploi_lettres_gratuites_mois: 3, emploi_simulations_gratuites_semaine: 2 });
    expect(await emploi.verifierDroitLettre(userId)).toMatchObject({ autorise: true, limite: 3 });
    const sim = await emploi.verifierDroitSimulationEntretien(userId);
    expect(sim).toMatchObject({ autorise: true, limite: 2 });
    expect(sim.message).toBe('2 simulations gratuites par semaine incluses.');
  });

  test('suivi de démarches : la limite réglée est appliquée', async () => {
    await offre.definirReglages({ demarches_suivis_gratuits: 0 });
    expect(await demarches.verifierDroitSuiviDemarche(userId)).toMatchObject({ autorise: false, limite: 0 });
    await offre.definirReglages({ demarches_suivis_gratuits: 4 });
    expect(await demarches.verifierDroitSuiviDemarche(userId)).toMatchObject({ autorise: true, limite: 4 });
  });
});

describe('Formules : ce que la console fixe est ce que le serveur lit', () => {
  test('un tarif modifié survit à la perte du cache et se lit en base', async () => {
    await abonnements.mettreAJourPlan('b2c_premium', { tarifHebdo: 700, tarifMensuel: 1800, tarifAnnuel: 18000 });
    offre.invaliderCache(); // redémarrage : plus rien en mémoire
    const plan = (await offre.chargerPlans()).find((p) => p.id === 'b2c_premium');
    expect(plan.tarifs).toEqual({ hebdomadaire: 700, mensuel: 1800, annuel: 18000 });
    const { rows } = await pool.query("SELECT tarif_hebdo_xof h, tarif_mensuel_xof m, tarif_annuel_xof a FROM surga_plans WHERE id = 'b2c_premium'");
    expect(rows[0]).toEqual({ h: 700, m: 1800, a: 18000 });
  });

  test('l’encaissement utilise le tarif de la base : plan et durée contrôlés avant tout paiement', async () => {
    // Un moyen de paiement autre que Wave est refusé APRÈS les contrôles de formule et de durée, donc ce refus prouve qu'ils sont passés.
    const essayer = (opts) => abonnements.initierSouscription({ userId, planKey: 'b2c_premium', provider: 'orange_money', ...opts });
    await expect(essayer({ cycle: 'hebdomadaire' })).rejects.toMatchObject({ code: 'PAIEMENT_INDISPONIBLE' });
    await expect(essayer({ cycle: 'trimestriel' })).rejects.toThrow(/Durée d’abonnement inconnue/);
    await expect(abonnements.initierSouscription({ userId, planKey: 'formule_fantome', cycle: 'mensuel' })).rejects.toThrow(/n'existe pas/);

    await abonnements.mettreAJourPlan('b2c_premium', { tarifHebdo: 0 });
    await expect(essayer({ cycle: 'hebdomadaire' })).rejects.toThrow(/n’est pas proposée pour cette formule/);
    await expect(essayer({ cycle: 'mensuel' })).rejects.toMatchObject({ code: 'PAIEMENT_INDISPONIBLE' });
  });

  test('les ventes fermées bloquent toute souscription, avec un code distinct', async () => {
    await offre.definirReglages({ ventes_ouvertes: false });
    await expect(abonnements.initierSouscription({ userId, planKey: 'b2c_premium', cycle: 'mensuel' })).rejects.toMatchObject({ code: 'VENTES_FERMEES' });
    const publique = await offre.getOffrePublique();
    expect(publique.ventes_ouvertes).toBe(false);
  });

  test('une formule retirée de la vente disparaît du public mais reste visible et réactivable en console', async () => {
    await abonnements.mettreAJourPlan('b2c_premium', { actif: false });
    expect((await offre.chargerPlans()).map((p) => p.id)).not.toContain('b2c_premium');
    expect((await offre.chargerPlans({ inclureInactifs: true, frais: true })).map((p) => p.id)).toContain('b2c_premium');
    await expect(abonnements.initierSouscription({ userId, planKey: 'b2c_premium', cycle: 'mensuel' })).rejects.toThrow(/pas proposée actuellement/);
    await abonnements.mettreAJourPlan('b2c_premium', { actif: true });
    expect((await offre.chargerPlans()).map((p) => p.id)).toContain('b2c_premium');
  });

  test('enregistrer des prix ne réactive pas une formule désactivée (défaut de l’ancienne console)', async () => {
    await abonnements.mettreAJourPlan('b2b_immo_pro', { actif: false });
    await abonnements.mettreAJourPlan('b2b_immo_pro', { tarifMensuel: 6000, nom: 'Surga Partenaire Immobilier' });
    const plan = (await offre.chargerPlans({ inclureInactifs: true, frais: true })).find((p) => p.id === 'b2b_immo_pro');
    expect(plan.actif).toBe(false);
    expect(plan.tarifs.mensuel).toBe(6000);
  });

  test('validations : prix négatif ou décimal, formule sans aucun tarif, doublon, formule inconnue', async () => {
    await expect(abonnements.mettreAJourPlan('b2c_premium', { tarifMensuel: -5 })).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(abonnements.mettreAJourPlan('b2c_premium', { tarifMensuel: 12.5 })).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(abonnements.mettreAJourPlan('b2c_premium', { nom: 'x' })).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(abonnements.mettreAJourPlan('b2c_premium', { actif: 'oui' })).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(abonnements.mettreAJourPlan('b2c_premium', { tarifHebdo: 0, tarifMensuel: 0, tarifAnnuel: 0 })).rejects.toMatchObject({ code: 'VALIDATION', message: expect.stringMatching(/au moins un tarif/) });
    await expect(abonnements.mettreAJourPlan('inconnue', { nom: 'Quelque chose' })).rejects.toMatchObject({ code: 'PLAN_INTROUVABLE' });
    await expect(abonnements.mettreAJourPlan('b2c_premium', { avantages: Array.from({ length: 13 }, (_, i) => `a${i}`) })).rejects.toMatchObject({ code: 'VALIDATION' });
    // Rien n'a bougé après tous ces refus.
    const plan = (await offre.chargerPlans({ frais: true })).find((p) => p.id === 'b2c_premium');
    expect(plan.tarifs.mensuel).toBeGreaterThan(0);

    const cree = await abonnements.creerPlan({ id: `test_offre_${ts}`, nom: 'Formule d’essai', type: 'b2c', tarifMensuel: 900, avantages: ['Un avantage'] });
    expect(cree).toMatchObject({ id: `test_offre_${ts}`, actif: true, tarifs: { hebdomadaire: 0, mensuel: 900, annuel: 0 } });
    await expect(abonnements.creerPlan({ id: `test_offre_${ts}`, nom: 'Doublon', tarifMensuel: 100 })).rejects.toMatchObject({ code: 'PLAN_EXISTE' });
    await expect(abonnements.creerPlan({ id: `test_offre_${ts}_b`, nom: 'Sans tarif' })).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  test('l’offre publique : formules en vente avec leurs durées, quotas gratuits, ouverture des ventes', async () => {
    await offre.definirReglages({ emploi_cv_gratuits: 2, demarches_suivis_gratuits: 3 });
    await abonnements.mettreAJourPlan('b2c_premium', { actif: true, tarifHebdo: 500, tarifMensuel: 1500, tarifAnnuel: 15000 });
    const o = await offre.getOffrePublique();
    expect(o.ventes_ouvertes).toBe(true);
    expect(o.gratuit).toEqual({ cv: 2, lettres_par_mois: 1, simulations_par_semaine: 1, suivis_demarche: 3 });
    const plus = o.plans.find((p) => p.id === 'b2c_premium');
    expect(plus.cycles).toEqual([
      { cycle: 'hebdomadaire', jours: 7, libelle: '7 jours', montant: 500 },
      { cycle: 'mensuel', jours: 30, libelle: '30 jours', montant: 1500 },
      { cycle: 'annuel', jours: 365, libelle: '12 mois', montant: 15000 },
    ]);
    expect(o.plans.every((p) => p.actif)).toBe(true);
    expect((await offre.libelleTarifsParticulier()).texte).toBe('500 FCFA / 7 jours, 1 500 FCFA / 30 jours, 15 000 FCFA / 12 mois');
  });
});

describe('Statut d’abonné : seule une formule particulier ouvre les droits d’un particulier', () => {
  test('une formule professionnelle ne donne pas les avantages d’un particulier', async () => {
    await abonner('b2b_immo_pro');
    expect(await offre.estUtilisateurPremium(userId)).toBe(false);
    expect((await emploi.verifierDroitCv(userId)).motif).not.toBe('premium');
    expect((await abonnements.verifierStatutPremium({ userId })).estPremium).toBe(false);
  });

  test('un abonnement particulier actif ouvre l’Emploi, les lettres, les simulations et les démarches', async () => {
    await abonner('b2c_premium', { cycle: 'hebdomadaire', finJours: 7 });
    expect(await offre.estUtilisateurPremium(userId)).toBe(true);
    expect(await emploi.verifierDroitCv(userId)).toMatchObject({ autorise: true, avecMention: false, motif: 'premium' });
    expect(await emploi.verifierDroitLettre(userId)).toMatchObject({ autorise: true, motif: 'premium' });
    expect(await emploi.verifierDroitSimulationEntretien(userId)).toMatchObject({ autorise: true, estPremium: true });
    // Défaut corrigé : demarches-service cherchait une fonction que le service d'abonnement n'exportait pas.
    expect(await demarches.verifierDroitSuiviDemarche(userId)).toMatchObject({ autorise: true, estPremium: true });
    expect((await abonnements.verifierStatutPremium({ userId })).estPremium).toBe(true);
  });

  test('un abonnement expiré ou en attente ne compte pas ; une formule retirée de la vente sert encore ses abonnés', async () => {
    await abonner('b2c_premium', { finJours: -2 });
    await abonner('b2c_premium', { statut: 'en_attente' });
    expect(await offre.estUtilisateurPremium(userId)).toBe(false);
    await abonner('b2c_premium');
    await abonnements.mettreAJourPlan('b2c_premium', { actif: false });
    expect(await offre.estUtilisateurPremium(userId)).toBe(true);
    await abonnements.mettreAJourPlan('b2c_premium', { actif: true });
  });

  test('les statistiques comptent un pass de 7 jours en équivalent mensuel (500 x 30 / 7)', async () => {
    const avant = (await abonnements.getStatistiquesFinancieresAdmin()).kpis.mrrEstimeXof;
    await abonner('b2c_premium', { cycle: 'hebdomadaire', finJours: 7 });
    await pool.query("UPDATE surga_abonnements SET montant_xof = 500 WHERE reference_paiement = $1", [referencesCreees[0]]);
    const apres = (await abonnements.getStatistiquesFinancieresAdmin()).kpis.mrrEstimeXof;
    expect(apres - avant).toBe(Math.round((500 * 30) / 7));
  });
});
