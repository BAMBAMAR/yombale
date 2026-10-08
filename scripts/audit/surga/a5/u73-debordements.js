// A5-128 — SRG-A3-011 (contrôle de régression) : le plancher de 12 px ne fait rien déborder ni couper.
// Cinq onglets à 320, 390 et 1440 px : débordement horizontal de la page, éléments qui dépassent, textes tronqués.
// Usage : $env:A5_DB='nopalou_audit'; $env:A5_BACK='http://127.0.0.1:4100'; run5.ps1 a5\u73-debordements.js -Base nopalou_audit [libelle_de_sortie]
const { ouvrir, configurer, onglet, mesurer, FRONT } = require('../a3/lib3');
const { rec, end } = require('./lib5');
const ENV = `pile isolée : frontend ${FRONT}, backend 127.0.0.1:4100, base locale ; code : feature/surga (arbre de travail)`;
const ONGLETS = ["Aujourd'hui", 'Notes', 'Sama Xaalis', 'Agenda', 'Services'];

(async () => {
  const r = rec('A5-128'); const res = {}; let debordements = 0; let tronques = 0; let debordants = 0;
  for (const [nom, taille] of [['320', [320, 568]], ['390', [390, 844]], ['1440', [1440, 900]]]) {
    const o = await ouvrir({ sw: 'block', taille });
    await o.page.goto(FRONT + '/surga', { waitUntil: 'domcontentloaded', timeout: 180000 }); await o.page.waitForTimeout(5000);
    await configurer(o.page); await o.page.waitForTimeout(2500);
    for (const t of ONGLETS) {
      await onglet(o.page, t); await o.page.waitForTimeout(1500);
      const m = await mesurer(o.page);
      res[`${t} ${nom}px`] = { debordement_page: m.debordement_horizontal, elements_debordants: m.elements_debordants.length, exemples: m.elements_debordants.slice(0, 3), textes_tronques: m.textes_tronques, exemples_tronques: m.exemples_tronques.slice(0, 3) };
      if (m.debordement_horizontal) debordements++; debordants += m.elements_debordants.length; tronques += m.textes_tronques;
    }
    await o.browser.close();
  }
  res.synthese = { ecrans_avec_debordement_de_page: debordements, elements_debordants: debordants, textes_tronques: tronques };
  r.mesure('mise en page', res);
  r.verdict(debordements === 0 && debordants === 0 ? 'PASS' : 'FAIL', JSON.stringify(res.synthese));
  r.save(process.argv[2] || 'debordements', ENV);
  await end(); process.exit(0);
})().catch(async (e) => { console.error('ERREUR', e.message); try { await end(); } catch { /* déjà fermé */ } process.exit(2); });
