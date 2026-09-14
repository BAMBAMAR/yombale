// tests/unit/credit-echelonnement-engine.test.js
const {
  CONFIG_DEFAUT,
  validerReglesEchelonnement,
  calculerEcheancier,
  genererFormulesRecommandees,
  imputerPaiementSurEcheances,
  solderCreditAnticipe,
} = require('../../backend/lib/creditCalculator');

describe('Système de Paiement Échelonné & Carnet de Crédit Nopalou', () => {
  const configStandard = {
    ...CONFIG_DEFAUT,
    actif: true,
    montant_min_vente: 10000,
    montant_max_vente: 2000000,
    apport_min_pct: 20,
    apport_min_fcfa: 5000,
    nb_echeances_autorisees: [2, 3, 4, 6],
    frequences_autorisees: ['mensuel', 'bimensuel', 'hebdomadaire'],
    delai_premiere_echeance_jours: 30,
    frais_dossier_fixes: 0,
    frais_pourcentage: 0,
  };

  describe('1. Validation des Règles Marchand (validerReglesEchelonnement)', () => {
    test('Refuse si le système est désactivé par le marchand', () => {
      const res = validerReglesEchelonnement({ ...configStandard, actif: false }, {
        montantTotal: 50000,
        apport: 15000,
        nbEcheances: 3,
        frequence: 'mensuel',
      });
      expect(res.valide).toBe(false);
      expect(res.erreur).toMatch(/activé/i);
    });

    test('Refuse si le montant de vente est inférieur au seuil minimum', () => {
      const res = validerReglesEchelonnement(configStandard, {
        montantTotal: 8000,
        apport: 2000,
        nbEcheances: 3,
        frequence: 'mensuel',
      });
      expect(res.valide).toBe(false);
      expect(res.erreur).toMatch(/minimum/i);
    });

    test('Refuse si le nombre d’échéances n’est pas dans la liste autorisée', () => {
      const res = validerReglesEchelonnement(configStandard, {
        montantTotal: 60000,
        apport: 20000,
        nbEcheances: 5,
        frequence: 'mensuel',
      });
      expect(res.valide).toBe(false);
      expect(res.erreur).toMatch(/échéances/i);
    });

    test('Refuse si l’apport est inférieur au pourcentage minimal requis', () => {
      // 20% de 100 000 = 20 000 FCFA
      const res = validerReglesEchelonnement(configStandard, {
        montantTotal: 100000,
        apport: 15000,
        nbEcheances: 3,
        frequence: 'mensuel',
      });
      expect(res.valide).toBe(false);
      expect(res.erreur).toMatch(/apport/i);
    });

    test('Valide avec succès une formule conforme aux critères marchand', () => {
      const res = validerReglesEchelonnement(configStandard, {
        montantTotal: 100000,
        apport: 25000,
        nbEcheances: 3,
        frequence: 'mensuel',
      });
      expect(res.valide).toBe(true);
      expect(res.montantFinance).toBe(75000);
    });
  });

  describe('2. Invariant Mathématique & Règle d’Arrondi Exact au Franc (calculerEcheancier)', () => {
    test('Garantit que la somme des échéances est EXACTEMENT égale au montant financé (Cas indivisible: 100 000 FCFA en 3x avec 20 000 apport -> 80 000 financé)', () => {
      const montantTotal = 100000;
      const apport = 20000;
      const nbEcheances = 3;

      const resultat = calculerEcheancier({
        montantTotal,
        apport,
        nbEcheances,
        frequence: 'mensuel',
        config: configStandard,
      });

      expect(resultat.montant_finance).toBe(80000);
      expect(resultat.echeances).toHaveLength(3);

      // 80 000 / 3 = 26 666.666...
      // Échéances 1 et 2 = 26 666
      // Échéance 3 = 26 666 + 2 = 26 668
      expect(resultat.echeances[0].montant_prevu).toBe(26666);
      expect(resultat.echeances[1].montant_prevu).toBe(26666);
      expect(resultat.echeances[2].montant_prevu).toBe(26668);

      const sommeEcheances = resultat.echeances.reduce((acc, ech) => acc + ech.montant_prevu, 0);
      expect(sommeEcheances).toBe(resultat.montant_finance);
      expect(sommeEcheances + resultat.apport_initial).toBe(resultat.total_a_payer);
    });

    test('Garantit les dates d’échéances calculées selon la fréquence', () => {
      const resultat = calculerEcheancier({
        montantTotal: 60000,
        apport: 15000,
        nbEcheances: 3,
        frequence: 'hebdomadaire',
        dateDebut: '2026-10-01',
        config: { ...configStandard, delai_premiere_echeance_jours: 7 },
      });

      expect(resultat.echeances[0].date_echeance).toBe('2026-10-08');
      expect(resultat.echeances[1].date_echeance).toBe('2026-10-15');
      expect(resultat.echeances[2].date_echeance).toBe('2026-10-22');
    });
  });

  describe('3. Générateur de Formules Recommandées (genererFormulesRecommandees)', () => {
    test('Génère les formules intelligentes adaptées (Recommandée, Économique, Rapide)', () => {
      const formules = genererFormulesRecommandees(150000, configStandard);
      expect(formules.length).toBeGreaterThanOrEqual(1);

      const rec = formules.find((f) => f.id === 'recommande');
      expect(rec).toBeDefined();
      expect(rec.nb_echeances).toBeGreaterThanOrEqual(2);
      expect(rec.detail.total_a_payer).toBe(150000);
    });
  });

  describe('4. Imputation FIFO des Paiements Partiels (imputerPaiementSurEcheances)', () => {
    const getEcheancesInitiales = () => [
      { id: 'ech-1', numero_echeance: 1, montant_prevu: 25000, montant_paye: 0, montant_restant: 25000, statut: 'a_venir' },
      { id: 'ech-2', numero_echeance: 2, montant_prevu: 25000, montant_paye: 0, montant_restant: 25000, statut: 'a_venir' },
      { id: 'ech-3', numero_echeance: 3, montant_prevu: 25000, montant_paye: 0, montant_restant: 25000, statut: 'a_venir' },
    ];

    test('Paiement partiel inférieur à la 1ère échéance (10 000 FCFA)', () => {
      const res = imputerPaiementSurEcheances(getEcheancesInitiales(), 10000);
      expect(res.resteNonImpute).toBe(0);

      expect(res.echeancesUpdated[0].montant_paye).toBe(10000);
      expect(res.echeancesUpdated[0].montant_restant).toBe(15000);
      expect(res.echeancesUpdated[0].statut).toBe('partielle');

      expect(res.echeancesUpdated[1].montant_paye).toBe(0);
      expect(res.echeancesUpdated[1].statut).toBe('a_venir');
    });

    test('Paiement en cascade couvrant la 1ère échéance et entamant la 2nde (35 000 FCFA)', () => {
      const res = imputerPaiementSurEcheances(getEcheancesInitiales(), 35000);
      expect(res.resteNonImpute).toBe(0);

      // Échéance 1 soldée
      expect(res.echeancesUpdated[0].montant_paye).toBe(25000);
      expect(res.echeancesUpdated[0].montant_restant).toBe(0);
      expect(res.echeancesUpdated[0].statut).toBe('payee');

      // Échéance 2 entamée (10 000 payés, reste 15 000)
      expect(res.echeancesUpdated[1].montant_paye).toBe(10000);
      expect(res.echeancesUpdated[1].montant_restant).toBe(15000);
      expect(res.echeancesUpdated[1].statut).toBe('partielle');

      // Échéance 3 intacte
      expect(res.echeancesUpdated[2].montant_paye).toBe(0);
      expect(res.echeancesUpdated[2].statut).toBe('a_venir');
    });

    test('Paiement avec excédent au-delà du solde total (80 000 FCFA payés pour 75 000)', () => {
      const res = imputerPaiementSurEcheances(getEcheancesInitiales(), 80000);
      expect(res.resteNonImpute).toBe(5000);
      expect(res.echeancesUpdated.every((e) => e.statut === 'payee')).toBe(true);
    });
  });

  describe('5. Solde Anticipé (solderCreditAnticipe)', () => {
    test('Marque toutes les échéances futures comme soldées par anticipation et solde restant à 0', () => {
      const planInitial = {
        id: 'plan-123',
        montant_total: 100000,
        montant_paye: 40000,
        solde_restant: 60000,
        statut: 'actif',
      };
      const echeancesInitiales = [
        { id: 'ech-1', numero_echeance: 1, montant_prevu: 20000, montant_paye: 20000, montant_restant: 0, statut: 'payee' },
        { id: 'ech-2', numero_echeance: 2, montant_prevu: 20000, montant_paye: 0, montant_restant: 20000, statut: 'a_venir' },
        { id: 'ech-3', numero_echeance: 3, montant_prevu: 20000, montant_paye: 0, montant_restant: 20000, statut: 'a_venir' },
      ];

      const res = solderCreditAnticipe(planInitial, echeancesInitiales);
      expect(res.planUpdated.montant_restant).toBe(0);
      expect(res.planUpdated.statut).toBe('solde');
      expect(res.echeancesUpdated[0].statut).toBe('payee');
      expect(res.echeancesUpdated[1].statut).toBe('soldee_par_anticipation');
      expect(res.echeancesUpdated[2].statut).toBe('soldee_par_anticipation');
    });
  });
});
