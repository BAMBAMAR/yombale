// backend/services/collecte/BaseCollector.js
// ══════════════════════════════════════════════════════════════════════════════
// ARCHITECTURE DE COLLECTE V2 — CLASSE DE BASE MODULAIRE
// Cycle de vie standardisé, traçabilité, rate-limiting, normalisation & idempotence
// ══════════════════════════════════════════════════════════════════════════════

const axios = require('axios');
const cheerio = require('cheerio');
const { pool } = require('../../models/db');
const { RunCollecte, noterRequeteCourante } = require('../../lib/scrapingRun');
const { parsePrix } = require('../../lib/prix');
const { normaliserUrlAchat } = require('../../lib/urlAchat');
const { vendeurRefOffre } = require('../../lib/vendeurRef');
const matching = require('../matching');

const UA_ROTATION = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
];

class BaseCollector {
  /**
   * @param {Object} config
   * @param {string} config.sourceId Identifiant unique (ex: 'soumari', 'decathlon')
   * @param {string} config.nom Nom public (ex: 'Soumari')
   * @param {string} config.baseUrl URL de base du site
   * @param {string} config.systeme Système métier : 'produits' | 'immo' | 'annonces'
   * @param {number} [config.delaiMs=2000] Délai de base entre requêtes HTTP
   * @param {number} [config.timeoutMs=20000] Timeout par requête
   */
  constructor(config) {
    if (!config.sourceId || !config.baseUrl) {
      throw new Error('[BaseCollector] sourceId et baseUrl sont obligatoires');
    }
    this.sourceId = config.sourceId;
    this.nom = config.nom || config.sourceId;
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.systeme = config.systeme || 'produits';
    this.delaiMs = config.delaiMs || 2000;
    this.timeoutMs = config.timeoutMs || 20000;
    this.marchandId = null;
  }

  randUA() {
    return UA_ROTATION[Math.floor(Math.random() * UA_ROTATION.length)];
  }

  async sleep(ms) {
    const jitter = Math.floor(Math.random() * 500);
    return new Promise(r => setTimeout(r, ms + jitter));
  }

