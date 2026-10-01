// backend/lib/scrapingRun.js : AUD-173. Définit ce qu'est un passage de collecte réussi, et le persiste.
// Un passage n'est jamais « ok » parce qu'il n'a pas planté : il l'est s'il a lu assez de pages, sans trop d'erreurs
// HTTP, et rapporté un volume cohérent avec les passages précédents de la même source.
// Désactivable pour retour arrière : SCRAPING_STATUTS_STRICTS=false (ancien comportement : derniere_sync toujours mise à jour).
const { AsyncLocalStorage } = require('async_hooks');

const stockage = new AsyncLocalStorage();

// Seuils initiaux, à calibrer sur deux semaines de mesures réelles (plan AUD-173).
const SEUILS = {
  couvertureMin: 0.9,      // part des catégories lues avec des articles
  erreurHttpMax: 0.1,      // part des requêtes en erreur (403, 429, 5xx, réseau ; un 404 est une fin de pagination)
  volumeRelatifMin: 0.5,   // articles extraits / médiane des derniers passages « ok » de la source
  historique: 7,           // nombre de passages « ok » servant au calcul de la médiane
};

const strict = () => process.env.SCRAPING_STATUTS_STRICTS !== 'false';

function estErreurHttp(statut) {
  if (statut === 404 || statut === '404') return false;
  if (typeof statut === 'number') return statut >= 400;
  return true; // absence de statut (délai dépassé, réseau coupé, DNS) : une erreur à analyser, jamais un succès
}

function mediane(valeurs) {
  const v = valeurs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

// Fonction pure : statut d'un passage à partir de ses mesures.
function evaluerStatut({ categoriesCibles, categoriesAvecArticles, requetes, itemsExtraits, medianeItems }) {
  const motifs = [];
  if (!itemsExtraits) return { statut: 'echec', motifs: ['aucun_article'] };
  if (categoriesCibles > 0 && categoriesAvecArticles / categoriesCibles < SEUILS.couvertureMin) {
    motifs.push(`couverture_${categoriesAvecArticles}_sur_${categoriesCibles}`);
  }
  if (requetes.total > 0 && requetes.erreurs / requetes.total > SEUILS.erreurHttpMax) {
    motifs.push(`erreurs_http_${requetes.erreurs}_sur_${requetes.total}`);
  }
  if (medianeItems && itemsExtraits < medianeItems * SEUILS.volumeRelatifMin) {
    motifs.push(`volume_${itemsExtraits}_pour_mediane_${Math.round(medianeItems)}`);
  }
  return { statut: motifs.length ? 'degrade' : 'ok', motifs };
}

class RunCollecte {
  constructor({ source, systeme = 'produits', categoriesCibles = 0 }) {
    this.source = source;
    this.systeme = systeme;
    this.categoriesCibles = categoriesCibles;
    this.debut = new Date();
    this.codes = {};
    this.requetes = { total: 0, erreurs: 0 };
    this.categories = [];
  }

  noterRequete(statut) {
    const cle = String(statut === undefined || statut === null ? 'none' : statut);
    this.codes[cle] = (this.codes[cle] || 0) + 1;
    this.requetes.total++;
    if (estErreurHttp(statut === undefined || statut === null ? 'none' : statut)) this.requetes.erreurs++;
  }

  // Une page HTTP 200 sans aucun article n'est pas une page réussie : la catégorie est « vide ».
  noterCategorie(nom, nbArticles) {
    this.categories.push({ nom, articles: nbArticles });
  }

  // Exécute `fn` en rattachant à ce passage toutes les requêtes HTTP qu'elle déclenche.
  executer(fn) { return stockage.run(this, fn); }

  async cloturer(pool, { itemsExtraits, itemsInseres = 0, itemsMaj = 0, itemsFiltres = 0, erreursSauvegarde = 0 }) {
    let medianeItems = null;
    try {
      const { rows } = await pool.query(
        `SELECT items_extraits FROM scraping_runs WHERE source = $1 AND systeme = $2 AND statut = 'ok'
         ORDER BY started_at DESC LIMIT $3`, [this.source, this.systeme, SEUILS.historique]);
      medianeItems = mediane(rows.map((r) => Number(r.items_extraits)));
    } catch (e) { /* table absente ou base indisponible : pas de comparaison de volume */ }

    const avecArticles = this.categories.filter((c) => c.articles > 0).length;
    const { statut, motifs } = evaluerStatut({
      categoriesCibles: this.categoriesCibles, categoriesAvecArticles: avecArticles,
      requetes: this.requetes, itemsExtraits, medianeItems,
    });
    const resultat = { statut, motifs, medianeItems, codes: this.codes };

    try {
      await pool.query(
        `INSERT INTO scraping_runs (source, systeme, started_at, ended_at, pages_cibles, pages_ok, pages_erreur, http_codes,
           items_extraits, items_inseres, items_maj, items_filtres, couverture, duree_ms, statut, erreur_msg)
         VALUES ($1,$2,$3,NOW(),$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [this.source, this.systeme, this.debut, this.categoriesCibles, avecArticles,
          this.categories.length - avecArticles, JSON.stringify(this.codes),
          itemsExtraits, itemsInseres, itemsMaj, itemsFiltres,
          this.categoriesCibles ? Math.round((avecArticles / this.categoriesCibles) * 10000) / 100 : null,
          Date.now() - this.debut.getTime(), statut,
          [...motifs, erreursSauvegarde ? `erreurs_sauvegarde_${erreursSauvegarde}` : null].filter(Boolean).join(',') || null]);
    } catch (e) { console.warn('[SCRAPING_RUN WARN]', e.message); }

    if (statut === 'echec') await this._alerterSiRepete(pool);
    return resultat;
  }

  // Deux passages « echec » consécutifs de la même source : alerte administrateur (au plus une toutes les 6 h).
  async _alerterSiRepete(pool) {
    try {
      const { rows } = await pool.query(
        `SELECT statut FROM scraping_runs WHERE source = $1 AND systeme = $2 ORDER BY started_at DESC LIMIT 2`,
        [this.source, this.systeme]);
      if (rows.length === 2 && rows.every((r) => r.statut === 'echec')) {
        const { alerterAdmin } = require('../services/admin-alerts');
        await alerterAdmin({
          type: `scraping_echec_${this.source}`, priorite: 'ATTENTION',
          titre: `Collecte sans donnée : ${this.source}`,
          message: `Deux passages consécutifs de ${this.source} n'ont rapporté aucun article (codes HTTP : ${JSON.stringify(this.codes)}).`,
          cooldownMs: 6 * 3600 * 1000,
        });
      }
    } catch (e) { console.warn('[SCRAPING_RUN ALERTE]', e.message); }
  }
}

// À appeler depuis la couche HTTP des scrapers : rattache le code de réponse au passage en cours, s'il y en a un.
function noterRequeteCourante(statut) {
  const run = stockage.getStore();
  if (run) run.noterRequete(statut);
}

module.exports = { RunCollecte, evaluerStatut, noterRequeteCourante, estErreurHttp, mediane, SEUILS, strict };
