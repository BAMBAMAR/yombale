// tests/unit/immo-chatbot.test.js
// Tests unitaires pour le chatbot immobilier bimodal (Agent Pro & Public Visiteur)

const mockQuery = jest.fn();
jest.mock('../../backend/models/db', () => ({
  pool: { query: mockQuery },
}));

const mockSendWhatsAppText = jest.fn().mockResolvedValue(undefined);
const mockSendWhatsAppCarousel = jest.fn().mockResolvedValue(undefined);
const mockSendWhatsAppButtons3 = jest.fn().mockResolvedValue(undefined);
const mockSendWhatsAppInteractive = jest.fn().mockResolvedValue(undefined);

jest.mock('../../backend/services/whatsapp', () => ({
  sendWhatsAppText: mockSendWhatsAppText,
  sendWhatsAppCarousel: mockSendWhatsAppCarousel,
  sendWhatsAppButtons3: mockSendWhatsAppButtons3,
  sendWhatsAppInteractive: mockSendWhatsAppInteractive,
}));

const {
  detecterIntentionImmo,
  trouverAgenceAgentParTelephone,
  traiterMessageImmo,
} = require('../../backend/services/immo-chatbot');

beforeEach(() => {
  mockQuery.mockReset();
  mockSendWhatsAppText.mockReset();
  mockSendWhatsAppCarousel.mockReset();
  mockSendWhatsAppButtons3.mockReset();
  mockSendWhatsAppInteractive.mockReset();
});

describe('immo-chatbot : detecterIntentionImmo', () => {
  test('détecte les intentions immobilières avec typologies ou quartiers sénégalais', () => {
    expect(detecterIntentionImmo('Je cherche un appartement aux Almadies')).toBe(true);
    expect(detecterIntentionImmo('Avez-vous une villa avec piscine à louer ?')).toBe(true);
    expect(detecterIntentionImmo('Terrain à vendre à Saly ou Ngaparou')).toBe(true);
    expect(detecterIntentionImmo('Je voudrais voir mes visites de la semaine')).toBe(true);
    expect(detecterIntentionImmo('Studio meublé Mermoz')).toBe(true);
  });

  test('ne détecte pas les requêtes commerce général', () => {
    expect(detecterIntentionImmo('Je veux acheter des chaussures Nike')).toBe(false);
    expect(detecterIntentionImmo('Avez-vous des iPhones en stock ?')).toBe(false);
    expect(detecterIntentionImmo('Combien coûte la livraison à Touba ?')).toBe(false);
  });
});

describe('immo-chatbot : trouverAgenceAgentParTelephone', () => {
  test('retrouve l\'agence quand le numéro correspond au propriétaire ou agent membre', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 'ag-123', nom: 'Teranga Immo Prestige', slug: 'teranga-immo', telephone: '+221771234567', role: 'owner' },
      ],
    });

    const agence = await trouverAgenceAgentParTelephone('+221771234567');
    expect(agence).toBeDefined();
    expect(agence.nom).toBe('Teranga Immo Prestige');
    expect(agence.slug).toBe('teranga-immo');
  });

  test('retourne null si le numéro n\'est rattaché à aucune agence active', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const agence = await trouverAgenceAgentParTelephone('+221779999999');
    expect(agence).toBeNull();
  });
});

describe('immo-chatbot : Mode Agent Pro', () => {
  test('fournit les prochaines visites programmées pour un agent authentifié', async () => {
    // Mock trouverAgenceAgentParTelephone
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'ag-1', nom: 'Dakar Immo', slug: 'dakar-immo', telephone: '771112233', role: 'owner' }],
    });

    // Mock query visites
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 'v-1',
          date_visite: '2026-09-17T15:00:00Z',
          statut: 'confirmee',
          bien_titre: 'Appartement F4 Fann Résidence',
          contact_nom: 'Moussa Diop',
          contact_tel: '775556677',
        },
      ],
    });

    const handled = await traiterMessageImmo('221771112233', 'mes visites');
    expect(handled).toBe(true);
    expect(mockSendWhatsAppText).toHaveBeenCalledWith(
      '221771112233',
      expect.stringContaining('Vos Prochaines Visites — Dakar Immo')
    );
    expect(mockSendWhatsAppText).toHaveBeenCalledWith(
      '221771112233',
      expect.stringContaining('Appartement F4 Fann Résidence')
    );
  });

  test('fournit les loyers impayés ou en attente pour un gestionnaire', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'ag-1', nom: 'Dakar Immo', slug: 'dakar-immo', telephone: '771112233', role: 'owner' }],
    });

    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          periode: '09-2026',
          montant_du: 450000,
          montant_restant: 450000,
          date_echeance: '2026-09-05',
          statut: 'en_retard',
          bien_titre: 'Villa Ngor',
          locataire_nom: 'Aminata Ba',
        },
      ],
    });

    const handled = await traiterMessageImmo('221771112233', 'loyers impayes');
    expect(handled).toBe(true);
    expect(mockSendWhatsAppText).toHaveBeenCalledWith(
      '221771112233',
      expect.stringContaining('Loyers en Attente / Retard — Dakar Immo')
    );
    expect(mockSendWhatsAppText).toHaveBeenCalledWith(
      '221771112233',
      expect.stringContaining('Aminata Ba')
    );
  });
});

describe('immo-chatbot : Mode Visiteur Grand Public', () => {
  test('recherche des biens par langage naturel et auto-ingère un prospect CRM', async () => {
    // Non-agent
    mockQuery.mockResolvedValueOnce({ rows: [] });

    // Mock recherche annonces_immo
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 'ann-99',
          titre: 'Magnifique Villa 5P Piscine Almadies',
          prix: 2500000,
          ville: 'Dakar',
          quartier: 'Almadies',
          type_bien: 'villa',
          transaction: 'location',
          surface_m2: 450,
          photos: ['https://example.com/p1.jpg'],
          agence_nom: 'Sotheby Dakar Realty',
          agence_id: 'ag-sotheby',
        },
      ],
    });

    // Mock insert prospect CRM
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const handled = await traiterMessageImmo('221780001122', 'Je cherche une villa à louer aux Almadies');
    expect(handled).toBe(true);
    expect(mockSendWhatsAppText).toHaveBeenCalledWith(
      '221780001122',
      expect.stringContaining('Opportunités Immobilières Nopalou')
    );
    expect(mockSendWhatsAppText).toHaveBeenCalledWith(
      '221780001122',
      expect.stringContaining('Sotheby Dakar Realty')
    );

    // Vérifier l'ingestion automatique en prospect CRM
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO contacts_immo'),
      expect.arrayContaining(['ag-sotheby', 'Prospect WA 1122', '221780001122'])
    );
  });
});
