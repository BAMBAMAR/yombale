// tests/unit/whatsapp-chatbot-p0.test.js
// Tests de validation des correctifs P0 de sécurité et robustesse du chatbot Nopalou (H1, H2, H3, L1)

const mockQuery = jest.fn();
jest.mock('../../backend/models/db', () => ({
  pool: {
    query: mockQuery,
  },
}));

const mockSendWhatsAppText = jest.fn().mockResolvedValue({});
const mockSendWhatsAppInteractive = jest.fn().mockResolvedValue({});
const mockSendWhatsAppButton = jest.fn().mockResolvedValue({});
const mockSendWhatsAppCarousel = jest.fn().mockResolvedValue({});
const mockSendWhatsAppMenuOuFin = jest.fn().mockResolvedValue({});

jest.mock('../../backend/services/whatsapp', () => ({
  sendWhatsAppText: mockSendWhatsAppText,
  sendWhatsAppInteractive: mockSendWhatsAppInteractive,
  sendWhatsAppButton: mockSendWhatsAppButton,
  sendWhatsAppButtons3: jest.fn().mockResolvedValue({}),
  sendWhatsAppProduct: jest.fn().mockResolvedValue({}),
  sendWhatsAppCarousel: mockSendWhatsAppCarousel,
  sendWhatsAppMenuOuFin: mockSendWhatsAppMenuOuFin,
  sendReadReceipt: jest.fn().mockResolvedValue({}),
  sendTyping: jest.fn().mockResolvedValue({}),
  normalisePhone: jest.fn(p => (p ? p.replace(/\D/g, '') : p)),
  estDesinscrit: jest.fn().mockResolvedValue(false),
  ajouterBlacklist: jest.fn().mockResolvedValue({}),
  retirerBlacklist: jest.fn().mockResolvedValue({}),
}));

const {
  handleIncoming,
  verifierCodePin,
  cleanupOldMessages,
  resetInactiveSessions,
  distanceLevenshtein,
  corrigerRequeteFuzzy,
  handleSearchQuery,
} = require('../../backend/services/whatsapp-chatbot');

