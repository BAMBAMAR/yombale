// Protection des données — AUD-132 (portail locataire), AUD-134 (fiche boutique), AUD-135 (extraction en masse)
// Exige une base PostgreSQL de TEST (jamais la production) : DATABASE_URL_TEST. Données 100 % fictives créées puis supprimées.
const HAS_DB_TEST = !!process.env.DATABASE_URL_TEST;
const describeIntegration = HAS_DB_TEST ? describe : describe.skip;

process.env.NODE_ENV = 'test';
process.env.FORCE_RATE_LIMITS = '1'; // les limiteurs OTP du portail locataire restent actifs en test
if (HAS_DB_TEST) process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-jwt-secret';

jest.mock('../../backend/services/whatsapp', () => new Proxy({ estDesinscrit: async () => false, normalisePhone: (t) => `221${String(t).replace(/\D/g, '').slice(-9)}` }, {
  get: (t, p) => (p in t ? t[p] : async () => ({ ok: true })),
}));
jest.mock('../../backend/services/admin-alerts', () => new Proxy({}, { get: () => async () => ({ ok: true }) }));

const jwt = require('jsonwebtoken');

describeIntegration('Protection des données', () => {
  let request, app, pool, marchand, agenceId, bailId, locataire, autreBailId;
  const PW = 'Integration!Pass2026x';
  const TEL = '770000501';
  const TEL_INCONNU = '770000599';

  const post = (url, body, token) => {
    const r = request(app).post(url).send(body);
    return token ? r.set('Authorization', `Bearer ${token}`) : r;
  };

  beforeAll(async () => {
    request = require('supertest');
    app = require('../../backend/app');
    ({ pool } = require('../../backend/models/db'));

    const email = `protection.${Date.now()}@integration.test`;
    const reg = await post('/api/auth/inscription', { nom: 'Marchand Protection', email, mot_de_passe: PW });
    marchand = { token: reg.body.token, id: reg.body.user.id };

    // Fixtures fictives du portail locataire (AUD-132)
    const slug = `agence-protection-${Date.now()}`;
    agenceId = (await pool.query(`INSERT INTO agences_immo (utilisateur_id, nom, slug) VALUES ($1,'Agence Protection Test',$2) RETURNING id`, [marchand.id, slug])).rows[0].id;
    const bien = (await pool.query(`INSERT INTO biens_immo (titre, agence_id, adresse, ville) VALUES ('Bien fictif protection',$1,'Rue fictive','Dakar') RETURNING id`, [agenceId])).rows[0].id;
    locataire = (await pool.query(`INSERT INTO contacts_immo (nom, prenom, telephone, agence_id) VALUES ('LOCATAIRE-PROTECTION','Fictif',$1,$2) RETURNING id`, [TEL, agenceId])).rows[0].id;
    bailId = (await pool.query(`INSERT INTO baux_immo (bien_id, locataire_id, date_debut, loyer_mensuel, agence_id) VALUES ($1,$2,current_date,150000,$3) RETURNING id`, [bien, locataire, agenceId])).rows[0].id;
    const autreLoc = (await pool.query(`INSERT INTO contacts_immo (nom, telephone, agence_id) VALUES ('AUTRE-LOCATAIRE','770000502',$1) RETURNING id`, [agenceId])).rows[0].id;
    autreBailId = (await pool.query(`INSERT INTO baux_immo (bien_id, locataire_id, date_debut, loyer_mensuel, agence_id) VALUES ($1,$2,current_date,90000,$3) RETURNING id`, [bien, autreLoc, agenceId])).rows[0].id;
  });

  afterAll(async () => {
    if (!pool) return;
    await pool.query(`DELETE FROM baux_immo WHERE agence_id = $1`, [agenceId]).catch(() => {});
    await pool.query(`DELETE FROM contacts_immo WHERE agence_id = $1`, [agenceId]).catch(() => {});
    await pool.query(`DELETE FROM biens_immo WHERE agence_id = $1`, [agenceId]).catch(() => {});
    await pool.query(`DELETE FROM agences_immo WHERE id = $1`, [agenceId]).catch(() => {});
    await pool.query(`DELETE FROM auth_otp_phones WHERE telephone LIKE '2217700005%'`).catch(() => {});
    await pool.query(`DELETE FROM utilisateurs WHERE id = $1`, [marchand.id]).catch(() => {});
  });

  describe('AUD-132 — portail locataire : un numéro de téléphone ne suffit plus', () => {
    test('locataire-lookup par numéro seul est fermé (410)', async () => {
      const r = await request(app).get(`/api/locatif-immo/public/locataire-lookup?tel=${TEL}`);
      expect(r.status).toBe(410);
      expect(JSON.stringify(r.body)).not.toMatch(/LOCATAIRE-PROTECTION|150000/);
    });

    test('signature et dépôt de pièces par numéro seul sont fermés (410)', async () => {
      const s = await post(`/api/locatif-immo/public/bail/${bailId}/signer`, { tel: TEL, signature: 'data:image/png;base64,AAAA' });
      expect(s.status).toBe(410);
      const d = await request(app).post(`/api/locatif-immo/public/bail/${bailId}/documents`).field('tel', TEL).attach('file', Buffer.from('x'), 'a.pdf');
      expect(d.status).toBe(410);
      const { rows } = await pool.query('SELECT signature_locataire FROM baux_immo WHERE id=$1', [bailId]);
      expect(rows[0].signature_locataire).toBeNull();
    });

    test('PDF du bail : refusé sans lien signé, même avec le bon numéro ou sans paramètre', async () => {
      expect((await request(app).get(`/api/locatif-immo/public/bail/${bailId}.pdf`)).status).toBe(401);
      expect((await request(app).get(`/api/locatif-immo/public/bail/${bailId}.pdf?tel=${TEL}`)).status).toBe(401);
    });

    test('PDF du bail : accepté avec un lien signé valide pour CE bail seulement', async () => {
      const { genererLienBail, validerLienBail } = require('../../backend/lib/bailLink');
      const lien = genererLienBail(bailId);
      const ok = await request(app).get(`/api/locatif-immo/public/bail/${bailId}.pdf?lien=${lien}`);
      expect(ok.status).toBe(200);
      expect(ok.headers['content-type']).toMatch(/pdf/);
      // le lien d'un bail ne sert pas pour un autre bail
      expect((await request(app).get(`/api/locatif-immo/public/bail/${autreBailId}.pdf?lien=${lien}`)).status).toBe(401);
      // lien falsifié ou expiré
      expect((await request(app).get(`/api/locatif-immo/public/bail/${bailId}.pdf?lien=${lien.slice(0, -4)}AAAA`)).status).toBe(401);
      expect(validerLienBail(genererLienBail(bailId, -1), bailId).valide).toBe(false);
    });

    test('demander-otp : même réponse pour un numéro locataire et un numéro inconnu (plus d\'oracle)', async () => {
      const connu = await post('/api/locatif-immo/public/demander-otp', { tel: TEL });
      const inconnu = await post('/api/locatif-immo/public/demander-otp', { tel: TEL_INCONNU });
      expect(connu.status).toBe(200);
      expect(inconnu.status).toBe(200);
      expect(Object.keys(inconnu.body).sort()).toEqual(expect.arrayContaining(['success', 'message', 'telephoneMasque', 'telephone']));
      const { rows } = await pool.query(`SELECT count(*)::int AS n FROM auth_otp_phones WHERE telephone LIKE '%${TEL_INCONNU}'`);
      expect(rows[0].n).toBe(0); // aucun code n'est créé pour un numéro sans bail
    });

    test('demander-otp : plafond par numéro (5/h) puis 429', async () => {
      const tel = '770000503';
      const codes = [];
      for (let i = 0; i < 7; i++) codes.push((await post('/api/locatif-immo/public/demander-otp', { tel })).status);
      expect(codes.slice(0, 5).every((c) => c === 200)).toBe(true);
      expect(codes[5]).toBe(429);
    });

    test('mes-baux : exige le jeton du portail (code WhatsApp), pas une simple session', async () => {
      expect((await request(app).get('/api/locatif-immo/public/mes-baux')).status).toBe(401);
      const sessionSimple = jwt.sign({ userId: marchand.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      expect((await request(app).get('/api/locatif-immo/public/mes-baux').set('Authorization', `Bearer ${sessionSimple}`)).status).toBe(403);
      const portail = jwt.sign({ userId: marchand.id, role: 'locataire', tel: TEL, type: 'locataire_portal' }, process.env.JWT_SECRET, { expiresIn: '1h' });
      const r = await request(app).get('/api/locatif-immo/public/mes-baux').set('Authorization', `Bearer ${portail}`);
      expect(r.status).toBe(200);
      expect(r.body.baux).toHaveLength(1);
      expect(r.body.baux[0].id).toBe(bailId);
    });
  });
});
