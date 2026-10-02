// Gardes de l'audit UX/parcours du 02/10/2026 (AUD-213 à AUD-233).
// Chaque test doit échouer sans son correctif (contrôle par mutation).
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@127.0.0.1:1/jest_mock'; // base simulée ci-dessous, jamais jointe

jest.mock('../../backend/models/db', () => ({ pool: { query: jest.fn() } }));

const request = require('supertest');
const app = require('../../backend/app');
const { pool } = require('../../backend/models/db');

describe('AUD-218 — un SMS simulé n\'est jamais un envoi réussi en production', () => {
  const avecEnv = async (env, fn) => {
    const avant = process.env.NODE_ENV; process.env.NODE_ENV = env;
    delete process.env.ORANGE_SMS_CLIENT_ID; delete process.env.ORANGE_SMS_AUTH_HEADER;
    try { jest.resetModules(); return await fn(require('../../backend/services/sms')); } finally { process.env.NODE_ENV = avant; }
  };
  test('production : success=false', async () => {
    const r = await avecEnv('production', (sms) => sms.sendSMS('+221770000001', 'Bonjour'));
    expect(r.success).toBe(false);
    expect(r.simulated).toBe(true);
  });
  test('hors production : la simulation reste un succès (tests et audits locaux)', async () => {
    const r = await avecEnv('development', (sms) => sms.sendSMS('+221770000001', 'Bonjour'));
    expect(r.success).toBe(true);
  });
});

const fs = require('fs');
const path = require('path');
const FRONT = process.env.UXP_FRONT_ROOT || path.join(__dirname, '../../frontend-next/src');
const lire = (rel) => fs.readFileSync(path.join(FRONT, rel), 'utf8');