  getHeaders(customHeaders = {}) {
    return {
      'User-Agent': this.randUA(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.7,en;q=0.3',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      ...customHeaders,
    };
  }

  async fetchHttp(url, { isJson = false, headers = {}, retries = 2 } = {}) {
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        const res = await axios.get(url, {
          headers: this.getHeaders(headers),
          timeout: this.timeoutMs,
          maxRedirects: 5,
          responseType: isJson ? 'json' : 'text',
        });
        noterRequeteCourante(res.status || 200);
        return {
          status: res.status,
          headers: res.headers,
          data: res.data,
          $: !isJson && typeof res.data === 'string' ? cheerio.load(res.data) : null,
        };
      } catch (err) {
        const status = err.response?.status;
        noterRequeteCourante(status || err.code || 'none');
        if (status === 404 || status === 403 || attempt > retries) {
          throw err;
        }
        const wait = status === 429 ? 15000 * attempt : 3000 * attempt;
        await this.sleep(wait);
      }
    }
  }

  async getMarchandId() {
    if (this.marchandId) return this.marchandId;
    const { rows } = await pool.query(
      'SELECT id FROM marchands WHERE unaccent(LOWER(nom)) = unaccent(LOWER($1)) OR LOWER(nom) = LOWER($1) LIMIT 1',
      [this.nom]
    );
    if (rows.length) {
      this.marchandId = rows[0].id;
      return this.marchandId;
    }
    const ins = await pool.query(
      'INSERT INTO marchands(nom, site_url, methode, actif) VALUES($1, $2, $3, true) RETURNING id',
      [this.nom, this.baseUrl, 'scraper_v2']
    );
    this.marchandId = ins.rows[0].id;
    return this.marchandId;
  }

  normaliserTitre(titre) {
    return matching.decoderHtmlEntities(titre || '')
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .slice(0, 255);
  }

  nettoyerPrix(prixTxt, { min = 500, max = 25000000 } = {}) {
    return parsePrix(prixTxt, { min, max }) || null;
  }

  /**
   * Méthode abstraite que chaque adaptateur spécialisé doit implémenter.
   * Doit retourner un itérateur ou tableau d'items normalisés.
   * @param {Object} options Options d'exécution
   * @returns {Promise<Array<Object>>}
   */
  async collecter(options = {}) {
    throw new Error(`[BaseCollector] La méthode collecter() doit être implémentée par ${this.constructor.name}`);
  }

  /**
   * Sauvegarde un lot d'offres e-commerce dans la base de données.
   * Idempotente et résistante aux crashs.
   * @param {Array<Object>} items 
   * @param {Object} [options]
   */
  async persisterOffres(items, { dryRun = false } = {}) {
    const stats = { total: items.length, inseres: 0, mis_a_jour: 0, filtres: 0, erreurs: 0, doublons: 0 };
    if (!items.length) return stats;
    if (dryRun) {
      stats.inseres = items.length;
      return stats;
    }

    const marchandId = await this.getMarchandId();
    const produitsTouches = new Set();

    for (const item of items) {
      try {
        const titre = this.normaliserTitre(item.titre);
        const prix = Number(item.prix);
        const urlAchat = normaliserUrlAchat(item.url || item.url_achat);

        if (!titre || titre.length < 3 || !prix || prix < 500 || !urlAchat || !urlAchat.startsWith('http')) {
          stats.filtres++;
          continue;
        }

        // Idempotence directe : vérification par (marchand_id, url_achat)
        const { rows: existantes } = await pool.query(
          'SELECT id, produit_id, prix FROM offres WHERE marchand_id = $1 AND url_achat = $2 LIMIT 1',
          [marchandId, urlAchat]
        );

        if (existantes.length > 0) {
          const off = existantes[0];
          const prixDiff = Number(off.prix) !== prix;

          await pool.query(
            `UPDATE offres SET
               prix = $1,
               titre_marchand = $2,
               specs = COALESCE($3::jsonb, specs),
               scraped_at = NOW(),
               stock = true,
               prix_brut = COALESCE($5, prix_brut)
             WHERE id = $4`,
            [prix, titre, item.specs ? JSON.stringify(item.specs) : null, off.id, item.prix_brut || null]
          );

          if (prixDiff) {
            await pool.query('INSERT INTO historique_prix(offre_id, prix) VALUES($1, $2)', [off.id, prix]);
          }

          produitsTouches.add(off.produit_id);
          stats.mis_a_jour++;
          continue;
        }

        // Recherche ou création du produit parent
        const correspondant = await matching.trouverProduitCorrespondant(pool, { titre, prix }, item.categorie_id || null);
        let produitId;

        if (correspondant) {
          produitId = correspondant.id;
          stats.mis_a_jour++;
        } else {
          const marque = matching.extraireMarque(titre);
          const { rows: nvo } = await pool.query(
            `INSERT INTO produits(nom, marque, categorie_id, image_url, description, nom_normalise)
             VALUES($1, $2, $3, $4, $5, $6) RETURNING id`,
            [titre, marque, item.categorie_id || null, item.image_url || null, item.description || titre, matching.normaliserTitre(titre)]
          );
          produitId = nvo[0].id;
          stats.inseres++;
        }

        const vendeurRef = vendeurRefOffre(this.nom, item, urlAchat);

        const { rows: resOffre } = await pool.query(
          `INSERT INTO offres(produit_id, marchand_id, prix, url_achat, titre_marchand, specs, scraped_at, stock, prix_brut, vendeur_ref)
           VALUES($1, $2, $3, $4, $5, $6::jsonb, NOW(), true, $7, $8)
           ON CONFLICT (produit_id, marchand_id, vendeur_ref)
           DO UPDATE SET
             url_achat = COALESCE(EXCLUDED.url_achat, offres.url_achat),
             prix = EXCLUDED.prix,
             titre_marchand = EXCLUDED.titre_marchand,
             specs = COALESCE(EXCLUDED.specs, offres.specs),
             scraped_at = NOW(),
             stock = true,
             prix_brut = COALESCE(EXCLUDED.prix_brut, offres.prix_brut)
           RETURNING id`,
          [produitId, marchandId, prix, urlAchat, titre, item.specs ? JSON.stringify(item.specs) : null, item.prix_brut || null, vendeurRef]
        );

        if (resOffre.length > 0) {
          await pool.query('INSERT INTO historique_prix(offre_id, prix) VALUES($1, $2)', [resOffre[0].id, prix]);
        }

        produitsTouches.add(produitId);
      } catch (err) {
        console.error(`[BaseCollector persister] Erreur "${item.titre}":`, err.message);
        stats.erreurs++;
      }
    }

    // Recalcul du prix min et nombre d'offres sur les produits touchés
    if (produitsTouches.size > 0) {
      const ids = [...produitsTouches];
      const batchSize = 250;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        await pool.query(`
          UPDATE produits SET
            prix_min = sub.prix_min,
            nb_offres = sub.nb_offres
          FROM (
            SELECT p.id,
              MIN(CASE WHEN o.stock AND o.quarantinee = false THEN o.prix END) AS prix_min,
              COUNT(o.id) FILTER (WHERE o.stock AND o.quarantinee = false) AS nb_offres
            FROM produits p
            LEFT JOIN offres o ON o.produit_id = p.id
            WHERE p.id = ANY($1::uuid[])
            GROUP BY p.id
          ) sub
          WHERE produits.id = sub.id
        `, [batch]);
      }
    }

    return stats;
  }

  /**
   * Exécution globale contrôlée avec traçabilité dans scraping_runs
   */
  async executer({ dryRun = false, categoriesCibles = 0 } = {}) {
    const sourceNom = this.nom || this.sourceId;
    const run = new RunCollecte({
      source: sourceNom,
      systeme: this.systeme,
      categoriesCibles,
    });

    return run.executer(async () => {
      let items = [];
      let persistStats = { inseres: 0, mis_a_jour: 0, filtres: 0, erreurs: 0, doublons: 0 };
      try {
        items = await this.collecter({ run, dryRun });
        if (this.systeme === 'produits') {
          persistStats = await this.persisterOffres(items, { dryRun });
        } else if (this.systeme === 'immo' && typeof this.persisterAnnoncesImmo === 'function') {
          persistStats = await this.persisterAnnoncesImmo(items, { dryRun });
        }
      } catch (err) {
        console.error(`[BaseCollector run] Échec fatal ${this.sourceId}:`, err.message);
      }

      if (!dryRun) {
        const cloture = await run.cloturer(pool, {
          itemsExtraits: items.length,
          itemsInseres: persistStats.inseres,
          itemsMaj: persistStats.mis_a_jour,
          itemsFiltres: persistStats.filtres,
          itemsDoublons: persistStats.doublons,
          erreursSauvegarde: persistStats.erreurs,
        });

        // Mise à jour propre de derniere_sync si non en échec et items extraits
        if (cloture.statut !== 'echec' && items.length > 0 && this.systeme === 'produits') {
          try {
            const mId = await this.getMarchandId();
            if (mId) {
              await pool.query('UPDATE marchands SET derniere_sync = NOW() WHERE id = $1', [mId]);
            }
          } catch (e) {
            console.warn('[BaseCollector] Mise à jour derniere_sync ignorée:', e.message);
          }
        }

        return {
          source: sourceNom,
          statut: cloture.statut,
          motifs: cloture.motifs,
          extraits: items.length,
          stats: persistStats,
        };
      }

      return {
        source: this.sourceId,
        statut: 'dryRun',
        extraits: items.length,
        stats: persistStats,
      };
    });
  }
}

module.exports = BaseCollector;
