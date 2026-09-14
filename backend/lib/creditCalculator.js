// backend/lib/creditCalculator.js
/**
 * Moteur de calcul centralisé pour le crédit commercial et paiement échelonné Nopalou.
 * 
 * GARANTIES :
 * 1. Règle d'or : Solde restant = Montant Total - Total Paiements Validés
 * 2. Arrondi exact au franc près (Exact Sum Guarantee) : sum(echeances) === montant_finance
 * 3. Validation stricte des règles du marchand (serveur et client)
 * 4. Imputation chronologique (FIFO) des paiements partiels
 */

const CONFIG_DEFAUT = {
  actif: true,
  montant_min_vente: 10000,
  montant_max_vente: 5000000,
  apport_min_pct: 20,
  apport_min_fcfa: 5000,
  echeance_min_fcfa: 5000,
  nb_echeances_autorisees: [2, 3, 4, 6],
  frequences_autorisees: ['mensuel', 'bimensuel', 'hebdomadaire'],
  delai_premiere_echeance_jours: 30,
  frais_dossier_fixes: 0,
  frais_pourcentage: 0,
};

/**
 * Valide si les paramètres demandés respectent les règles configurées par le marchand.
 */
function validerReglesEchelonnement(configRaw, params) {
  const config = { ...CONFIG_DEFAUT, ...(configRaw || {}) };
  const { montantTotal, apport, nbEcheances, frequence } = params;

  const numTotal = Number(montantTotal) || 0;
  const numApport = Number(apport) || 0;
  const numNb = Number(nbEcheances) || 0;
  const freq = String(frequence || 'mensuel').toLowerCase();

  if (!config.actif) {
    return { valide: false, erreur: 'Le paiement échelonné n’est pas activé pour cette boutique.' };
  }

  if (numTotal < config.montant_min_vente) {
    return {
      valide: false,
      erreur: `Le montant minimum pour un paiement échelonné est de ${config.montant_min_vente.toLocaleString('fr-FR')} FCFA.`,
    };
  }

  if (config.montant_max_vente && numTotal > config.montant_max_vente) {
    return {
      valide: false,
      erreur: `Le montant maximum éligible est de ${config.montant_max_vente.toLocaleString('fr-FR')} FCFA.`,
    };
  }

  const apportMinCalcule = Math.max(
    config.apport_min_fcfa || 0,
    Math.round((numTotal * (config.apport_min_pct || 0)) / 100)
  );

  if (numApport < apportMinCalcule) {
    return {
      valide: false,
      erreur: `L’apport initial minimum requis est de ${apportMinCalcule.toLocaleString('fr-FR')} FCFA (${config.apport_min_pct}% du total).`,
    };
  }

  if (numApport >= numTotal) {
    return {
      valide: false,
      erreur: 'L’apport ne peut pas être supérieur ou égal au montant total de la vente.',
    };
  }

  const autoriseesNb = Array.isArray(config.nb_echeances_autorisees) ? config.nb_echeances_autorisees : [2, 3, 4, 6];
  if (!autoriseesNb.includes(numNb)) {
    return {
      valide: false,
      erreur: `Le nombre d’échéances (${numNb}x) n’est pas autorisé par le marchand. Choix possibles : ${autoriseesNb.join(', ')}x.`,
    };
  }

  const autoriseesFreq = Array.isArray(config.frequences_autorisees) ? config.frequences_autorisees : ['mensuel', 'bimensuel', 'hebdomadaire'];
  if (!autoriseesFreq.includes(freq)) {
    return {
      valide: false,
      erreur: `La fréquence "${freq}" n’est pas autorisée par le marchand.`,
    };
  }

  const fraisFixes = Math.max(0, Number(config.frais_dossier_fixes) || 0);
  const fraisPct = Math.max(0, Number(config.frais_pourcentage) || 0);
  const montantFrais = fraisFixes + Math.round((numTotal * fraisPct) / 100);
  const montantFinance = (numTotal + montantFrais) - numApport;

  const montantMoyenParEcheance = montantFinance / numNb;
  if (config.echeance_min_fcfa && montantMoyenParEcheance < config.echeance_min_fcfa) {
    return {
      valide: false,
      erreur: `Le montant par échéance est inférieur au minimum autorisé (${config.echeance_min_fcfa.toLocaleString('fr-FR')} FCFA).`,
    };
  }

  return { valide: true, config, apportMinCalcule, montantFrais, montantFinance };
}

/**
 * Calcule la date de la Nième échéance selon la fréquence et la date de départ.
 */
