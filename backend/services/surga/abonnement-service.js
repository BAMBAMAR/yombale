// backend/services/surga/abonnement-service.js
// Service de gestion des Abonnements Premium B2C et Espaces Professionnels B2B Surga (Tranche 15)
// Zéro émoji, vouvoiement strict D19, conformité multi-tenant anti-IDOR

const crypto = require('crypto');
const { pool } = require('../../models/db');
const wave = require('../wave');

/**
 * Catalogue officiel des formules Surga
 */
const CATALOGUE_PLANS = {
  b2c_premium: {
    id: 'b2c_premium',
    nom: 'Surga Premium Particulier',
    type: 'b2c',
    description: 'Assistant de poche complet sans limite : vocal illimité, alertes prioritaires et accès audio exclusif.',
    tarifs: {
      mensuel: 1500, // 1 500 FCFA / mois
      annuel: 15000, // 15 000 FCFA / an (2 mois offerts)
    },
    avantages: [
      'Commandes vocales WhatsApp et web illimitées (au-delà des 20 requêtes/jour)',
      'Accès permanent et fluide aux radios nationales et podcasts sans interruption',
      'Alertes immobilières ultra-rapides notifiées en moins de 60 secondes',
      'Rappels et notifications prioritaires J-30, J-7 et J-1 pour tous les concours',
      'Sauvegarde cloud chiffrée de votre journal de dépenses et mémos',
      'Assistance prioritaire directe',
    ],
  },
  b2b_visibilite_resto: {
    id: 'b2b_visibilite_resto',
    nom: 'Surga Visibilité Bonnes Adresses',
    type: 'b2b',
    description: 'Mise en avant ciblée de votre établissement auprès des résidents et visiteurs de Dakar.',
    tarifs: {
      mensuel: 5000, // 5 000 FCFA / mois
      annuel: 50000, // 50 000 FCFA / an
    },
    avantages: [
      'Positionnement prioritaire en tête de liste dans votre quartier',
      'Badge officiel "Recommandé par Surga"',
      'Lien direct WhatsApp & appel direct vers votre standard de réservation',
      'Statistiques mensuelles de consultations et intentions d\'itinéraires',
      'Mise à jour instantanée de vos menus et promotions du jour',
    ],
  },
  b2b_immo_pro: {
    id: 'b2b_immo_pro',
    nom: 'Surga Partenaire Immobilier',
    type: 'b2b',
    description: 'Diffusion prioritaire de vos mandats de location et vente aux acquéreurs qualifiés de Dakar.',
    tarifs: {
      mensuel: 5000,
      annuel: 50000,
    },
    avantages: [
      'Alerte immédiate transmise aux abonnés ciblant votre zone géographique',
      'Mise en relation directe sans intermédiaire',
      'Badge "Agence Immobilière Vérifiée"',
      'Rapport d\'intérêt et volume d\'appels générés',
    ],
  },
  b2b_education_pro: {
    id: 'b2b_education_pro',
    nom: 'Surga Prépa & Éducation Nationale',
    type: 'b2b',
    description: 'Visibilité exclusive sur les fiches des concours officiels du Sénégal auprès des candidats.',
    tarifs: {
      mensuel: 10000,
      annuel: 100000,
    },
    avantages: [
      'Encart dédié sur les pages des concours (FASTEF, ENA, Douanes, Police, Santé...)',
      'Bouton d\'inscription directe à vos sessions de préparation intensives',
      'Badge "Centre de Préparation Partenaire"',
      'Mesure précise des clics et prospects qualifiés',
    ],
  },
};

/**
 * Retourne la liste des formules disponibles
 */
function getCataloguePlans() {
  return Object.values(CATALOGUE_PLANS);
}

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

  const query = `
    SELECT id, plan, cycle, montant_xof, provider, statut, debut, fin
    FROM surga_abonnements
    WHERE statut = 'actif'
      AND fin > NOW()
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
  const planInfo = CATALOGUE_PLANS[planKey];
  if (!planInfo) {
    throw new Error(`Le plan d'abonnement demandé '${planKey}' n'existe pas.`);
  }

  const cycleValid = cycle === 'annuel' ? 'annuel' : 'mensuel';
  const montantXof = planInfo.tarifs[cycleValid];
  if (!montantXof) {
    throw new Error(`Tarif non défini pour le cycle ${cycleValid}.`);
  }

  const referencePaiement = `SURGA-${planKey.toUpperCase()}-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`.toUpperCase();

  // Durée estimée selon le cycle
  const intervalleJours = cycleValid === 'annuel' ? 365 : 30;
  const dateDebut = new Date();
  const dateFin = new Date(dateDebut.getTime() + intervalleJours * 24 * 60 * 60 * 1000);

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

  if (provider === 'wave') {
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

      // Mise à jour du session_id
      await pool.query(
        'UPDATE surga_abonnements SET session_id = $1 WHERE id = $2',
        [sessionId, abonnementCree.id]
      );
    } catch (errWave) {
      console.warn('[SURGA ABONNEMENT] Wave non disponible en direct, bascule en simulation sandbox:', errWave.message);
      // Fallback sandbox pour tests ou validation locale sans clé Wave de production
      paiementUrl = `${origin}/surga?simulate_wave=1&ref=${referencePaiement}&amount=${montantXof}`;
    }
  } else if (provider === 'orange_money') {
    // Mode Orange Money via passerelle Nopalou
    paiementUrl = `${origin}/surga?simulate_om=1&ref=${referencePaiement}&amount=${montantXof}`;
  } else {
    paiementUrl = successUrl;
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
  const jours = sub.cycle === 'annuel' ? 365 : 30;
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
      u.email, u.nom_complet
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
  getCataloguePlans,
  verifierStatutPremium,
  initierSouscription,
  activerAbonnementParReference,
  traiterWebhookWaveSurga,
  getStatistiquesFinancieresAdmin,
  listerAbonnementsAdmin,
};

