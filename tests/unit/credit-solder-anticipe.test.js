// Solde anticipé d'un crédit client (backend/lib/creditCalculator.js)
// Ce cas était testé par erreur côté frontend, où la fonction n'existe pas (voir AUD-049).
const { solderCreditAnticipe } = require('../../backend/lib/creditCalculator');

describe('solderCreditAnticipe', () => {
  const plan = { id: 'p1', montant_total: 40000, solde_restant: 20000, statut: 'actif' };

  test('solde toutes les échéances non payées et le plan', () => {
    const echeances = [
      { id: '1', numero_echeance: 1, montant_prevu: 20000, montant_paye: 20000, montant_restant: 0, statut: 'payee' },
      { id: '2', numero_echeance: 2, montant_prevu: 20000, montant_paye: 5000, montant_restant: 15000, statut: 'partielle' },
      { id: '3', numero_echeance: 3, montant_prevu: 20000, montant_paye: 0, montant_restant: 20000, statut: 'a_venir' },
    ];
    const r = solderCreditAnticipe(plan, echeances);
    expect(r.planUpdated.statut).toBe('solde');
    expect(r.planUpdated.montant_restant).toBe(0);
    expect(r.echeancesUpdated[0].statut).toBe('payee'); // déjà payée : inchangée
    expect(r.echeancesUpdated[1].statut).toBe('soldee_par_anticipation');
    expect(r.echeancesUpdated[1].montant_restant).toBe(0);
    expect(r.echeancesUpdated[2].statut).toBe('soldee_par_anticipation');
  });

  test('ne modifie pas les objets reçus', () => {
    const echeances = [{ id: '1', statut: 'a_venir', montant_restant: 100 }];
    solderCreditAnticipe(plan, echeances);
    expect(echeances[0].statut).toBe('a_venir');
    expect(plan.statut).toBe('actif');
  });
});
