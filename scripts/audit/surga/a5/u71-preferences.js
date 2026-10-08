// A5-125 et A5-126 — SRG-A2-011 : les réglages d'un compte, du briefing et d'un appareil à l'autre.
// Frontend 3001, backend 4100 de la pile isolée, workers bloqués.
//   A5-125 (serveur) : le briefing d'un invité reprend ses choix ; un compte garde « configuré » ; rien d'un invité n'est écrit.
//   A5-126 (écran)   : zone à choix unique ; briefing de l'invité ; réglages envoyés à la connexion ; second appareil ;
//                      réglage changé ailleurs repris au rechargement ; un compte déjà réglé n'est pas écrasé par un invité.
// Usage : $env:A5_DB='nopalou_audit'; $env:A5_BACK='http://127.0.0.1:4100'; run5.ps1 a5\u71-preferences.js -Base nopalou_audit [A5-125,A5-126]
const { ouvrir, configurer, connexionEmail, ls, FRONT } = require('../a3/lib3');
const { rec, appel, connexion, pool, end, PASS } = require('./lib5');
const seul = process.argv[2] ? process.argv[2].split(',') : null;
const joue = (id) => !seul || seul.includes(id);
const ts = Date.now().toString(36);
const ENV = `pile isolée : frontend ${FRONT} (next dev), backend 127.0.0.1:4100, base locale nopalou_audit ; code : feature/surga (arbre de travail)`;
const texte = async (page) => (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
const phrase = async (page) => ((await texte(page)).match(/Bonjour\. Pour .{1,60}? ce matin\s*: [^.]+\./) || [null])[0];
const enBase = async (id) => (await pool.query('select quartiers, modules_actifs, heure_briefing, onboarding_termine from surga_preferences where user_id = $1', [id])).rows[0] || null;
const inscrire = async (nom, xff) => { const email = `a5125.${nom}.${ts}@audit.test`; const r = await appel('POST', '/api/auth/inscription', { xff, body: { nom: `Awa ${nom}`, email, mot_de_passe: PASS } }); return { email, id: r.d.user.id }; };
const accueil = async (opt = {}) => { const o = await ouvrir({ sw: 'block', ...opt }); await o.page.goto(FRONT + '/surga', { waitUntil: 'domcontentloaded', timeout: 180000 }); await o.page.waitForTimeout(5000); return o; };

(async () => {
  if (joue('A5-125')) {
    const r = rec('A5-125'); const res = {};
    const q = '/api/surga/briefing?quartier=' + encodeURIComponent('Rufisque') + '&modules=' + encodeURIComponent('actualites,meteo,trafic') + '&heure=06%3A30';
    const inv = await appel('GET', q, { xff: '10.252.1.1' });
    res.invite_avec_choix = { statut: inv.s, quartier: inv.d.quartier, heure: inv.d.heure_briefing, modules: inv.d.modules_actifs, sports: (inv.d.sports || []).length, phrase: inv.d.message_synthese };
    const nu = await appel('GET', '/api/surga/briefing', { xff: '10.252.1.2' });
    res.invite_sans_choix = { statut: nu.s, quartier: nu.d.quartier };
    const long = await appel('GET', '/api/surga/briefing?quartier=' + 'x'.repeat(400) + '&modules=' + encodeURIComponent('<script>,actualites') + '&heure=99h', { xff: '10.252.1.3' });
    res.choix_mal_formes = { statut: long.s, quartier: long.d.quartier, heure: long.d.heure_briefing, modules: long.d.modules_actifs };
    // Compte : ses réglages en base l'emportent sur les paramètres de l'adresse.
    const U = await inscrire('api', '10.252.1.4'); const token = await connexion(U.email, '10.252.1.4');
    const env = await appel('POST', '/api/surga/preferences', { token, xff: '10.252.1.4', body: { modules_actifs: ['actualites', 'meteo'], heure_briefing: '08:00', langue: 'fr', quartiers: ['Almadies / Ngor'], equipes_suivies: [], onboarding_termine: true } });
    res.compte_enregistre = { statut: env.s, configure: env.d.preferences && env.d.preferences.onboarding_termine, en_base: await enBase(U.id) };
    const lu = await appel('GET', q, { token, xff: '10.252.1.4' });
    res.compte_briefing = { quartier: lu.d.quartier, heure: lu.d.heure_briefing };
    // « configuré » ne se retire pas par un envoi qui l'omet ou le nie.
    await appel('POST', '/api/surga/preferences', { token, xff: '10.252.1.4', body: { heure_briefing: '07:00', onboarding_termine: false } });
    res.configure_garde = (await enBase(U.id) || {}).onboarding_termine;
    const sansJeton = await appel('POST', '/api/surga/preferences', { xff: '10.252.1.5', body: { quartiers: ['Rufisque'] } });
    res.ecriture_sans_compte = sansJeton.s;
    r.mesure('relevés', res);
    const ok = res.invite_avec_choix.quartier === 'Rufisque' && res.invite_avec_choix.heure === '06:30' && res.invite_avec_choix.sports === 0 && !/sportive/.test(res.invite_avec_choix.phrase || '')
      && res.invite_sans_choix.statut === 200 && res.choix_mal_formes.statut === 200 && (res.choix_mal_formes.quartier || '').length <= 80 && /^\d{2}:\d{2}$/.test(res.choix_mal_formes.heure || '') && !(res.choix_mal_formes.modules || []).some((m) => /[<>]/.test(m))
      && res.compte_enregistre.statut === 200 && res.compte_enregistre.configure === true && res.compte_briefing.quartier === 'Almadies / Ngor' && res.compte_briefing.heure === '08:00'
      && res.configure_garde === true && res.ecriture_sans_compte === 401;
    r.verdict(ok ? 'PASS' : 'FAIL', JSON.stringify(res)); r.save('preferences_serveur', ENV);
  }

  if (joue('A5-126')) {
    const r = rec('A5-126'); const res = {};
    const U = await inscrire('ecran', '10.252.2.1');
    // Appareil 1, en invité : sans le sport, zone Rufisque.
    const a = await accueil();
    await a.page.locator('button:has-text("Démarrer ma journée avec Surga")').first().click(); await a.page.waitForTimeout(1200);
    await a.page.locator('[role="checkbox"]:has-text("Sport")').first().click(); await a.page.waitForTimeout(300);
    await a.page.locator('button:has-text("Continuer")').click(); await a.page.waitForTimeout(800);
    await a.page.locator('button:has-text("06:30")').first().click(); await a.page.waitForTimeout(200);
    await a.page.locator('button:has-text("Rufisque")').first().click(); await a.page.waitForTimeout(300);
    await a.page.locator('button:has-text("Continuer")').click(); await a.page.waitForTimeout(1200);
    res.zone_au_recapitulatif = ((await texte(a.page)).match(/Zone principale : (.+?) Noyau inclus/) || [null, null])[1];
    await a.page.locator('button:has-text("Ouvrir mon Surga")').click(); await a.page.waitForTimeout(7000);
    res.invite = { phrase: await phrase(a.page), appareil: await ls(a.page, 'surga_preferences').then((p) => p && { quartiers: p.quartiers, heure: p.heure_briefing, sport: (p.modules_actifs || []).includes('sport') }) };
    res.avant_connexion_en_base = await enBase(U.id);
    res.connexion_1 = await connexionEmail(a.page, U.email); await a.page.waitForTimeout(6000);
    res.apres_connexion_en_base = await enBase(U.id);
    res.apres_connexion_ecran = { phrase: await phrase(a.page) };
    // Appareil 2 : configuration par défaut (Dakar Plateau, 07:30), puis connexion au même compte.
    const b = await accueil(); await configurer(b.page); await b.page.waitForTimeout(3000);
    res.appareil_2_avant = (await ls(b.page, 'surga_preferences') || {}).quartiers;
    res.connexion_2 = await connexionEmail(b.page, U.email); await b.page.waitForTimeout(7000);
    const p2 = await ls(b.page, 'surga_preferences') || {};
    res.appareil_2_apres = { quartiers: p2.quartiers, heure: p2.heure_briefing, sport: (p2.modules_actifs || []).includes('sport'), phrase: await phrase(b.page) };
    res.compte_non_ecrase = await enBase(U.id);
    // Réglage changé depuis l'appareil 1 (par l'API, au nom du compte) : l'appareil 2 le reprend au rechargement.
    const token = await connexion(U.email, '10.252.2.2');
    await appel('POST', '/api/surga/preferences', { token, xff: '10.252.2.2', body: { heure_briefing: '08:00', quartiers: ['Almadies / Ngor'] } });
    await b.page.reload({ waitUntil: 'domcontentloaded' }); await b.page.waitForTimeout(8000);
    const p3 = await ls(b.page, 'surga_preferences') || {};
    res.appareil_2_apres_changement = { quartiers: p3.quartiers, heure: p3.heure_briefing, phrase: await phrase(b.page), heure_a_l_ecran: /08:00/.test(await texte(b.page)) };
    await a.browser.close(); await b.browser.close(); r.mesure('relevés', res);
    const ok = res.zone_au_recapitulatif === 'Rufisque'
      && /Pour Rufisque/.test(res.invite.phrase || '') && !/sportive/.test(res.invite.phrase || '')
      && res.connexion_1.ok && res.apres_connexion_en_base && res.apres_connexion_en_base.onboarding_termine === true && (res.apres_connexion_en_base.quartiers || [])[0] === 'Rufisque' && res.apres_connexion_en_base.heure_briefing === '06:30' && !(res.apres_connexion_en_base.modules_actifs || []).includes('sport')
      && res.connexion_2.ok && (res.appareil_2_apres.quartiers || [])[0] === 'Rufisque' && res.appareil_2_apres.heure === '06:30' && !res.appareil_2_apres.sport && /Pour Rufisque/.test(res.appareil_2_apres.phrase || '')
      && (res.compte_non_ecrase.quartiers || [])[0] === 'Rufisque'
      && (res.appareil_2_apres_changement.quartiers || [])[0] === 'Almadies / Ngor' && res.appareil_2_apres_changement.heure === '08:00' && /Pour Almadies/.test(res.appareil_2_apres_changement.phrase || '');
    r.verdict(ok ? 'PASS' : 'FAIL', JSON.stringify(res)); r.save('preferences_ecran', ENV);
  }
  await end(); process.exit(0);
})().catch(async (e) => { console.error('ERREUR', e.message); try { await end(); } catch { /* déjà fermé */ } process.exit(2); });
