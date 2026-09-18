// tests/unit/creer-boutique-categories.test.js
// Tests de validation de la sélection progressive des catégories lors de la création de boutique WhatsApp

const mockQuery = jest.fn();
jest.mock('../../backend/models/db', () => ({
  pool: {
    query: mockQuery,
  },
}));

const mockSendWhatsAppText = jest.fn().mockResolvedValue({});
const mockSendWhatsAppInteractive = jest.fn().mockResolvedValue({});
const mockSendWhatsAppButton = jest.fn().mockResolvedValue({});
const mockSendWhatsAppButtons3 = jest.fn().mockResolvedValue({});
const mockSendWhatsAppMenuOuFin = jest.fn().mockResolvedValue({});

jest.mock('../../backend/services/whatsapp', () => ({
  sendWhatsAppText: mockSendWhatsAppText,
  sendWhatsAppInteractive: mockSendWhatsAppInteractive,
  sendWhatsAppButton: mockSendWhatsAppButton,
  sendWhatsAppButtons3: mockSendWhatsAppButtons3,
  sendWhatsAppProduct: jest.fn().mockResolvedValue({}),
  sendWhatsAppCarousel: jest.fn().mockResolvedValue({}),
  sendWhatsAppMenuOuFin: mockSendWhatsAppMenuOuFin,
  sendReadReceipt: jest.fn().mockResolvedValue({}),
  sendTyping: jest.fn().mockResolvedValue({}),
  normalisePhone: jest.fn(p => (p ? p.replace(/\D/g, '') : p)),
  estDesinscrit: jest.fn().mockResolvedValue(false),
  ajouterBlacklist: jest.fn().mockResolvedValue({}),
  retirerBlacklist: jest.fn().mockResolvedValue({}),
}));

const { handleIncoming } = require('../../backend/services/whatsapp-chatbot');

