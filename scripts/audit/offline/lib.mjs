// Bibliothèque des tests navigateur hors-ligne (audit). Cible : frontend de production LOCAL :3001 + backend :4100 (base nopalou_audit).
import { chromium, devices } from '../../../node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
export const BASE = process.env.AUDIT_BASE || 'http://127.0.0.1:3001'; // pour le panier : AUDIT_BASE=http://localhost:3001 (CORS du backend d'audit)
export const API = 'http://127.0.0.1:4100';
export const state = () => JSON.parse(fs.readFileSync(path.join(here, '..', '.local', 'offline-state.json'), 'utf8'));
export async function launch({ mobile = false, storageState, userDataDir } = {}) {
  const browser = await chromium.launch({ headless: true });
  const opts = mobile ? { ...devices['Pixel 7'] } : { viewport: { width: 1280, height: 800 } };
  if (storageState) opts.storageState = storageState;
  const ctx = await browser.newContext({ ...opts, serviceWorkers: 'allow', locale: 'fr-FR' });
  const page = await ctx.newPage();
  const logs = []; page.on('console', m => { if (['error', 'warning'].includes(m.type())) logs.push(`${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', e => logs.push('pageerror: ' + String(e.message).slice(0, 200)));
  return { browser, ctx, page, logs };
}
export async function login(page, email, pw) {
  await page.goto(BASE + '/connexion', { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  await page.locator('button', { hasText: 'Avec mot de passe' }).first().click();
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', pw);
  await Promise.all([page.waitForURL(u => !u.pathname.startsWith('/connexion'), { timeout: 30000 }), page.click('button[type="submit"]')]);
}
export async function swReady(page) {
  return page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return { supported: false };
    const reg = await Promise.race([navigator.serviceWorker.ready, new Promise(r => setTimeout(() => r(null), 20000))]);
    return { supported: true, ready: !!reg, scope: reg && reg.scope, controller: !!navigator.serviceWorker.controller, active: reg && reg.active && reg.active.state };
  });
}
export async function cacheReport(page) {
  return page.evaluate(async () => {
    const out = {};
    for (const n of await caches.keys()) { const c = await caches.open(n); const ks = await c.keys(); out[n] = ks.map(r => new URL(r.url).pathname + new URL(r.url).search); }
    return out;
  });
}
export async function readIDB(page, storeNames) {
  return page.evaluate(async (stores) => {
    const open = () => new Promise((res, rej) => { const r = indexedDB.open('nopalou_pos_offline'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const db = await open(); const out = { version: db.version, stores: Array.from(db.objectStoreNames) };
    for (const s of stores) { if (!db.objectStoreNames.contains(s)) { out[s] = null; continue; } out[s] = await new Promise(res => { const r = db.transaction(s).objectStore(s).getAll(); r.onsuccess = () => res(r.result); r.onerror = () => res('ERR'); }); }
    db.close(); return out;
  }, storeNames);
}
export async function visitOffline(page, url, expectText) {
  let status = null, fromSW = null, err = null;
  try { const r = await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 20000 }); status = r && r.status(); fromSW = r && r.fromServiceWorker(); } catch (e) { err = String(e.message).split('\n')[0]; }
  await page.waitForTimeout(1500);
  const info = await page.evaluate((t) => ({ title: document.title, text: document.body ? document.body.innerText.slice(0, 4000) : '', hasExpected: t ? (document.body.innerText.includes(t)) : null }), expectText).catch(() => ({ title: '(page indisponible)', text: '', hasExpected: null }));
  const isFallback = /Connexion Internet Interrompue|Mode Hors-Ligne/.test(info.text);
  return { url, status, fromSW, err, title: info.title, isFallback, hasExpected: info.hasExpected, textLen: info.text.length, excerpt: info.text.replace(/\s+/g, ' ').slice(0, 160) };
}
export const out = (o) => console.log(JSON.stringify(o, null, 1));

