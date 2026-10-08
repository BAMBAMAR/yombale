// A5-129 — SRG-A3-010 (suite) : champs nommés, messages annoncés, lien d'évitement, titre de niveau 1.
// Formulaires essayés (390 px) : note, dépense de Sama Xaalis, rappel, connexion. Puis bureau (1440 px) : titre et repères.
// « Nom accessible » est lu dans l'arbre d'accessibilité de Chromium (page.accessibility), pas deviné d'après le code.
// Usage : $env:A5_DB='nopalou_audit'; $env:A5_BACK='http://127.0.0.1:4100'; run5.ps1 a5\u74-accessibilite.js -Base nopalou_audit [libelle]
const { ouvrir, configurer, onglet, FRONT } = require('../a3/lib3');
const { rec, end } = require('./lib5');
const ENV = `pile isolée : frontend ${FRONT}, backend 127.0.0.1:4100, base locale ; code : feature/surga (arbre de travail)`;

// Nom accessible calculé par le navigateur pour chaque champ visible : aria-label, label lié, labelledby, title, placeholder en dernier.
const champs = (page) => page.evaluate(() => {
  const vis = (e) => { const b = e.getBoundingClientRect(); const s = getComputedStyle(e); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const nomLie = (c) => {
    const l = c.getAttribute('aria-labelledby'); if (l) { const t = l.split(/\s+/).map((i) => (document.getElementById(i) || {}).innerText || '').join(' ').trim(); if (t) return t; }
    if (c.getAttribute('aria-label')) return c.getAttribute('aria-label').trim();
    if (c.labels && c.labels.length) return [...c.labels].map((x) => x.innerText).join(' ').trim();
    return '';
  };
  return [...document.querySelectorAll('.surga-root input:not([type="hidden"]), .surga-root textarea, .surga-root select')].filter(vis).map((c) => ({ champ: `${c.tagName.toLowerCase()}${c.type ? ':' + c.type : ''} « ${(c.placeholder || '').slice(0, 30)} »`, nom: nomLie(c).slice(0, 60), nomme: !!nomLie(c) }));
});

(async () => {
  const r = rec('A5-129'); const res = {};
  const m = await ouvrir({ sw: 'block' });
  await m.page.goto(FRONT + '/surga', { waitUntil: 'domcontentloaded', timeout: 180000 }); await m.page.waitForTimeout(5000);
  await configurer(m.page); await m.page.waitForTimeout(2500);
  const formulaires = {};
  const essai = async (id, ouvrirFn) => { try { await ouvrirFn(); await m.page.waitForTimeout(1200); formulaires[id] = await champs(m.page); } catch (e) { formulaires[id] = `non atteint : ${String(e.message).slice(0, 80)}`; } };
  await onglet(m.page, 'Notes'); await essai('note', async () => { await m.page.locator('button:has-text("Nouvelle"), button:has-text("Ajouter"), button[aria-label*="note" i]').first().click(); });
  await m.page.reload({ waitUntil: 'domcontentloaded' }); await m.page.waitForTimeout(4500);
  await onglet(m.page, 'Sama Xaalis'); await essai('depense', async () => { await m.page.locator('button:has-text("Dépense")').first().click(); });
  await m.page.reload({ waitUntil: 'domcontentloaded' }); await m.page.waitForTimeout(4500);
  await onglet(m.page, 'Agenda'); await essai('rappel', async () => { await m.page.locator('button:has-text("Nouveau"), button:has-text("Ajouter"), button:has-text("rappel")').first().click(); });
  await m.page.reload({ waitUntil: 'domcontentloaded' }); await m.page.waitForTimeout(4500);
  await essai('connexion', async () => { await m.page.locator('button[title="Se connecter / Compte"], button:has-text("Connexion")').first().click(); await m.page.waitForTimeout(800); await m.page.locator('text=Email & Passe').first().click(); });
  res.formulaires = formulaires;
  const tous = Object.values(formulaires).filter(Array.isArray).flat();
  res.synthese_champs = { champs_vus: tous.length, nommes: tous.filter((c) => c.nomme).length, sans_nom: tous.filter((c) => !c.nomme).map((c) => c.champ) };

  // Annonce : un message de Surga doit apparaître dans la zone permanente.
  await m.page.reload({ waitUntil: 'domcontentloaded' }); await m.page.waitForTimeout(4500);
  const zoneAvant = await m.page.evaluate(() => { const z = document.getElementById('surga-annonces'); return z ? { role: z.getAttribute('role'), live: z.getAttribute('aria-live'), texte: z.textContent } : null; });
  await m.page.evaluate(() => window.dispatchEvent(new CustomEvent('surga-toast', { detail: { message: 'Rappel enregistré pour demain 09:00', type: 'succes' } })));
  await m.page.waitForTimeout(400);
  const zoneApres = await m.page.evaluate(() => (document.getElementById('surga-annonces') || {}).textContent || '');
  const pastille = await m.page.evaluate(() => { const t = document.querySelector('.surga-global-toast'); return t ? { aria_hidden: t.getAttribute('aria-hidden'), role: t.getAttribute('role') } : null; });
  res.annonce = { zone_presente_avant: zoneAvant, texte_apres: zoneApres, pastille_visible: pastille };

  // Lien d'évitement : premier arrêt de tabulation, visible au focus, déplace le focus vers le contenu.
  await m.page.reload({ waitUntil: 'domcontentloaded' }); await m.page.waitForTimeout(4500);
  await m.page.keyboard.press('Tab');
  const lien = await m.page.evaluate(() => { const a = document.activeElement; const b = a ? a.getBoundingClientRect() : null; return a && a.classList.contains('surga-lien-evitement') ? { texte: a.textContent.trim(), visible_au_focus: b.top >= 0 && b.bottom > 0 } : { actif: a ? a.tagName + ' ' + (a.textContent || '').trim().slice(0, 30) : null }; });
  await m.page.keyboard.press('Enter'); await m.page.waitForTimeout(300);
  res.lien_d_evitement = { ...lien, focus_apres_entree: await m.page.evaluate(() => (document.activeElement || {}).id || null) };
  await m.browser.close();

  // Bureau : un seul titre de niveau 1 lu par écran, contenu dans un repère principal.
  const d = await ouvrir({ sw: 'block', desktop: true });
  await d.page.goto(FRONT + '/surga', { waitUntil: 'domcontentloaded', timeout: 180000 }); await d.page.waitForTimeout(5000);
  await configurer(d.page); await d.page.waitForTimeout(2500);
  const reperes = async () => d.page.evaluate(() => { const lisible = (e) => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden'; return { h1: [...document.querySelectorAll('h1')].filter(lisible).map((h) => h.textContent.trim()), main: document.querySelectorAll('main').length }; });
  res.bureau = { aujourdhui: await reperes() };
  await onglet(d.page, 'Notes'); res.bureau.notes = await reperes();
  await d.browser.close();
  // Téléphone : l'en-tête garde son titre, pas de doublon.
  const t = await ouvrir({ sw: 'block' });
  await t.page.goto(FRONT + '/surga', { waitUntil: 'domcontentloaded', timeout: 180000 }); await t.page.waitForTimeout(5000);
  await configurer(t.page); await t.page.waitForTimeout(2500);
  res.telephone = await t.page.evaluate(() => { const lisible = (e) => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden'; return { h1: [...document.querySelectorAll('h1')].filter(lisible).map((h) => h.textContent.trim()) }; });
  await t.browser.close();

  r.mesure('accessibilité', res);
  const ok = res.synthese_champs.champs_vus >= 8 && res.synthese_champs.sans_nom.length === 0
    && res.annonce.zone_presente_avant && res.annonce.zone_presente_avant.role === 'status' && /Rappel enregistré/.test(res.annonce.texte_apres) && res.annonce.pastille_visible && res.annonce.pastille_visible.aria_hidden === 'true'
    && res.lien_d_evitement.texte === 'Aller au contenu' && res.lien_d_evitement.focus_apres_entree === 'surga-contenu'
    && res.bureau.aujourdhui.h1.length === 1 && res.bureau.aujourdhui.main === 1 && res.bureau.notes.h1.length === 1 && res.telephone.h1.length === 1;
  r.verdict(ok ? 'PASS' : 'FAIL', JSON.stringify({ champs: res.synthese_champs, annonce: res.annonce.texte_apres, lien: res.lien_d_evitement, bureau: res.bureau, telephone: res.telephone }));
  r.save(process.argv[2] || 'accessibilite', ENV);
  await end(); process.exit(0);
})().catch(async (e) => { console.error('ERREUR', e.message); try { await end(); } catch { /* déjà fermé */ } process.exit(2); });