describe('Création de Boutique WhatsApp — Choix progressif des catégories', () => {
  const phone = '221770009988';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. Si le commerçant sélectionne "cat_voir_plus", la liste étendue des catégories est envoyée', async () => {
    mockQuery.mockImplementation((sql) => {
      if (sql.includes('whatsapp_processed_messages')) {
        return Promise.resolve({ rows: [{ message_id: 'msg-cat-1' }] });
      }
      if (sql.includes('SELECT state, context FROM whatsapp_sessions')) {
        return Promise.resolve({
          rows: [{
            state: 'CREER_BOUTIQUE_CATEGORIE',
            context: { nom_boutique: 'Boutique Alpha', quartier: 'Sandaga' },
          }],
        });
      }
      return Promise.resolve({ rows: [] });
    });

    await handleIncoming({
      id: 'msg-cat-1',
      from: phone,
      type: 'interactive',
      interactive: {
        type: 'list_reply',
        list_reply: { id: 'cat_voir_plus', title: '➕ Autres catégories...' },
      },
    });

    // Doit avoir envoyé la liste interactive avec les autres catégories
    expect(mockSendWhatsAppInteractive).toHaveBeenCalled();
    const callArgs = mockSendWhatsAppInteractive.mock.calls[0];
    expect(callArgs[0]).toBe(phone);
    expect(callArgs[2]).toContain('Autres secteurs');

    const rows = callArgs[3][0].rows;
    const ids = rows.map(r => r.id);
    expect(ids).toContain('cat_electro');
    expect(ids).toContain('cat_auto');
    expect(ids).toContain('cat_bijouterie');
    expect(ids).toContain('cat_populaires');
  });

  test('2. Si le commerçant sélectionne "cat_populaires", la liste principale est renvoyée', async () => {
    mockQuery.mockImplementation((sql) => {
      if (sql.includes('whatsapp_processed_messages')) {
        return Promise.resolve({ rows: [{ message_id: 'msg-cat-2' }] });
      }
      if (sql.includes('SELECT state, context FROM whatsapp_sessions')) {
        return Promise.resolve({
          rows: [{
            state: 'CREER_BOUTIQUE_CATEGORIE',
            context: { nom_boutique: 'Boutique Alpha', quartier: 'Sandaga' },
          }],
        });
      }
      return Promise.resolve({ rows: [] });
    });

    await handleIncoming({
      id: 'msg-cat-2',
      from: phone,
      type: 'interactive',
      interactive: {
        type: 'list_reply',
        list_reply: { id: 'cat_populaires', title: '⬅️ Catégories Populaires' },
      },
    });

    expect(mockSendWhatsAppInteractive).toHaveBeenCalled();
    const callArgs = mockSendWhatsAppInteractive.mock.calls[0];
    const rows = callArgs[3][0].rows;
    const ids = rows.map(r => r.id);
    expect(ids).toContain('cat_mode');
    expect(ids).toContain('cat_telephonie');
    expect(ids).toContain('cat_voir_plus');
  });

  test('3. Sélection d\'une catégorie secondaire (ex: cat_electro) crée la boutique avec "tv-electro"', async () => {
    mockQuery.mockImplementation((sql) => {
      if (sql.includes('whatsapp_processed_messages')) {
        return Promise.resolve({ rows: [{ message_id: 'msg-cat-3' }] });
      }
      if (sql.includes('SELECT state, context FROM whatsapp_sessions')) {
        return Promise.resolve({
          rows: [{
            state: 'CREER_BOUTIQUE_CATEGORIE',
            context: { nom_boutique: 'Dakar Froid TV', quartier: 'Colobane' },
          }],
        });
      }
      if (sql.includes('SELECT id FROM utilisateurs')) {
        return Promise.resolve({ rows: [{ id: 'user-123' }] });
      }
      if (sql.toUpperCase().includes('COUNT')) {
        return Promise.resolve({ rows: [{ count: '0', total: 0 }] });
      }
      if (sql.includes('SELECT id FROM boutiques WHERE slug = $1')) {
        return Promise.resolve({ rows: [] }); // slug dispo
      }
      if (sql.includes('INSERT INTO boutiques')) {
        return Promise.resolve({ rows: [{ id: 99, nom: 'Dakar Froid TV', slug: 'dakar-froid-tv' }] });
      }
      return Promise.resolve({ rows: [] });
    });

    await handleIncoming({
      id: 'msg-cat-3',
      from: phone,
      type: 'interactive',
      interactive: {
        type: 'list_reply',
        list_reply: { id: 'cat_electro', title: '📺 TV & Électroménager' },
      },
    });

    // Vérifier l'insertion avec 'tv-electro'
    const insertCall = mockQuery.mock.calls.find(c => c[0].includes('INSERT INTO boutiques'));
    expect(insertCall).toBeDefined();
    expect(insertCall[1][5]).toBe('tv-electro'); // catégorie
  });

  test('4. Saisie textuelle libre d\'un secteur (ex: "bijoux en or") détecte sémantiquement "bijouterie"', async () => {
    mockQuery.mockImplementation((sql) => {
      if (sql.includes('whatsapp_processed_messages')) {
        return Promise.resolve({ rows: [{ message_id: 'msg-cat-4' }] });
      }
      if (sql.includes('SELECT state, context FROM whatsapp_sessions')) {
        return Promise.resolve({
          rows: [{
            state: 'CREER_BOUTIQUE_CATEGORIE',
            context: { nom_boutique: 'Keur Bijoux', quartier: 'Plateau' },
          }],
        });
      }
      if (sql.includes('SELECT id FROM utilisateurs')) {
        return Promise.resolve({ rows: [{ id: 'user-456' }] });
      }
      if (sql.toUpperCase().includes('COUNT')) {
        return Promise.resolve({ rows: [{ count: '0', total: 0 }] });
      }
      if (sql.includes('SELECT id FROM boutiques WHERE slug = $1')) {
        return Promise.resolve({ rows: [] });
      }
      if (sql.includes('INSERT INTO boutiques')) {
        return Promise.resolve({ rows: [{ id: 101, nom: 'Keur Bijoux', slug: 'keur-bijoux' }] });
      }
      return Promise.resolve({ rows: [] });
    });

    await handleIncoming({
      id: 'msg-cat-4',
      from: phone,
      type: 'text',
      text: { body: 'Bijoux et montres de luxe' },
    });

    const insertCall = mockQuery.mock.calls.find(c => c[0].includes('INSERT INTO boutiques'));
    expect(insertCall).toBeDefined();
    expect(insertCall[1][5]).toBe('bijouterie');
  });
});