function calculerDateEcheance(dateDepart, indexEcheance, frequence, delaiInitialJours = 30) {
  const d = new Date(dateDepart || new Date());
  d.setHours(12, 0, 0, 0);

  if (indexEcheance === 1) {
    d.setDate(d.getDate() + (delaiInitialJours || 30));
    return d.toISOString().split('T')[0];
  }

  // Pour les échéances suivantes (> 1)
  const baseJours = delaiInitialJours || 30;
  const pasIndex = indexEcheance - 1;

  if (frequence === 'hebdomadaire') {
    d.setDate(d.getDate() + baseJours + (pasIndex * 7));
  } else if (frequence === 'bimensuel') {
    d.setDate(d.getDate() + baseJours + (pasIndex * 14));
  } else {
    // Mensuel par défaut (ajout de 30 jours calendaires ou mois glissant)
    d.setDate(d.getDate() + baseJours + (pasIndex * 30));
  }

  return d.toISOString().split('T')[0];
}

/**
 * Moteur principal de génération d'un échéancier avec garantie absolue d'arrondi exact.
 */
function calculerEcheancier(options) {
  const {
    montantTotal,
    apport,
    nbEcheances,
    frequence = 'mensuel',
    dateDebut = new Date(),
    config = CONFIG_DEFAUT,
  } = options;

  const validation = validerReglesEchelonnement(config, {
    montantTotal,
    apport,
    nbEcheances,
    frequence,
  });

  const numTotal = Number(montantTotal) || 0;
  const numApport = Number(apport) || 0;
  const numNb = Number(nbEcheances) || 3;
  const freq = String(frequence || 'mensuel').toLowerCase();

  const fraisFixes = Math.max(0, Number(config?.frais_dossier_fixes) || 0);
  const fraisPct = Math.max(0, Number(config?.frais_pourcentage) || 0);
  const montantFrais = fraisFixes + Math.round((numTotal * fraisPct) / 100);
  const totalAPayer = numTotal + montantFrais;
  const montantFinance = Math.max(0, totalAPayer - numApport);

  // Exact Rounding Guarantee (absorption du reste sur la dernière échéance)
  const baseEcheance = Math.floor(montantFinance / numNb);
  const resteArrondi = montantFinance - (baseEcheance * numNb);

  const echeances = [];
  const delaiJours = Number(config?.delai_premiere_echeance_jours) || (freq === 'hebdomadaire' ? 7 : freq === 'bimensuel' ? 14 : 30);

  for (let i = 1; i <= numNb; i++) {
    const isDerniere = (i === numNb);
    const montantPrevu = isDerniere ? (baseEcheance + resteArrondi) : baseEcheance;
    const dateEch = calculerDateEcheance(dateDebut, i, freq, delaiJours);

    echeances.push({
      numero_echeance: i,
      date_echeance: dateEch,
      montant_prevu: montantPrevu,
      montant_paye: 0,
      montant_restant: montantPrevu,
      statut: 'a_venir',
    });
  }

  // Vérification de sécurité absolue
  const sommeEcheances = echeances.reduce((acc, ech) => acc + ech.montant_prevu, 0);
  if (sommeEcheances !== montantFinance) {
    throw new Error(`Incohérence mathématique détectée : somme (${sommeEcheances}) !== financé (${montantFinance})`);
  }

  return {
    valide: validation.valide,
    erreur: validation.erreur || null,
    montant_total_vente: numTotal,
    frais_dossier: montantFrais,
    total_a_payer: totalAPayer,
    apport_initial: numApport,
    montant_finance: montantFinance,
    nb_echeances: numNb,
    frequence: freq,
    montant_base_echeance: baseEcheance,
    prochaine_echeance: echeances[0]?.date_echeance || null,
    prochain_montant: echeances[0]?.montant_prevu || 0,
    echeances,
    solde_restant: montantFinance,
  };
}

/**
 * Génère des options intelligentes (Recommandé, Économique, Rapide) pour l'acheteur.
 */
