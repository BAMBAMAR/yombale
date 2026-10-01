// tests/unit/ux-seo-audit.test.js — AUD-159, AUD-155, AUD-160 (audit UX, contenu et SEO du 2026-10-01)
const fs = require('fs');
const path = require('path');

const RACINE = path.join(__dirname, '..', '..', 'frontend-next', 'src');
const lire = (rel) => fs.readFileSync(path.join(RACINE, rel), 'utf8');

describe('AUD-159 : plus de promesse Pay Safe hors des parcours qui l\'activent', () => {
  // Parcours où l'activation du séquestre n'est jamais appelée (le seul appelant est checkout-express).
  const FICHIERS_SANS_PROMESSE = [
    'app/hero/HeroAcheteurView.tsx',
    'app/boutiques/[id]/commander/CommanderPaymentSection.tsx',
    'app/boutiques/[id]/commander/CheckoutStep2Recap.tsx',
    'app/boutiques/[id]/produits/[produitId]/page.tsx',
    'app/boutique/ProductTourModal.tsx',
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
