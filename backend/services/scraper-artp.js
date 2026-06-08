// backend/services/scraper-artp.js — Scraper ARTP (e-services.artp.sn/catalogues)
// Nécessite : npm install playwright (Chromium headless)
// IMPORTANT : Ce scraper tourne côté backend Node.js avec son propre Playwright —
// distinct du MCP Playwright utilisé par Claude pour explorer le site.
//
// Architecture : Angular SSR probable → attente du rendu avant extraction
// Déclenchement : POST /api/telecom/sync-artp (protégé adminSecretOnly, arrière-plan)

const { pool } = require('../models/db');

// ─── Sélecteurs CSS — à valider via Playwright MCP sur le site réel ──────────
// Ces constantes sont des placeholders ; les vrais sélecteurs seront remplis
// après exploration manuelle du DOM Angular rendu.
const SEL = {
  // Conteneur principal d'un forfait / ligne de catalogue
  ITEM:        '[data-placeholder="item-selector"]',
  // Nom de l'opérateur (ex: "Orange", "Free", "Expresso")
  OPERATEUR:   '[data-placeholder="operateur-selector"]',
  // Nom commercial du forfait
  NOM:         '[data-placeholder="nom-selector"]',
  // Volume data (ex: "5 Go", "500 Mo")
  DATA:        '[data-placeholder="data-selector"]',
  // Minutes d'appel incluses
  MINUTES:     '[data-placeholder="minutes-selector"]',
  // SMS inclus
  SMS:         '[data-placeholder="sms-selector"]',
  // Durée de validité (ex: "30 jours")
  VALIDITE:    '[data-placeholder="validite-selector"]',
  // Prix (ex: "2 000 FCFA")
  PRIX:        '[data-placeholder="prix-selector"]',
  // Type de forfait (internet / appel / sms / combo)
  TYPE:        '[data-placeholder="type-selector"]',
  // URL image/logo opérateur (attribut src ou background-image)
  IMAGE:       '[data-placeholder="image-selector"]',
};

const ARTP_URL = 'https://e-services.artp.sn/catalogues';
const TIMEOUT  = 30000; // ms d'attente max pour le rendu Angular

// ─── Helpers de parsing ────────────────────────────────────────────────────

function parseData(texte) {
  if (!texte) return null;
  const t = texte.toLowerCase().replace(/\s/g, '');
  const goMatch = t.match(/(\d+[,.]?\d*)\s*go/);
  if (goMatch) return Math.round(parseFloat(goMatch[1].replace(',', '.')) * 1000);
  const moMatch = t.match(/(\d+)\s*mo/);
  if (moMatch) return parseInt(moMatch[1]);
  return null;
}

function parseMinutes(texte) {
  if (!texte) return null;
  const m = texte.replace(/\s/g, '').match(/(\d+)\s*min/i);
  return m ? parseInt(m[1]) : null;
}

function parseSms(texte) {
  if (!texte) return null;
  const m = texte.replace(/\s/g, '').match(/(\d+)\s*sms/i);
  return m ? parseInt(m[1]) : null;
}

function parseValidite(texte) {
  if (!texte) return null;
  const m = texte.replace(/\s/g, '').match(/(\d+)\s*j(?:our)?/i);
  return m ? parseInt(m[1]) : null;
}

function parsePrix(texte) {
  if (!texte) return null;
  // "2 000 FCFA", "1500 CFA", "2.000 XOF"
  const clean = texte.replace(/\s|[.,](?=\d{3})/g, '').replace(/[^0-9]/g, '');
  const val = parseInt(clean);
  return isNaN(val) || val <= 0 ? null : val;
}

function inferType(nom, data, minutes, sms) {
  if (data && (minutes || sms)) return 'combo';
  if (data)    return 'internet';
  if (minutes) return 'appel';
  if (sms)     return 'sms';
  const n = (nom || '').toLowerCase();
  if (/internet|data|4g|5g|go|mo/.test(n)) return 'internet';
  if (/appel|voix|call/.test(n))           return 'appel';
  if (/sms/.test(n))                       return 'sms';
  return 'combo';
}

// ─── Extraction DOM ────────────────────────────────────────────────────────