function genererFormulesRecommandees(montantTotal, configRaw, dateDebut = new Date()) {
  const config = { ...CONFIG_DEFAUT, ...(configRaw || {}) };
  const numTotal = Number(montantTotal) || 0;

  if (!config.actif || numTotal < config.montant_min_vente) {
    return [];
  }

  const autoriseesNb = (config.nb_echeances_autorisees || [2, 3, 4, 6]).slice().sort((a, b) => a - b);
  const minPct = config.apport_min_pct || 20;

  const formules = [];

  // 1. Formule Recommandée (Ex: Apport 30% ou 40%, 3 échéances ou médiane, mensuel)
  const nbRec = autoriseesNb.includes(3) ? 3 : autoriseesNb[Math.floor(autoriseesNb.length / 2)] || 2;
  const apportPctRec = Math.min(50, Math.max(minPct, 30));
  const apportRec = Math.max(config.apport_min_fcfa || 0, Math.round((numTotal * apportPctRec) / 100));

  try {
    const calcRec = calculerEcheancier({
      montantTotal: numTotal,
      apport: apportRec,
      nbEcheances: nbRec,
      frequence: 'mensuel',
      dateDebut,
      config,
    });
    if (calcRec.valide) {
      formules.push({
        id: 'recommande',
        badge: '⭐ RECOMMANDÉ',
        titre: 'Équilibre Confort',
        apport: apportRec,
        apport_pct: apportPctRec,
        nb_echeances: nbRec,
        frequence: 'mensuel',
        label_frequence: 'Chaque mois',
        montant_echeance: calcRec.montant_base_echeance,
        prochaine_date: calcRec.prochaine_echeance,
        detail: calcRec,
      });
    }
  } catch (err) {
    console.debug('[CALCUL REC SKIP]:', err.message);
  }

  // 2. Formule Économique (Apport minimum, maximum d'échéances)
  const nbEco = autoriseesNb[autoriseesNb.length - 1];
  const apportEco = Math.max(config.apport_min_fcfa || 0, Math.round((numTotal * minPct) / 100));

  if (nbEco !== nbRec || apportEco !== apportRec) {
    try {
      const calcEco = calculerEcheancier({
        montantTotal: numTotal,
        apport: apportEco,
        nbEcheances: nbEco,
        frequence: 'mensuel',
        dateDebut,
        config,
      });
      if (calcEco.valide) {
        formules.push({
          id: 'economique',
          badge: 'PETIT BUDGET',
          titre: 'Apport Minimum',
          apport: apportEco,
          apport_pct: minPct,
          nb_echeances: nbEco,
          frequence: 'mensuel',
          label_frequence: 'Chaque mois',
          montant_echeance: calcEco.montant_base_echeance,
          prochaine_date: calcEco.prochaine_echeance,
          detail: calcEco,
        });
      }
    } catch (err) {
      console.debug('[CALCUL ECO SKIP]:', err.message);
    }
  }

  // 3. Formule Rapide (Apport 50%, 2 échéances)
  const nbRapide = autoriseesNb[0] || 2;
  const apportRapide = Math.round(numTotal * 0.5);

  if (nbRapide !== nbRec && nbRapide !== nbEco) {
    try {
      const calcRapide = calculerEcheancier({
        montantTotal: numTotal,
        apport: apportRapide,
        nbEcheances: nbRapide,
        frequence: 'mensuel',
        dateDebut,
        config,
      });
      if (calcRapide.valide) {
        formules.push({
          id: 'rapide',
          badge: 'RÈGLEMENT RAPIDE',
          titre: 'Liberté Express',
          apport: apportRapide,
          apport_pct: 50,
          nb_echeances: nbRapide,
          frequence: 'mensuel',
          label_frequence: 'Chaque mois',
          montant_echeance: calcRapide.montant_base_echeance,
          prochaine_date: calcRapide.prochaine_echeance,
          detail: calcRapide,
        });
      }
    } catch (err) {
      console.debug('[CALCUL RAPIDE SKIP]:', err.message);
    }
  }

  return formules;
}

/**
 * Impute un montant de remboursement sur une liste d'échéances chronologiques (FIFO).
 */
function imputerPaiementSurEcheances(echeances, montantPaiement) {
  let montantRestantAImputer = Number(montantPaiement) || 0;
  if (montantRestantAImputer <= 0) return { echeancesUpdated: echeances, resteNonImpute: 0 };

  const echeancesUpdated = echeances.map(ech => ({ ...ech }));

  for (const ech of echeancesUpdated) {
    if (montantRestantAImputer <= 0) break;
    if (ech.statut === 'payee' || ech.statut === 'annulee' || ech.statut === 'soldee_par_anticipation') continue;

    const detteLigne = Number(ech.montant_restant !== undefined ? ech.montant_restant : (ech.montant_prevu - ech.montant_paye));
    if (detteLigne <= 0) {
      ech.statut = 'payee';
      continue;
    }

    const payeSurLigne = Math.min(detteLigne, montantRestantAImputer);
    ech.montant_paye = Number(ech.montant_paye || 0) + payeSurLigne;
    ech.montant_restant = detteLigne - payeSurLigne;
    montantRestantAImputer -= payeSurLigne;

    if (ech.montant_restant <= 0) {
      ech.statut = 'payee';
      ech.date_paiement_complet = new Date().toISOString();
    } else {
      ech.statut = 'partielle';
    }
  }

  return {
    echeancesUpdated,
    resteNonImpute: montantRestantAImputer,
  };
}

/**
 * Solde anticipé : passe toutes les échéances non encore échues ou partielles à soldee_par_anticipation.
 */
function solderCreditAnticipe(plan, echeances) {
  const echeancesUpdated = echeances.map(ech => {
    if (ech.statut !== 'payee') {
      return {
        ...ech,
        statut: 'soldee_par_anticipation',
        montant_restant: 0,
        note: 'Soldé par anticipation',
      };
    }
    return ech;
  });

  return {
    planUpdated: {
      ...plan,
      statut: 'solde',
      montant_paye: plan.montant_total,
      montant_restant: 0,
      updated_at: new Date().toISOString(),
    },
    echeancesUpdated,
  };
}

module.exports = {
  CONFIG_DEFAUT,
  validerReglesEchelonnement,
  calculerDateEcheance,
  calculerEcheancier,
  genererFormulesRecommandees,
  imputerPaiementSurEcheances,
  solderCreditAnticipe,
};
