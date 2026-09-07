// tests/unit/admin-alerts-and-health.test.js
const axios = require('axios');
jest.mock('axios');

jest.mock('../../backend/services/email', () => ({
  envoyerEmail: jest.fn().mockResolvedValue({ id: 'email_123' }),
}));

jest.mock('../../backend/models/db', () => ({
  pool: {
    query: jest.fn().mockResolvedValue({ rows: [] }),
  },
}));

describe('Admin Alerts & WhatsApp Health Resilience', () => {
  let adminAlerts;
  let whatsappHealth;
  const { envoyerEmail } = require('../../backend/services/email');

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_EMAIL = 'admin@test.com';
    process.env.TELEGRAM_BOT_TOKEN = 'mock_bot_token';
    process.env.TELEGRAM_CHAT_ID = 'mock_chat_id';

    // Réinitialiser les modules pour réinitialiser les caches internes
    jest.isolateModules(() => {
      adminAlerts = require('../../backend/services/admin-alerts');
      whatsappHealth = require('../../backend/services/whatsapp-health');
    });
  });

  describe('admin-alerts service', () => {
    test('envoie une alerte par email et telegram', async () => {
      axios.post.mockResolvedValue({ data: { ok: true } });

      const res = await adminAlerts.alerterAdmin({
        type: 'test_alert_unique_1',
        titre: 'Test incident',
        message: 'Un problème de test est survenu.',
        details: 'Détails erreur 500',
        lienAction: 'https://test.com/action',
        priorite: 'CRITIQUE',
      });

      expect(res.success).toBe(true);
      expect(envoyerEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@test.com',
          subject: expect.stringContaining('CRITIQUE'),
          html: expect.stringContaining('Test incident'),
        })
      );
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.telegram.org/botmock_bot_token/sendMessage',
        expect.objectContaining({
          chat_id: 'mock_chat_id',
          text: expect.stringContaining('Test incident'),
        }),
        expect.anything()
      );
    });

    test('respecte le cooldown pour éviter le spam', async () => {
      axios.post.mockResolvedValue({ data: { ok: true } });

      // 1er envoi -> doit passer
      const res1 = await adminAlerts.alerterAdmin({
        type: 'test_cooldown',
        titre: 'Incident cooldown',
        message: 'Message 1',
        cooldownMs: 60000,
      });
      expect(res1.success).toBe(true);
      expect(envoyerEmail).toHaveBeenCalledTimes(1);

      // 2e envoi immédiat -> doit être ignoré
      const res2 = await adminAlerts.alerterAdmin({
        type: 'test_cooldown',
        titre: 'Incident cooldown',
        message: 'Message 2',
        cooldownMs: 60000,
      });
      expect(res2.skipped).toBe(true);
      expect(res2.cooldown).toBe(true);
      expect(envoyerEmail).toHaveBeenCalledTimes(1); // Pas d'appel supplémentaire
    });
  });

  describe('whatsapp-health service & circuit breaker', () => {
    test('démarre dans un état sain', () => {
      const status = whatsappHealth.getStatus();
      expect(status.healthy).toBe(true);
      expect(whatsappHealth.isDegraded()).toBe(false);
    });

    test('détecte l\'erreur critique de facturation Meta (131056 / unsettled payments)', () => {
      whatsappHealth.recordFailure({
        code: 131056,
        title: 'Payment issue',
        message: 'Message failed to send because your WhatsApp Business account has unsettled payments.',
        href: 'https://business.facebook.com/billing_hub',
      });

      const status = whatsappHealth.getStatus();
      expect(status.healthy).toBe(false);
      expect(whatsappHealth.isDegraded()).toBe(true);
      expect(status.lastFailure.code).toBe(131056);
      expect(envoyerEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('WhatsApp Bloqué'),
        })
      );
    });

    test('détecte l\'erreur critique de token expiré (190)', () => {
      whatsappHealth.recordFailure({
        code: 190,
        message: 'Error validating access token: Session has expired',
      });

      expect(whatsappHealth.isDegraded()).toBe(true);
    });

    test('ignore l\'erreur destinataire (131026 / Message Undeliverable) et maintient l\'état sain', () => {
      whatsappHealth.recordFailure({
        code: 131026,
        title: 'Message Undeliverable.',
        message: 'Message Undeliverable.',
        recipient_id: '221770000000',
      });

      const status = whatsappHealth.getStatus();
      expect(status.healthy).toBe(true);
      expect(whatsappHealth.isDegraded()).toBe(false);
      expect(status.consecutiveFailures).toBe(0);
      expect(status.lastRecipientFailure).toBeTruthy();
      expect(status.lastRecipientFailure.code).toBe(131026);
      expect(status.recipientFailuresCount).toBe(1);
      expect(envoyerEmail).not.toHaveBeenCalled();
    });

    test('ne déclenche pas d\'alerte admin ni de mode dégradé même après 3 échecs destinataires consécutifs', () => {
      for (let i = 0; i < 3; i++) {
        whatsappHealth.recordFailure({
          code: 131026,
          title: 'Message Undeliverable.',
          message: 'Message Undeliverable.',
          recipient_id: `22177000000${i}`,
        });
      }

      const status = whatsappHealth.getStatus();
      expect(status.healthy).toBe(true);
      expect(whatsappHealth.isDegraded()).toBe(false);
      expect(status.consecutiveFailures).toBe(0);
      expect(status.recipientFailuresCount).toBe(3);
      expect(envoyerEmail).not.toHaveBeenCalled();
    });

    test('déclenche le mode dégradé après 3 pannes d\'infrastructure serveur consécutives', () => {
      for (let i = 0; i < 3; i++) {
        whatsappHealth.recordFailure({
          code: 500,
          message: 'Internal Server Error from Meta Graph API',
        });
      }

      const status = whatsappHealth.getStatus();
      expect(status.healthy).toBe(false);
      expect(whatsappHealth.isDegraded()).toBe(true);
      expect(status.consecutiveFailures).toBe(3);
      expect(envoyerEmail).toHaveBeenCalled();
    });

    test('rétablit l\'état sain lors d\'un succès', () => {
      // Provoquer une dégradation
      whatsappHealth.recordFailure({
        code: 131056,
        message: 'unsettled payments',
      });
      expect(whatsappHealth.isDegraded()).toBe(true);

      // Enregistrer un succès
      whatsappHealth.recordSuccess();

      const status = whatsappHealth.getStatus();
      expect(status.healthy).toBe(true);
      expect(whatsappHealth.isDegraded()).toBe(false);
    });
  });
});
