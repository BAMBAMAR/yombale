// backend/services/surga/abonnement-service.js
// Service de gestion des Abonnements Premium B2C et Espaces Professionnels B2B Surga (Tranche 15)
// Zéro émoji, vouvoiement strict D19, conformité multi-tenant anti-IDOR

const crypto = require('crypto');
const { pool } = require('../../models/db');
const wave = require('../wave');

// Formules, tarifs, réglages et statut d'abonné : voir offre-service.js (tout se règle depuis la console d'administration).
const offre = require('./offre-service');
const { CATALOGUE_PLANS, CYCLES, chargerPlans, getCataloguePlans, mettreAJourPlan, creerPlan, supprimerPlan, estUtilisateurPremium } = offre;
const getCataloguePlansAsync = (options) => chargerPlans(options);

/**
 * Vérifie si un utilisateur ou numéro de téléphone bénéficie d'un abonnement Premium actif
 */
async function verifierStatutPremium({ userId, phone }) {
  if (!userId && !phone) return { estPremium: false, plan: null };

  const conditions = [];
  const params = [];

  if (userId) {
    params.push(userId);
    conditions.push(`user_id = $${params.length}`);
  }
  if (phone) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const suffixe = cleanPhone.slice(-9);
    params.push(`%${suffixe}`);
    conditions.push(`phone LIKE $${params.length}`);
  }

  // Une formule professionnelle ne donne pas les avantages d'un particulier.
  const plansParticuliers = (await chargerPlans({ inclureInactifs: true })).filter((p) => p.type === 'b2c').map((p) => p.id);
  if (plansParticuliers.length === 0) return { estPremium: false, plan: null, abonnement: null, joursRestants: 0 };
  params.push(plansParticuliers);

  const query = `
    SELECT id, plan, cycle, montant_xof, provider, statut, debut, fin
    FROM surga_abonnements
    WHERE statut = 'actif'
      AND fin > NOW()
      AND plan = ANY($${params.length}::text[])
      AND (${conditions.join(' OR ')})
    ORDER BY fin DESC
    LIMIT 1
  `;

  try {
    const { rows } = await pool.query(query, params);
    if (rows.length > 0) {
      const sub = rows[0];
      return {
        estPremium: true,
        plan: sub.plan,
        abonnement: sub,
        joursRestants: Math.max(0, Math.ceil((new Date(sub.fin) - new Date()) / (1000 * 60 * 60 * 24))),
      };
    }
  } catch (err) {
    console.warn('[SURGA ABONNEMENT] Erreur vérification statut:', err.message);
  }

  return { estPremium: false, plan: null, abonnement: null, joursRestants: 0 };
}

/**
 * Initialise une intention de souscription et génère le lien de paiement
 */
