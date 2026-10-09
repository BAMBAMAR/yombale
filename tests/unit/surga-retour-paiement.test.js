// Retour de paiement Wave de Surga : les adresses de retour sont celles du SITE, jamais celles du backend.
// Constat (2026-10-09) : un client sans solde suffisant était renvoyé sur https://yombale.onrender.com/surga?paiement=erreur…
// (hôte du backend) et voyait du JSON brut « Ressource introuvable ». Aucune base ni API Wave réelle n'est touchée.

const mockQuery = jest.fn();
jest.mock('../../backend/models/db', () => ({ pool: { query: (...a) => mockQuery(...a) } }));
jest.mock('../../backend/services/wave', () => ({
  createCheckoutSession: jest.fn(async () => ({ wave_url: 'https://pay.wave.com/c/test', session_id: 'cos-test' })),
}));
jest.mock('../../backend/services/surga/offre-service', () => ({
  CYCLES: { mensuel: { jours: 30, libelle: '30 jours' } },
  getReglage: jest.fn(async () => true),
  chargerPlans: jest.fn(async () => [
    { id: 'b2c_premium', nom: 'Surga Plus', type: 'b2c', actif: true, tarifs: { mensuel: 1500 } },
  ]),
}));

describe('Surga : adresses de retour de paiement Wave', () => {
  const wave = require('../../backend/services/wave');
  const { initierSouscription } = require('../../backend/services/surga/abonnement-service');
  const ancienFront = process.env.FRONTEND_URL;
  const anciennePublique = process.env.PUBLIC_URL;

  beforeEach(() => {
    wave.createCheckoutSession.mockClear();
    mockQuery.mockReset();
    mockQuery.mockResolvedValue({ rows: [{ id: 1, reference_paiement: 'SURGA-TEST', plan: 'b2c_premium', montant_xof: 1500, statut: 'en_attente', fin: new Date() }] });
  });
  afterEach(() => {
    if (ancienFront === undefined) delete process.env.FRONTEND_URL; else process.env.FRONTEND_URL = ancienFront;
    if (anciennePublique === undefined) delete process.env.PUBLIC_URL; else process.env.PUBLIC_URL = anciennePublique;
  });

  test('sans réglage, Wave renvoie le client sur nopalou.com', async () => {
    delete process.env.FRONTEND_URL; delete process.env.PUBLIC_URL;
    await initierSouscription({ userId: 'u1', planKey: 'b2c_premium', cycle: 'mensuel', provider: 'wave' });
    const { success_url, error_url } = wave.createCheckoutSession.mock.calls[0][0];
    expect(success_url).toMatch(/^https:\/\/nopalou\.com\/surga\?paiement=succes&ref=SURGA-/);
    expect(error_url).toMatch(/^https:\/\/nopalou\.com\/surga\?paiement=erreur&ref=SURGA-/);
    expect(error_url).not.toContain('onrender.com');
  });

  test('FRONTEND_URL est respecté, sans double barre finale', async () => {
    process.env.FRONTEND_URL = 'https://nopalou.com/';
    await initierSouscription({ userId: 'u1', planKey: 'b2c_premium', cycle: 'mensuel', provider: 'wave' });
    expect(wave.createCheckoutSession.mock.calls[0][0].error_url).toMatch(/^https:\/\/nopalou\.com\/surga\?paiement=erreur/);
  });

  test('un hôte transmis par l’appelant (celui du backend) n’est plus utilisé', async () => {
    delete process.env.FRONTEND_URL; delete process.env.PUBLIC_URL;
    await initierSouscription({ userId: 'u1', planKey: 'b2c_premium', cycle: 'mensuel', provider: 'wave', baseUrl: 'https://yombale.onrender.com' });
    const { success_url, error_url } = wave.createCheckoutSession.mock.calls[0][0];
    expect(success_url).not.toContain('yombale.onrender.com');
    expect(error_url).not.toContain('yombale.onrender.com');
  });
});
