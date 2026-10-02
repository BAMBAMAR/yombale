// Passage axe-core (WCAG 2.1 A/AA) sur des pages clés en mobile, état connecté optionnel.
// Sortie : violations par règle ET, pour color-contrast, une synthèse par couple de couleurs (pour viser les correctifs
// les plus rentables).
// Usage : node scripts/audit/ux-parcours/17-axe.js <sortie.json> <chemins,séparés> [state.json]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const axeSrc = fs.readFileSync(path.join(__dirname, '../../../frontend-next/node_modules/axe-core/axe.min.js'), 'utf8');
const [, , out, chemins, state] = process.argv;
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, locale: 'fr-FR', storageState: state || undefined });
  const res = {};
  const paires = {};
  for (const p of chemins.split(',')) {
    const page = await ctx.newPage();
    await page.goto('http://localhost:3001' + p, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    await page.addScriptTag({ content: axeSrc });
    const r = await page.evaluate(async () => await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
    res[p] = r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length }));
    for (const v of r.violations.filter(v => v.id === 'color-contrast')) {
      for (const n of v.nodes) {
        const d = (n.any[0] && n.any[0].data) || {};
        const k = `${d.fgColor} sur ${d.bgColor} (${d.contrastRatio}, ${d.fontSize || '?'})`;
        (paires[k] = paires[k] || []).push(`${p} :: ${n.target.join(' ').slice(0, 90)}`);
      }
    }
    console.log(p, '->', res[p].map(v => `${v.id}(${v.impact}) x${v.n}`).join(', ') || 'aucune violation');
    await page.close();
  }
  const synthese = Object.entries(paires).sort((a, b) => b[1].length - a[1].length).map(([k, v]) => ({ couple: k, n: v.length, exemples: v.slice(0, 3) }));
  fs.writeFileSync(out, JSON.stringify({ res, synthese }, null, 1));
  console.log('\nCouples de couleurs en échec (du plus fréquent) :');
  synthese.slice(0, 14).forEach(s => console.log(`  x${s.n}  ${s.couple}\n        ${s.exemples[0]}`));
  await browser.close();
})();
