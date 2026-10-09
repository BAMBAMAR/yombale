// Mise en page du CV en PDF : pagination, modèles, données saisies seulement.
const { genererPdfBuffer } = require('../../backend/services/surga/emploi-service');
const { normaliser, lignesDe, initialesDe } = require('../../backend/services/surga/cv-pdf');

const profilCourt = {
  nom_complet: 'Awa Ndiaye',
  titre_professionnel: 'Comptable général',
  telephone: '+221 77 000 00 00',
  email: 'awa@email.sn',
  adresse_ville: 'Dakar, Mermoz',
  resume_pro: 'Comptable avec six ans d’expérience.',
  competences: ['SYSCOHADA', 'Excel'],
  experiences: [{ titre: 'Comptable', entreprise: 'Société X', date_debut: '2021', en_cours: true, description: 'Clôtures mensuelles\nDéclarations de TVA' }],
  formations: [{ diplome: 'Licence', etablissement: 'UCAD', annee: '2017' }],
  langues: [{ langue: 'Français', niveau: 'Courant' }],
};
const profilLong = {
  ...profilCourt,
  experiences: Array.from({ length: 11 }, (_, i) => ({
    titre: `Poste ${i}`, entreprise: `Entreprise ${i}`, date_debut: `20${10 + i}`, date_fin: `20${11 + i}`,
    description: `Mission numéro ${i} : suivi des comptes, relations fournisseurs et reporting mensuel à la direction générale.\nSecond point ${i}`,
  })),
};

const pagesDe = (buf) => (buf.toString('latin1').match(/\/Type \/Page\b/g) || []).length;
const formats = (buf) => [...buf.toString('latin1').matchAll(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/g)].map((m) => `${m[1]}x${m[2]}`);

describe('CV PDF (Surga)', () => {
  test.each(['sobre_moderne', 'classique_pro'])('%s : un CV court tient sur une seule page, avec la mention de la version gratuite', async (modele) => {
    const pdf = await genererPdfBuffer('CV', profilCourt, { modele, avecMention: true });
    expect(pdf.slice(0, 5).toString()).toBe('%PDF-');
    expect(pagesDe(pdf)).toBe(1); // la mention du pied créait une seconde page vide
  });

  test.each(['sobre_moderne', 'classique_pro'])('%s : un CV long passe sur 2 pages, toutes au format A4', async (modele) => {
    const pdf = await genererPdfBuffer('CV', profilLong, { modele, avecMention: true });
    expect(pagesDe(pdf)).toBe(2);
    expect(new Set(formats(pdf))).toEqual(new Set(['595.28x841.89'])); // les pages suivantes sortaient en Letter
  });

  test('les deux modèles produisent des documents différents', async () => {
    const a = await genererPdfBuffer('CV', profilCourt, { modele: 'sobre_moderne' });
    const b = await genererPdfBuffer('CV', profilCourt, { modele: 'classique_pro' });
    expect(a.equals(b)).toBe(false);
  });

  test('un profil réduit au nom ne produit aucune rubrique inventée', () => {
    const d = normaliser({ nom_complet: 'Awa Ndiaye' }, (s) => s);
    expect(d.experiences).toEqual([]);
    expect(d.formations).toEqual([]);
    expect(d.competences).toEqual([]);
    expect(d.langues).toEqual([]);
    expect(d.resume).toBe('');
    expect(d.titre).toBe('');
  });

  test('une expérience sans poste ni entreprise est écartée ; la période reprend « Présent » si en cours', () => {
    const d = normaliser({ experiences: [{ description: 'x' }, { titre: 'Chef', date_debut: '2020', en_cours: true }] }, (s) => s);
    expect(d.experiences).toHaveLength(1);
    expect(d.experiences[0].periode).toBe('2020 – Présent');
  });

  test('la description devient une liste, une ligne par point', () => {
    expect(lignesDe('- Premier\n• Deuxième\n\n  Troisième ')).toEqual(['Premier', 'Deuxième', 'Troisième']);
    expect(initialesDe('Awa Ndiaye')).toBe('AN');
    expect(initialesDe('Madonna')).toBe('M');
  });
});
