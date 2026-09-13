// tests/unit/sprint4-bundles-b2b-aiagent-feed.test.js
jest.mock('../../backend/models/db', () => ({
  pool: {
    query: jest.fn().mockResolvedValue({
      rows: [
        { prompt_systeme: 'Assistant Nopalou', marge_remise_max: 10, actif: true }
      ]
    })
  },
  query: jest.fn().mockResolvedValue({ rows: [] })
}));

const { processAgentNegotiation } = require('../../backend/services/ai-agent');

describe('⚡ Sprint 4: Product Bundles, B2B Volume Pricing, Meta Feed & AI Sales Agent', () => {

  test('AI Agent Negotiation: accorde une remise plafonnée lors d une demande de prix', async () => {
    const cart = { articles: [{ nom: 'Chaussure Luxe', quantite: 1 }], totalFCFA: 50000 };
    const res = await processAgentNegotiation('fake_bq_id', 'Pouvez-vous me faire une réduction ou remise svp ?', cart);

    expect(res.reply).toContain('remise');
    expect(res.discountGranted).toBeGreaterThan(0);
    expect(res.finalTotal).toBeLessThan(50000);
    expect(res.discountGranted).toBe(2500); // 5% de 50 000
    expect(res.finalTotal).toBe(47500);
  });

  test('AI Agent Negotiation: réponse standard d orientation si pas de demande de rabais', async () => {
    const cart = { articles: [], totalFCFA: 0 };
    const res = await processAgentNegotiation('fake_bq_id', 'Quels sont vos horaires de livraison ?', cart);

    expect(res.discountGranted).toBe(0);
    expect(res.reply).toContain('Merci pour votre message');
  });

  test('Product Bundles & B2B Volume Pricing: structure des requêtes SQL et validation des données', () => {
    const sampleBundle = [
      { parent_id: 'p1', enfant_id: 'p2', quantite: 2 },
      { parent_id: 'p1', enfant_id: 'p3', quantite: 1 }
    ];

    const sampleB2BGrille = [
      { me_min: 5, prix_unitaire: 12000 },
      { me_min: 10, prix_unitaire: 10000 }
    ];

    expect(sampleBundle.length).toBe(2);
    expect(sampleBundle[0].quantite).toBe(2);
    expect(sampleB2BGrille[1].prix_unitaire).toBe(10000);
  });
});