async function extraireForfaits(page) {
  // Attendre que le rendu Angular soit terminé (les items sont dans le DOM)
  await page.waitForSelector(SEL.ITEM, { timeout: TIMEOUT });

  return page.evaluate(function(sel) {
    var items = Array.from(document.querySelectorAll(sel.ITEM));
    return items.map(function(el) {
      function txt(s) {
        var node = el.querySelector(s);
        return node ? node.textContent.trim() : '';
      }
      function attr(s, a) {
        var node = el.querySelector(s);
        return node ? (node.getAttribute(a) || node.style.backgroundImage || '') : '';
      }
      return {
        operateur:  txt(sel.OPERATEUR),
        nom:        txt(sel.NOM),
        data_raw:   txt(sel.DATA),
        minutes_raw:txt(sel.MINUTES),
        sms_raw:    txt(sel.SMS),
        validite_raw:txt(sel.VALIDITE),
        prix_raw:   txt(sel.PRIX),
        type_raw:   txt(sel.TYPE),
        image_url:  attr(sel.IMAGE, 'src'),
      };
    });
  }, SEL);
}

// ─── Persistance ──────────────────────────────────────────────────────────

async function upsertForfait(forfait) {
  // Upsert par (operateur, nom) — idempotent
  await pool.query(`
    INSERT INTO forfaits_telecom
      (operateur, nom, type, data_mo, minutes, sms, validite_jours, prix, image_url, source)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'artp')
    ON CONFLICT (operateur, nom)
    DO UPDATE SET
      type           = EXCLUDED.type,
      data_mo        = EXCLUDED.data_mo,
      minutes        = EXCLUDED.minutes,
      sms            = EXCLUDED.sms,
      validite_jours = EXCLUDED.validite_jours,
      prix           = EXCLUDED.prix,
      image_url      = COALESCE(EXCLUDED.image_url, forfaits_telecom.image_url),
      source         = 'artp',
      updated_at     = NOW()
  `, [
    forfait.operateur, forfait.nom, forfait.type,
    forfait.data_mo, forfait.minutes, forfait.sms, forfait.validite_jours,
    forfait.prix, forfait.image_url || null
  ]);
}

// ─── Point d'entrée principal ─────────────────────────────────────────────

async function scraperARTP({ dryRun = false } = {}) {
  let playwright, browser;
  const resultats = { scrapes: 0, inseres: 0, ignores: 0, erreurs: [], dryRun };

  try {
    // Import dynamique — playwright doit être installé : npm install playwright
    playwright = require('playwright');
    browser = await playwright.chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const context = await browser.newContext({
      ignoreHTTPSErrors: true,   // site ARTP a un certificat non vérifié
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    });
    const page = await context.newPage();

    console.log('[ARTP] Navigation vers', ARTP_URL);
    await page.goto(ARTP_URL, { waitUntil: 'networkidle', timeout: TIMEOUT });

    const rawItems = await extraireForfaits(page);
    console.log('[ARTP] Items bruts extraits :', rawItems.length);

    for (const raw of rawItems) {
      resultats.scrapes++;

      const data_mo        = parseData(raw.data_raw);
      const minutes        = parseMinutes(raw.minutes_raw);
      const sms            = parseSms(raw.sms_raw);
      const validite_jours = parseValidite(raw.validite_raw);
      const prix           = parsePrix(raw.prix_raw);
      const operateur      = raw.operateur || 'Inconnu';
      const nom            = raw.nom       || raw.type_raw || 'Sans nom';
      const type           = inferType(nom, data_mo, minutes, sms);

      if (!prix || prix <= 0) {
        console.warn('[ARTP] Prix invalide pour :', nom, '— ignoré');
        resultats.ignores++;
        continue;
      }

      const forfait = { operateur, nom, type, data_mo, minutes, sms, validite_jours, prix, image_url: raw.image_url };

      if (dryRun) {
        console.log('[ARTP DRY]', forfait);
      } else {
        await upsertForfait(forfait);
        resultats.inseres++;
      }
    }
  } catch (err) {
    console.error('[ARTP] Erreur scraper :', err.message);
    resultats.erreurs.push(err.message);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }

  console.log('[ARTP] Terminé :', resultats);
  return resultats;
}

module.exports = { scraperARTP };
