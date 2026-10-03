// tests/unit/chat-base-connaissances.test.js
// L'assistant du site doit répondre aux questions sur Nopalou lui-même (pas seulement chercher des produits).
// Cas repris d'une conversation réelle où « annonce », « comment ajouter produit » et
// « comment declarer un probleme » aboutissaient à « produit introuvable ».

const request = require('supertest');
const express = require('express');

const mockQuery = jest.fn();
jest.mock('../../backend/models/db', () => ({ pool: { query: (...a) => mockQuery(...a) } }));
jest.mock('../../backend/middlewares/rateLimit', () => ({ limiterRecherche: (req, res, next) => next() }));

const chatRouter = require('../../backend/routes/chat');
const { trouverFAQWeb, FAQ_WEB, actionsFAQ } = require('../../backend/lib/faq');
const { estRemerciement, estQuestion } = require('../../backend/lib/chat-intentions');

const app = express();
app.use(express.json());
app.use('/api/chat', chatRouter);

const dire = (message) => request(app).post('/api/chat/message').send({ message });
const urls = (body) => (body.chips || []).map((c) => c.url);

describe('chat — base de connaissances Nopalou', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockQuery.mockResolvedValue({ rows: [] });
  });

  const CAS = [
    ['annonce', '/deposer-annonce'],
    ['les annonces', '/deposer-annonce'],
    ['comment publier une annonce ?', '/deposer-annonce'],
    ['je veux vendre ma voiture', '/deposer-annonce'],
    ['comment ajouter produit', '/boutique/catalogue'],
    ['comment ajouter un produit à ma boutique', '/boutique/catalogue'],
    ['comment declarer un probleme', '/aide'],
    ['j\'ai un problème avec ma commande', '/aide'],
    ['comment vous contacter', '/aide'],
    ['vendre', '/creer-boutique'],
    ['creer boutique', '/creer-boutique'],
    ['quels sont vos tarifs', '/tarifs-boutique'],
    ['combien coûte l\'abonnement', '/tarifs-boutique'],
    ['est-ce que c\'est gratuit', '/tarifs-boutique'],
    ['comment commander', '/suivi-commande'],
    ['je veux annuler ma commande', '/aide'],
    ['comment importer mes produits depuis shopify', '/migration'],
    ['comment créer un compte', '/inscription'],
    ['j\'ai oublié mon mot de passe', '/mot-de-passe-oublie'],
    ['supprimer mon compte', '/confidentialite'],
    ['comment publier mon appartement', '/deposer-immo'],
    ['inscrire mon agence', '/agence'],
    ['payer mon loyer', '/payer-loyer'],
    ['quels forfaits internet orange', '/telecom'],
    ['comment booster mon annonce', '/compte'],
    ['devenir apporteur d\'affaires', '/partenaires'],
    ['je veux installer l\'application', '/guide-utilisation'],
    ['c\'est quoi nopalou', '/pourquoi-nopalou'],
    ['nopalou est il fiable', '/aide'],
    ['c\'est une arnaque', '/aide'],
    ['créer une facture', '/boutique/documents'],
    ['comment gérer mes dettes clients', '/boutique/carnet'],
    ['comment marche la caisse hors ligne', '/boutique/caisse'],
    ['vos réseaux sociaux', 'https://www.instagram.com/nopalousn/'],
  ];

  test.each(CAS)('« %s » reçoit une réponse FAQ avec le bon lien (%s)', async (question, lien) => {
    const res = await dire(question);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.reply).not.toMatch(/Je n'ai pas trouvé/);
    const tous = urls(res.body).concat(res.body.reply.match(/https?:\/\/\S+/g) || []);
    expect(tous.some((u) => u.replace(/[,)]+$/, '').includes(lien) || u.includes(lien))).toBe(true);
  });

  test('« annonce villa Almadies » reste une recherche immobilière, pas la page d\'aide des annonces', () => {
    expect(trouverFAQWeb('annonce villa Almadies')).toBeNull();
    expect(trouverFAQWeb('cherche une annonce de villa à louer')).toBeNull();
  });

  test('les recherches de produits ne sont pas détournées vers la FAQ', () => {
    for (const q of ['iphone 13', 'support tv', 'iphone 13 moins cher', 'samsung galaxy promo', 'wifi gratuit', 'climatiseur', 'commander un ASICS KAYANO 14', 'canapé 3 places']) {
      expect(trouverFAQWeb(q)).toBeNull();
    }
  });

  test('« om » ne se déclenche pas à l\'intérieur d\'un mot', () => {
    expect(trouverFAQWeb('comment')).toBeNull();
    expect(trouverFAQWeb('payer par om')).toBeTruthy();
  });

  test('le mot-clé le plus précis l\'emporte', () => {
    expect(trouverFAQWeb('publier une annonce').titre).toBe('Petites annonces');
    expect(trouverFAQWeb('vendre mon appartement').titre).toBe('Publier un bien immobilier');
    expect(trouverFAQWeb('vendre mes produits').titre).toBe('Vendre sur Nopalou');
  });

  test('le chiffre de l\'essai est relu à chaque réponse, pas figé au démarrage', () => {
    const cfg = require('../../backend/lib/settingsCache');
    const spy = jest.spyOn(cfg, 'getSync').mockImplementation((k) => (k === 'abonnement_essai_jours' ? '14' : null));
    const boutique = trouverFAQWeb('créer ma boutique');
    expect(boutique.reponse).toMatch(/14 jours/);
    spy.mockImplementation((k) => (k === 'abonnement_essai_jours' ? '21' : null));
    expect(boutique.reponse).toMatch(/21 jours/);
    spy.mockRestore();
  });

  test('chaque sujet a des mots-clés, une réponse et au moins un bouton valide', () => {
    for (const f of FAQ_WEB) {
      expect((f.motsCles || []).length + (f.motsClesCourts || []).length).toBeGreaterThan(0);
      expect(typeof f.reponse).toBe('string');
      expect(f.reponse.length).toBeGreaterThan(30);
      const actions = actionsFAQ(f);
      expect(actions.length).toBeGreaterThan(0);
      for (const a of actions) expect(a.url).toMatch(/^(\/|https:\/\/)/);
    }
  });

  test('une question hors base oriente vers l\'aide au lieu d\'un faux « produit introuvable »', async () => {
    const res = await dire('pourquoi le ciel est bleu ?');
    expect(res.body.reply).not.toMatch(/produit correspondant/);
    expect(urls(res.body)).toEqual(expect.arrayContaining(['/guide-utilisation', '/aide']));
  });

  test('« merci » reçoit un remerciement, sans recherche catalogue', async () => {
    const res = await dire('merci beaucoup');
    expect(res.body.reply).toMatch(/plaisir/i);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('détecteurs purs', () => {
    expect(estRemerciement('Merci !')).toBe(true);
    expect(estRemerciement('ok super merci')).toBe(true);
    expect(estRemerciement('merci pour le prix de l\'iphone 13')).toBe(false);
    expect(estQuestion('Comment ajouter un produit')).toBe(true);
    expect(estQuestion('iphone 13')).toBe(false);
    expect(estQuestion('livraison possible ?')).toBe(true);
  });
});
