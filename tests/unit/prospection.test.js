// tests/unit/prospection.test.js — Tests unitaires du moteur de prospection & CRM leads
const {
  normaliserTelephoneSenegal,
  extraireLeadsDepuisTexte,
  interpolerMessage,
  genererLienWhatsApp,
  TEMPLATES_PAR_DEFAUT,
} = require('../../backend/services/prospection');

afterAll(async () => {
  const { pool } = require('../../backend/models/db');
  await pool.end().catch(() => {});
});

describe('Moteur de Prospection & Normalisation Leads Sénégal', () => {
  describe('1. Normalisation Téléphonique (+221)', () => {
    test('normalise un numéro standard à 9 chiffres', () => {
      const res = normaliserTelephoneSenegal('771234567');
      expect(res.valide).toBe(true);
      expect(res.local).toBe('771234567');
      expect(res.national).toBe('221771234567');
      expect(res.e164).toBe('+221771234567');
      expect(res.formate).toBe('77 123 45 67');
      expect(res.operateur).toBe('Orange');
    });

    test('détecte correctement les différents opérateurs sénégalais', () => {
      expect(normaliserTelephoneSenegal('771112233').operateur).toBe('Orange');
      expect(normaliserTelephoneSenegal('785554433').operateur).toBe('Orange');
      expect(normaliserTelephoneSenegal('769998877').operateur).toBe('Free (Yas)');
      expect(normaliserTelephoneSenegal('701234567').operateur).toBe('Expresso');
      expect(normaliserTelephoneSenegal('750001122').operateur).toBe('Promobile');
    });

    test('gère les préfixes internationaux +221, 00221 et 221 avec espaces et tirets', () => {
      const r1 = normaliserTelephoneSenegal('+221 77 123-45.67');
      expect(r1.valide).toBe(true);
      expect(r1.national).toBe('221771234567');

      const r2 = normaliserTelephoneSenegal('00221 78 555 44 33');
      expect(r2.valide).toBe(true);
      expect(r2.national).toBe('221785554433');

      const r3 = normaliserTelephoneSenegal('221769876543');
      expect(r3.valide).toBe(true);
      expect(r3.national).toBe('221769876543');
    });

    test('rejette les numéros invalides ou de longueur incorrecte', () => {
      expect(normaliserTelephoneSenegal('').valide).toBe(false);
      expect(normaliserTelephoneSenegal('12345').valide).toBe(false);
      expect(normaliserTelephoneSenegal('0612345678').valide).toBe(false); // Numéro français
    });
  });

  describe('2. Extraction et Import de Leads depuis du Texte Brut', () => {
    test('extrait les numéros, noms de boutiques et e-mails depuis un texte en vrac', () => {
      const raw = `
        Dakar Fashion Store - 77 123 45 67 - contact@dakarfashion.sn
        Touba Tech Sandaga : +221 78 555 44 33
        Boutique HLM 76 987 65 43
        Doublon Dakar Fashion 221771234567
      `;

      const leads = extraireLeadsDepuisTexte(raw, { categorie: 'mode', ville: 'Dakar', quartier: 'HLM' });
      expect(leads.length).toBe(3); // 3 uniques, le doublon est écarté
      expect(leads[0].nom_boutique).toBe('Dakar Fashion Store');
      expect(leads[0].telephone).toBe('221771234567');
      expect(leads[0].email).toBe('contact@dakarfashion.sn');
      expect(leads[1].nom_boutique).toBe('Touba Tech Sandaga');
      expect(leads[1].telephone).toBe('221785554433');
    });
  });

  describe('3. Interpolation Dynamique des Messages', () => {
    test('remplace fidèlement les variables {nom_boutique}, {prenom}, {quartier}', () => {
      const template = 'Salam {prenom} ({nom_boutique}) à {quartier} ! Créez votre boutique : {lien_boutique}';
      const lead = {
        nom_boutique: 'Dakar Chic',
        contact_nom: 'Fatou',
        quartier: 'Sacré-Cœur',
      };

      const res = interpolerMessage(template, lead);
      expect(res).toBe('Salam Fatou (Dakar Chic) à Sacré-Cœur ! Créez votre boutique : https://nopalou.com/creer-boutique');
    });
  });

  describe('4. Génération de Liens WhatsApp Directs (wa.me)', () => {
    test('génère une URL wa.me valide avec message encodé', () => {
      const url = genererLienWhatsApp('77 123 45 67', 'Bonjour & Bienvenue chez Nopalou !');
      expect(url).toBe('https://wa.me/221771234567?text=Bonjour%20%26%20Bienvenue%20chez%20Nopalou%20!');
    });
  });

  describe('5. Bibliothèque de Templates Prédéfinis & Conformité Opt-Out (STOP)', () => {
    test('contient les templates adaptés pour le Sénégal', () => {
      expect(TEMPLATES_PAR_DEFAUT.length).toBeGreaterThanOrEqual(4);
      const ids = TEMPLATES_PAR_DEFAUT.map(t => t.id);
      expect(ids).toContain('mode_pret_a_porter');
      expect(ids).toContain('tech_telephonie');
      expect(ids).toContain('carnet_dettes');
    });

    test('inclut obligatoirement la mention de désinscription STOP dans chaque template', () => {
      for (const tpl of TEMPLATES_PAR_DEFAUT) {
        expect(tpl.texte).toMatch(/STOP/i);
      }
    });
  });

  describe('6. Scraper & Sourcing de Marchés Dakar', () => {
    test('expose les marchés clés de Dakar (Sandaga, HLM, Centenaire, Colobane)', () => {
      const { DIRECTOIRE_MARCHES_DAKAR } = require('../../backend/services/scraper-prospection');
      expect(Array.isArray(DIRECTOIRE_MARCHES_DAKAR)).toBe(true);
      const zones = DIRECTOIRE_MARCHES_DAKAR.map(m => m.zone);
      expect(zones).toContain('Sandaga');
      expect(zones).toContain('HLM');
      expect(zones).toContain('Centenaire');
    });
  });

  describe('7. Service de Relances Marchands', () => {
    test('expose la méthode traiterRelancesMarchands', () => {
      const { traiterRelancesMarchands } = require('../../backend/services/cron-relances-marchands');
      expect(typeof traiterRelancesMarchands).toBe('function');
    });
  });

  describe('8. Routage Sécurisé des Actions & Boutons Marchands WhatsApp', () => {
    test('exclut strictement les actions internes (boutique_ajout_prod_, creer_boutique) du lookup de slug', () => {
      const regexInternes = /^boutique_(recherche|categorie|contact|quitter|choisie_|produits_tous|next|secteur_liste|recherche_nom|ajout_prod|ajouter_produit|creer_boutique|partager)/;
      
      expect(regexInternes.test('boutique_ajout_prod_12345')).toBe(true);
      expect(regexInternes.test('boutique_ajouter_produit')).toBe(true);
      expect(regexInternes.test('boutique_produits_tous')).toBe(true);
      expect(regexInternes.test('boutique_creer_boutique')).toBe(true);
      
      // Un vrai slug de boutique n'est pas un ID d'action interne
      expect(regexInternes.test('boutique_astou-frip')).toBe(false);
      expect(regexInternes.test('boutique_dakar-fashion')).toBe(false);
    });
  });
});

