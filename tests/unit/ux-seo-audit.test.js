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

  test('plus de promesse « toutes les 6 heures » sur la fraîcheur des prix (cadence non prouvée)', () => {
    expect(trouve(/toutes les 6 ?(?:h|heures)/i)).toEqual([]);
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

describe('AUD-154 : un titre de page ne porte pas déjà la marque ajoutée par le gabarit du layout', () => {
  const { analyser } = require(path.join(__dirname, '..', '..', 'scripts', 'audit', 'ux-seo', 'titres-marque.cjs'));

  test('le gabarit du layout ajoute « | Nopalou »', () => {
    expect(lire('app/layout.tsx')).toMatch(/template: '%s \| Nopalou'/);
  });

  test('aucun titre de premier niveau ne se termine par « Nopalou » ou « Nopalou Immo »', () => {
    expect(analyser(path.join(RACINE, 'app'), false).map((x) => x.f)).toEqual([]);
  });

  test('les titres construits en variable (produit, fiche immo, boutique) n\'ajoutent plus la marque', () => {
    expect(lire('app/produit/[id]/page.tsx')).not.toMatch(/const titre = `[^`]*\| Nopalou`/);
    expect(lire('app/immo/[id]/page.tsx')).not.toMatch(/const titre = `[^`]*\| Nopalou Immo`/);
    expect(lire('app/boutiques/[id]/page.tsx')).not.toMatch(/const titre = `[^`]*\| Nopalou`/);
  });
});

describe('AUD-157 : structure HTML (un seul <main>, pas de H1 vide, un H1 par vue)', () => {
  test('hors layout racine et espaces admin, aucun <main> imbriqué dans le <main id="app-main">', () => {
    const fautifs = sources(RACINE)
      .filter((p) => !/[\\/]admin[\\/]/.test(p) && !p.endsWith(path.join('app', 'layout.tsx')))
      .filter((p) => /<main\b/.test(fs.readFileSync(p, 'utf8')))
      .map((p) => path.relative(RACINE, p).replace(/\\/g, '/'));
    expect(fautifs).toEqual([]);
  });

  test('PageHeader ne rend pas de <h1> quand le titre est vide', () => {
    expect(lire('components/PageHeader.tsx')).toMatch(/\{titre \? \(\s*<h1/);
  });

  test('les vues marchand et agence de l\'accueil ont un <h1>, et la page guide-emploi aussi', () => {
    expect(lire('app/hero/HeroMarchandView.tsx')).toMatch(/<h1\b/);
    expect(lire('app/hero/HeroAgenceHeaderView.tsx')).toMatch(/<h1\b/);
    expect(lire('app/guide-emploi/page.tsx')).toMatch(/<h1\b/);
  });
});

describe('AUD-164 : données structurées', () => {
  test('l\'accueil n\'ajoute pas un second Organization / WebSite (le layout les fournit)', () => {
    const src = lire('app/page.tsx');
    expect(src).not.toMatch(/organizationSchema\(\)/);
    expect(src).not.toMatch(/websiteSchema\(\)/);
  });

  test('plus de liste de navigation sur chaque page ni de SearchAction vers une URL interdite', () => {
    const src = lire('app/layout.tsx');
    expect(src).not.toMatch(/SITE_NAV_JSON_LD/);
    expect(src).not.toMatch(/potentialAction/);
  });

  test('les fiches produit ont un fil d\'Ariane structuré', () => {
    expect(lire('app/produit/[id]/page.tsx')).toMatch(/breadcrumbSchema\(/);
  });
});

describe('AUD-165 : canonical et métadonnées des pages sans titre propre', () => {
  test.each([
    ['app/connexion/page.tsx', '/connexion'],
    ['app/inscription/page.tsx', '/inscription'],
    ['app/aide/page.tsx', '/aide'],
    ['app/cgu/page.tsx', '/cgu'],
    ['app/confidentialite/page.tsx', '/confidentialite'],
    ['app/mentions-legales/page.tsx', '/mentions-legales'],
    ['app/demo/page.tsx', '/demo'],
  ])('%s déclare son canonical', (rel, chemin) => {
    expect(lire(rel)).toContain(`canonical: '${chemin}'`);
  });

  test.each(['app/suivi-commande/layout.tsx', 'app/checkout-express/layout.tsx', 'app/agence/layout.tsx'])('%s fournit un titre propre', (rel) => {
    expect(lire(rel)).toMatch(/title:/);
  });
});

describe('AUD-170 : plus d\'emoji dans les titres et pastilles de catégories', () => {
  test('PageHeader ne rend plus d\'emoji', () => {
    expect(lire('components/PageHeader.tsx')).not.toMatch(/\{emoji \?/);
  });

  test('les pages de catégorie ne rendent plus l\'emoji dans le H1, les pastilles ni le décor', () => {
    const a = lire('app/categorie/[slug]/page.tsx');
    const b = lire('app/categorie/[slug]/[sousCategorie]/page.tsx');
    expect(a).not.toMatch(/emoji=\{cat\.emoji\}/);
    expect(a).not.toMatch(/\{cat\.emoji\}/);
    expect(a).not.toMatch(/emoji: '🗂'/);
    expect(b).not.toMatch(/\{emoji\} \{h1\}/);
    expect(b).not.toMatch(/\{emoji\}<\/span>/);
  });
});

describe('AUD-167 : cibles tactiles sur mobile', () => {
  test('les onglets du hero et les liens du pied de page ont une hauteur minimale', () => {
    const css = fs.readFileSync(path.join(RACINE, 'styles', 'mobile-utils.css'), 'utf8');
    expect(css).toMatch(/\.hero-mode-tab-btn[^}]*min-height:\s*40px/);
    expect(css).toMatch(/\.footer-col a[^}]*min-height:\s*32px/);
  });
});

describe('AUD-161 : le positionnement présente l\'écosystème (textes validés par le propriétaire)', () => {
  test('titre et description de l\'accueil citent produits, boutiques, immobilier, forfaits et annonces (≤ 160 car.)', () => {
    const src = lire('app/page.tsx');
    expect(src).toMatch(/title: 'Nopalou : produits, boutiques, immobilier, forfaits au Sénégal'/);
    const d = /description:\s*\n?\s*'([^']+)'/.exec(src)[1];
    expect(d.length).toBeLessThanOrEqual(160);
    for (const mot of [/prix/, /WhatsApp/, /logement/, /forfait/, /annonce/, /boutique/]) expect(d).toMatch(mot);
    expect(lire('app/layout.tsx')).toMatch(/logement, un forfait ou une annonce/);
  });

  test('le H1 de l\'accueil nomme produits, boutiques, logements et forfaits', () => {
    const src = lire('app/hero/HeroAcheteurView.tsx');
    expect(src).toMatch(/Produits, boutiques, logements et forfaits au Sénégal/);
    expect(src).not.toMatch(/Achetez au meilleur prix au Sénégal/);
  });

  test('onglets « Acheter », « Vendre » et « Agences immo » ; plus « Caisse » ni « Acheteur & Comparateur »', () => {
    const src = lire('app/HeroDualTrack.tsx');
    expect(src).toMatch(/>Acheter</);
    expect(src).toMatch(/Vendre/);
    expect(src).toMatch(/Agences immo/);
    expect(src).not.toMatch(/<span>Caisse<\/span>/);
    expect(src).not.toMatch(/Acheteur &amp; Comparateur/);
  });

  test('menu : pas de badge PRO sur « Boutiques », lien « Vendre » vers /marchands', () => {
    const src = lire('app/components/NavbarLinksNav.tsx');
    expect(src).not.toMatch(/label: 'Boutiques', badge/);
    expect(src).toMatch(/href: '\/marchands', label: 'Vendre'/);
  });

  test('inscription et chatbot', () => {
    expect(lire('app/inscription/page.tsx')).toMatch(/publiez vos annonces/);
    const chat = lire('components/chat/ChatbotWidget.tsx');
    expect(chat).toMatch(/label: 'Annonces'/);
    expect(chat).toMatch(/label: 'Forfaits télécom'/);
    expect(chat).not.toMatch(/Caisse POS commerçant/);
    expect(chat).toMatch(/Vendre avec Nopalou/);
  });
});

describe('AUD-168 : retours d\'interface', () => {
  test('checkout étape 1 : le motif du bouton inactif est affiché', () => {
    const src = lire('app/boutiques/[id]/commander/CheckoutStep1Info.tsx');
    expect(src).toMatch(/Renseignez votre nom et un numéro de téléphone/);
    expect(src).toMatch(/!canProceed &&/);
  });

  test('état vide de recherche : passerelles vers boutiques, annonces, immobilier', () => {
    const src = lire('app/ProduitsListe.tsx');
    expect(src).toMatch(/href="\/boutiques"/);
    expect(src).toMatch(/href="\/annonces"/);
    expect(src).toMatch(/href="\/immo"/);
  });

  test('/immo : un seul accès « Payer mon loyer » dans le corps de la page', () => {
    const src = lire('app/immo/page.tsx');
    expect((src.match(/href="\/payer-loyer"/g) || []).length).toBe(1);
  });
});

describe('AUD-169 : /tarifs-boutique affiche d\'abord le prix mensuel', () => {
  test('la durée par défaut est 1 mois', () => {
    expect(lire('app/tarifs-boutique/TarifsPublicsSelector.tsx')).toMatch(/useState<number>\(1\)/);
  });
});

describe('AUD-153 : une fiche inconnue répond 404 dès generateMetadata (sinon le statut reste 200)', () => {
  test.each([
    'app/annonces/[id]/page.tsx',
    'app/boutiques/[id]/page.tsx',
    'app/boutiques/[id]/produits/[produitId]/page.tsx',
    'app/agences/[slug]/page.tsx',
    'app/produit/[id]/page.tsx',
    'app/immo/[id]/page.tsx',
    'app/telecom/[id]/page.tsx',
  ])('%s appelle introuvableOuRedirection et ne renvoie plus un titre « introuvable »', (rel) => {
    const src = lire(rel);
    expect(src).toMatch(/introuvableOuRedirection\(/);
    expect(src).not.toMatch(/title: '[^']*introuvable/i);
    expect(src).not.toMatch(/title: 'Vitrine Boutique'/);
  });

  test('la fiche boutique inconnue ne redirige plus vers l\'annuaire', () => {
    expect(lire('app/boutiques/[id]/page.tsx')).not.toMatch(/redirect\('\/boutiques'\)\s*\n\s*\}\s*\n\s*\n\s*const b = boutique/);
  });

  test('la catégorie inconnue appelle notFound() dès les métadonnées', () => {
    const src = lire('app/categorie/[slug]/page.tsx');
    expect(src).not.toMatch(/title: 'Catégorie introuvable'/);
    expect(src).toMatch(/if \(!cat\) \{[\s\S]{0,260}notFound\(\)/);
  });

  test('l\'utilitaire redirige un alias connu et sinon répond 404, sans jamais retourner', () => {
    const src = lire('lib/introuvable.ts');
    expect(src).toMatch(/redirect\(cible\)/);
    expect(src).toMatch(/notFound\(\)/);
    expect(src).toMatch(/Promise<never>/);
  });
});

describe('AUD-156 : titre et description des fiches immo', () => {
  test('la fiche utilise localiteImmo et descriptionMetaImmo, plus de « à ${annonce.transaction} » brut', () => {
    const src = lire('app/immo/[id]/page.tsx');
    expect(src).toMatch(/localiteImmo\(annonce\.quartier, annonce\.ville\)/);
    expect(src).toMatch(/descriptionMetaImmo\(/);
    expect(src).not.toMatch(/à \$\{annonce\.transaction \?\? /);
    expect(src).not.toMatch(/description: annonce\.description \?\? undefined/);
  });
});

describe('AUD-163 : toute page qui définit openGraph y met des images (sinon le lien partagé n\'a pas de visuel)', () => {
  const { analyser } = require(path.join(__dirname, '..', '..', 'scripts', 'audit', 'ux-seo', 'og-images.cjs'));

  test('aucun objet openGraph sans images', () => {
    expect(analyser(RACINE, false)).toEqual([]);
  });

  test('le twitter du layout ne force plus un titre et une description génériques sur toutes les pages', () => {
    const layout = lire('app/layout.tsx');
    const bloc = /twitter: \{[\s\S]*?\n  \},/.exec(layout)[0];
    expect(bloc).not.toMatch(/title:/);
    expect(bloc).not.toMatch(/description:/);
    expect(bloc).toMatch(/images:/);
  });
});

describe('AUD-162 : la fiche produit n\'affiche pas une description égale au nom', () => {
  test('méta-description et paragraphe passent par produit-texte', () => {
    const src = lire('app/produit/[id]/page.tsx');
    expect(src).toMatch(/descriptionMetaProduit\(/);
    expect(src).toMatch(/descriptionProduitUtile\(produit\.nom, produit\.description\)/);
    expect(src).not.toMatch(/p\.description\.slice\(0, 155\)/);
    expect(src).not.toMatch(/\{produit\.description && <p/);
  });
});

describe('AUD-158 : les pages « moins de N FCFA » ont une liste blanche', () => {
  test('la route refuse tout budget hors liste et le sitemap utilise la même liste', () => {
    const route = lire('app/categorie/[slug]/[sousCategorie]/page.tsx');
    expect(route).toMatch(/budgetAutorise\(budget\)/);
    expect(route).toMatch(/if \(!r\) notFound\(\)/);
    expect(lire('app/sitemap.ts')).toMatch(/BUDGETS_PAGES/);
    expect(lire('app/sitemap.ts')).not.toMatch(/\[50000, 100000\]/);
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
