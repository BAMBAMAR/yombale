// tests/unit/whatsapp-comparator-and-cart.test.js
// Tests unitaires pour les fonctionnalités M4 (Panier & Commande 24h) et M5 (Comparateur de prix multi-marchands)

const {
  detecterIntentionComparateur,
  extraireSujetComparaison,
  comparerPrixProduits,
  formaterComparatifWhatsApp,
} = require('../../backend/services/whatsapp-comparator');
const { pool } = require('../../backend/models/db');
const { resetInactiveSessions } = require('../../backend/services/whatsapp-chatbot');

jest.mock('../../backend/models/db', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { pool: mPool };
});

describe('M5 — Comparateur de Prix WhatsApp & Web (whatsapp-comparator.js)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('détecte correctement diverses formulations comparatives', () => {
    expect(detecterIntentionComparateur('comparer iphone 13')).toBe(true);
    expect(detecterIntentionComparateur('comparatif climatiseur')).toBe(true);
    expect(detecterIntentionComparateur('quel est le meilleur prix pour téléviseur')).toBe(true);
    expect(detecterIntentionComparateur('moins cher samsung s23')).toBe(true);
    expect(detecterIntentionComparateur('ps5 vs xbox')).toBe(true);
    expect(detecterIntentionComparateur('bonjour, comment allez-vous')).toBe(false);
    expect(detecterIntentionComparateur('')).toBe(false);
  });

  test('extrait proprement le sujet de la comparaison sans mots parasites', () => {
    expect(extraireSujetComparaison('comparer iphone 13')).toBe('iphone 13');
    expect(extraireSujetComparaison('quel est le moins cher pour frigo ?')).toBe('frigo');
    expect(extraireSujetComparaison('meilleur prix téléviseur samsung')).toBe('téléviseur samsung');
    expect(extraireSujetComparaison('comparatif climatiseur 1.5cv')).toBe('climatiseur 1.5cv');
  });

  test('comparerPrixProduits agrège et trie par prix croissant en calculant l\'économie', async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [
          { id: 'bp-1', nom: 'iPhone 13 128Go', prix: 390000, stock_quantite: 3, boutique_nom: 'Dakar Tech', boutique_slug: 'dakar-tech', boutique_id: 'b-1', source: 'boutique' },
          { id: 'bp-2', nom: 'iPhone 13 128Go', prix: 420000, stock_quantite: 1, boutique_nom: 'Plateau Mobile', boutique_slug: 'plateau-mobile', boutique_id: 'b-2', source: 'boutique' },
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          { id: 'm-1', nom: 'iPhone 13 Neuf', prix: 450000, stock_quantite: null, boutique_nom: 'Marketplace Nopalou', boutique_slug: null, boutique_id: null, source: 'marketplace' }
        ]
      });

    const res = await comparerPrixProduits('iphone 13');

    expect(res.sujet).toBe('iphone 13');
    expect(res.offres.length).toBe(3);
    // Tri par prix croissant
    expect(Number(res.offres[0].prix)).toBe(390000);
    expect(Number(res.offres[1].prix)).toBe(420000);
    expect(Number(res.offres[2].prix)).toBe(450000);
    // Économie constatée
    expect(res.minPrix).toBe(390000);
    expect(res.maxPrix).toBe(450000);
    expect(res.economieMax).toBe(60000);
  });

  test('formaterComparatifWhatsApp génère un message WhatsApp avec bouton de commande immédiate', () => {
    const data = {
      sujet: 'climatiseur',
      offres: [
        { id: 'prod-cheapest', nom: 'Climatiseur Inverter 1.5 CV', prix: 185000, stock_quantite: 2, boutique_nom: 'Froid Dakar', source: 'boutique' },
        { id: 'prod-premium', nom: 'Climatiseur Split 1.5 CV', prix: 210000, stock_quantite: 5, boutique_nom: 'Electro Plus', source: 'boutique' },
      ],
      minPrix: 185000,
      maxPrix: 210000,
      economieMax: 25000,
    };

    const { texte, boutons, bestBoutique } = formaterComparatifWhatsApp(data, 'https://nopalou.com');
    const cleanText = texte.replace(/[\u202f\u00a0]/g, ' ');

    expect(cleanText).toContain('Comparatif Prix Nopalou : "climatiseur"');
    expect(cleanText).toContain('Meilleure offre');
    expect(cleanText).toContain('185 000 FCFA');
    expect(cleanText).toContain('Économie constatée : jusqu\'à 25 000 FCFA');
    expect(bestBoutique.id).toBe('prod-cheapest');
    expect(boutons.length).toBe(3);
    expect(boutons[0].id).toBe('cmd_produit_prod-cheapest');
    expect(boutons[0].title).toContain('Commander');
  });
});

describe('M4 — Persistance 24h & Anti-abandon de commande (whatsapp-chatbot.js)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('resetInactiveSessions expire les sessions normales à 1h mais préserve les commandes à 24h', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    await resetInactiveSessions();

    expect(pool.query).toHaveBeenCalledTimes(2);
    // 1ère requête : sessions normales hors COMMANDE_% (1 hour)
    const call1 = pool.query.mock.calls[0][0];
    expect(call1).toContain("state != 'IDLE'");
    expect(call1).toContain("state NOT LIKE 'COMMANDE_%'");
    expect(call1).toContain("INTERVAL '1 hour'");

    // 2ème requête : sessions COMMANDE_% (24 hours)
    const call2 = pool.query.mock.calls[1][0];
    expect(call2).toContain("state LIKE 'COMMANDE_%'");
    expect(call2).toContain("INTERVAL '24 hours'");
  });
});