async function initierSouscription({ userId, phone, planKey, cycle = 'mensuel', provider = 'wave', metadata = {}, baseUrl }) {
  if (!(await offre.getReglage('ventes_ouvertes'))) {
    const e = new Error('Les abonnements ne sont pas ouverts pour le moment. Revenez bientôt.');
    e.code = 'VENTES_FERMEES';
    throw e;
  }

  const planInfo = (await chargerPlans({ inclureInactifs: true, frais: true })).find((p) => p.id === planKey);
  if (!planInfo) {
    throw new Error(`Le plan d'abonnement demandé '${planKey}' n'existe pas.`);
  }
  if (!planInfo.actif) {
    throw new Error('Cette formule n’est pas proposée actuellement.');
  }

  if (!CYCLES[cycle]) {
    throw new Error('Durée d’abonnement inconnue : choisissez 7 jours, 30 jours ou 12 mois.');
  }
  const cycleValid = cycle;
  const montantXof = planInfo.tarifs[cycleValid];
  if (!montantXof || montantXof <= 0) {
    throw new Error(`Cette durée (${CYCLES[cycleValid].libelle}) n’est pas proposée pour cette formule.`);
  }

  const referencePaiement = `SURGA-${planKey.toUpperCase()}-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`.toUpperCase();

  // Durée estimée selon le cycle
  const intervalleJours = CYCLES[cycleValid].jours;
  const dateDebut = new Date();
  const dateFin = new Date(dateDebut.getTime() + intervalleJours * 24 * 60 * 60 * 1000);

  // Seul Wave ouvre un vrai paiement. Les autres moyens rendaient une adresse de simulation : aucun paiement possible,
  // et une souscription laissée en attente. Ils sont refusés avant toute écriture.
  if (provider !== 'wave') {
    const e = new Error('Ce moyen de paiement n’est pas encore disponible pour Surga. Choisissez Wave.');
    e.code = 'PAIEMENT_INDISPONIBLE';
    throw e;
  }

  // Enregistrement de l'abonnement en statut 'en_attente'
  const insertSql = `
    INSERT INTO surga_abonnements (
      user_id, phone, plan, cycle, montant_xof, provider, statut,
      reference_paiement, client_metadata, debut, fin
    ) VALUES ($1, $2, $3, $4, $5, $6, 'en_attente', $7, $8, $9, $10)
    RETURNING id, reference_paiement, plan, montant_xof, statut, fin
  `;

  const { rows } = await pool.query(insertSql, [
    userId || null,
    phone || null,
    planKey,
    cycleValid,
    montantXof,
    provider,
    referencePaiement,
    JSON.stringify(metadata || {}),
    dateDebut,
    dateFin,
  ]);

  const abonnementCree = rows[0];

  // Construction des URLs de retour
  const origin = baseUrl || process.env.PUBLIC_URL || 'https://nopalou.com';
  const successUrl = `${origin}/surga?paiement=succes&ref=${referencePaiement}`;
  const errorUrl = `${origin}/surga?paiement=erreur&ref=${referencePaiement}`;

  let paiementUrl = null;
  let sessionId = null;

  try {
    const waveSession = await wave.createCheckoutSession({
      amount: montantXof,
      currency: 'XOF',
      success_url: successUrl,
      error_url: errorUrl,
      client_reference: referencePaiement,
    });
    paiementUrl = waveSession.wave_url;
    sessionId = waveSession.session_id;
    if (!paiementUrl || !sessionId) throw new Error('réponse de Wave sans adresse de paiement');

    await pool.query('UPDATE surga_abonnements SET session_id = $1 WHERE id = $2', [sessionId, abonnementCree.id]);
  } catch (errWave) {
    // Le paiement n'a pas pu être ouvert : la souscription est marquée en échec et l'erreur est dite, au lieu de
    // rendre une adresse de simulation présentée comme la passerelle.
    console.error('[SURGA ABONNEMENT] Paiement Wave non ouvert :', errWave.message);
    await pool.query("UPDATE surga_abonnements SET statut = 'echoue' WHERE id = $1", [abonnementCree.id]).catch(() => {});
    const e = new Error('Le paiement Wave n’a pas pu être ouvert. Veuillez réessayer dans un instant.');
    e.code = 'PAIEMENT_INDISPONIBLE';
    throw e;
  }

  return {
    success: true,
    abonnementId: abonnementCree.id,
    reference: referencePaiement,
    plan: planInfo.nom,
    cycle: cycleValid,
    montant: montantXof,
    provider,
    paiementUrl,
  };
}

/**
 * Valide et active un abonnement suite à une vérification certifiée auprès de Wave/OM
 * Interdiction absolue d'activer sans preuve cryptographique ou synchrone de paiement réussi.
 */