describe('Chatbot P0 Remediation Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('H1 — Rate limiting et protection brute-force du Code PIN Marchand', () => {
    test('verifierCodePin valide le code PIN par défaut ou boutique', async () => {
      const boutique = { id: 1, nom: 'Test Boutique', code_pin: '4321' };
      expect(await verifierCodePin(boutique, '4321')).toBe(true);
      expect(await verifierCodePin(boutique, '9999')).toBe(false);
    });

    test('bloque après 3 tentatives infructueuses consécutives', async () => {
      const phone = '221770000001';
      const boutique = { id: 10, nom: 'Dakar Express', code_pin: '1234', proprietaire_nom: 'Moussa' };

      // Simuler session en MARCHAND_PIN avec 2 tentatives déjà échouées
      mockQuery.mockImplementation((sql, params) => {
        if (sql.includes('whatsapp_processed_messages')) {
          return Promise.resolve({ rows: [{ message_id: 'm-pin-3' }] });
        }
        if (sql.includes('SELECT state, context FROM whatsapp_sessions')) {
          return Promise.resolve({
            rows: [{
              state: 'MARCHAND_PIN',
              context: { boutique, pinAttempts: 2 },
            }],
          });
        }
        if (sql.includes('INSERT INTO whatsapp_sessions')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      });

      // 3e tentative avec mauvais PIN '9999'
      await handleIncoming({
        id: 'm-pin-3',
        from: phone,
        type: 'text',
        text: { body: '9999' },
      });

      // Doit envoyer le message de verrouillage 15 minutes
      const lockMsgCall = mockSendWhatsAppText.mock.calls.find(c =>
        c[0] === phone && c[1].includes('verrouillé pendant 15 minutes')
      );
      expect(lockMsgCall).toBeDefined();

      // Vérifie que setSession a bien enregistré le pinLockedUntil
      const updateSessionCall = mockQuery.mock.calls.find(c =>
        c[0].includes('INSERT INTO whatsapp_sessions') && c[1][0] === phone
      );
      expect(updateSessionCall).toBeDefined();
      const savedContext = JSON.parse(updateSessionCall[1][2]);
      expect(savedContext.pinAttempts).toBe(3);
      expect(savedContext.pinLockedUntil).toBeGreaterThan(Date.now());
    });

    test('rejette immédiatement la saisie si le compte est actuellement verrouillé', async () => {
      const phone = '221770000002';
      const boutique = { id: 11, nom: 'Almadies Store', code_pin: '1234' };
      const lockExpiry = Date.now() + 10 * 60 * 1000; // Encore 10 min de verrouillage

      mockQuery.mockImplementation((sql) => {
        if (sql.includes('whatsapp_processed_messages')) {
          return Promise.resolve({ rows: [{ message_id: 'm-locked' }] });
        }
        if (sql.includes('SELECT state, context FROM whatsapp_sessions')) {
          return Promise.resolve({
            rows: [{
              state: 'MARCHAND_PIN',
              context: { boutique, pinAttempts: 3, pinLockedUntil: lockExpiry },
            }],
          });
        }
        return Promise.resolve({ rows: [] });
      });

      await handleIncoming({
        id: 'm-locked',
        from: phone,
        type: 'text',
        text: { body: '1234' }, // Même avec le bon PIN, le verrou bloque
      });

      const lockWarningCall = mockSendWhatsAppText.mock.calls.find(c =>
        c[0] === phone && c[1].includes('temporairement suspendu')
      );
      expect(lockWarningCall).toBeDefined();
    });
  });

  describe('H3 — Persistance et expiration OTP dans la session DB', () => {
    test('valide l\'OTP depuis la session DB même si le cache mémoire a été vidé (redémarrage serveur)', async () => {
      const phone = '221770000003';
      const boutique = { id: 12, nom: 'Plateau Shop', code_pin: '1234' };
      const validOtp = '7890';

      mockQuery.mockImplementation((sql) => {
        if (sql.includes('whatsapp_processed_messages')) {
          return Promise.resolve({ rows: [{ message_id: 'm-otp-ok' }] });
        }
        if (sql.includes('SELECT state, context FROM whatsapp_sessions')) {
          return Promise.resolve({
            rows: [{
              state: 'MARCHAND_RESET_OTP',
              context: {
                boutique,
                otpCode: validOtp,
                otpExpiresAt: Date.now() + 5 * 60 * 1000, // Valide pour 5 min
              },
            }],
          });
        }
        if (sql.includes('INSERT INTO whatsapp_sessions')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      });

      await handleIncoming({
        id: 'm-otp-ok',
        from: phone,
        type: 'text',
        text: { body: validOtp },
      });

      // Vérifie que l'identité est validée et qu'on demande le nouveau code PIN
      const successMsg = mockSendWhatsAppText.mock.calls.find(c =>
        c[0] === phone && c[1].includes('Identité vérifiée avec succès')
      );
      expect(successMsg).toBeDefined();
    });

    test('refuse un code OTP expiré même s\'il correspond au code généré', async () => {
      const phone = '221770000004';
      const boutique = { id: 13, nom: 'Mermoz Shop', code_pin: '1234' };

      mockQuery.mockImplementation((sql) => {
        if (sql.includes('whatsapp_processed_messages')) {
          return Promise.resolve({ rows: [{ message_id: 'm-otp-expired' }] });
        }
        if (sql.includes('SELECT state, context FROM whatsapp_sessions')) {
          return Promise.resolve({
            rows: [{
              state: 'MARCHAND_RESET_OTP',
              context: {
                boutique,
                otpCode: '4567',
                otpExpiresAt: Date.now() - 60 * 1000, // Expiré depuis 1 min
              },
            }],
          });
        }
        return Promise.resolve({ rows: [] });
      });

      await handleIncoming({
        id: 'm-otp-expired',
        from: phone,
        type: 'text',
        text: { body: '4567' },
      });

      const failMsg = mockSendWhatsAppText.mock.calls.find(c =>
        c[0] === phone && c[1].includes('incorrect ou expiré')
      );
      expect(failMsg).toBeDefined();
    });
  });

  describe('H2 — Traitement des erreurs et élimination du silence radio', () => {
    test('envoie un message d\'erreur convivial au lieu de couper la communication en cas d\'erreur DB imprévue', async () => {
      const phone = '221770000005';

      // Simuler une coupure de base de données soudaine
      mockQuery.mockImplementation((sql) => {
        if (sql.includes('whatsapp_processed_messages')) {
          return Promise.resolve({ rows: [{ message_id: 'm-crash' }] });
        }
        throw new Error('Connection terminated unexpectedly');
      });

      await handleIncoming({
        id: 'm-crash',
        from: phone,
        type: 'text',
        text: { body: 'bonjour' },
      });

      // Doit avoir envoyé le message de secours à l'utilisateur
      const errorFallbackMsg = mockSendWhatsAppText.mock.calls.find(c =>
        c[0] === phone && c[1].includes('Oups, une indisponibilité momentanée est survenue')
      );
      expect(errorFallbackMsg).toBeDefined();
    });
  });

  describe('L1 — Nettoyage périodique et prévention des fuites mémoire', () => {
    test('cleanupOldMessages et resetInactiveSessions s\'exécutent sans erreur et nettoient les sessions inactives', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await expect(cleanupOldMessages()).resolves.not.toThrow();
      await expect(resetInactiveSessions()).resolves.not.toThrow();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM whatsapp_processed_messages')
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE whatsapp_sessions SET state=\'IDLE\'')
      );
    });
  });

  describe('M2 — Tolérance aux fautes d\'orthographe & Fuzzy Matching', () => {
    test('calcule correctement la distance de Levenshtein', () => {
      expect(distanceLevenshtein('climatiseur', 'climatisseur')).toBe(1);
      expect(distanceLevenshtein('appartement', 'apartement')).toBe(1);
      expect(distanceLevenshtein('terrain', 'terain')).toBe(1);
      expect(distanceLevenshtein('chaussure', 'chaussure')).toBe(0);
      expect(distanceLevenshtein('abc', 'xyz')).toBe(3);
    });

    test('corrige automatiquement les fautes d\'orthographe fréquentes', () => {
      expect(corrigerRequeteFuzzy('climatisseur')).toBe('climatiseur');
      expect(corrigerRequeteFuzzy('apartement')).toBe('appartement');
      expect(corrigerRequeteFuzzy('terain')).toBe('terrain');
      expect(corrigerRequeteFuzzy('chaussur')).toBe('chaussure');
      // Terme correct non altéré
      expect(corrigerRequeteFuzzy('appartement')).toBeNull();
    });

    test('handleSearchQuery propose les résultats de la suggestion fuzzy en cas de faute de frappe', async () => {
      const phone = '221770000006';

      // 1ère recherche avec 'climatisseur' -> 0 résultat FTS
      // 2ème recherche avec 'climatiseur' -> 1 résultat trouvé !
      mockQuery.mockImplementation((sql, params) => {
        if (sql.includes('to_tsvector') && params && params[0] === 'climatiseur') {
          return Promise.resolve({
            rows: [{
              type: 'produit',
              id: 'prod-clim-1',
              titre: 'Climatiseur Inverter 12000 BTU',
              prix: 185000,
              photo: 'https://img.com/clim.jpg',
              boutique_nom: 'Electro Dakar',
              boutique_slug: 'electro-dakar',
            }],
          });
        }
        return Promise.resolve({ rows: [] });
      });

      await handleSearchQuery(phone, 'climatisseur');

      // Doit avoir prévenu de la correction
      const typoMsg = mockSendWhatsAppText.mock.calls.find(c =>
        c[0] === phone && c[1].includes('Aucun résultat direct pour') && c[1].includes('climatiseur')
      );
      expect(typoMsg).toBeDefined();
    });
  });

  describe('M3 — Mécanisme de correction d\'intention et reprise fluide', () => {
    test('reconnaît "non je voulais dire" et permet de corriger le nom de boutique dans le tunnel', async () => {
      const phone = '221770000007';

      mockQuery.mockImplementation((sql) => {
        if (sql.includes('whatsapp_processed_messages')) {
          return Promise.resolve({ rows: [{ message_id: 'm-correct-1' }] });
        }
        if (sql.includes('SELECT state, context FROM whatsapp_sessions')) {
          return Promise.resolve({
            rows: [{
              state: 'CREER_BOUTIQUE_VILLE',
              context: { boutiqueNom: 'Mauvais Nom' },
            }],
          });
        }
        if (sql.includes('INSERT INTO whatsapp_sessions')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      });

      await handleIncoming({
        id: 'm-correct-1',
        from: phone,
        type: 'text',
        text: { body: 'non je voulais dire' },
      });

      // Doit renvoyer vers la saisie du nom de boutique
      const correctMsg = mockSendWhatsAppText.mock.calls.find(c =>
        c[0] === phone && c[1].includes('Reprenons : quel est le nom souhaité pour votre boutique')
      );
      expect(correctMsg).toBeDefined();

      // Vérifie la transition d'état vers CREER_BOUTIQUE_NOM
      const updateCall = mockQuery.mock.calls.find(c =>
        c[0].includes('INSERT INTO whatsapp_sessions') && c[1][1] === 'CREER_BOUTIQUE_NOM'
      );
      expect(updateCall).toBeDefined();
    });

    test('permet de recommencer avec "recommencer" sans effectuer de recherche produit inutile', async () => {
      const phone = '221770000008';

      mockQuery.mockImplementation((sql) => {
        if (sql.includes('whatsapp_processed_messages')) {
          return Promise.resolve({ rows: [{ message_id: 'm-restart-1' }] });
        }
        if (sql.includes('SELECT state, context FROM whatsapp_sessions')) {
          return Promise.resolve({
            rows: [{
              state: 'CREER_BOUTIQUE_NOM',
              context: {},
            }],
          });
        }
        if (sql.includes('INSERT INTO whatsapp_sessions')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      });

      await handleIncoming({
        id: 'm-restart-1',
        from: phone,
        type: 'text',
        text: { body: 'recommencer' },
      });

      // Doit réinitialiser la session sur MENU
      const updateCall = mockQuery.mock.calls.find(c =>
        c[0].includes('INSERT INTO whatsapp_sessions') && c[1][1] === 'MENU'
      );
      expect(updateCall).toBeDefined();
    });
  });

  describe('M6 — Modification de panier en cours de commande', () => {
    test('permet d\'incrémenter la quantité avec le bouton +1 lors de la confirmation', async () => {
      const phone = '221770000009';
      const boutique = { id: 25, nom: 'Tech Dakar', whatsapp: '221770000000' };
      const initialCommande = {
        items: [{ produit_id: 'p-1', nom_produit: 'Écouteurs Bluetooth', prix: 15000, quantite: 1, stock_quantite: 10 }],
        client_nom: 'Fatou Diop',
        client_telephone: '221771112233',
        client_adresse: 'Mermoz Dakar',
        zone_nom: 'Dakar Centre',
        frais_livraison: 2000,
        methode_paiement: 'wave',
      };

      mockQuery.mockImplementation((sql) => {
        if (sql.includes('whatsapp_processed_messages')) {
          return Promise.resolve({ rows: [{ message_id: 'm-qte-plus' }] });
        }
        if (sql.includes('SELECT state, context FROM whatsapp_sessions')) {
          return Promise.resolve({
            rows: [{
              state: 'COMMANDE_CONFIRMATION',
              context: { boutique, commande: initialCommande },
            }],
          });
        }
        if (sql.includes('INSERT INTO whatsapp_sessions')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      });

      await handleIncoming({
        id: 'm-qte-plus',
        from: phone,
        type: 'interactive',
        interactive: {
          button_reply: { id: 'cmd_plus_un', title: '➕ Ajouter (+1)' },
        },
      });

      // Vérifie que le message de confirmation de nouvelle quantité a été émis
      const qteMsg = mockSendWhatsAppText.mock.calls.find(c =>
        c[0] === phone && c[1].includes('Quantité mise à jour : *2*')
      );
      expect(qteMsg).toBeDefined();

      // Vérifie que la nouvelle session enregistre la quantité = 2
      const updateSession = mockQuery.mock.calls.find(c =>
        c[0].includes('INSERT INTO whatsapp_sessions') && c[1][0] === phone
      );
      expect(updateSession).toBeDefined();
      const savedContext = JSON.parse(updateSession[1][2]);
      expect(savedContext.commande.items[0].quantite).toBe(2);
    });
  });
});
