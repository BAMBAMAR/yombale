// Tests unitaires — Résilience WhatsApp & Fallback SMS Automatique (Orange / Simulation)
const { sendSMS, normaliseSmsPhone } = require('../../backend/services/sms');
const { sendWhatsAppNotification } = require('../../backend/services/whatsapp');

describe('Service SMS Résilient (Orange API & Simulation Fallback)', () => {
  test('normalise correctement les numéros de téléphone sénégalais', () => {
    expect(normaliseSmsPhone('771234567')).toBe('+221771234567');
    expect(normaliseSmsPhone('00221781234567')).toBe('+221781234567');
    expect(normaliseSmsPhone('+221701234567')).toBe('+221701234567');
    expect(normaliseSmsPhone('221761234567')).toBe('+221761234567');
  });

  test('envoie un SMS en mode simulation sécurisée quand les identifiants ne sont pas en env', async () => {
    const res = await sendSMS('771234567', 'Votre commande CMD-1234 a été confirmée');
    expect(res.success).toBe(true);
    expect(res.simulated).toBe(true);
    expect(res.provider).toBe('simulation');
    expect(res.messageId).toMatch(/^sms_sim_/);
  });

  test('rejette les requêtes avec un numéro ou contenu invalide', async () => {
    const resNoPhone = await sendSMS('', 'Message test');
    expect(resNoPhone.success).toBe(false);
    expect(resNoPhone.error).toMatch(/invalide/);

    const resNoContent = await sendSMS('771234567', '');
    expect(resNoContent.success).toBe(false);
    expect(resNoContent.error).toMatch(/vide/);
  });
});

describe('sendWhatsAppNotification avec Fallback SMS', () => {
  test('déclenche le fallback SMS en cas d échec du template WhatsApp', async () => {
    // Un faux numéro qui déclenche une erreur réseau simulée ou rejet Meta
    const res = await sendWhatsAppNotification('770000999', {
      title: 'Commande expédiée',
      detail: 'Votre colis est en cours de livraison',
      textMessage: 'Votre colis est en route',
      fallbackSMS: true,
    });

    // En environnement de test, Meta n'est pas joignable -> catch(tErr) -> fallbackSMS
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(res.fallback_sms).toBe(true);
    expect(res.messages[0].id).toMatch(/^sms_sim_/);
  });
});