async function activerAbonnementParReference(referencePaiement, options = {}) {
  if (!referencePaiement) {
    throw new Error('Référence de paiement manquante.');
  }

  const { rows } = await pool.query(
    'SELECT * FROM surga_abonnements WHERE reference_paiement = $1',
    [referencePaiement]
  );

  if (rows.length === 0) {
    throw new Error(`Aucune souscription trouvée pour la référence ${referencePaiement}.`);
  }

  const sub = rows[0];

  // Si l'abonnement est déjà actif et non expiré
  if (sub.statut === 'actif' && sub.fin && new Date(sub.fin) > new Date()) {
    return sub;
  }

  // 1. Validation selon la provenance
  if (options.provenance === 'webhook_wave') {
    // Validé via webhook signé cryptographiquement HMAC
    console.log(`[SURGA ABO WAVE WEBHOOK OK] Activation de la souscription ${referencePaiement}`);
  } else {
    // 2. Vérification synchrone auprès de la passerelle
    if (sub.provider === 'wave') {
      if (!sub.session_id) {
        throw new Error('Identifiant de session Wave manquant pour vérifier le paiement.');
      }

      try {
        const waveSession = await wave.getCheckoutSession(sub.session_id);
        const estPaye =
          waveSession.checkout_status === 'complete' ||
          waveSession.payment_status === 'succeeded';

        if (!estPaye) {
          throw new Error(
            `Le paiement Wave n'est pas encore finalisé (statut actuel: ${waveSession.checkout_status || waveSession.payment_status || 'en attente'}).`
          );
        }
      } catch (err) {
        console.error('[SURGA ABO WAVE VERIFY ERR]:', err.message);
        throw new Error(
          err.message.includes('statut actuel')
            ? err.message
            : 'Impossible de certifier le règlement auprès de Wave. Veuillez réessayer.'
        );
      }
    } else {
      // Pour tout autre provider sans webhook validé
      throw new Error('Preuve de règlement manquante ou passerelle non confirmée.');
    }
  }

  const dateDebut = new Date();
  const jours = (CYCLES[sub.cycle] || CYCLES.mensuel).jours;
  const dateFin = new Date(dateDebut.getTime() + jours * 24 * 60 * 60 * 1000);

  const updateRes = await pool.query(
    `UPDATE surga_abonnements
     SET statut = 'actif',
         debut = $1,
         fin = $2,
         updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [dateDebut, dateFin, sub.id]
  );

  return updateRes.rows[0];
}

/**
 * Traite le webhook officiel Wave avec contrôle strict de la signature HMAC
 */
async function traiterWebhookWaveSurga(req) {
  const signatureValide = wave.verifyWebhookSignature(req);
  if (!signatureValide) {
    throw new Error('Signature du webhook Wave invalide ou expirée.');
  }

  const event = req.body;
  if (!event || event.type !== 'checkout.session.completed') {
    return { ignore: true, reason: 'Événement non pertinent pour abonnement' };
  }

  const sessionData = event.data || {};
  const clientRef = sessionData.client_reference;
  const sessionId = sessionData.id;

  if (!clientRef && !sessionId) {
    throw new Error('Données de référence introuvables dans le webhook Wave.');
  }

  let ref = clientRef;
  if (!ref && sessionId) {
    const { rows } = await pool.query(
      'SELECT reference_paiement FROM surga_abonnements WHERE session_id = $1 LIMIT 1',
      [sessionId]
    );
    ref = rows[0]?.reference_paiement;
  }

  if (!ref) {
    throw new Error(`Aucun abonnement Surga correspondant à la session ${sessionId}.`);
  }

  const abonnementActive = await activerAbonnementParReference(ref, {
    provenance: 'webhook_wave',
    waveSessionData: sessionData,
  });

  return { success: true, abonnement: abonnementActive };
}

/**
 * Liste administrative des abonnements avec calcul du MRR et de la répartition
 */
async function getStatistiquesFinancieresAdmin() {
  const statsQuery = `
    SELECT
      COUNT(*) FILTER (WHERE statut = 'actif' AND fin > NOW()) AS nb_abonnements_actifs,
      COUNT(*) FILTER (WHERE statut = 'en_attente') AS nb_en_attente,
      COALESCE(SUM(CASE
        WHEN statut = 'actif' AND cycle = 'mensuel' THEN montant_xof
        WHEN statut = 'actif' AND cycle = 'annuel' THEN ROUND(montant_xof / 12)
        WHEN statut = 'actif' AND cycle = 'hebdomadaire' THEN ROUND(montant_xof * 30.0 / 7)
        ELSE 0
      END), 0) AS mrr_estime_xof,
      COALESCE(SUM(CASE WHEN statut = 'actif' THEN montant_xof ELSE 0 END), 0) AS volume_encaisse_xof
    FROM surga_abonnements
  `;

  const { rows: statsRows } = await pool.query(statsQuery);
  const repartitionQuery = `
    SELECT plan, cycle, COUNT(*) as count, SUM(montant_xof) as total_xof
    FROM surga_abonnements
    WHERE statut = 'actif' AND fin > NOW()
    GROUP BY plan, cycle
  `;
  const { rows: repartitionRows } = await pool.query(repartitionQuery);

  return {
    kpis: {
      abonnementsActifs: parseInt(statsRows[0]?.nb_abonnements_actifs || 0, 10),
      enAttente: parseInt(statsRows[0]?.nb_en_attente || 0, 10),
      mrrEstimeXof: parseInt(statsRows[0]?.mrr_estime_xof || 0, 10),
      volumeEncaisseXof: parseInt(statsRows[0]?.volume_encaisse_xof || 0, 10),
    },
    repartition: repartitionRows,
  };
}

/**
 * Liste paginée des abonnements pour l'administration
 */
async function listerAbonnementsAdmin({ page = 1, limit = 20, statut, plan } = {}) {
  const conditions = [];
  const params = [];

  if (statut) {
    params.push(statut);
    conditions.push(`statut = $${params.length}`);
  }
  if (plan) {
    params.push(plan);
    conditions.push(`plan = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRes = await pool.query(`SELECT COUNT(*) FROM surga_abonnements ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const offset = (Math.max(1, page) - 1) * limit;
  params.push(limit, offset);

  const query = `
    SELECT
      a.id, a.user_id, a.phone, a.plan, a.cycle, a.montant_xof,
      a.provider, a.statut, a.reference_paiement, a.client_metadata,
      a.debut, a.fin, a.created_at,
      u.email, u.nom AS nom_complet
    FROM surga_abonnements a
    LEFT JOIN utilisateurs u ON a.user_id = u.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const { rows } = await pool.query(query, params);

  return {
    total,
    page,
    limit,
    abonnements: rows,
  };
}

module.exports = {
  CATALOGUE_PLANS,
  CYCLES,
  chargerPlans,
  getCataloguePlans,
  getCataloguePlansAsync,
  mettreAJourPlan,
  creerPlan,
  supprimerPlan,
  estUtilisateurPremium,
  verifierStatutPremium,
  initierSouscription,
  activerAbonnementParReference,
  traiterWebhookWaveSurga,
  getStatistiquesFinancieresAdmin,
  listerAbonnementsAdmin,
};

