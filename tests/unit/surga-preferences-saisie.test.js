// SRG-A2-011 : choix de personnalisation reçus du client
const { choixDepuisAdresse, listeDeTextes, heureValide } = require('../../backend/services/surga/preferences-saisie');

describe('choixDepuisAdresse', () => {
  test('lit la zone, les briques, l\'heure et les équipes', () => {
    expect(choixDepuisAdresse({ quartier: 'Rufisque', modules: 'actualites,meteo,trafic', heure: '06:30', equipes: 'ASC Jaraaf|Sénégal' })).toEqual({
      quartier: 'Rufisque', modules: ['actualites', 'meteo', 'trafic'], heure: '06:30', equipes: ['ASC Jaraaf', 'Sénégal'],
    });
  });

  test('rend null sans aucun choix exploitable', () => {
    expect(choixDepuisAdresse({})).toBeNull();
    expect(choixDepuisAdresse(undefined)).toBeNull();
    expect(choixDepuisAdresse({ quartier: '   ', modules: '', heure: 'x' })).toBeNull();
  });

  test('écarte ce qui est mal formé sans rejeter le reste', () => {
    const c = choixDepuisAdresse({ quartier: 'x'.repeat(81), modules: '<script>,actualites,Mode;DROP', heure: '25:99' });
    expect(c).toEqual({ modules: ['actualites'] });
  });

  test('ignore un paramètre répété (tableau) au lieu de planter', () => {
    expect(choixDepuisAdresse({ quartier: ['a', 'b'], modules: ['actualites'], heure: ['06:30'] })).toBeNull();
  });

  test('borne le nombre de briques et supprime les doublons', () => {
    const modules = Array.from({ length: 40 }, (_, i) => `mod${String.fromCharCode(97 + (i % 26))}`).join(',');
    expect(choixDepuisAdresse({ modules }).modules.length).toBeLessThanOrEqual(20);
    expect(choixDepuisAdresse({ modules: 'trafic,trafic' }).modules).toEqual(['trafic']);
  });
});

describe('heureValide', () => {
  test('accepte HH:MM réel seulement', () => {
    expect(heureValide('06:30')).toBe(true);
    expect(heureValide('23:59')).toBe(true);
    expect(heureValide('24:00')).toBe(false);
    expect(heureValide('7:30')).toBe(false);
    expect(heureValide(630)).toBe(false);
  });
});

describe('listeDeTextes', () => {
  test('ne garde que des textes courts', () => {
    expect(listeDeTextes(['a', ['b'], 3, '  c  ', '', 'x'.repeat(81)])).toEqual(['a', 'c']);
    expect(listeDeTextes('pas une liste')).toBeNull();
  });
});
