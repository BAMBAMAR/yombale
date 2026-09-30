// Chaîne commande/paiement du checkout express — AUD-044, AUD-042, AUD-011, AUD-010, AUD-046, AUD-045
// Exige une base PostgreSQL de TEST (jamais la production) : DATABASE_URL_TEST.
// Les données sont créées par l'API elle-même (comptes, boutique, produits) : aucune fixture préexistante.
const HAS_DB_TEST = !!process.env.DATABASE_URL_TEST;
const describeIntegration = HAS_DB_TEST ? describe : describe.skip;

process.env.NODE_ENV = 'test';
if (HAS_DB_TEST) process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-jwt-secret';
process.env.WAVE_API_KEY = 'integration-wave-key';
process.env.WAVE_WEBHOOK_SECRET = 'integration-wave-webhook-secret';

// Aucun appel réseau sortant : Wave est simulé (échec contrôlé), WhatsApp et alertes sont neutralisés.
jest.mock('../../backend/services/wave', () => {
  const real = jest.requireActual('../../backend/services/wave');
  return { ...real, createCheckoutSession: jest.fn(async () => { throw new Error('Wave indisponible (test)'); }) };
});
jest.mock('../../backend/services/orange-money', () => ({
  createWebPayment: jest.fn(async () => ({ payment_url: 'https://om.test/pay', pay_token: 'tok' })),
}));
jest.mock('../../backend/services/whatsapp', () => new Proxy({ estDesinscrit: async () => false }, {
  get: (t, p) => (p in t ? t[p] : async () => ({ ok: true })),
}));
jest.mock('../../backend/services/admin-alerts', () => new Proxy({}, { get: () => async () => ({ ok: true }) }));

const crypto = require('crypto');

