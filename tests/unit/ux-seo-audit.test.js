// tests/unit/ux-seo-audit.test.js — AUD-159, AUD-155, AUD-160 (audit UX, contenu et SEO du 2026-10-01)
const fs = require('fs');
const path = require('path');

// Racines surchargeables (UXSEO_FRONT_ROOT, UXSEO_BACK_ROOT) pour rejouer les gardes sur une copie de l'ancien code
const RACINE = process.env.UXSEO_FRONT_ROOT || path.join(__dirname, '..', '..', 'frontend-next', 'src');
const RACINE_BACK = process.env.UXSEO_BACK_ROOT || path.join(__dirname, '..', '..', 'backend');
const lire = (rel) => fs.readFileSync(path.join(RACINE, rel), 'utf8');
const lireBack = (rel) => fs.readFileSync(path.join(RACINE_BACK, rel), 'utf8');

function sources(dir, sortie = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) sources(p, sortie);
    else if (/\.(ts|tsx)$/.test(e.name)) sortie.push(p);
  }
  return sortie;
}

describe('AUD-160 : la durée d\'essai et les allégations ne sont jamais écrites en dur', () => {
  const FICHIERS = () => sources(RACINE).map((p) => ({ p: path.relative(RACINE, p).replace(/\\/g, '/'), src: fs.readFileSync(p, 'utf8') }));
  const trouve = (re, exclure = () => false) => FICHIERS().filter((f) => !exclure(f.p) && re.test(f.src)).map((f) => f.p);

  test('aucun « 1m offert », « 1er mois offert », « premier mois gratuit » dans le frontend', () => {
    expect(trouve(/\b1 ?m offert|(?:1er|premier) mois (?:est |d'essai )?(?:100 ?% )?(?:offert|gratuit)|1 mois offert/i)).toEqual([]);
  });

  test('aucune durée d\'essai en chiffres dans les textes, Sama Xaalis compris', () => {
    const re = /\b\d{1,3} ?jours? ?(?:offerts?|gratuits?|d['’]essai)|essai gratuit (?:de )?\d+ ?jours?|\b\d{1,3} ?j offerts?|\b\d{1,3} jours complets d['’&apos;]*essai/i;
    expect(trouve(re)).toEqual([]);
  });

  test('Sama Xaalis lit sa durée d\'essai et son prix dans ses réglages admin (kalpe_essai_jours, kalpe_prix_mensuel)', () => {
    const src = lire('app/sama-xaalis/page.tsx');
    expect(src).toMatch(/getKalpeReglages\(\)/);
    expect(src).not.toMatch(/\b1 ?000 F\b/);
    expect(src).not.toMatch(/price: '1000'/);
    expect(src).not.toMatch(/export const metadata/);
    expect(lire('lib/essai.ts')).toMatch(/kalpe_essai_jours/);
    expect(lire('lib/essai.ts')).toMatch(/kalpe_prix_mensuel/);
  });

  test('le pied de page ne revendique plus « Impartial »', () => {
    expect(trouve(/Impartial/)).toEqual([]);
  });

  test('plus de « 100% hors-ligne », « le plus consulté/visité », « Plateforme Officielle »', () => {
    expect(trouve(/100 ?% hors[- ]ligne/i)).toEqual([]);
    expect(trouve(/le plus (?:consulté|visité)/i)).toEqual([]);
    expect(trouve(/Plateforme Officielle/i)).toEqual([]);
  });

  test('le bot WhatsApp crée l\'essai avec le réglage admin, pas 30 jours en dur', () => {
    const src = lireBack('services/whatsapp-chatbot.js');
    expect(src).not.toMatch(/Date\.now\(\) \+ 30 \* 24/);
    expect(src).not.toMatch(/30 jours d'essai/);
    expect(src).toMatch(/dureeEssaiJours\(\)/);
  });

  test('les avantages publics des forfaits affichent la durée réelle de l\'essai', () => {
    const { avantagesAvecEssai } = require(path.join(RACINE_BACK, 'lib', 'plansCache.js'));
    expect(avantagesAvecEssai(['Tout le contenu Taf Taf', '1er mois 100% OFFERT'], 14)).toEqual(['Tout le contenu Taf Taf', '14 jours 100% OFFERTS']);
    expect(avantagesAvecEssai(['Premier mois offert'], '30')).toEqual(['30 jours 100% OFFERTS']);
    expect(avantagesAvecEssai(['-25% (3 mois offerts)', 'Caisse POS'], 14)).toEqual(['-25% (3 mois offerts)', 'Caisse POS']);
    expect(avantagesAvecEssai(['1er mois offert'], 'abc')).toEqual(['30 jours 100% OFFERTS']);
    expect(avantagesAvecEssai(null, 14)).toEqual([]);
    expect(lireBack('routes/plans.js')).toMatch(/avantagesAvecEssai/);
  });
});

describe('AUD-160 : les contenus sponsorisés sont étiquetés « Sponsorisé »', () => {
  test.each([
    'app/boutiques/components/BoutiqueCard.tsx',
    'app/ProduitsListe.tsx',
    'app/categorie/[slug]/page.tsx',
    'app/categorie/[slug]/[sousCategorie]/page.tsx',
  ])('%s affiche le badge via sponsoringActif', (rel) => {
    const src = lire(rel);
    expect(src).toMatch(/<BadgeSponsorise actif=\{/);
    expect(src).toMatch(/sponsoringActif\(/);
  });

  test('les produits de boutique (sponsorise = true par construction du serveur) ne sont pas étiquetés', () => {
    expect(lire('app/ProduitsListe.tsx')).toMatch(/!p\.boutique_id && sponsoringActif/);
  });

  test('le badge affiche le libellé « Sponsorisé »', () => {
    expect(lire('components/BadgeSponsorise.tsx')).toMatch(/LIBELLE_SPONSORISE/);
    expect(lire('lib/sponsoring.ts')).toMatch(/LIBELLE_SPONSORISE = 'Sponsorisé'/);
  });
});

describe('AUD-155 : le texte importé des annonces passe par le nettoyage avant tout affichage public', () => {
  const page = () => lire('app/annonces/[id]/page.tsx');

  test('méta-description, titre, H1, description et JSON-LD utilisent le texte nettoyé', () => {
    const src = page();
    expect(src).toMatch(/vueTexteAnnonce\(annonce\)/);
    expect(src).not.toMatch(/annonce\.description\?\.slice/);
    expect(src).not.toMatch(/titre=\{annonce\.titre\}/);
    expect(src).not.toMatch(/\{annonce\.description\}/);
    expect(src).not.toMatch(/description: annonce\.description/);
  });

  test('le JSON-LD ne publie pas le nom du vendeur particulier', () => {
    expect(page()).not.toMatch(/name: annonce\.contact_nom/);
  });

  test('l\'image sociale écarte les URL Facebook expirées', () => {
    expect(page()).toMatch(/sanitizeImgUrl\(annonce\.photos\?\.\[0\]\)/);
  });

  test('la liste des annonces affiche le titre nettoyé', () => {
    const src = lire('app/annonces/page.tsx');
    expect(src).toMatch(/nettoyerTitreAnnonce\(a\.titre\)/);
    expect(src).not.toMatch(/\{a\.titre\}/);
  });
});

describe('AUD-159 : plus de promesse Pay Safe hors des parcours qui l\'activent', () => {
  // Parcours où l'activation du séquestre n'est jamais appelée (le seul appelant est checkout-express).
  const FICHIERS_SANS_PROMESSE = [
    'app/hero/HeroAcheteurView.tsx',
    'app/boutiques/[id]/commander/CommanderPaymentSection.tsx',
    'app/boutiques/[id]/commander/CheckoutStep2Recap.tsx',
    'app/boutiques/[id]/produits/[produitId]/page.tsx',
    'app/boutique/ProductTourModal.tsx',
    // Décision D1 étendue à l'immobilier : aucune preuve que les fonds y soient bloqués non plus
    'app/immo/[id]/FicheImmoSidebar.tsx',
    'app/payer-loyer/[echeanceId]/PayerLoyerClient.tsx',
    'app/assistant-whatsapp/page.tsx',
  ];
  const PROMESSE = /Pay Safe|PaySafe|séquestre|sequestre/i;

  test.each(FICHIERS_SANS_PROMESSE)('%s ne mentionne ni Pay Safe ni séquestre', (rel) => {
    expect(lire(rel)).not.toMatch(PROMESSE);
  });

  test('le tunnel principal n\'appelle pas l\'activation (donc ne doit rien promettre)', () => {
    expect(lire('app/boutiques/[id]/commander/useCommander.ts')).not.toMatch(/paiement-sequestre/);
  });

  test('checkout-express n\'affiche « Protection active » que si l\'activation a réussi', () => {
    const src = lire('app/checkout-express/page.tsx');
    expect(src).toMatch(/sequestreActif/);
    expect(src).toMatch(/\{sequestreActif && \(/);
    expect(src).not.toMatch(/\{useSequestre && \(\s*<div style=\{\{ background: '#FFF3E8'/);
  });
});
