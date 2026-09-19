const axios = require('axios');
jest.mock('axios');

jest.mock('../../backend/models/db', () => ({
  pool: { query: jest.fn().mockResolvedValue({ rows: [] }) },
}));

// Définir les variables d'environnement nécessaires pour WhatsApp
process.env.WHATSAPP_PHONE_NUMBER_ID = '1234567890';
process.env.WHATSAPP_API_TOKEN = 'test-token-xyz';
process.env.FRONTEND_URL = 'https://nopalou.com';

const { sendWhatsAppNotification } = require('../../backend/services/whatsapp');

describe('sendWhatsAppNotification — Garantie livraison Meta 24H', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('envoie à la fois le texte libre et le template Meta certifié pour une commande', async () => {
    axios.post.mockResolvedValue({ data: { messages: [{ id: 'wamid.123' }] } });

    const res = await sendWhatsAppNotification('771234567', {
      textMessage: '✅ Commande confirmée',
      title: '✅ Commande confirmée — Tech Store',
      detail: 'Réf CMD-123 : Votre colis est en cours de préparation.',
      url: 'https://nopalou.com/boutiques/tech-store',
      buttonParam: 'tech-store',
      type: 'commande',
    });

    expect(res).toBeDefined();
    // Au moins 2 appels POST à l'API Graph (1 textMessage + 1 template nopalou_alerte_commande)
    expect(axios.post).toHaveBeenCalled();
    const calls = axios.post.mock.calls;
    
    // Vérifier l'appel template
    const tplCall = calls.find(c => c[1]?.type === 'template');
    expect(tplCall).toBeDefined();
    expect(tplCall[1].to).toBe('221771234567');
    expect(tplCall[1].template.name).toBe('nopalou_alerte_commande');
    expect(tplCall[1].template.language.code).toBe('fr');
    expect(tplCall[1].template.components[0].parameters[0].text).toContain('Tech Store');
    // Le slug brut est automatiquement préfixé vers boutiques/
    expect(tplCall[1].template.components[1].parameters[0].text).toBe('boutiques/tech-store');
  });

  test('envoie nopalou_rappel_service avec le montant exact et le bouton Voir les détails pour un rappel', async () => {
    axios.post.mockResolvedValue({ data: { messages: [{ id: 'wamid.rappel' }] } });

    const res = await sendWhatsAppNotification('771234567', {
      textMessage: 'Rappel amical',
      title: '💳 Rappel de solde — AMAR',
      montant: '23 334 FCFA',
      detail: 'Solde impayé de 23 334 FCFA. Merci de régulariser.',
      url: 'https://nopalou.com/boutiques/amar',
      buttonParam: 'boutiques/amar',
      type: 'rappel',
    });

    expect(res).toBeDefined();
    const calls = axios.post.mock.calls;
    const tplCall = calls.find(c => c[1]?.type === 'template');
    expect(tplCall).toBeDefined();
    expect(tplCall[1].template.name).toBe('nopalou_rappel_service');
    expect(tplCall[1].template.components[0].parameters[0].text).toBe('💳 Rappel de solde — AMAR');
    expect(tplCall[1].template.components[0].parameters[1].text).toBe('23 334 FCFA');
    expect(tplCall[1].template.components[1].parameters[0].text).toBe('boutiques/amar');
  });

  test('préserve les slashes et paramètres de requête pour le suivi de commande et liens magiques', async () => {
    axios.post.mockResolvedValue({ data: { messages: [{ id: 'wamid.url' }] } });

    await sendWhatsAppNotification('771234567', {
      title: 'Suivi',
      detail: 'Colis',
      buttonParam: 'suivi-commande?ref=CMD-9842&tracking=1',
      type: 'commande',
    });

    const calls = axios.post.mock.calls;
    const tplCall = calls.find(c => c[1]?.type === 'template');
    expect(tplCall[1].template.components[1].parameters[0].text).toBe('suivi-commande?ref=CMD-9842&tracking=1');
  });

  test('gère gracieusement les erreurs sans lever d\'exception non interceptée', async () => {
    axios.post.mockRejectedValue(new Error('Network error'));

    const resSansFallback = await sendWhatsAppNotification('771234567', {
      textMessage: 'Test',
      title: 'Alerte',
      detail: 'Détail',
      fallbackSMS: false,
    });
    expect(resSansFallback).toBeNull();

    const resAvecFallback = await sendWhatsAppNotification('771234567', {
      textMessage: 'Test',
      title: 'Alerte',
      detail: 'Détail',
    });
    expect(resAvecFallback?.fallback_sms).toBe(true);
  });

  test('assainit les retours à la ligne et espaces consécutifs pour respecter Meta #132018', async () => {
    axios.post.mockResolvedValue({ data: { messages: [{ id: 'wamid.sanitized' }] } });

    await sendWhatsAppNotification('771234567', {
      textMessage: 'Message avec\nretours\n\nà la ligne',
      title: 'Titre\nAvec\nSauts',
      detail: "Ligne 1\n\nLigne 2 avec    plusieurs    espaces et\ttabulation",
      url: 'https://nopalou.com',
      buttonParam: 'boutique',
    });

    const calls = axios.post.mock.calls;
    const tplCall = calls.find(c => c[1]?.type === 'template');
    expect(tplCall).toBeDefined();

    const bodyParams = tplCall[1].template.components[0].parameters;
    // Aucun paramètre ne doit contenir de retour chariot ou de tabulation
    for (const p of bodyParams) {
      expect(p.text).not.toMatch(/[\r\n\t]/);
      expect(p.text).not.toMatch(/ {4,}/);
    }
    expect(bodyParams[0].text).toBe('Titre · Avec · Sauts');
    expect(bodyParams[1].text).toBe('Consulter');
    expect(bodyParams[2].text).toBe('Ligne 1 · Ligne 2 avec plusieurs espaces et tabulation');
  });

  test('templateOnly: true ne tente PAS d\'envoi texte libre pour éviter l\'erreur 131047', async () => {
    axios.post.mockResolvedValue({ data: { messages: [{ id: 'wamid.templateOnly' }] } });

    await sendWhatsAppNotification('771234567', {
      textMessage: 'Ce texte ne doit pas être envoyé',
      title: 'Titre',
      detail: 'Détail',
      templateOnly: true,
    });

    const calls = axios.post.mock.calls;
    // Doit avoir exactement 1 seul appel (le template), et AUCUN appel de type 'text'
    const textCall = calls.find(c => c[1]?.type === 'text');
    expect(textCall).toBeUndefined();
    const tplCall = calls.find(c => c[1]?.type === 'template');
    expect(tplCall).toBeDefined();
  });

  test('sendWhatsAppProspectionDirecte envoie le template pur texte sans bouton nopalou_contact_direct', async () => {
    const { sendWhatsAppProspectionDirecte } = require('../../backend/services/whatsapp');
    axios.post.mockResolvedValue({ data: { messages: [{ id: 'wamid.direct' }] } });

    const res = await sendWhatsAppProspectionDirecte('781690379', {
      features: 'Caisse tactile & boutique WhatsApp\nFactures directes',
      googleProof: 'Tapez Nopalou sur Google 🇸🇳',
    });

    expect(res).toBeDefined();
    const tplCall = axios.post.mock.calls.find(c => c[1]?.template?.name === 'nopalou_contact_direct');
    expect(tplCall).toBeDefined();
    expect(tplCall[1].to).toBe('221781690379');
    expect(tplCall[1].template.components[0].parameters[0].text).toBe('Caisse tactile & boutique WhatsApp · Factures directes');
    expect(tplCall[1].template.components[0].parameters[1].text).toBe('Tapez Nopalou sur Google 🇸🇳');
  });
});
