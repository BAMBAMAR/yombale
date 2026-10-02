// backend/services/scraper-artp.js — Scraper ARTP via API JSON publique
// URL : https://e-services.artp.sn/catalogue-api/
// Pas de Playwright nécessaire — l'API REST est accessible directement.
// Déclenchement : POST /api/telecom/sync-artp (protégé adminSecretOnly, arrière-plan)

const https  = require('https');
const tls    = require('tls');
const fs     = require('fs');
const path   = require('path');
const { pool } = require('../models/db');
const { RunCollecte, noterRequeteCourante } = require('../lib/scrapingRun');

const BASE_URL = 'https://e-services.artp.sn/catalogue-api';

// Mapping typeOffre.nom → notre champ type
const TYPE_MAP = {
  'Bundle':          'combo',
  'Exclusif Voix':   'appel',
  'Internet mobile': 'internet',
  'Voix-Sms':        'combo',
};

// ─── Requête HTTPS (certificat vérifié : AUD-192) ─────────────────────────
// Le certificat de e-services.artp.sn n'est PAS auto-signé (le commentaire d'origine était faux) : c'est un certificat Sectigo
// valide dont le serveur n'envoie pas l'intermédiaire. Cet intermédiaire public est fourni dans backend/certs. Retour arrière
// explicite et journalisé : ARTP_TLS_INSECURE=true.
function optionsTls() {
  if (process.env.ARTP_TLS_INSECURE === 'true') {
    console.warn('[ARTP] ARTP_TLS_INSECURE=true : certificat NON vérifié (retour arrière explicite)');
    return { rejectUnauthorized: false };
  }
  const intermediaire = fs.readFileSync(path.join(__dirname, '..', 'certs', 'sectigo-public-server-ca-dv-r36.pem'), 'utf8');
  return { ca: [...tls.rootCertificates, intermediaire] };
}

function apiFetch(chemin) {
  return new Promise((resolve, reject) => {
    const url = BASE_URL + chemin;
    const req = https.get(url, {
      ...optionsTls(),
      headers: {
        'Accept':  'application/json',
        'Referer': 'https://e-services.artp.sn/catalogues',
        'User-Agent': 'Mozilla/5.0 (compatible; Nopalou-Scraper/1.0)',
      },
    }, (res) => {
      noterRequeteCourante(res.statusCode);
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP ${res.statusCode} pour ${url}: ${body.slice(0, 200)}`));
        }
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error(`JSON invalide: ${e.message}`)); }
      });
    });
    req.on('error', (e) => { noterRequeteCourante(e.code || 'none'); reject(e); });
    req.setTimeout(15000, () => { req.destroy(); reject(new Error(`Timeout ${url}`)); });
  });
}

// ─── Conversion validité minutes → jours ─────────────────────────────────

function minutesEnJours(minutes) {
  if (!minutes || minutes <= 0) return null;
  return Math.max(1, Math.round(minutes / 1440));
}

// ─── Persistance upsert ───────────────────────────────────────────────────

async function upsertForfait(f) {
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
      actif          = true,
      source         = 'artp',
      updated_at     = NOW()
  `, [f.operateur, f.nom, f.type, f.data_mo, f.minutes, f.sms, f.validite_jours, f.prix, f.image_url]);
}

// ─── Point d'entrée principal ─────────────────────────────────────────────

// AUD-192 / AUD-173 : le passage est mesuré et évalué comme les autres sources (0 forfait lu = échec, alerte si répété)
async function scraperARTP(options = {}) {
  const run = new RunCollecte({ source: 'ARTP', systeme: 'telecom', categoriesCibles: 1 });
  const resultats = await run.executer(() => scraperARTPMesure(options));
  run.noterCategorie('catalogue', resultats.inseres);
  if (!options.dryRun) {
    const verdict = await run.cloturer(pool, { itemsExtraits: resultats.scrapes, itemsInseres: resultats.inseres, itemsFiltres: resultats.ignores });
    resultats.statut = verdict.statut;
    resultats.motifs = verdict.motifs;
  }
  return resultats;
}

async function scraperARTPMesure({ dryRun = false } = {}) {
  const resultats = { scrapes: 0, inseres: 0, ignores: 0, erreurs: [], dryRun };

  try {
    console.log('[ARTP] Démarrage scraping via API JSON...');

    // Récupérer les référentiels en parallèle
    const [operateurs, typesOffres, offres] = await Promise.all([
      apiFetch('/operateurs'),
      apiFetch('/type-offres'),
      apiFetch('/offres'),
    ]);

    // Construire les tables de lookup id → nom / logo
    const opMap   = {};
    const logoMap = {};
    operateurs.forEach(op => {
      opMap[op.id]   = op.nom;
      logoMap[op.id] = op.logo || null;
    });

    const typeMap = {};
    typesOffres.forEach(t => { typeMap[t.id] = t.nom; });

    console.log(`[ARTP] ${operateurs.length} opérateurs, ${typesOffres.length} types, ${offres.length} offres récupérées`);

    for (const o of offres) {
      resultats.scrapes++;

      // Ignorer les offres inactives
      if (!o.active) { resultats.ignores++; continue; }

      // Ignorer les offres hors-mobile (Fibre, Box, FlyBox = segment fixe)
      if (o.segment === 'fixe') { resultats.ignores++; continue; }

      const operateur = opMap[o.operateurId] || 'Inconnu';
      const typeNom   = typeMap[o.typeOffreId] || '';
      const type      = TYPE_MAP[typeNom] || 'combo';

      const forfait = {
        operateur,
        nom:           o.nom,
        type,
        data_mo:       (typeof o.data  === 'number' && o.data  > 0) ? o.data  : null,
        minutes:       (typeof o.voix  === 'number' && o.voix  > 0) ? o.voix  : null,
        sms:           (typeof o.sms   === 'number' && o.sms   > 0) ? o.sms   : null,
        validite_jours: minutesEnJours(o.validite),
        prix:          o.prix,
        image_url:     logoMap[o.operateurId] || null,
      };

      if (!forfait.prix || forfait.prix <= 0) {
        console.warn(`[ARTP] Prix nul pour "${forfait.nom}" — ignoré`);
        resultats.ignores++;
        continue;
      }

      if (dryRun) {
        console.log('[ARTP DRY]', forfait);
        resultats.inseres++;
      } else {
        await upsertForfait(forfait);
        resultats.inseres++;
      }
    }

  } catch (err) {
    console.error('[ARTP] Erreur:', err.message);
    resultats.erreurs.push(err.message);
  }

  const label = dryRun ? 'DRY-RUN' : 'RÉEL';
  console.log(`[ARTP ${label}] Terminé — scrapes: ${resultats.scrapes}, insérés: ${resultats.inseres}, ignorés: ${resultats.ignores}, erreurs: ${resultats.erreurs.length}`);
  return resultats;
}

module.exports = { scraperARTP };
