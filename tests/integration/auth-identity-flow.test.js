// tests/integration/auth-identity-flow.test.js
const request = require('supertest');
const app = require('../../backend/app');
const { pool } = require('../../backend/models/db');
const jwt = require('jsonwebtoken');

describe('Flux Complet Identité & RGPD Nopalou', () => {
  const testEmail = `audit.auto.${Date.now()}@testnopalou.sn`;
  const testPassword = 'Password123!';
  const testNom = 'Mamadou Ndiaye Test';
  let sessionToken = '';
  let testUserId = '';

  afterAll(async () => {
    if (testUserId) {
      await pool.query('DELETE FROM utilisateurs WHERE id=$1', [testUserId]);
    }
  });

  test('1. Inscription réussie avec jwt_version et token session', async () => {
    const res = await request(app)
      .post('/api/auth/inscription')
      .send({
        nom: testNom,
        email: testEmail,
        mot_de_passe: testPassword,
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    testUserId = res.body.user.id;

    // Décodage du token de session pour vérifier jwtVersion
    const decoded = jwt.decode(res.body.token);
    expect(decoded.jwtVersion).toBe(1);
    expect(decoded.userId).toBe(testUserId);
  });

  test('2. Connexion avec email en minuscules/majuscules mélangées (normalizeEmail)', async () => {
    const mixedEmail = testEmail.toUpperCase();
    const res = await request(app)
      .post('/api/auth/connexion')
      .send({
        email: mixedEmail,
        mot_de_passe: testPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    sessionToken = res.body.token;

    const decoded = jwt.decode(sessionToken);
    expect(decoded.userId).toBe(testUserId);
    expect(decoded.jwtVersion).toBe(1);
  });

  test('3. Demande de suppression autonome sans le mot clé "SUPPRIMER" rejetée (400)', async () => {
    const res = await request(app)
      .post('/api/auth/supprimer-compte')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        mot_de_passe: testPassword,
        confirmation: 'OUI',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('SUPPRIMER');
  });

  test('4. Demande de suppression autonome avec "SUPPRIMER" validée (période de grâce 30j)', async () => {
    const res = await request(app)
      .post('/api/auth/supprimer-compte')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        mot_de_passe: testPassword,
        confirmation: 'SUPPRIMER',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.date_limite).toBeDefined();

    // Vérification en base
    const { rows } = await pool.query('SELECT supprime_le, supprime_par_utilisateur, jwt_version FROM utilisateurs WHERE id=$1', [testUserId]);
    expect(rows[0].supprime_le).not.toBeNull();
    expect(rows[0].supprime_par_utilisateur).toBe(true);
    expect(rows[0].jwt_version).toBe(2); // jwt_version incrémenté pour révoquer les sessions
  });

  test('5. Connexion autorisée pendant la période de grâce avec nouveau token', async () => {
    const res = await request(app)
      .post('/api/auth/connexion')
      .send({
        email: testEmail,
        mot_de_passe: testPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.user.en_cours_de_suppression).toBe(true);
    sessionToken = res.body.token;

    const decoded = jwt.decode(sessionToken);
    expect(decoded.jwtVersion).toBe(2);
  });

  test('6. Annulation de la suppression pendant la période de grâce', async () => {
    const res = await request(app)
      .post('/api/auth/annuler-suppression')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Vérification en base que supprime_le est redevenu NULL
    const { rows } = await pool.query('SELECT supprime_le, supprime_par_utilisateur FROM utilisateurs WHERE id=$1', [testUserId]);
    expect(rows[0].supprime_le).toBeNull();
    expect(rows[0].supprime_par_utilisateur).toBe(false);
  });
});
