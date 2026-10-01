// Protection des données — AUD-132 (portail locataire), AUD-134 (fiche boutique), AUD-135 (extraction en masse)
// Exige une base PostgreSQL de TEST (jamais la production) : DATABASE_URL_TEST. Données 100 % fictives créées puis supprimées.
const HAS_DB_TEST = !!process.env.DATABASE_URL_TEST;
const describeIntegration = HAS_DB_TEST ? describe : describe.skip;

process.env.NODE_ENV = 'test';
process.env.FORCE_RATE_LIMITS = '1'; // les limiteurs OTP du portail locataire restent actifs en test
if (HAS_DB_TEST) process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-jwt-secret';
process.env.SSR_SECRET = 'integration-ssr-secret';
process.env.ADMIN_SECRET = 'integration-admin-secret';

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

  describe('AUD-134 — la fiche boutique publique ne publie plus les données de gestion', () => {
    let boutique, autre;
    const INTERDITS = ['compte_bancaire', 'utilisateur_id', 'pos_remise_max_caissier', 'pos_remise_seuil_auto_montant', 'pos_remise_seuil_auto_pct',
      'pos_remise_motifs', 'regime_fiscal', 'tva_taux_defaut', 'timbre_fiscal_applicable', 'prix_tva_incluse', 'capital_social', 'message_bas_ticket',
      'pied_de_page_document', 'fidelite_actif', 'fidelite_type', 'fidelite_taux_cashback', 'fidelite_tampons_max', 'fidelite_seuil_tampon'];

    beforeAll(async () => {
      const b = await post('/api/boutiques', { nom: `Boutique Protection ${Date.now()}`, telephone: '771110501', ville: 'Dakar', categorie: 'mode' }, marchand.token);
      boutique = b.body.boutique || b.body;
      const reg = await post('/api/auth/inscription', { nom: 'Autre Marchand', email: `autre.${Date.now()}@integration.test`, mot_de_passe: PW });
      autre = { token: reg.body.token, id: reg.body.user.id };
      const put = await request(app).put(`/api/boutiques/${boutique.id}`).set('Authorization', `Bearer ${marchand.token}`)
        .send({ rccm: 'SN-TEST-2026', ninea: '0099999TEST', forme_juridique: 'SARL', capital_social: '1000000', compte_bancaire: 'TEST-COMPTE-FICTIF', pos_remise_max_caissier: 25 });
      expect(put.status).toBe(200);
    });

    afterAll(async () => {
      await pool.query('DELETE FROM boutiques WHERE id = $1', [boutique.id]).catch(() => {});
      await pool.query('DELETE FROM utilisateurs WHERE id = $1', [autre.id]).catch(() => {});
    });

    test('anonyme (par id et par slug) : aucune donnée de gestion, fiche vitrine intacte', async () => {
      for (const ref of [boutique.id, boutique.slug]) {
        const r = await request(app).get(`/api/boutiques/${ref}`);
        expect(r.status).toBe(200);
        for (const k of INTERDITS) expect(r.body).not.toHaveProperty(k);
        for (const k of ['rccm', 'ninea', 'forme_juridique']) expect(r.body).not.toHaveProperty(k); // sans opt-in
        expect(r.body).toMatchObject({ id: boutique.id, slug: boutique.slug });
        expect(r.body).toEqual(expect.objectContaining({ nom: expect.any(String), plan_actif: expect.any(String) }));
      }
    });

    test('un autre marchand connecté voit la fiche publique, pas les données de gestion', async () => {
      const r = await request(app).get(`/api/boutiques/${boutique.id}`).set('Authorization', `Bearer ${autre.token}`);
      expect(r.status).toBe(200);
      expect(r.body).not.toHaveProperty('compte_bancaire');
      expect(r.body).not.toHaveProperty('utilisateur_id');
    });

    test('le propriétaire voit toujours tout (compte bancaire, plafond de remise, identifiant)', async () => {
      const r = await request(app).get(`/api/boutiques/${boutique.id}`).set('Authorization', `Bearer ${marchand.token}`);
      expect(r.status).toBe(200);
      expect(r.body.compte_bancaire).toBe('TEST-COMPTE-FICTIF');
      expect(r.body.utilisateur_id).toBe(marchand.id);
      expect(Number(r.body.pos_remise_max_caissier)).toBe(25);
      const mine = await request(app).get('/api/boutiques/mine').set('Authorization', `Bearer ${marchand.token}`);
      expect(mine.body.boutiques.find((b) => b.id === boutique.id)).toMatchObject({ compte_bancaire: 'TEST-COMPTE-FICTIF', mentions_legales_publiques: false });
    });

    test('opt-in du marchand : RCCM, NINEA et forme juridique deviennent publics, jamais le compte bancaire', async () => {
      const put = await request(app).put(`/api/boutiques/${boutique.id}`).set('Authorization', `Bearer ${marchand.token}`).send({ mentions_legales_publiques: true });
      expect(put.status).toBe(200);
      const r = await request(app).get(`/api/boutiques/${boutique.slug}`);
      expect(r.body).toMatchObject({ rccm: 'SN-TEST-2026', ninea: '0099999TEST', forme_juridique: 'SARL' });
      expect(r.body).not.toHaveProperty('compte_bancaire');
      expect(r.body).not.toHaveProperty('capital_social');
      await request(app).put(`/api/boutiques/${boutique.id}`).set('Authorization', `Bearer ${marchand.token}`).send({ mentions_legales_publiques: false });
      expect((await request(app).get(`/api/boutiques/${boutique.slug}`)).body).not.toHaveProperty('rccm');
    });

    test('annonces du propriétaire : route publique par boutique (remplace le filtre utilisateur_id)', async () => {
      const r = await request(app).get(`/api/boutiques/${boutique.slug}/annonces`);
      expect(r.status).toBe(200);
      expect(Array.isArray(r.body.annonces)).toBe(true);
      expect((await request(app).get('/api/boutiques/inexistant-protection/annonces')).body.annonces).toEqual([]);
    });
  });
  describe('AUD-135 — plus d\'extraction en masse en quelques requêtes', () => {
    const PUBLIC = (n) => ({ 'X-Forwarded-For': `203.0.113.${n}`, 'User-Agent': 'Mozilla/5.0 Chrome/122.0' }); // IP publique simulée (trust proxy) + navigateur (supertest envoie "node", signalé comme automate)
    const get = (url, headers = {}) => request(app).get(url).set(headers);

    beforeAll(async () => {
      await pool.query(`
        INSERT INTO annonces_immo (titre, type_bien, transaction, prix, ville, source, actif, supprimee, rejete)
        SELECT 'Annonce test protection ' || g, 'appartement', 'location', 150000 + g, 'Dakar', 'test-protection', true, false, false
        FROM generate_series(1, 130) g`);
    });
    afterAll(async () => {
      await pool.query(`DELETE FROM annonces_immo WHERE source = 'test-protection'`).catch(() => {});
    });

    test('immo : limit=100000 est ramené à 50 lignes ; une valeur invalide donne le défaut (plus de 500)', async () => {
      const grand = await get('/api/immo/?limit=100000&source=test-protection', PUBLIC(11));
      expect(grand.status).toBe(200);
      expect(grand.body.annonces).toHaveLength(50);
      expect(grand.body.total).toBe(130);
      const invalide = await get('/api/immo/?limit=abc&page=x&source=test-protection', PUBLIC(11));
      expect(invalide.status).toBe(200);
      expect(invalide.body.annonces).toHaveLength(24);
    });

    test('le rendu serveur du site (jeton SSR) garde un plafond élevé pour le sitemap', async () => {
      const r = await get('/api/immo/?limit=500&source=test-protection', { 'X-SSR-Token': 'integration-ssr-secret', ...PUBLIC(12) });
      expect(r.body.annonces).toHaveLength(130);
    });

    test('budget de lignes : un anonyme est arrêté (429) après ~600 lignes, un compte a un budget plus large, le SSR est exempté', async () => {
      process.env.SCRAPE_BUDGET_ANON = '100';
      process.env.SCRAPE_BUDGET_USER = '300';
      try {
        const url = '/api/immo/?limit=50&source=test-protection';
        const anonyme = [];
        for (let i = 0; i < 4; i++) anonyme.push((await get(url, PUBLIC(21))).status);
        expect(anonyme).toEqual([200, 200, 429, 429]);
        const bloque = await get(url, PUBLIC(21));
        expect(bloque.headers['retry-after']).toBeDefined();
        // un autre visiteur n'est pas affecté
        expect((await get(url, PUBLIC(22))).status).toBe(200);
        // un compte connecté : budget propre (300 lignes), non partagé avec l'IP bloquée
        const compte = [];
        for (let i = 0; i < 7; i++) compte.push((await get(url, { Authorization: `Bearer ${marchand.token}`, ...PUBLIC(21) })).status);
        expect(compte.slice(0, 6)).toEqual([200, 200, 200, 200, 200, 200]);
        expect(compte[6]).toBe(429);
        // le rendu serveur n'est jamais compté
        for (let i = 0; i < 5; i++) expect((await get(url, { 'X-SSR-Token': 'integration-ssr-secret', ...PUBLIC(21) })).status).toBe(200);
      } finally {
        delete process.env.SCRAPE_BUDGET_ANON;
        delete process.env.SCRAPE_BUDGET_USER;
      }
    });

    test('offres : plus d\'export complet, filtre obligatoire, identifiants validés', async () => {
      expect((await get('/api/offres/', PUBLIC(31))).status).toBe(400);
      expect((await get('/api/offres/?produit_id=zzz', PUBLIC(31))).status).toBe(400);
      const ok = await get('/api/offres/?produit_id=00000000-0000-4000-8000-000000000001', PUBLIC(31));
      expect(ok.status).toBe(200);
      expect(Array.isArray(ok.body)).toBe(true);
    });

    test('listes télécom, annonces et boutiques : valeurs invalides sans 500', async () => {
      for (const u of ['/api/telecom/?limit=abc', '/api/annonces/?page=abc&limit=zz', '/api/boutiques/?page=abc&limit=zz', '/api/produits/?limit=abc']) {
        const r = await get(u, PUBLIC(41));
        expect([u, r.status]).toEqual([u, 200]);
      }
    });
  });
  describe('AUD-137 — le numéro d\'un particulier n\'est plus envoyé : masqué, révélé au clic', () => {
    const TEL = '771234567';
    const PUBLIC = (n) => ({ 'X-Forwarded-For': `203.0.113.${n}` });
    let immoId, annonceId;

    beforeAll(async () => {
      immoId = (await pool.query(`INSERT INTO annonces_immo (titre, type_bien, transaction, prix, ville, source, actif, supprimee, rejete, contact_tel)
        VALUES ('Villa test numero', 'villa', 'location', 250000, 'Dakar', 'test-contact', true, false, false, $1) RETURNING id`, [TEL])).rows[0].id;
      annonceId = (await pool.query(`INSERT INTO annonces_classifiees (categorie_slug, titre, contact_tel, actif, supprimee, source)
        VALUES ('divers', 'Annonce test numero', $1, true, false, 'test-contact') RETURNING id`, ['77 123 45 67'])).rows[0].id;
    });
    afterAll(async () => {
      await pool.query(`DELETE FROM annonces_immo WHERE source = 'test-contact'`).catch(() => {});
      await pool.query(`DELETE FROM annonces_classifiees WHERE source = 'test-contact'`).catch(() => {});
    });

    const sansNumero = (corps) => {
      const texte = JSON.stringify(corps);
      expect(texte).not.toContain(TEL);
      expect(texte).not.toContain('77 123 45 67');
      expect(texte).not.toContain('contact_tel"');
    };

    test('immo : liste et fiche renvoient le numéro masqué, jamais le numéro', async () => {
      const liste = await request(app).get('/api/immo/?source=test-contact').set(PUBLIC(51));
      expect(liste.status).toBe(200);
      sansNumero(liste.body);
      expect(liste.body.annonces[0]).toMatchObject({ contact_tel_masque: '77 123 •• ••', contact_tel_disponible: true });
      for (const k of ['utilisateur_id', 'ref_externe', 'motif_rejet', 'rejete', 'supprimee']) expect(liste.body.annonces[0]).not.toHaveProperty(k);
      const fiche = await request(app).get(`/api/immo/${immoId}`).set(PUBLIC(51));
      expect(fiche.status).toBe(200);
      sansNumero(fiche.body);
      expect(fiche.body.contact_tel_masque).toBe('77 123 •• ••');
    });

    test('annonces classifiées : liste et fiche sans numéro', async () => {
      const liste = await request(app).get('/api/annonces/?limit=50').set(PUBLIC(52));
      const mine = liste.body.annonces.find((a) => a.id === annonceId);
      expect(mine).toMatchObject({ contact_tel_masque: '77 123 •• ••', contact_tel_disponible: true });
      sansNumero(mine);
      const fiche = await request(app).get(`/api/annonces/${annonceId}`).set(PUBLIC(52));
      sansNumero(fiche.body);
    });

    test('révélation : renvoie le numéro (immo et annonces), journalise le contact, refuse une annonce inconnue', async () => {
      const a = await request(app).post(`/api/immo/${immoId}/contact`).set(PUBLIC(53));
      expect(a.status).toBe(200);
      expect(a.body).toMatchObject({ success: true, telephone: '77 123 45 67', whatsapp: '221771234567' });
      expect(a.headers['cache-control']).toMatch(/no-store/);
      const b = await request(app).post(`/api/annonces/${annonceId}/contact`).set(PUBLIC(53));
      expect(b.body).toMatchObject({ success: true, telephone: '77 123 45 67' });
      expect((await request(app).post('/api/immo/00000000-0000-4000-8000-000000000001/contact').set(PUBLIC(53))).status).toBe(404);
      expect((await request(app).post('/api/immo/pas-un-uuid/contact').set(PUBLIC(53))).status).toBe(404);
      const { rows } = await pool.query(`SELECT count(*)::int AS n FROM analytics_events WHERE type IN ('contact_revele_immo','contact_revele_annonce') AND annonce_id IN ($1,$2)`, [immoId, annonceId]);
      expect(rows[0].n).toBe(2);
    });

    test('révélation : 10 par heure et par IP puis 429 ; une autre IP n\'est pas touchée', async () => {
      const codes = [];
      for (let i = 0; i < 12; i++) codes.push((await request(app).post(`/api/immo/${immoId}/contact`).set(PUBLIC(60))).status);
      expect(codes.slice(0, 10).every((c) => c === 200)).toBe(true);
      expect(codes.slice(10)).toEqual([429, 429]);
      expect((await request(app).post(`/api/immo/${immoId}/contact`).set(PUBLIC(61))).status).toBe(200);
    });
  });
  describe('AUD-140 / AUD-141 — badge « vérifié » sur critères réels, noms de marque réservés', () => {
    const { recalculerVerification } = require('../../backend/lib/verificationBoutique');
    const { marqueReservee } = require('../../backend/lib/nomsReserves');
    let m, b, abonnementId;
    const statut = async () => (await pool.query('SELECT statut_verification FROM boutiques WHERE id=$1', [b.id])).rows[0].statut_verification;
    const commandes = async (n, extra = {}) => {
      for (let i = 0; i < n; i++) {
        await pool.query(
          `INSERT INTO commandes_boutique (reference, boutique_id, nom_produit, quantite, prix_unitaire, montant_total, client_nom, client_telephone, statut, source, groupe_commande)
           VALUES ($1,$2,'Article test',1,5000,5000,$3,$4,'livree',$5,gen_random_uuid())`,
          [`PROT-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`, b.id, extra.nom || 'Client réel', extra.tel || `7755${String(10000 + i)}`, extra.source || 'web']
        );
      }
    };

    beforeAll(async () => {
      const reg = await post('/api/auth/inscription', { nom: 'Marchand Badge', email: `badge.${Date.now()}@integration.test`, mot_de_passe: PW });
      m = { token: reg.body.token, id: reg.body.user.id };
      const r = await post('/api/boutiques', { nom: `Boutique Badge ${Date.now()}`, telephone: '771119001', ville: 'Dakar', categorie: 'mode' }, m.token);
      b = r.body.boutique || r.body;
    });
    afterAll(async () => {
      await pool.query('DELETE FROM signalements WHERE cible_id = $1', [b.id]).catch(() => {});
      await pool.query('DELETE FROM commandes_boutique WHERE boutique_id = $1', [b.id]).catch(() => {});
      await pool.query('DELETE FROM abonnements WHERE utilisateur_id = $1', [m.id]).catch(() => {});
      await pool.query('DELETE FROM boutiques WHERE id = $1', [b.id]).catch(() => {});
      await pool.query('DELETE FROM utilisateurs WHERE id = $1', [m.id]).catch(() => {});
    });

    test('une boutique neuve n\'a aucun badge (API publique et liste)', async () => {
      expect(await statut()).toBe('non_verifie');
      const fiche = await request(app).get(`/api/boutiques/${b.id}`);
      expect(fiche.body.statut_verification).toBe('non_verifie');
      const liste = await request(app).get('/api/boutiques/?limit=50&q=Boutique%20Badge');
      expect(liste.body.boutiques.find((x) => x.id === b.id).statut_verification).toBe('non_verifie');
    });

    test('essai, attribution admin ou abonnement récent ne donnent pas le badge, même avec 20 commandes', async () => {
      await commandes(20);
      for (const [ref, trial, age] of [['abmt_essai', true, 40], ['admin_grant_x', false, 40], ['abmt_recent', false, 5]]) {
        await pool.query('DELETE FROM abonnements WHERE utilisateur_id = $1', [m.id]);
        await pool.query(`INSERT INTO abonnements (utilisateur_id, plan, statut, prix_mensuel, fin, commande_ref, is_trial, created_at)
                          VALUES ($1,'pro','actif',5000, NOW() + INTERVAL '20 days', $2, $3, NOW() - ($4 || ' days')::interval)`, [m.id, ref, trial, String(age)]);
        await recalculerVerification(b.id);
        expect([ref, await statut()]).toEqual([ref, 'non_verifie']);
      }
    });

    test('abonnement payant réel de 30 jours + 20 commandes livrées à des tiers : badge « verifie » ; 19 commandes : non', async () => {
      await pool.query('DELETE FROM abonnements WHERE utilisateur_id = $1', [m.id]);
      abonnementId = (await pool.query(`INSERT INTO abonnements (utilisateur_id, plan, statut, prix_mensuel, fin, commande_ref, is_trial, created_at)
        VALUES ($1,'pro','actif',5000, NOW() + INTERVAL '20 days','abmt_reel_1', false, NOW() - INTERVAL '40 days') RETURNING id`, [m.id])).rows[0].id;
      await recalculerVerification(b.id);
      expect(await statut()).toBe('verifie');
      expect((await request(app).get(`/api/boutiques/${b.slug}/verification`)).body).toMatchObject({ success: true, statut: 'verifie' });
      await pool.query(`DELETE FROM commandes_boutique WHERE id = (SELECT id FROM commandes_boutique WHERE boutique_id=$1 LIMIT 1)`, [b.id]);
      await recalculerVerification(b.id);
      expect(await statut()).toBe('non_verifie'); // 19 commandes : le badge est retiré
    });

    test('les commandes du marchand lui-même, de test, ou hors livraison ne comptent pas ; un signalement ouvert retire le badge', async () => {
      await pool.query('DELETE FROM commandes_boutique WHERE boutique_id = $1', [b.id]);
      await commandes(10);
      await commandes(10, { tel: '771119001' });             // passées avec le numéro de la boutique
      await commandes(10, { nom: 'Client TEST' });            // commandes de test
      await commandes(10, { source: 'web_test' });
      await recalculerVerification(b.id);
      expect(await statut()).toBe('non_verifie');
      await commandes(10);                                    // 20 vraies commandes de tiers
      await recalculerVerification(b.id);
      expect(await statut()).toBe('verifie');
      await pool.query(`INSERT INTO signalements (type_cible, cible_id, motif, statut) VALUES ('boutique', $1, 'test', 'nouveau')`, [b.id]);
      await recalculerVerification(b.id);
      expect(await statut()).toBe('non_verifie');
    });

    test('l\'admin décide : certifie sans critères, retire malgré les critères, puis rend la main au calcul (journalisé)', async () => {
      const admin = (mode) => request(app).post(`/api/admin/marchands/boutique/${b.id}/verification`).set('X-Admin-Secret', 'integration-admin-secret').send({ mode, motif: 'test' });
      expect((await admin('admin_oui')).body).toMatchObject({ success: true, statut_verification: 'certifie' });
      expect(await statut()).toBe('certifie');
      await recalculerVerification(b.id); // le cron ne défait pas la décision de l'admin
      expect(await statut()).toBe('certifie');
      expect((await admin('admin_non')).body.statut_verification).toBe('non_verifie');
      expect((await admin('auto')).body.statut_verification).toBe('non_verifie'); // signalement encore ouvert
      expect((await admin('nimporte')).status).toBe(400);
      // sans identification admin : refusé
      expect((await request(app).post(`/api/admin/marchands/boutique/${b.id}/verification`).send({ mode: 'admin_oui' })).status).toBe(401);
    });

    test('noms réservés : variantes de « Nopalou » refusées à la création et au renommage, noms ordinaires acceptés', async () => {
      for (const n of ['Nopalou Officiel - Support Paiement', 'N0palou Support', 'n.o.p.a.l.o.u', 'NÖPALOU', 'Nopa1ou Shop', 'Yombalé Pay']) {
        expect([n, marqueReservee(n) !== null]).toEqual([n, true]);
      }
      for (const n of ['Palou Mode', 'Boutique Aminata', 'Nopal Cactus', 'Dakar Style']) expect([n, marqueReservee(n)]).toEqual([n, null]);
      const cree = await post('/api/boutiques', { nom: 'Nopalou Officiel Support', telephone: '771119002', ville: 'Dakar', categorie: 'mode' }, m.token);
      expect(cree.status).toBe(400);
      expect(cree.body.error).toMatch(/réservé/);
      const renomme = await request(app).put(`/api/boutiques/${b.id}`).set('Authorization', `Bearer ${m.token}`).send({ nom: 'N0palou Support Paiement' });
      expect(renomme.status).toBe(400);
      const ok = await request(app).put(`/api/boutiques/${b.id}`).set('Authorization', `Bearer ${m.token}`).send({ nom: 'Boutique Badge Renommee' });
      expect(ok.status).toBe(200);
    });
  });
  describe('AUD-143 — le secret maître administrateur n\'est plus copié dans un cookie', () => {
    const SECRET = 'integration-admin-secret';
    const cookiesDe = (r) => [].concat(r.headers['set-cookie'] || []);

    test('connexion par secret (nominative et historique) : aucun cookie ne contient le secret, un jeton signé le remplace', async () => {
      for (const url of ['/api/admin/auth/login', '/api/admin/login']) {
        const r = await post(url, { secret: SECRET });
        expect([url, r.status]).toEqual([url, 200]);
        const cookies = cookiesDe(r);
        expect(cookies.length).toBeGreaterThan(0);
        for (const c of cookies) expect(decodeURIComponent(c)).not.toContain(SECRET);
        const admin = cookies.find((c) => c.startsWith('nopalou_admin='));
        expect(admin).toBeDefined();
        const jeton = admin.split(';')[0].split('=')[1];
        expect(jeton.startsWith('eyJ')).toBe(true);
        expect(jwt.verify(jeton, process.env.JWT_SECRET)).toMatchObject({ scope: 'nopalou_admin', role: 'super_admin' });
      }
    });

    test('le cookie jeton ouvre bien les routes administrateur ; un jeton forgé ou le secret en cookie nu fonctionnent comme avant seulement via l\'en-tête', async () => {
      const r = await post('/api/admin/auth/login', { secret: SECRET });
      const jeton = cookiesDe(r).find((c) => c.startsWith('nopalou_admin=')).split(';')[0].split('=')[1];
      expect((await request(app).get('/api/settings').set('Cookie', `nopalou_admin=${jeton}`)).status).toBe(200);
      const forge = jwt.sign({ adminId: 'x', role: 'super_admin', scope: 'nopalou_admin' }, 'autre-secret');
      expect((await request(app).get('/api/settings').set('Cookie', `nopalou_admin=${forge}`)).status).toBe(401);
      expect((await post('/api/admin/auth/login', { secret: 'mauvais' })).status).toBe(401);
    });
  });
  describe('AUD-146 — téléversements : le contenu réel est contrôlé', () => {
    test('un faux PDF (HTML renommé) est refusé en 400 sur la route de dépôt de pièces ; un vrai PDF passe le contrôle', async () => {
      await pool.query('UPDATE contacts_immo SET utilisateur_id = $1 WHERE id = $2', [marchand.id, locataire]);
      const url = `/api/locatif-immo/mes-locations/bail/${bailId}/documents`;
      const faux = await request(app).post(url).set('Authorization', `Bearer ${marchand.token}`)
        .field('type_piece', 'cni').attach('file', Buffer.from('<html><script>alert(1)</script></html>'), { filename: 'cni.pdf', contentType: 'application/pdf' });
      expect(faux.status).toBe(400);
      expect(faux.body.error).toMatch(/non autorisé/);
      const vrai = await request(app).post(url).set('Authorization', `Bearer ${marchand.token}`)
        .field('type_piece', 'cni').attach('file', Buffer.from('%PDF-1.7\n%test\n'), { filename: 'cni.pdf', contentType: 'application/pdf' });
      expect(vrai.status).not.toBe(400); // le contrôle est passé ; l'envoi Cloudinary est neutralisé en test (échec 500 attendu)
      const { rows } = await pool.query('SELECT pieces_jointes FROM baux_immo WHERE id = $1', [bailId]);
      expect(JSON.stringify(rows[0].pieces_jointes || [])).not.toContain('cni.pdf'); // rien n'a été enregistré pour le faux fichier
    });

    test('le point de passage commun (service Cloudinary) refuse aussi un contenu non autorisé, même sans pré-contrôle', async () => {
      const { uploadBuffer, uploadDocumentBuffer, uploadVideoBuffer } = require('../../backend/services/cloudinary');
      const html = Buffer.from('<html>x</html>');
      await expect(uploadBuffer(html, 'test')).rejects.toMatchObject({ status: 400 });
      await expect(uploadDocumentBuffer(html, 'test', 'a.pdf')).rejects.toMatchObject({ status: 400 });
      await expect(uploadVideoBuffer(Buffer.from('%PDF-1.7'), 'test')).rejects.toMatchObject({ status: 400 });
    });
  });
  describe('AUD-138 — l\'User-Agent est un signal (budget réduit), plus un refus', () => {
    const get = (url, ua, ip) => request(app).get(url).set({ 'X-Forwarded-For': `203.0.113.${ip}`, 'User-Agent': ua });
    const NAV = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0 Safari/537.36';
    beforeAll(async () => {
      await pool.query(`INSERT INTO annonces_immo (titre, type_bien, transaction, prix, ville, source, actif, supprimee, rejete)
        SELECT 'Annonce UA ' || g, 'appartement', 'location', 150000 + g, 'Dakar', 'test-protection-ua', true, false, false FROM generate_series(1, 130) g`);
    });
    afterAll(async () => { await pool.query(`DELETE FROM annonces_immo WHERE source = 'test-protection-ua'`).catch(() => {}); });

    test('un client automate reçoit un budget divisé par 4 mais n\'est jamais refusé d\'emblée ; un navigateur garde le budget normal', async () => {
      process.env.SCRAPE_BUDGET_ANON = '200';
      try {
        const url = '/api/immo/?limit=50&source=test-protection-ua';
        const auto = [];
        for (let i = 0; i < 3; i++) auto.push((await get(url, 'python-requests/2.31', 71)).status);
        expect(auto).toEqual([200, 429, 429]);   // 200/4 = 50 lignes : une seule page
        const nav = [];
        for (let i = 0; i < 5; i++) nav.push((await get(url, NAV, 72)).status);
        expect(nav).toEqual([200, 200, 200, 200, 429]); // 200 lignes : 4 pages
        const vide = await get(url, '', 73);
        expect(vide.status).toBe(200);           // UA vide : accepté (budget réduit), pas refusé
      } finally {
        delete process.env.SCRAPE_BUDGET_ANON;
      }
    });

    test('un client d\'API partenaire en Python ou curl atteint la vérification de clé (401), il n\'est pas refusé en 403', async () => {
      for (const ua of ['python-requests/2.31', 'curl/8.4.0', 'Java/17.0.2', 'Go-http-client/1.1']) {
        const r = await request(app).get('/api/v1/prix').set({ 'User-Agent': ua, 'X-Api-Key': 'nopalou_sk_live_fausse' });
        expect([ua, r.status]).toEqual([ua, 401]);
      }
    });
  });
  describe('AUD-139 — sitemap complet via un endpoint réservé au rendu serveur', () => {
    const ssr = { 'X-SSR-Token': 'integration-ssr-secret' };
    const compteSql = {
      annonce: 'SELECT count(*)::int AS n FROM annonces_classifiees WHERE actif = true AND supprimee = false',
      boutique: 'SELECT count(*)::int AS n FROM boutiques WHERE actif = true',
      immo: 'SELECT count(*)::int AS n FROM annonces_immo WHERE actif = true AND (supprimee IS NULL OR supprimee = false) AND (rejete IS NULL OR rejete = false) AND prix IS NOT NULL AND prix >= 10000',
    };

    test('refusé sans jeton SSR, type invalide refusé', async () => {
      expect((await request(app).get('/api/sitemap/ids?type=annonce')).status).toBe(403);
      expect((await request(app).get('/api/sitemap/ids?type=annonce').set('X-SSR-Token', 'faux')).status).toBe(403);
      expect((await request(app).get('/api/sitemap/ids?type=utilisateur').set(ssr)).status).toBe(400);
    });

    test('avec le jeton : le total égale le comptage SQL, aucune donnée personnelle, aucun plafond de 50', async () => {
      for (const type of ['annonce', 'boutique', 'immo']) {
        const r = await request(app).get(`/api/sitemap/ids?type=${type}`).set(ssr);
        expect(r.status).toBe(200);
        const attendu = (await pool.query(compteSql[type])).rows[0].n;
        expect([type, r.body.total]).toEqual([type, attendu]);
        expect(r.body.items).toHaveLength(Math.min(attendu, 5000));
        for (const it of r.body.items) expect(Object.keys(it).every((k) => ['id', 'slug', 'updated_at', 'boutique_id', 'boutique_slug'].includes(k))).toBe(true); // identifiants seulement
      }
      for (const type of ['produit', 'produit_boutique', 'agence']) {
        expect([type, (await request(app).get(`/api/sitemap/ids?type=${type}`).set(ssr)).status]).toEqual([type, 200]);
      }
    });

    test('plus de 50 annonces sont listées (le plafond des listes publiques ne s\'applique pas)', async () => {
      await pool.query(`INSERT INTO annonces_immo (titre, type_bien, transaction, prix, ville, source, actif, supprimee, rejete)
        SELECT 'Annonce sitemap ' || g, 'studio', 'location', 80000 + g, 'Dakar', 'test-sitemap', true, false, false FROM generate_series(1, 120) g`);
      try {
        const r = await request(app).get('/api/sitemap/ids?type=immo').set(ssr);
        expect(r.body.items.length).toBeGreaterThanOrEqual(120);
        const publique = await request(app).get('/api/immo/?limit=1000').set({ 'X-Forwarded-For': '203.0.113.90', 'User-Agent': 'Mozilla/5.0 Chrome/122.0' });
        expect(publique.body.annonces.length).toBeLessThanOrEqual(50);
      } finally {
        await pool.query(`DELETE FROM annonces_immo WHERE source = 'test-sitemap'`);
      }
    });
  });
  describe('AUD-142 — champs internes retirés des réponses publiques', () => {
    let m, b, prodId;
    beforeAll(async () => {
      const reg = await post('/api/auth/inscription', { nom: 'Marchand Stock', email: `stock.${Date.now()}@integration.test`, mot_de_passe: PW });
      m = { token: reg.body.token, id: reg.body.user.id };
      const r = await post('/api/boutiques', { nom: `Boutique Stock ${Date.now()}`, telephone: '771119003', ville: 'Dakar', categorie: 'mode' }, m.token);
      b = r.body.boutique || r.body;
      prodId = (await pool.query(
        `INSERT INTO boutique_produits (boutique_id, nom, prix, images, en_stock, stock_quantite, code_barre)
         VALUES ($1, 'Article stock test', 5000, ARRAY['https://res.cloudinary.com/x/a.jpg'], true, 37, '6001234567890') RETURNING id`, [b.id])).rows[0].id;
      await pool.query(`INSERT INTO boutique_produit_variantes (produit_id, sku, code_barre, attributs, prix, stock_quantite, actif) VALUES ($1, 'SKU-1', '6009999999999', '{"taille":"M"}', 5000, 12, true)`, [prodId]).catch(() => {});
    });
    afterAll(async () => {
      await pool.query('DELETE FROM boutique_produit_variantes WHERE produit_id = $1', [prodId]).catch(() => {});
      await pool.query('DELETE FROM boutique_produits WHERE boutique_id = $1', [b.id]).catch(() => {});
      await pool.query('DELETE FROM boutiques WHERE id = $1', [b.id]).catch(() => {});
      await pool.query('DELETE FROM utilisateurs WHERE id = $1', [m.id]).catch(() => {});
    });
    const INTERNES = ['statut_moderation', 'motif_moderation', 'modere_le', 'whatsapp_sync_statut', 'whatsapp_sync_erreur', 'partage_le', 'code_barre'];

    test('public : ni quantité exacte, ni données de gestion ; la vitrine garde de quoi afficher « en stock »', async () => {
      const liste = await request(app).get(`/api/boutiques/${b.slug}/produits`);
      const p = liste.body.produits.find((x) => x.id === prodId);
      expect(p).toBeDefined();
      for (const k of INTERNES) expect(p).not.toHaveProperty(k);
      expect(p.stock_quantite).toBe(1);               // drapeau « disponible », pas 37
      expect(p.stock_etat).toBe('disponible');
      expect(p.en_stock).toBe(true);
      expect(JSON.stringify(liste.body)).not.toMatch(/6001234567890|6009999999999|\b37\b/);
      const fiche = await request(app).get(`/api/boutiques/${b.slug}/produits/${prodId}`);
      for (const k of INTERNES) expect(fiche.body.produit).not.toHaveProperty(k);
      expect(fiche.body.produit.stock_quantite).toBe(1);
      for (const sku of fiche.body.produit.variantes_skus) { expect(sku).not.toHaveProperty('code_barre'); expect(sku.stock_quantite).toBe(1); }
    });

    test('rupture et stock faible exprimés par un état, sans chiffre', async () => {
      await pool.query('UPDATE boutique_produits SET stock_quantite = 3 WHERE id = $1', [prodId]);
      let p = (await request(app).get(`/api/boutiques/${b.slug}/produits/${prodId}`)).body.produit;
      expect([p.stock_etat, p.stock_quantite]).toEqual(['faible', 1]);
      await pool.query('UPDATE boutique_produits SET stock_quantite = 0 WHERE id = $1', [prodId]);
      p = (await request(app).get(`/api/boutiques/${b.slug}/produits/${prodId}`)).body.produit;
      expect([p.stock_etat, p.stock_quantite, p.en_stock]).toEqual(['rupture', 0, false]);
      await pool.query('UPDATE boutique_produits SET stock_quantite = 37 WHERE id = $1', [prodId]);
    });

    test('le propriétaire et son équipe gardent la vue complète (quantité exacte, code-barres, modération)', async () => {
      const r = await request(app).get(`/api/boutiques/${b.id}/produits`).set('Authorization', `Bearer ${m.token}`);
      const p = r.body.produits.find((x) => x.id === prodId);
      expect(p.stock_quantite).toBe(37);
      expect(p.code_barre).toBe('6001234567890');
      expect(p).toHaveProperty('statut_moderation');
      const fiche = await request(app).get(`/api/boutiques/${b.id}/produits/${prodId}`).set('Authorization', `Bearer ${m.token}`);
      expect(fiche.body.produit.stock_quantite).toBe(37);
    });

    test('settings publics : plus de seuils anti-abus par téléphone ni de réglages d\'alertes internes', async () => {
      const r = await request(app).get('/api/settings/public');
      expect(r.status).toBe(200);
      for (const k of ['max_boutiques_par_telephone', 'max_agences_par_telephone', 'alertes_abonnement_jours_avant', 'alertes_abonnement_whatsapp', 'alertes_abonnement_email']) {
        expect(r.body).not.toHaveProperty(k);
      }
      expect(r.body).toHaveProperty('plan_pro_prix'); // les prix restent publics
    });
  });});
