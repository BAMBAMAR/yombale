// Lit le message d'hydratation EXACT (mode développement de Next) pour une page : texte serveur vs texte client.
// Usage : node scripts/audit/ux-parcours/19-hydratation-dev.js <chemin> [port=3002]
const { chromium } = require('playwright');
const [, , chemin, port = '3002'] = process.argv;
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, locale: 'fr-FR' })).newPage();
  const msgs = [];
  page.on('console', async m => {
    if (!/hydrat|did not match|Warning|mismatch/i.test(m.text())) return;
    // « Server: "%s" Client: "%s" » : on lit les arguments réels pour comparer les deux textes
    const args = await Promise.all(m.args().map(a => a.jsonValue().catch(() => '?')));
    const [fmt, srv, cli] = args;
    if (/Text content did not match/.test(String(fmt)) && typeof srv === 'string' && typeof cli === 'string') {
      let i = 0; while (i < srv.length && srv[i] === cli[i]) i++;
      msgs.push(`TEXTE DIFFÉRENT (serveur ${srv.length} car., client ${cli.length} car.), premier écart à l'indice ${i} :\n  serveur : …${JSON.stringify(srv.slice(Math.max(0, i - 60), i + 120))}\n  client  : …${JSON.stringify(cli.slice(Math.max(0, i - 60), i + 120))}`);
    } else msgs.push(m.text().slice(0, 500));
  });
  page.on('pageerror', e => msgs.push('PAGEERROR ' + e.message.slice(0, 500)));
  await page.goto(`http://localhost:${port}${chemin}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(9000);
  console.log(chemin, ': ', msgs.length, 'message(s)');
  msgs.slice(0, 4).forEach((m, i) => console.log(`--- ${i + 1}\n${m}`));
  await browser.close();
})();
