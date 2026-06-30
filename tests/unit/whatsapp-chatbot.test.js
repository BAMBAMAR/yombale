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

const { cleanupOldMessages, resetInactiveSessions } = require('../../backend/services/whatsapp-chatbot');

beforeEach(() => {
  mockQuery.mockReset();
  mockQuery.mockResolvedValue({ rows: [] });
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
