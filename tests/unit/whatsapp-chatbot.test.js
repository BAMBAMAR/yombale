// Tests unitaires — services/whatsapp-chatbot.js (fonctions pures et cleanup)
// Les dépendances DB et WhatsApp sont mockées

const mockQuery = jest.fn();
jest.mock('../../backend/models/db', () => ({
  pool: { query: mockQuery },
}));

jest.mock('../../backend/services/whatsapp', () => ({
  sendWhatsAppText:        jest.fn().mockResolvedValue(undefined),
  sendWhatsAppInteractive: jest.fn().mockResolvedValue(undefined),
  sendWhatsAppCarousel:    jest.fn().mockResolvedValue(undefined),
  sendWhatsAppProduct:     jest.fn().mockResolvedValue(undefined),
  sendReadReceipt:         jest.fn().mockResolvedValue(undefined),
  sendTyping:              jest.fn().mockResolvedValue(undefined),
  normalisePhone:          jest.fn(p => p),
}));

const { cleanupOldMessages, resetInactiveSessions, extraireInfosProduitTexte } = require('../../backend/services/whatsapp-chatbot');

beforeEach(() => {
  mockQuery.mockReset();
  mockQuery.mockResolvedValue({ rows: [] });
});

describe('extraireInfosProduitTexte', () => {
  test('extrait correctement le format compact direct [Nom] [Prix] [Stock] : "Sac cuir 5000 10"', () => {
    const res = extraireInfosProduitTexte('Sac cuir 5000 10');
    expect(res).toEqual({
      nom: 'Sac cuir',
      prix: 5000,
      stock: 10,
    });
  });

  test('extrait correctement le format avec devise et stock direct : "Robe Bazin 15000 FCFA 5"', () => {
    const res = extraireInfosProduitTexte('Robe Bazin 15000 FCFA 5');
    expect(res).toEqual({
      nom: 'Robe Bazin',
      prix: 15000,
      stock: 5,
    });
  });

  test('extrait sans stock quand aucun stock n\'est fourni : "Sac cuir 5000"', () => {
    const res = extraireInfosProduitTexte('Sac cuir 5000');
    expect(res).toEqual({
      nom: 'Sac cuir',
      prix: 5000,
      stock: null,
    });
  });

  test('extrait avec mot-clé stock : "Sac cuir 5000 stock 10"', () => {
    const res = extraireInfosProduitTexte('Sac cuir 5000 stock 10');
    expect(res).toEqual({
      nom: 'Sac cuir',
      prix: 5000,
      stock: 10,
    });
  });

  test('extrait avec mot-clé qte : "Robe Soirée 20000 CFA qte: 12"', () => {
    const res = extraireInfosProduitTexte('Robe Soirée 20000 CFA qte: 12');
    expect(res).toEqual({
      nom: 'Robe Soirée',
      prix: 20000,
      stock: 12,
    });
  });

  test('extrait avec multiplicateur x : "Chaussures Nike 25000 x 8"', () => {
    const res = extraireInfosProduitTexte('Chaussures Nike 25000 x 8');
    expect(res).toEqual({
      nom: 'Chaussures Nike',
      prix: 25000,
      stock: 8,
    });
  });

  test('extrait avec parenthèses pour stock : "Montre Rolex 75000 (3)"', () => {
    const res = extraireInfosProduitTexte('Montre Rolex 75000 (3)');
    expect(res).toEqual({
      nom: 'Montre Rolex',
      prix: 75000,
      stock: 3,
    });
  });

  test('gère les noms avec des chiffres : "iPhone 13 128Go 350000 3"', () => {
    const res = extraireInfosProduitTexte('iPhone 13 128Go 350000 3');
    expect(res).toEqual({
      nom: 'iPhone 13 128Go',
      prix: 350000,
      stock: 3,
    });
  });

  test('retourne null si le texte est vide ou ne contient pas de prix', () => {
    expect(extraireInfosProduitTexte('')).toBeNull();
    expect(extraireInfosProduitTexte('Juste un nom')).toBeNull();
  });
});

describe('cleanupOldMessages', () => {
  test('exécute une DELETE sur whatsapp_processed_messages', async () => {
    await cleanupOldMessages();
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toMatch(/DELETE FROM whatsapp_processed_messages/i);
    expect(sql).toMatch(/7 days/i);
  });
});

describe('resetInactiveSessions', () => {
  test('exécute un UPDATE sur whatsapp_sessions', async () => {
    await resetInactiveSessions();
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toMatch(/UPDATE whatsapp_sessions/i);
    expect(sql).toMatch(/IDLE/);
    expect(sql).toMatch(/1 hour/i);
  });

  test("ne reset pas les sessions déjà IDLE (WHERE state != 'IDLE')", async () => {
    await resetInactiveSessions();
    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toMatch(/state\s*!=\s*'IDLE'/i);
  });
});

describe('detecterIntentionInterrogative', () => {
  const { detecterIntentionInterrogative } = require('../../backend/services/whatsapp-chatbot');

  test('détecte un point d interrogation', () => {
    expect(detecterIntentionInterrogative('vous livrez ?')).toBe(true);
    expect(detecterIntentionInterrogative('c est disponible ?')).toBe(true);
  });

  test('détecte les mots-clés interrogatifs sans point d interrogation', () => {
    expect(detecterIntentionInterrogative('est ce que vous livrez à Rufisque')).toBe(true);
    expect(detecterIntentionInterrogative('c est combien le prix')).toBe(true);
    expect(detecterIntentionInterrogative('naata la')).toBe(true);
    expect(detecterIntentionInterrogative('amna couleur bleu')).toBe(true);
  });

  test('ne détecte pas une adresse ou un nom classique', () => {
    expect(detecterIntentionInterrogative('Bamba Mar, Sacré-Cœur 3')).toBe(false);
    expect(detecterIntentionInterrogative('Fatou Diop, Maristes')).toBe(false);
  });
});

describe('enregistrerDemandeSupport', () => {
  const { enregistrerDemandeSupport } = require('../../backend/services/whatsapp-chatbot');

  test('insère une nouvelle demande de support en base', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'sup-uuid-1', created_at: new Date() }] });
    const res = await enregistrerDemandeSupport('221708717942', {
      nom: 'Moussa',
      message: 'Demande de rappel',
    });
    expect(res).toBeDefined();
    expect(res.id).toBe('sup-uuid-1');
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toMatch(/INSERT INTO support_demandes/i);
    expect(mockQuery.mock.calls[0][1][0]).toBe('221708717942');
  });
});
