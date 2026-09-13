// tests/unit/search-service.test.js
// Tests unitaires pour le moteur de recherche unifié (Phase 9 — P1)

const { normaliserTexte, expandQuery, searchMeilisearch } = require('../../backend/services/search-service');

describe('Moteur de Recherche Unifié & Phonétique Sénégal (Phase 9 — P1)', () => {
  describe('Normalisation des Requêtes', () => {
    test('supprime les accents et caractères spéciaux', () => {
      expect(normaliserTexte('Café Touba & Thiéboudienne !')).toBe('cafe touba thieboudienne');
      expect(normaliserTexte('Électronique & Écran-TV')).toBe('electronique ecran tv');
      expect(normaliserTexte('')).toBe('');
      expect(normaliserTexte(null)).toBe('');
    });
  });

  describe('Expansion Sémantique & Synonymes Sénégalais', () => {
    test('enrichit "thieb" avec riz et ceeb', () => {
      const terms = expandQuery('thieb');
      expect(terms).toContain('thieb');
      expect(terms).toContain('riz');
      expect(terms).toContain('ceeb');
    });

    test('enrichit "dall" avec chaussure et sandale', () => {
      const terms = expandQuery('dall');
      expect(terms).toContain('dall');
      expect(terms).toContain('chaussure');
      expect(terms).toContain('sandale');
    });

    test('enrichit "portable" avec telephone et smartphone', () => {
      const terms = expandQuery('portable');
      expect(terms).toContain('portable');
      expect(terms).toContain('telephone');
      expect(terms).toContain('smartphone');
    });

    test('garde le terme original pour un mot inconnu', () => {
      const terms = expandQuery('motinconnu');
      expect(terms).toEqual(['motinconnu']);
    });
  });

  describe('Résilience Meilisearch Adapter', () => {
    test('retourne null si les identifiants Meilisearch sont absents sans crasher', async () => {
      const res = await searchMeilisearch('produits', 'samsung');
      expect(res).toBeNull();
    });
  });
});