describeIntegration('Checkout express — intégrité commande / stock / paiement', () => {
  let request, app, pool, wave, marchand, boutique, produits, annulerExp;
  const PW = 'Integration!Pass2026x';
  const tel = '771119900';

  const post = (url, body, token) => {
    const r = request(app).post(url).send(body);
    return token ? r.set('Authorization', `Bearer ${token}`) : r;
  };
  const stock = async (id) => Number((await pool.query('SELECT stock_quantite FROM boutique_produits WHERE id=$1', [id])).rows[0].stock_quantite);
  const webhookWave = (ref, amount) => {
    const body = JSON.stringify({ type: 'checkout.session.completed', data: { client_reference: ref, amount: String(amount) } });
    const t = Math.floor(Date.now() / 1000);
    const v1 = crypto.createHmac('sha256', process.env.WAVE_WEBHOOK_SECRET).update(`${t}${body}`).digest('hex');
    return request(app).post('/api/paiement/wave/webhook').set('Content-Type', 'application/json').set('Wave-Signature', `t=${t},v1=${v1}`).send(body);
  };

  beforeAll(async () => {
    request = require('supertest');
    app = require('../../backend/app');
    ({ pool } = require('../../backend/models/db'));
    wave = require('../../backend/services/wave');
    ({ annulerCommandesImpayeesExpirees: annulerExp } = require('../../backend/services/commande-service'));

    const email = `pipeline.${Date.now()}@integration.test`;
    const reg = await post('/api/auth/inscription', { nom: 'Marchand Pipeline', email, mot_de_passe: PW });
    marchand = { token: reg.body.token, id: reg.body.user.id };
    const b = await post('/api/boutiques', { nom: `Boutique Pipeline ${Date.now()}`, telephone: '771110077', ville: 'Dakar', categorie: 'mode' }, marchand.token);
    boutique = b.body.boutique || b.body;
    produits = [];
    for (const [nom, prix] of [['Article A', 10000], ['Article B', 5000], ['Article C', 2500]]) {
      const p = await post(`/api/boutiques/${boutique.id}/produits`, { nom, prix, stock_quantite: 50, description: nom }, marchand.token);
      produits.push({ id: p.body.produit.id, prix });
    }
  });

  afterAll(async () => {
    if (!pool) return;
    await pool.query(`DELETE FROM commandes_boutique WHERE boutique_id = $1`, [boutique.id]).catch(() => {});
    await pool.query(`DELETE FROM boutiques WHERE id = $1`, [boutique.id]).catch(() => {});
    await pool.query(`DELETE FROM utilisateurs WHERE id = $1`, [marchand.id]).catch(() => {});
    await pool.end().catch(() => {});
  });

  const base = () => ({ boutique_id: boutique.id, client_nom: 'Client Pipeline', client_telephone: tel, methode_paiement: 'cash' });

  test('panier de 3 articles : un en-tête au total complet, 3 lignes, stock décrémenté par article', async () => {
    const avant = [];
    for (const p of produits) avant.push(await stock(p.id));
    const cart = [{ produit_id: produits[0].id, quantite: 2 }, { produit_id: produits[1].id, quantite: 1 }, { produit_id: produits[2].id, quantite: 3 }];
    const attendu = 2 * 10000 + 5000 + 3 * 2500 + 1500;

    const res = await post('/api/boutiques/commandes/express', { ...base(), frais_livraison: 1500, articles: cart });
    expect(res.status).toBe(201);
    expect(Number(res.body.montant_total)).toBe(attendu);

    const head = (await pool.query('SELECT id, montant_total, quantite FROM commandes_boutique WHERE reference=$1', [res.body.reference])).rows;
    expect(head).toHaveLength(1);
    expect(Number(head[0].montant_total)).toBe(attendu);
    expect(Number(head[0].quantite)).toBe(6);
    const items = (await pool.query('SELECT quantite FROM commandes_boutique_items WHERE commande_id=$1', [head[0].id])).rows;
    expect(items).toHaveLength(3);

    const apres = [];
    for (const p of produits) apres.push(await stock(p.id));
    expect([avant[0] - apres[0], avant[1] - apres[1], avant[2] - apres[2]]).toEqual([2, 1, 3]);
  });

  test('webhook Wave signé : accepté au montant total (livraison incluse), refusé au montant des articles seuls', async () => {
    const cart = [{ produit_id: produits[0].id, quantite: 1 }, { produit_id: produits[1].id, quantite: 1 }];
    const o = await post('/api/boutiques/commandes/express', { ...base(), frais_livraison: 1500, articles: cart });
    const total = 10000 + 5000 + 1500;

    await webhookWave(o.body.reference, 10000 + 5000);
    let row = (await pool.query('SELECT paiement_recu FROM commandes_boutique WHERE reference=$1', [o.body.reference])).rows[0];
    expect(row.paiement_recu).toBe(false);

    const ok = await webhookWave(o.body.reference, total);
    expect(ok.status).toBe(200);
    row = (await pool.query('SELECT paiement_recu, statut FROM commandes_boutique WHERE reference=$1', [o.body.reference])).rows[0];
    expect(row.paiement_recu).toBe(true);
    expect(row.statut).toBe('payee');
  });

  test('article libre ou identifiant non UUID : refusé, le prix ne vient jamais du client', async () => {
    const libre = await post('/api/boutiques/commandes/express', { ...base(), articles: [{ nom_produit: 'Libre', prix_unitaire: 1, quantite: 1 }] });
    expect(libre.status).toBe(400);
    const faux = await post('/api/boutiques/commandes/express', { ...base(), articles: [{ produit_id: 'x'.repeat(36), quantite: 1 }] });
    expect(faux.status).toBe(400);
    const tarif = await post('/api/boutiques/commandes/express', { ...base(), articles: [{ produit_id: produits[1].id, quantite: 1, prix_unitaire: 1 }] });
    expect(tarif.status).toBe(201);
    expect(Number(tarif.body.montant_total)).toBe(5000);
  });

  test('échec de la session Wave : commande annulée, stock restitué, code promo non consommé', async () => {
    const bid = boutique.id;
    await pool.query(`INSERT INTO boutique_promotions (boutique_id, code, type_remise, valeur, actif, limite_utilisation, fois_utilise) VALUES ($1,'PIPE1','fixe',500,true,1,0)`, [bid]);
    const avant = await stock(produits[0].id);
    const res = await post('/api/boutiques/commandes/express', { ...base(), methode_paiement: 'wave', code_promo: 'PIPE1', articles: [{ produit_id: produits[0].id, quantite: 2 }] });
    expect(wave.createCheckoutSession).toHaveBeenCalled();
    expect(res.status).toBe(400);
    expect(await stock(produits[0].id)).toBe(avant);
    const cmd = (await pool.query(`SELECT statut FROM commandes_boutique WHERE boutique_id=$1 AND methode_paiement='wave' ORDER BY created_at DESC LIMIT 1`, [bid])).rows[0];
    expect(cmd.statut).toBe('annulee');
    const promo = (await pool.query(`SELECT fois_utilise FROM boutique_promotions WHERE boutique_id=$1 AND code='PIPE1'`, [bid])).rows[0];
    expect(Number(promo.fois_utilise)).toBe(0);
  });

  test('code promo à usage limité : la limite est réellement appliquée', async () => {
    await pool.query(`INSERT INTO boutique_promotions (boutique_id, code, type_remise, valeur, actif, limite_utilisation, fois_utilise) VALUES ($1,'PIPE2','fixe',500,true,1,0)`, [boutique.id]);
    const un = await post('/api/boutiques/commandes/express', { ...base(), code_promo: 'PIPE2', articles: [{ produit_id: produits[2].id, quantite: 1 }] });
    const deux = await post('/api/boutiques/commandes/express', { ...base(), code_promo: 'PIPE2', articles: [{ produit_id: produits[2].id, quantite: 1 }] });
    expect(Number(un.body.montant_total)).toBe(2000);
    expect(Number(deux.body.montant_total)).toBe(2500);
  });

  test('expiration : seules les commandes numériques impayées anciennes sont annulées, une seule fois', async () => {
    const mk = async (methode, vieilleDe) => {
      const o = await post('/api/boutiques/commandes/express', { ...base(), articles: [{ produit_id: produits[1].id, quantite: 1 }] });
      await pool.query(`UPDATE commandes_boutique SET methode_paiement=$2, created_at=NOW() - ($3 || ' hours')::interval WHERE reference=$1`, [o.body.reference, methode, String(vieilleDe)]);
      return o.body.reference;
    };
    const impayee = await mk('wave', 3);
    const espece = await mk('cash', 6);
    const payee = await mk('wave', 6);
    await pool.query(`UPDATE commandes_boutique SET paiement_recu=true, statut='payee' WHERE reference=$1`, [payee]);

    const avant = await stock(produits[1].id);
    expect(await annulerExp({ delaiHeures: 2 })).toBeGreaterThanOrEqual(1);
    const statuts = Object.fromEntries((await pool.query('SELECT reference, statut FROM commandes_boutique WHERE reference = ANY($1)', [[impayee, espece, payee]])).rows.map(r => [r.reference, r.statut]));
    expect(statuts[impayee]).toBe('annulee');
    expect(statuts[espece]).toBe('en_attente');
    expect(statuts[payee]).toBe('payee');
    expect(await stock(produits[1].id)).toBe(avant + 1);
    expect(await annulerExp({ delaiHeures: 2 })).toBe(0); // idempotent : pas de double restitution
    expect(await stock(produits[1].id)).toBe(avant + 1);
  });

  test('Orange Money : la notification de paiement pointe vers la vraie route du webhook (AUD-040)', async () => {
    process.env.BACKEND_URL = 'https://api.nopalou.test';
    const om = require('../../backend/services/orange-money');
    om.createWebPayment.mockClear();
    const res = await post('/api/boutiques/commandes/express', { ...base(), methode_paiement: 'orange_money', articles: [{ produit_id: produits[2].id, quantite: 1 }] });
    expect(res.status).toBe(201);
    expect(res.body.payment_url || res.body.om_url).toBe('https://om.test/pay');
    const args = om.createWebPayment.mock.calls[0][0];
    expect(args.notif_url).toBe('https://api.nopalou.test/api/paiement/orange/webhook');
    // la route annoncée existe réellement : le webhook Orange refuse (401/500) sans signature valide au lieu de répondre 404
    const hook = await request(app).post('/api/paiement/orange/webhook').send({ status: 'SUCCESS', order_id: res.body.reference });
    expect(hook.status).not.toBe(404);
  });

  test('Orange Money : échec de création du paiement -> commande annulée, stock restitué', async () => {
    const om = require('../../backend/services/orange-money');
    om.createWebPayment.mockRejectedValueOnce(new Error('OM indisponible (test)'));
    const avant = await stock(produits[2].id);
    const res = await post('/api/boutiques/commandes/express', { ...base(), methode_paiement: 'orange_money', articles: [{ produit_id: produits[2].id, quantite: 2 }] });
    expect(res.status).toBe(502);
    expect(await stock(produits[2].id)).toBe(avant);
  });

  describe('Webhooks de paiement (AUD-013) : signature toujours exigée, montant contrôlé', () => {
    const stripeHook = (ref, amountTotal, { signed = true, currency = 'xof' } = {}) => {
      const body = JSON.stringify({ type: 'checkout.session.completed', data: { object: { client_reference_id: ref, amount_total: amountTotal, currency } } });
      const t = Math.floor(Date.now() / 1000);
      const v1 = crypto.createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET).update(`${t}.${body}`).digest('hex');
      const r = request(app).post('/api/paiement/stripe/webhook').set('Content-Type', 'application/json');
      return (signed ? r.set('Stripe-Signature', `t=${t},v1=${v1}`) : r).send(body);
    };
    const nouvelleCommande = async (frais = 0) => {
      const o = await post('/api/boutiques/commandes/express', { ...base(), frais_livraison: frais, articles: [{ produit_id: produits[0].id, quantite: 1 }] });
      return { ref: o.body.reference, total: Number(o.body.montant_total) };
    };
    const etat = async (ref) => (await pool.query('SELECT paiement_recu, statut FROM commandes_boutique WHERE reference=$1', [ref])).rows[0];

    beforeAll(() => { process.env.STRIPE_WEBHOOK_SECRET = 'whsec_integration_secret'; });

    test('Stripe non signé : 401 et commande inchangée (même hors production)', async () => {
      const { ref, total } = await nouvelleCommande();
      const res = await stripeHook(ref, total, { signed: false });
      expect(res.status).toBe(401);
      expect((await etat(ref)).paiement_recu).toBe(false);
    });

    test('Stripe signé au bon montant : commande payée ; rejeu : idempotent', async () => {
      const { ref, total } = await nouvelleCommande(1500);
      const ok = await stripeHook(ref, total);
      expect(ok.status).toBe(200);
      expect(await etat(ref)).toMatchObject({ paiement_recu: true, statut: 'payee' });
      const rejeu = await stripeHook(ref, total);
      expect(rejeu.status).toBe(200);
    });

    test('Stripe signé mais montant erroné (1 au lieu du total) : non validé', async () => {
      const { ref } = await nouvelleCommande();
      const res = await stripeHook(ref, 1);
      expect(res.status).toBe(200);
      expect((await etat(ref)).paiement_recu).toBe(false);
    });

    test('Orange Money sans secret configuré : rejeté, jamais traité', async () => {
      delete process.env.ORANGE_WEBHOOK_SECRET;
      const { ref } = await nouvelleCommande();
      const res = await request(app).post('/api/paiement/orange/webhook').send({ status: 'SUCCESS', order_id: ref, amount: 1 });
      expect(res.status).toBe(500);
      expect((await etat(ref)).paiement_recu).toBe(false);
    });
  });

  test('commande sans frais de livraison : la notification vendeur ne lève pas de ReferenceError', async () => {
    const { notifierVendeurCommande } = require('../../backend/services/commande-service');
    await expect(notifierVendeurCommande(
      { id: boutique.id, nom: 'B', slug: 'b', whatsapp: '771110077', telephone: '771110077' },
      { reference: 'CMD-X', nomProduit: 'P', quantite: 1, montantTotal: 1000, fraisLivraison: 0, methodePaiement: 'cash', clientNom: 'C', clientTelephone: '771112222', clientAdresse: 'Dakar', note: null }
    )).resolves.not.toThrow();
  });
});
