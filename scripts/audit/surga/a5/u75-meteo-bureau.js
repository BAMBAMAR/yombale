// A5-130 — la météo de la colonne de droite (ordinateur) s'ouvre : fenêtre, détail, fermeture par Échap et par le bouton,
// changement de localité possible. Avant : le clic renvoyait vers l'écran Aujourd'hui, déjà affiché, rien ne s'ouvrait.
// Nécessite des sources publiques : backend lancé par restart-backend.ps1 -Sources (sinon la météo est « indisponible »).
// Usage : $env:A5_DB='nopalou_audit'; $env:A5_BACK='http://127.0.0.1:4100'; run5.ps1 a5\u75-meteo-bureau.js -Base nopalou_audit [libelle]
const { ouvrir, configurer, FRONT } = require('../a3/lib3');
const { rec, end } = require('./lib5');
const ENV = `pile isolée : frontend ${FRONT}, backend 127.0.0.1:4100 (sources publiques), base locale ; code : feature/surga (arbre de travail)`;
const fenetres = (p) => p.evaluate(() => [...document.querySelectorAll('[role="dialog"]')].filter((d) => d.getClientRects().length > 0).map((d) => (d.getAttribute('aria-label') || (d.querySelector('h2') || {}).textContent || '(sans nom)').trim()));

(async () => {
  const r = rec('A5-130'); const res = {};
  const o = await ouvrir({ sw: 'block', desktop: true }); const p = o.page;
  await p.goto(FRONT + '/surga', { waitUntil: 'domcontentloaded', timeout: 180000 }); await p.waitForTimeout(5000);
  await configurer(p); await p.waitForTimeout(4500);
  const widget = p.locator('.surga-desktop-right-rail [title="Voir les détails météo"]').first();
  res.widget = { present: await widget.count() > 0, texte: ((await widget.innerText().catch(() => '')) || '').replace(/\s+/g, ' ').slice(0, 80) };
  res.avant_clic = await fenetres(p);
  await widget.click({ timeout: 8000 }).catch((e) => { res.clic_impossible = e.message.slice(0, 100); });
  await p.waitForTimeout(1500);
  res.apres_clic = { fenetres: await fenetres(p), contenu: await p.evaluate(() => { const t = document.body.innerText; return { temperature: (t.match(/\b\d{1,2}\s?°C/) || [null])[0], previsions_ou_detail: /Prévisions|Vent|Humidité|Détails|Moins/.test(t), bouton_localite: !!document.querySelector('[data-surga-fenetre] button') }; }) };
  const focus = await p.evaluate(() => { const f = document.querySelector('[data-surga-fenetre]'); return f ? f.contains(document.activeElement) : null; });
  res.focus_dans_la_fenetre = focus;
  // Changer de localité depuis la fenêtre : la liste s'ouvre au-dessus.
  const titre = p.locator('[data-surga-fenetre] button:has-text("Météo ·")').first();
  if (await titre.count()) { await titre.click().catch(() => {}); await p.waitForTimeout(1000); res.liste_des_localites = await p.evaluate(() => /Rechercher|Dakar Plateau|Thiès|Saint-Louis/.test(document.body.innerText) && !!document.querySelector('[data-surga-fenetre]')); await p.keyboard.press('Escape'); await p.waitForTimeout(600); }
  await p.screenshot({ path: 'C:/Users/HP/AppData/Local/Temp/claude/c--Users-HP--gemini-antigravity-ide-scratch-yombale-docs-surga/c510d782-5a97-4f33-8703-f2e52d791f3b/scratchpad/meteo-fenetre.png' });
  // Fermeture par Échap puis par le bouton.
  await p.keyboard.press('Escape'); await p.waitForTimeout(700);
  if ((await fenetres(p)).length > 0) await p.keyboard.press('Escape');
  await p.waitForTimeout(500);
  res.apres_echap = await fenetres(p);
  await widget.click().catch(() => {}); await p.waitForTimeout(900);
  await p.locator('button[aria-label="Fermer la météo"]').first().click().catch(() => {}); await p.waitForTimeout(700);
  res.apres_bouton_fermer = await fenetres(p);
  await o.browser.close(); r.mesure('relevés', res);
  const ok = res.widget.present && res.avant_clic.length === 0 && res.apres_clic.fenetres.length >= 1 && /°C/.test(res.widget.texte + (res.apres_clic.contenu.temperature || ''))
    && res.apres_clic.contenu.temperature && res.focus_dans_la_fenetre === true && res.apres_echap.length === 0 && res.apres_bouton_fermer.length === 0;
  r.verdict(ok ? 'PASS' : 'FAIL', JSON.stringify(res)); r.save(process.argv[2] || 'meteo_bureau', ENV);
  await end(); process.exit(0);
})().catch(async (e) => { console.error('ERREUR', e.message); try { await end(); } catch { /* déjà fermé */ } process.exit(2); });
