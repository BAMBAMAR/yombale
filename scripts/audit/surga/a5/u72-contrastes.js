// A5-127 — SRG-A3-011 : contrastes et taille du texte sur les cinq onglets, 390 px et 1440 px.
// Règle axe-core « color-contrast » (WCAG 1.4.3 : 4,5:1, 3:1 pour le grand texte) + part du texte sous 12 px.
// Frontend 3001 (next dev ou build), backend 4100, workers bloqués. Les données viennent de la base locale d'audit.
// Usage : $env:A5_DB='nopalou_audit'; $env:A5_BACK='http://127.0.0.1:4100'; run5.ps1 a5\u72-contrastes.js -Base nopalou_audit [libelle_de_sortie]
const path = require('path');
const { ouvrir, configurer, onglet, FRONT, ROOT } = require('../a3/lib3');
const { rec, end } = require('./lib5');
const ENV = `pile isolée : frontend ${FRONT}, backend 127.0.0.1:4100, base locale ; code : feature/surga (arbre de travail)`;
const AXE = path.join(ROOT, 'frontend-next/node_modules/axe-core/axe.min.js');
const ONGLETS = ["Aujourd'hui", 'Notes', 'Sama Xaalis', 'Agenda', 'Services'];

const mesure = (page) => page.evaluate(async () => {
  const r = await window.axe.run(document, { runOnly: { type: 'rule', values: ['color-contrast'] }, resultTypes: ['violations', 'passes'] });
  const v = r.violations[0], ok = r.passes[0];
  const comb = {};
  for (const n of (v ? v.nodes : [])) { const d = (n.any[0] || {}).data || {}; const k = `${d.fgColor} sur ${d.bgColor} = ${d.contrastRatio}:1 (${d.fontSize})`; comb[k] = (comb[k] || 0) + 1; }
  const vis = (e) => { const b = e.getBoundingClientRect(); const s = getComputedStyle(e); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let total = 0, petit = 0;
  for (let n = tw.nextNode(); n; n = tw.nextNode()) { const t = n.nodeValue.trim(); if (!t || !n.parentElement || !vis(n.parentElement)) continue; total += t.length; if (parseFloat(getComputedStyle(n.parentElement).fontSize) < 12) petit += t.length; }
  return { en_echec: v ? v.nodes.length : 0, conformes: ok ? ok.nodes.length : 0, part_texte_sous_12px: total ? Math.round(petit * 100 / total) : 0, combinaisons: Object.entries(comb).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, n]) => `${n}× ${k}`) };
});

(async () => {
  const r = rec('A5-127'); const res = {}; let totalEchecs = 0; let pires = 0;
  for (const [nom, opt] of [['390', {}], ['1440', { desktop: true }]]) {
    const o = await ouvrir({ sw: 'block', ...opt });
    await o.page.goto(FRONT + '/surga', { waitUntil: 'domcontentloaded', timeout: 180000 }); await o.page.waitForTimeout(5000);
    await configurer(o.page); await o.page.waitForTimeout(2500);
    await o.page.addScriptTag({ path: AXE });
    for (const t of ONGLETS) {
      await onglet(o.page, t); await o.page.waitForTimeout(1500);
      await o.page.addScriptTag({ path: AXE }).catch(() => {});
      const m = await mesure(o.page); res[`${t} ${nom}px`] = m; totalEchecs += m.en_echec; pires = Math.max(pires, m.part_texte_sous_12px);
    }
    await o.browser.close();
  }
  res.total_en_echec = totalEchecs; res.part_max_sous_12px = pires;
  r.mesure('contrastes', res);
  const ok = totalEchecs === 0 && pires === 0;
  r.verdict(ok ? 'PASS' : 'FAIL', JSON.stringify({ total_en_echec: totalEchecs, part_max_sous_12px: pires, detail: Object.fromEntries(Object.entries(res).filter(([k]) => /px$/.test(k)).map(([k, v]) => [k, `${v.en_echec} en échec, ${v.part_texte_sous_12px} % sous 12 px`])) }));
  r.save(process.argv[2] || 'contrastes', ENV);
  await end(); process.exit(0);
})().catch(async (e) => { console.error('ERREUR', e.message); try { await end(); } catch { /* déjà fermé */ } process.exit(2); });
