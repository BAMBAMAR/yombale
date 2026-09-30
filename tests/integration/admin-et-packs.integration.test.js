// AUD-012 (packs / tarifs par quantité), AUD-018 (détail commande admin), AUD-019 (supervision POS admin)
// Exige une base PostgreSQL de TEST (DATABASE_URL_TEST). Données créées par l'API et par SQL dans la base de test.
const HAS_DB_TEST = !!process.env.DATABASE_URL_TEST;
const describeIntegration = HAS_DB_TEST ? describe : describe.skip;

process.env.NODE_ENV = 'test';
if (HAS_DB_TEST) process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-jwt-secret';
process.env.ADMIN_SECRET = 'integration-admin-secret-0123456789abcdef';

jest.mock('../../backend/services/whatsapp', () => new Proxy({ estDesinscrit: async () => false }, {
  get: (t, p) => (p in t ? t[p] : async () => ({ ok: true })),
}));
jest.mock('../../backend/services/admin-alerts', () => new Proxy({}, { get: () => async () => ({ ok: true }) }));

describeIntegration('Packs, détail commande admin, supervision POS', () => {
  let request, app, pool;
  const PW = 'Integration!Pass2026x';
  const admin = () => ({ 'x-admin-secret': process.env.ADMIN_SECRET });
  const users = {};
  let produitsA = [];
  let produitB;

  const inscrire = async (nom) => {
    const r = await request(app).post('/api/auth/inscription').send({ nom, email: `${nom.replace(/\s+/g, '.').toLowerCase()}.${Date.now()}@integration.test`, mot_de_passe: PW });
    return { token: r.body.token, id: r.body.user.id };
  };
  const creerBoutique = async (u, tel) => {
    const r = await request(app).post('/api/boutiques').set('Authorization', `Bearer ${u.token}`).send({ nom: `Boutique ${Date.now()}${tel}`, telephone: tel, ville: 'Dakar', categorie: 'mode' });
    return r.body.boutique || r.body;
  };
  const creerProduit = async (u, boutique, nom, prix) => {
    const r = await request(app).post(`/api/boutiques/${boutique.id}/produits`).set('Authorization', `Bearer ${u.token}`).send({ nom, prix, stock_quantite: 20, description: nom });
    return r.body.produit.id;
  };

  beforeAll(async () => {
    request = require('supertest');
    app = require('../../backend/app');
    ({ pool } = require('../../backend/models/db'));
    users.a = await inscrire('Marchand Packs A');
    users.b = await inscrire('Marchand Packs B');
    users.boutiqueA = await creerBoutique(users.a, '771118801');
    users.boutiqueB = await creerBoutique(users.b, '771118802');
    produitsA = [];
    for (const [n, p] of [['Pack parent', 20000], ['Composant 1', 5000], ['Composant 2', 3000]]) produitsA.push(await creerProduit(users.a, users.boutiqueA, n, p));
    produitB = await creerProduit(users.b, users.boutiqueB, 'Produit de B', 1000);
  });

  afterAll(async () => {
    if (!pool) return;
    for (const b of [users.boutiqueA, users.boutiqueB]) {
      if (b) {
        await pool.query('DELETE FROM boutique_pos_sessions WHERE boutique_id=$1', [b.id]).catch(() => {});
        await pool.query('DELETE FROM commandes_boutique WHERE boutique_id=$1', [b.id]).catch(() => {});
        await pool.query('DELETE FROM boutiques WHERE id=$1', [b.id]).catch(() => {});
      }
    }
    for (const u of [users.a, users.b]) if (u) await pool.query('DELETE FROM utilisateurs WHERE id=$1', [u.id]).catch(() => {});
    await pool.end().catch(() => {});
  });

  describe('AUD-012 — composants et tarifs par quantité', () => {
    const url = (b, p, suffixe) => `/api/boutiques/${b.id}/produits/${p}/${suffixe}`;
    const auth = (u) => ({ Authorization: `Bearer ${u.token}` });

    test('le propriétaire définit un pack et le relit', async () => {
      const res = await request(app).post(url(users.boutiqueA, produitsA[0], 'composants')).set(auth(users.a))
        .send({ composants: [{ enfant_id: produitsA[1], quantite: 2 }, { enfant_id: produitsA[2], quantite: 1 }] });
      expect(res.status).toBe(200);
      const lu = await request(app).get(url(users.boutiqueA, produitsA[0], 'composants'));
      expect(lu.status).toBe(200);
      expect(lu.body.composants).toHaveLength(2);
    });

    test('le propriétaire définit une grille B2B et la relit', async () => {
      const res = await request(app).post(url(users.boutiqueA, produitsA[0], 'tarifs-quantite')).set(auth(users.a))
        .send({ tarifs: [{ quantite_min: 5, prix_unitaire_fcfa: 18000 }, { quantite_min: 10, prix_unitaire_fcfa: 16000 }, { quantite_min: 1, prix_unitaire_fcfa: 1 }] });
      expect(res.status).toBe(200);
      const lu = await request(app).get(url(users.boutiqueA, produitsA[0], 'tarifs-quantite'));
      expect(lu.body.tarifs.map(t => Number(t.quantite_min))).toEqual([5, 10]); // le seuil « 1 » invalide est ignoré
    });

    test('un autre marchand est refusé et rien n\'est écrit', async () => {
      const avant = (await pool.query('SELECT COUNT(*) FROM produit_tarifs_quantite WHERE produit_id=$1', [produitsA[0]])).rows[0].count;
      const r1 = await request(app).post(url(users.boutiqueA, produitsA[0], 'tarifs-quantite')).set(auth(users.b)).send({ tarifs: [{ quantite_min: 5, prix_unitaire_fcfa: 1 }] });
      const r2 = await request(app).post(url(users.boutiqueA, produitsA[0], 'composants')).set(auth(users.b)).send({ composants: [] });
      expect(r1.status).toBe(403);
      expect(r2.status).toBe(403);
      const apres = (await pool.query('SELECT COUNT(*) FROM produit_tarifs_quantite WHERE produit_id=$1', [produitsA[0]])).rows[0].count;
      expect(apres).toBe(avant);
      expect((await request(app).get(url(users.boutiqueA, produitsA[0], 'composants'))).body.composants).toHaveLength(2);
    });

    test('propre boutique mais produit d\'une autre boutique : 404 (pas d\'écriture inter-boutiques)', async () => {
      const r = await request(app).post(url(users.boutiqueA, produitB, 'tarifs-quantite')).set(auth(users.a)).send({ tarifs: [{ quantite_min: 5, prix_unitaire_fcfa: 1 }] });
      expect(r.status).toBe(404);
      const n = (await pool.query('SELECT COUNT(*) FROM produit_tarifs_quantite WHERE produit_id=$1', [produitB])).rows[0].count;
      expect(n).toBe('0');
    });

    test('composant d\'une autre boutique, auto-référence et identifiants invalides : 400', async () => {
      const auth_ = auth(users.a);
      const etranger = await request(app).post(url(users.boutiqueA, produitsA[0], 'composants')).set(auth_).send({ composants: [{ enfant_id: produitB, quantite: 1 }] });
      const soi = await request(app).post(url(users.boutiqueA, produitsA[0], 'composants')).set(auth_).send({ composants: [{ enfant_id: produitsA[0], quantite: 1 }] });
      const invalide = await request(app).post(url(users.boutiqueA, produitsA[0], 'composants')).set(auth_).send({ composants: [{ enfant_id: 'pas-un-uuid', quantite: 1 }] });
      const idKO = await request(app).post(`/api/boutiques/${users.boutiqueA.id}/produits/xxx/composants`).set(auth_).send({ composants: [] });
      expect([etranger.status, soi.status, invalide.status, idKO.status]).toEqual([400, 400, 400, 400]);
      expect((await request(app).get(url(users.boutiqueA, produitsA[0], 'composants'))).body.composants).toHaveLength(2); // pack intact
    });
  });

  describe('AUD-018 / AUD-019 — écrans admin', () => {
    test('détail d\'une commande : 200 avec ses lignes et l\'e-mail du propriétaire', async () => {
      const o = await request(app).post('/api/boutiques/commandes/express').send({
        boutique_id: users.boutiqueA.id, client_nom: 'Client Admin', client_telephone: '771117700', methode_paiement: 'cash',
        articles: [{ produit_id: produitsA[1], quantite: 1 }, { produit_id: produitsA[2], quantite: 2 }],
      });
      expect(o.status).toBe(201);
      const { rows } = await pool.query('SELECT id FROM commandes_boutique WHERE reference=$1', [o.body.reference]);
      const res = await request(app).get(`/api/admin/commandes/${rows[0].id}`).set(admin());
      expect(res.status).toBe(200);
      expect(res.body.commande.reference).toBe(o.body.reference);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.commande.boutique_email).toMatch(/@integration\.test$/);
    });

    test('supervision POS : statistiques et liste des sessions répondent 200 avec écart et dates', async () => {
      await pool.query(
        `INSERT INTO boutique_pos_sessions (boutique_id, caissier_nom, fond_caisse_initial, especes_comptees, ecart_caisse, date_ouverture, date_cloture, statut)
         VALUES ($1,'Caissier Test',10000,9500,-500,NOW() - INTERVAL '2 hours',NOW() - INTERVAL '1 hour','cloturee'),
                ($1,'Caissier Ouvert',5000,NULL,NULL,NOW(),NULL,'ouverte')`,
        [users.boutiqueA.id]
      );
      const stats = await request(app).get('/api/admin/pos/stats').set(admin());
      expect(stats.status).toBe(200);
      expect(stats.body.stats.sessions.ouvertes).toBeGreaterThanOrEqual(1);
      expect(stats.body.stats.sessions.cloturesAvecEcart).toBeGreaterThanOrEqual(1);
      expect(stats.body.stats.sessions.totalEcartsCumules).toBeGreaterThanOrEqual(500);

      const liste = await request(app).get('/api/admin/pos/sessions').query({ boutique_id: users.boutiqueA.id }).set(admin());
      expect(liste.status).toBe(200);
      const cloturee = liste.body.sessions.find(s => s.caissier_nom === 'Caissier Test');
      expect(cloturee.statut).toBe('fermee');          // contrat conservé pour l'interface admin
      expect(Number(cloturee.ecart)).toBe(-500);
      expect(cloturee.ouvert_le).toBeTruthy();

      const filtre = await request(app).get('/api/admin/pos/sessions').query({ boutique_id: users.boutiqueA.id, statut: 'fermee' }).set(admin());
      expect(filtre.body.sessions.map(s => s.caissier_nom)).toEqual(['Caissier Test']);
    });
  });
});