describe('AUD-220 — jamais de lien wa.me construit à la main dans la vitrine boutique', () => {
  test.each([
    'app/boutiques/[id]/page.tsx',
    'app/boutiques/[id]/BoutiqueDetailClient.tsx',
    'app/boutiques/[id]/produits/[produitId]/page.tsx',
    'app/boutiques/[id]/components/BoutiqueInfosTab.tsx',
    'app/boutiques/[id]/SocialShopFeed.tsx',
  ])('%s passe par lienWhatsapp()', (rel) => {
    const src = lire(rel);
    expect(src).not.toMatch(/wa\.me\/\$\{/);
    expect(src).toMatch(/lienWhatsapp\(/);
  });
});

describe('AUD-217 — la confirmation de commande ne ment pas', () => {
  test('aucune promesse « transmise avec succès » avant l\'envoi, aucun repli sur le numéro administrateur', () => {
    for (const rel of ['components/cart/DrawerCartSuccessModal.tsx', 'components/cart/useDrawerCartCheckout.ts']) {
      const src = lire(rel);
      expect(src).not.toMatch(/transmise avec succès/);
      expect(src).not.toMatch(/221777202086/);
      expect(src).not.toMatch(/Pouvons-nous organiser la livraison/);
    }
    expect(lire('components/cart/DrawerCartSuccessModal.tsx')).toMatch(/Dernière étape/);
    expect(lire('components/cart/DrawerCartSuccessModal.tsx')).toMatch(/suivi-commande\?ref=/);
  });
  test('libellés du panier sans ponctuation doublée ni emoji', () => {
    for (const l of ['fr', 'en', 'ar']) {
      const src = lire(`i18n/locales/${l}/shop.ts`);
      expect(src).not.toMatch(/(chooseOrderMode|orderViaWhatsAppDirect|onlineFormOption): '[^']*(:|→)'/);
      expect(src).not.toMatch(/(notifyVendorWhatsApp|directOnlineOrder): '[^']*[\u{1F300}-\u{1FAFF}]/u);
      expect(src).toMatch(/deliveryToAgree:/);
    }
  });
});

describe('AUD-222 — une seule règle de publication immobilière pour le site et les assistants', () => {
  const { conditionImmoPubliable, titreCourt, PRIX_MIN_IMMO } = require('../../backend/lib/immo-publiable');
  const BACK = process.env.UXP_BACK_ROOT || path.join(__dirname, '../../backend');
  const lireBack = (rel) => fs.readFileSync(path.join(BACK, rel), 'utf8');

  test('la règle exige un prix, exclut supprimées et rejetées', () => {
    const sql = conditionImmoPubliable('ai');
    expect(sql).toMatch(/ai\.prix IS NOT NULL AND ai\.prix >= 10000/);
    expect(sql).toMatch(/ai\.supprimee/);
    expect(sql).toMatch(/ai\.rejete/);
    expect(PRIX_MIN_IMMO).toBe(10000);
    expect(conditionImmoPubliable('')).toMatch(/^actif = true/);
  });

  test('titreCourt tronque les descriptions importées', () => {
    expect(titreCourt('x'.repeat(250)).length).toBeLessThanOrEqual(80);
    expect(titreCourt('Studio  Almadies')).toBe('Studio Almadies');
  });

  test.each([
    'routes/chat.js',
    'routes/search.js',
    'services/immo-chatbot.js',
    'services/whatsapp-chatbot.js',
  ])('%s applique la règle commune', (rel) => {
    expect(lireBack(rel)).toMatch(/conditionImmoPubliable\(/);
  });

  test('le bot WhatsApp raccourcit les titres de biens', () => {
    expect(lireBack('services/immo-chatbot.js')).toMatch(/titreCourt\(/);
  });
});

describe('AUD-230 — couleurs lisibles (WCAG AA) sans toucher à la couleur de marque', () => {
  const css = (rel) => fs.readFileSync(path.join(FRONT, rel), 'utf8');
  test('jetons contrastés déclarés, couleur de marque inchangée', () => {
    const t = css('styles/design-tokens.css');
    expect(t).toMatch(/--accent:\s+#C75B00/);
    expect(t).toMatch(/--accent-on-dark:\s+#F28C28/);
    expect(t).toMatch(/--success-on-dark:\s+#4ADE80/);
    expect(t).toMatch(/--wa-dark:\s+#0B7A5E/);
  });
  test('le pied de page n\'utilise plus l\'orange/vert de marque sur fond sombre', () => {
    const l = lire('app/layout.tsx');
    expect(l).toMatch(/Annuaire des Boutiques/);
    expect(l).not.toMatch(/'var\(--accent, #C75B00\)' \}\}>(Annuaire des Boutiques|Agences Immobilières|Centre d)/);
    expect(l).not.toMatch(/color: '#16a34a', fontWeight: 700 \}\}>Payer mon Loyer/);
    expect(css('styles/footer.css')).toMatch(/footer-support-title[\s\S]{0,200}var\(--accent-on-dark/);
  });
  test('badges et pilules actives : fond contrasté pour le texte blanc', () => {
    const h = css('styles/homepage.css');
    expect(h).toMatch(/\.filter-pill\.filter-pill--active \{\s*background: var\(--accent-text/);
    expect(h).toMatch(/\.badge-promo \{[\s\S]{0,120}background: var\(--accent-text/);
  });
  test('la page de recherche utilise --accent-text pour le texte orange et décode les entités', () => {
    const r = lire('app/recherche/RechercheClient.tsx');
    expect(r).not.toMatch(/color: '#C75B00'/);
    expect(r).toMatch(/decodeHtml\(/);
  });
});

describe('AUD-225 — la dictée d\'un remboursement ne pré-remplit pas une dette', () => {
  test('remboursement détecté : message explicite et retour avant tout setter du formulaire', () => {
    const s = lire('app/(account)/compte/kalpe/components/useKalpeVoice.ts');
    const iRemb = s.indexOf('if (parsed.remboursement)');
    const iMontant = s.indexOf('setMontant(String(parsed.montant))');
    expect(iRemb).toBeGreaterThan(-1);
    expect(iRemb).toBeLessThan(iMontant); // le contrôle précède tout remplissage
    expect(s).toMatch(/aucune dette n’a été créée/);
    expect(s).toMatch(/touchez « Rembourser »/);
    expect(s).not.toMatch(/parsed\.sens && !parsed\.remboursement/);
  });
});

describe('AUD-228 — fiche immobilière : contact accessible dès le premier écran sur mobile', () => {
  test('barre fixe prix + « Contacter » reliée à l\'ancre du bloc contact, visible seulement sur mobile', () => {
    const s = lire('app/immo/[id]/FicheImmoSidebar.tsx');
    expect(s).toMatch(/className="fiche-barre-contact"/);
    expect(s).toMatch(/href="#contact-annonce"/);
    expect(s).toMatch(/id="contact-annonce"/);
    const c = fs.readFileSync(path.join(FRONT, 'styles/produit.css'), 'utf8');
    expect(c).toMatch(/\.fiche-barre-contact \{ display: none; \}/);
    expect(c).toMatch(/@media \(max-width: 768px\) \{[\s\S]*?\.fiche-barre-contact \{\s*display: flex/);
    // constaté en navigateur : sans cette règle la bulle d'assistant recouvre le bouton « Contacter »
    expect(fs.readFileSync(path.join(FRONT, 'styles/chat-widget.css'), 'utf8')).toMatch(/body:has\(\.fiche-barre-contact\) \.npl-chat-floating-wrapper/);
  });
});

describe('AUD-229 — aucun <style>{texte}</style> contenant « > » (erreur d\'hydratation #425)', () => {
  // React échappe « > » en « &gt; » dans un enfant texte rendu côté serveur, pas côté client : les deux textes diffèrent
  function fichiersTsx(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return e.name === '__tests__' ? [] : fichiersTsx(p);
      return e.name.endsWith('.tsx') ? [p] : [];
    });
  }
  test('les blocs <style> à enfant texte ne contiennent pas de sélecteur « > »', () => {
    const fautifs = [];
    for (const f of fichiersTsx(FRONT)) {
      const src = fs.readFileSync(f, 'utf8');
      const re = /<style>\{`([\s\S]*?)`\}<\/style>/g;
      let m;
      while ((m = re.exec(src))) if (/[^=\-]>/.test(m[1].replace(/=>/g, ''))) fautifs.push(path.relative(FRONT, f));
    }
    expect(fautifs).toEqual([]);
  });
  test('les listes boutiques et agences utilisent dangerouslySetInnerHTML', () => {
    expect(lire('app/boutiques/components/BoutiquesDirectoryList.tsx')).toMatch(/<style dangerouslySetInnerHTML/);
    expect(lire('app/agences/components/AgencesDirectoryList.tsx')).toMatch(/<style dangerouslySetInnerHTML/);
  });
});

describe('AUD-231 — la bulle d\'assistant ne recouvre plus les pages de formulaire', () => {
  test('le widget consulte la liste de pages sans bulle', () => {
    const w = lire('components/chat/ChatbotWidget.tsx');
    expect(w).toMatch(/bulleAssistantMasquee\(pathname\)/);
    expect(w).toMatch(/usePathname/);
    expect(lire('lib/chat-routes.ts')).toMatch(/'\/creer-boutique'/);
  });
});

describe('AUD-227 — les anciens articles de démarrage ne sont plus publics', () => {
  test('migration idempotente vers le statut « exemple » pour les libellés « — à modifier »', () => {
    const src = fs.readFileSync(path.join(process.env.UXP_BACK_ROOT || path.join(__dirname, '../../backend'), 'migrate-inline.js'), 'utf8');
    expect(src).toMatch(/SET statut_moderation = 'exemple'/);
    expect(src).toMatch(/nom ~ ' — à modifier\$'/);
    // idempotence : ne touche que les lignes encore publiques
    expect(src).toMatch(/statut_moderation IS NULL OR statut_moderation = 'actif'\)`/);
  });
});

describe('AUD-226 — carte « Commencez à vendre » lisible sur mobile', () => {
  test('le bloc de texte garde une base de largeur (il passe à la ligne au lieu d\'être écrasé) et les boutons font 44 px', () => {
    const src = lire('app/(account)/compte/tabs/hub/AccountHubRecentAnnonces.tsx');
    expect(src).toMatch(/flex: '1 1 240px'/);
    expect(src.match(/minHeight: 44/g)?.length).toBeGreaterThanOrEqual(2);
  });
});

describe('AUD-221 — l\'assistant du site comprend les demandes courantes', () => {
  const { normaliser, estSalutation, extraireReferenceCommande, extraireBudget, decoderEntites } = require('../../backend/lib/chat-intentions');
  const BACK = process.env.UXP_BACK_ROOT || path.join(__dirname, '../../backend');

  test('accents ignorés', () => expect(normaliser('Je veux CRÉER une boutique')).toBe('je veux creer une boutique'));

  test.each(['salam', 'Salam aleykoum', 'Bonjour !', 'bsr', 'Nanga def'])('« %s » est une salutation', (t) => expect(estSalutation(t)).toBe(true));
  test.each(['salam je cherche un iphone', 'iphone 13', 'saly villa à vendre', ''])('« %s » n\'est pas une simple salutation', (t) => expect(estSalutation(t)).toBe(false));

  test('référence de commande extraite', () => {
    expect(extraireReferenceCommande('suivre ma commande c-mur0mzmr70c8 svp')).toBe('C-MUR0MZMR70C8');
    expect(extraireReferenceCommande('CMD-20260921-164F39')).toBe('CMD-20260921-164F39');
    expect(extraireReferenceCommande('je veux un iphone')).toBeNull();
  });

  test.each([
    ['iphone 13 moins de 200000', 'iphone 13', 200000],
    ['samsung a15 max 150k', 'samsung a15', 150000],
    ['frigo budget 200 mille', 'frigo', 200000],
    ['télévision jusqu\'à 80 000 FCFA', 'télévision', 80000],
    ['iphone 13', 'iphone 13', null],
  ])('budget de « %s »', (entree, texte, prix) => {
    const r = extraireBudget(entree);
    expect(r.prixMax).toBe(prix);
    expect(r.texte).toBe(texte);
  });

  test('entités HTML décodées', () => {
    expect(decoderEntites('Chargeur USB C &#8211; 35W')).toBe('Chargeur USB C – 35W');
    expect(decoderEntites('Tongs Personnalis&eacute;es')).toBe('Tongs Personnalisées');
    expect(decoderEntites('6.1&Prime; &amp; plus')).toBe('6.1″ & plus');
    expect(decoderEntites('&inconnue; reste')).toBe('&inconnue; reste');
  });

  describe('route /api/chat/message', () => {
    beforeEach(() => { jest.clearAllMocks(); pool.query.mockResolvedValue({ rows: [] }); });
    const dire = (message) => request(app).post('/api/chat/message').send({ message });

    test('« je veux créer une boutique » mène à la création', async () => {
      const r = await dire('je veux créer une boutique');
      expect(r.statusCode).toBe(200);
      expect(JSON.stringify(r.body.chips)).toMatch(/\/creer-boutique/);
    });
    test('une référence de commande donne un lien de suivi direct', async () => {
      const r = await dire('suivre ma commande C-MUR0MZMR70C8');
      expect(JSON.stringify(r.body.chips)).toMatch(/\/suivi-commande\?ref=C-MUR0MZMR70C8/);
    });
    test('« Sama xaalis » est reconnu', async () => {
      const r = await dire('Sama xaalis');
      expect(JSON.stringify(r.body.chips)).toMatch(/\/sama-xaalis/);
    });
    test('« salam » reçoit un accueil, sans recherche ni correction en ville', async () => {
      const r = await dire('salam');
      expect(r.body.items).toEqual([]);
      expect(r.body.correction).toBeNull();
      expect(r.body.reply).not.toMatch(/saly/i);
      expect(pool.query.mock.calls.some(c => /FROM (produits|boutique_produits|annonces)/.test(c[0]))).toBe(false);
    });
  });

  test('chat.js applique budget et décodage des entités', () => {
    const src = fs.readFileSync(path.join(BACK, 'routes/chat.js'), 'utf8');
    expect(src).toMatch(/extraireBudget\(/);
    expect(src).toMatch(/decoderEntites\(/);
    expect(src).toMatch(/estSalutation\(/);
  });
});

describe('AUD-223 — l\'erreur du wizard boutique est visible et compréhensible', () => {
  test('erreur annoncée, amenée à l\'écran, messages sans « utilisez la connexion par e-mail » ni « Failed to fetch »', () => {
    const src = lire('app/creer-boutique/page.tsx');
    expect(src).toMatch(/role="alert"/);
    expect(src).toMatch(/scrollIntoView/);
    expect(src).toMatch(/data\?\.degraded/);
    expect(src).toMatch(/instanceof TypeError/);
    expect(src).not.toMatch(/setError\(err\.message\)/);
  });
});

describe('AUD-219— dépôt d\'annonce : prévenu dès l\'ouverture, saisie conservée', () => {
  test('le formulaire avertit si l\'e-mail n\'est pas vérifié, reprend et efface le brouillon', () => {
    const f = lire('app/(account)/deposer-annonce/FormulaireAnnonce.tsx');
    expect(f).toMatch(/AvisEmailAPublier/);
    expect(f).toMatch(/lireBrouillon\(email\)/);
    expect(f).toMatch(/ecrireBrouillon\(email/);
    expect(f).toMatch(/effacerBrouillon\(email\)/);
    // le retour depuis l'étape 3 ne vide plus l'étape 2
    expect(f).toMatch(/defaultValue=\{d\.titre/);
    expect(lire('app/(account)/deposer-annonce/page.tsx')).toMatch(/email_verifie/);
  });
});

describe('AUD-214— un utilisateur connecté crée sa boutique sur son propre compte', () => {
  // Module chargé en isolation : l'application, déjà chargée plus haut, a figé la vraie résolution par téléphone
  const charger = (resultat) => {
    const resolverComptesParTelephone = jest.fn().mockResolvedValue(resultat);
    let mod;
    jest.isolateModules(() => {
      jest.doMock('../../backend/lib/telephoneIntegrity', () => ({ resolverComptesParTelephone }));
      mod = require('../../backend/lib/proprietaireBoutique');
    });
    return mod.proprietaireDepuisSession;
  };
  const ligneUser = (extra = {}) => ({ id: 'u-mail', nom: 'Awa', email: 'awa@exemple.sn', telephone: null, suspendu: false, anonymise_le: null, jwt_version: 1, ...extra });
  const poolFactice = (user) => ({ query: jest.fn(async (sql) => (/FROM utilisateurs WHERE id/.test(sql) ? { rows: user ? [user] : [] } : { rows: [] })) });

  test('numéro libre : la boutique va au compte connecté et le numéro rejoint son profil', async () => {
    const proprietaireDepuisSession = charger({ rows: [], ambigu: false });
    const p = poolFactice(ligneUser());
    const r = await proprietaireDepuisSession(p, 'u-mail', '+221770000003', '770000003');
    expect(r.user.id).toBe('u-mail');
    expect(p.query).toHaveBeenCalledWith('UPDATE utilisateurs SET telephone = $1 WHERE id = $2', ['+221770000003', 'u-mail']);
  });

  test('numéro déjà sur le même compte : accepté, aucune écriture', async () => {
    const proprietaireDepuisSession = charger({ rows: [{ id: 'u-mail' }], ambigu: false });
    const p = poolFactice(ligneUser({ telephone: '+221770000003' }));
    const r = await proprietaireDepuisSession(p, 'u-mail', '+221770000003', '770000003');
    expect(r.user.id).toBe('u-mail');
    expect(p.query.mock.calls.some(c => /UPDATE/.test(c[0]))).toBe(false);
  });

  test('numéro d\'un AUTRE compte : 409 explicite, pas de boutique chez un tiers', async () => {
    const proprietaireDepuisSession = charger({ rows: [{ id: 'u-autre' }], ambigu: false });
    const r = await proprietaireDepuisSession(poolFactice(ligneUser()), 'u-mail', '+221770000003', '770000003');
    expect(r.status).toBe(409);
    expect(r.code).toBe('TELEPHONE_AUTRE_COMPTE');
    expect(r.user).toBeUndefined();
  });

  test('compte suspendu ou introuvable : refusé', async () => {
    const proprietaireDepuisSession = charger({ rows: [], ambigu: false });
    expect((await proprietaireDepuisSession(poolFactice(ligneUser({ suspendu: true })), 'u-mail', 't', 'c')).status).toBe(403);
    expect((await proprietaireDepuisSession(poolFactice(null), 'u-mail', 't', 'c')).status).toBe(401);
  });

  test('le wizard crée la boutique côté serveur (session jointe) et ne remplace pas la session d\'un compte connecté', () => {
    const src = lire('app/creer-boutique/page.tsx');
    expect(src).toMatch(/creerBoutiqueTafTafAction\(/);
    expect(src).not.toMatch(/\/api\/boutiques\/taf-taf/);
    expect(src).toMatch(/data\.token && !data\.compte_connecte/);
    expect(lire('app/actions/boutique-creation.ts')).toMatch(/backendFetch\('\/api\/boutiques\/taf-taf'/);
  });

  test('la route taf-taf utilise ce propriétaire et ne remplace pas le jeton d\'une session existante', () => {
    const src = fs.readFileSync(path.join(__dirname, '../../backend/routes/boutiques-modules/boutiques-crud.js'), 'utf8');
    expect(src).toMatch(/router\.post\('\/taf-taf', authSiEnTete,/);
    expect(src).toMatch(/proprietaireDepuisSession\(/);
    expect(src).toMatch(/compte_connecte/);
  });
});

describe('AUD-213— le succès de création de boutique ne dépend plus d\'un état local', () => {
  test('le wizard navigue vers /creer-boutique/succes et ne garde plus de boutiqueCreee', () => {
    const src = lire('app/creer-boutique/page.tsx');
    expect(src).toMatch(/router\.replace\(`\/creer-boutique\/succes\?/);
    expect(src).not.toMatch(/setBoutiqueCreee|boutiqueCreee/);
    // la navigation vient après la tentative d'ouverture de session, même si elle échoue
    expect(src.indexOf('setAuthCookieAction(data.token)')).toBeLessThan(src.indexOf('router.replace(`/creer-boutique/succes'));
    expect(src).toMatch(/sessionOuverte = false/);
  });
  test('la page de succès existe et lit tout depuis l\'adresse', () => {
    const src = lire('app/creer-boutique/succes/page.tsx');
    expect(src).toMatch(/useSearchParams/);
    expect(src).toMatch(/asPage/);
    expect(lire('app/creer-boutique/components/ModalBoutiqueCreeeSucces.tsx')).toMatch(/sessionNonOuverte/);
  });
});

describe('AUD-224 — message de connexion explicite', () => {
  test('un mauvais mot de passe ne répond plus « Accès non autorisé »', () => {
    const src = lire('app/connexion/ConnexionForm.tsx');
    expect(src).toMatch(/errors\.invalidCredentials/);
    expect(src).not.toMatch(/Identifiants invalides'\) return t\('errors\.unauthorized'\)/);
    for (const l of ['fr', 'en', 'ar']) expect(lire(`i18n/locales/${l}/errors.ts`)).toMatch(/invalidCredentials:/);
  });
});

describe('AUD-216 — recherche globale : pertinence, vrais totaux, budget', () => {
  const ligne = (n, extra = {}) => ({ id: String(n), nom: 'x', total_count: '176', ...extra });
  beforeEach(() => {
    jest.clearAllMocks();
    pool.query.mockImplementation(async (sql) => {
      if (/FROM produits p/.test(sql)) return { rows: [ligne(1, { prix: 120000 }), ligne(2, { prix: 130000 })] };
      if (/FROM boutiques b/.test(sql)) return { rows: [] };
      if (/annonces_classifiees/.test(sql)) return { rows: [ligne(3, { total_count: '44' })] };
      return { rows: [] };
    });
  });
  const produitsSql = () => pool.query.mock.calls.map(c => c[0]).find(s => /FROM produits p/.test(s));
  const produitsParams = () => pool.query.mock.calls.find(c => /FROM produits p/.test(c[0]))[1];

  test('le total est le vrai nombre de correspondances, pas la taille de la page', async () => {
    const res = await request(app).get('/api/search').query({ q: 'iphone', limit: 12 });
    expect(res.statusCode).toBe(200);
    expect(res.body.totaux).toMatchObject({ produits: 176, annonces: 44 });
    expect(res.body.total).toBe(176 + 44);
  });

  test('seules les offres en stock comptent ; les prix très inférieurs à la médiane passent en fin de liste', async () => {
    await request(app).get('/api/search').query({ q: 'iphone' });
    const sql = produitsSql();
    expect(sql).toMatch(/EXISTS \(SELECT 1 FROM offres o/);
    expect(sql).toMatch(/percentile_cont/);
    expect(sql).not.toMatch(/ORDER BY\s+CASE WHEN p\.nom ILIKE \$2 THEN 0 ELSE 1 END,\s+p\.prix_min ASC/);
  });

  test('budget : prix_max et tri sont transmis, tri inconnu ignoré (aucune injection)', async () => {
    await request(app).get('/api/search').query({ q: 'iphone', prix_max: '200000', tri: 'prix_asc' });
    expect(produitsParams()).toContain(200000);
    expect(produitsSql()).toMatch(/ORDER BY[\s\S]*m\.prix_min ASC/);
    // PostgreSQL refuse un paramètre non référencé (« impossible de déterminer le type du paramètre $2 ») : constaté sur base réelle
    expect(produitsSql()).toMatch(/\$2::text IS NOT NULL/);
    jest.clearAllMocks();
    await request(app).get('/api/search').query({ q: 'iphone', tri: 'x; DROP TABLE produits' });
    expect(produitsSql()).not.toMatch(/DROP TABLE/);
  });
});

describe('AUD-215 — suivi public : jamais de joker', () => {
  beforeEach(() => { jest.clearAllMocks(); pool.query.mockResolvedValue({ rows: [{ id: 'x', reference: 'C-1', client_nom: 'A B', client_telephone: '770000001', statut: 'en_attente', montant_total: 1 }] }); });

  test.each(['XX-INEXISTANT', 'abcdefgh', 'zzzzzzzz'])('« %s » (ni référence ni téléphone) : 400 et aucune requête SQL', async (terme) => {
    const res = await request(app).get('/api/boutiques/commandes/suivi').query({ q: terme });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/référence|numéro/i);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('une référence bien formée passe toujours', async () => {
    const res = await request(app).get('/api/boutiques/commandes/suivi').query({ ref: 'C-MUR0MZMR70C8' });
    expect(res.statusCode).toBe(200);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  test('un téléphone de 9 chiffres passe toujours', async () => {
    const res = await request(app).get('/api/boutiques/commandes/suivi').query({ tel: '770000001' });
    expect(res.statusCode).toBe(200);
    expect(pool.query.mock.calls[0][1]).toEqual(['770000001']);
  });
});
