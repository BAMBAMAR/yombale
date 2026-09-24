// tests/unit/support-service.test.js
// Tests unitaires pour l'API Support, SAV, Gestion d'incidents et Signalements (/api/support)

const request = require('supertest');
const express = require('express');

const mockQuery = jest.fn();
jest.mock('../../backend/models/db', () => ({
  pool: {
    query: mockQuery,
  },
}));

jest.mock('../../backend/services/admin-alerts', () => ({
  alerterAdmin: jest.fn(),
}));

jest.mock('../../backend/services/email', () => ({
  envoyerEmail: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../../backend/services/whatsapp', () => ({
  sendWhatsAppText: jest.fn().mockResolvedValue({ success: true }),
}));

const supportRouter = require('../../backend/routes/support');

const app = express();
app.use(express.json());
// Injecter un faux req.user si test utilisateur connecté
app.use((req, res, next) => {
  if (req.headers['x-mock-user-id']) {
    req.user = { id: req.headers['x-mock-user-id'] };
  }
  next();
});
app.use('/api/support', supportRouter);

describe('API Support & SAV (/api/support)', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  describe('POST /api/support/tickets — Création de ticket', () => {
    test('renvoie 400 si sujet ou description manquent', async () => {
      const res = await request(app)
        .post('/api/support/tickets')
        .send({ sujet: '', description: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Sujet et description');
    });

    test('renvoie 400 pour un visiteur non connecté sans téléphone ni email', async () => {
      const res = await request(app)
        .post('/api/support/tickets')
        .send({
          sujet: 'Incident commande',
          description: 'Mon colis est en retard',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('téléphone ou un email');
    });

    test('crée un ticket avec succès pour un client visiteur', async () => {
      const ticketCree = {
        id: 'tck-uuid-1',
        numero_ticket: 'TCK-2026-9999',
        numero: 'TCK-2026-9999',
        sujet: 'Litige Commande #CMD-1234',
        description: 'Colis non reçu',
        categorie: 'commande',
        statut: 'nouveau',
        priorite: 'haute',
        commande_ref: 'CMD-1234',
        contact_nom: 'Fatou Sow',
        contact_telephone: '771234567',
        contact_email: 'fatou@test.sn',
        canal: 'web_suivi',
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [ticketCree] });

      const res = await request(app)
        .post('/api/support/tickets')
        .send({
          sujet: 'Litige Commande #CMD-1234',
          description: 'Colis non reçu',
          categorie: 'commande',
          priorite: 'haute',
          commande_ref: 'CMD-1234',
          contact_nom: 'Fatou Sow',
          contact_telephone: '771234567',
          contact_email: 'fatou@test.sn',
          canal: 'web_suivi',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.ticket.numero).toBe('TCK-2026-9999');
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('GET /api/support/tickets/suivi/:numero — Suivi de ticket & Anti-IDOR', () => {
    test('renvoie 404 si le ticket n\'existe pas', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/support/tickets/suivi/TCK-NOT-FOUND');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Ticket introuvable');
    });

    test('bloque l\'accès (403) si aucun identifiant de vérification n\'est fourni pour un visiteur', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'tck-1',
            numero_ticket: 'TCK-100',
            contact_telephone: '771234567',
            contact_email: 'client@test.sn',
          },
        ],
      });

      const res = await request(app)
        .get('/api/support/tickets/suivi/TCK-100');

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Veuillez renseigner votre numéro de téléphone ou votre adresse email');
    });

    test('autorise l\'accès si le téléphone de contact correspond', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'tck-1',
            numero_ticket: 'TCK-100',
            sujet: 'Recherche ticket',
            contact_telephone: '221771234567',
            contact_email: 'client@test.sn',
            messages: [{ auteur: 'client', message: 'Message test' }],
          },
        ],
      });

      const res = await request(app)
        .get('/api/support/tickets/suivi/TCK-100?contact=771234567');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.ticket.numero).toBe('TCK-100');
    });
  });

  describe('POST /api/support/tickets/:numero/repondre — Réponse client au ticket', () => {
    test('renvoie 400 si le message est vide', async () => {
      const res = await request(app)
        .post('/api/support/tickets/TCK-100/repondre')
        .send({ message: '  ' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Message requis');
    });

    test('ajoute la réponse et met à jour le statut du ticket', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'tck-1',
              numero: 'TCK-100',
              statut: 'en_attente_client',
              contact_telephone: '771234567',
              messages: [],
            },
          ],
        })
        .mockResolvedValueOnce({ rowCount: 1 });

      const res = await request(app)
        .post('/api/support/tickets/TCK-100/repondre')
        .send({
          message: 'Voici la photo du colis comme demandé.',
          contact: '771234567',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message.auteur).toBe('client');
    });
  });

  describe('POST /api/support/signalements — Déclaration d\'abus ou de fraude', () => {
    test('renvoie 400 si type_entite ou motif sont manquants', async () => {
      const res = await request(app)
        .post('/api/support/signalements')
        .send({ entite_id: 'prod-1' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('type d\'entité et motif requis');
    });

    test('enregistre le signalement avec succès', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'sig-1',
            type_entite: 'boutique',
            entite_id: 'btq-fraud-1',
            motif: 'contrefacon',
            statut: 'en_attente',
          },
        ],
      });

      const res = await request(app)
        .post('/api/support/signalements')
        .send({
          type_entite: 'boutique',
          entite_id: 'btq-fraud-1',
          motif: 'contrefacon',
          description: 'Vente de faux produits',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.signalement.motif).toBe('contrefacon');
    });
  });
});
