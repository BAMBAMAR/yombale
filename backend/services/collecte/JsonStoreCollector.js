// backend/services/collecte/JsonStoreCollector.js
// ══════════════════════════════════════════════════════════════════════════════
// ARCHITECTURE DE COLLECTE V2 — ADAPTATEUR WOOCOMMERCE STORE API
// Collecte directe JSON, détection dynamique X-WP-Total, streaming par lots
// ══════════════════════════════════════════════════════════════════════════════

const BaseCollector = require('./BaseCollector');

class JsonStoreCollector extends BaseCollector {
  /**
   * @param {Object} config
   * @param {number} [config.perPage=100] Nombre d'articles par page demandés
   * @param {number} [config.maxPagesMax=100] Garde-fou sécurité max
   */
  constructor(config) {
    super({ ...config, systeme: 'produits' });
    this.perPage = config.perPage || 100;
    this.maxPagesMax = config.maxPages || config.maxPagesMax || 100;
  }

  async collecter({ run = null, dryRun = false, onBatch = null } = {}) {
    const resultats = [];
    let page = 1;
    let totalPagesConnu = null;
    let totalItemsConnu = null;

    console.log(`[JsonStoreCollector] Début collecte ${this.nom} (${this.baseUrl})`);

    while (page <= this.maxPagesMax) {
      const url = `${this.baseUrl}/wp-json/wc/store/v1/products?per_page=${this.perPage}&page=${page}&status=publish`;
      try {
        const { status, headers, data } = await this.fetchHttp(url, {
          isJson: true,
          headers: { 'Accept': 'application/json' },
        });

        if (headers['x-wp-totalpages']) {
          totalPagesConnu = parseInt(headers['x-wp-totalpages'], 10);
        }
        if (headers['x-wp-total']) {
          totalItemsConnu = parseInt(headers['x-wp-total'], 10);
        }

        if (!Array.isArray(data) || data.length === 0) {
          console.log(`[JsonStoreCollector] ${this.nom} p${page} : fin de pagination (tableau vide)`);
          break;
        }

        const itemsPage = [];
        for (const p of data) {
          const titre = this.normaliserTitre(p.name || '');
          const currCode = (p.prices?.currency_code || '').toUpperCase();
          const isFCFA = currCode === 'XOF' || currCode === 'FCFA' || currCode === 'CFA' || currCode === '';
          const rawUnit = isFCFA ? 0 : parseInt(p.prices?.currency_minor_unit ?? '0', 10);
          const prixRaw = parseInt(p.prices?.price || p.prices?.sale_price || '0', 10);
          const prix = rawUnit > 0 ? Math.round(prixRaw / Math.pow(10, rawUnit)) : prixRaw;

          const img = p.images?.[0]?.src || null;
          const permalink = p.permalink || `${this.baseUrl}/?p=${p.id}`;

          if (titre.length > 3 && prix >= 500) {
            itemsPage.push({
              titre,
              prix,
              url: permalink,
              image_url: img,
              description: p.short_description || p.description || titre,
              prix_brut: `${p.prices?.price ?? ''} ${currCode || 'XOF'}`.trim(),
              source: this.sourceId,
            });
          }
        }

        console.log(`[JsonStoreCollector] ${this.nom} p${page}/${totalPagesConnu || '?'}: ${itemsPage.length} items (Total catalogue: ${totalItemsConnu || '?'})`);

        // Si streaming activé, persister immédiatement par page pour économiser la mémoire
        if (onBatch && itemsPage.length > 0) {
          await onBatch(itemsPage);
        } else {
          resultats.push(...itemsPage);
        }

        if (totalPagesConnu && page >= totalPagesConnu) {
          console.log(`[JsonStoreCollector] ${this.nom} : Dernière page atteinte (${page}/${totalPagesConnu})`);
          break;
        }

        page++;
        await this.sleep(this.delaiMs);
      } catch (err) {
        const code = err.response?.status;
        if (code === 400 || code === 404) {
          console.log(`[JsonStoreCollector] ${this.nom} p${page} : Fin de liste (${code})`);
        } else {
          console.warn(`[JsonStoreCollector] ${this.nom} p${page} : Erreur ${code || err.code || err.message}`);
        }
        break;
      }
    }

    if (run) {
      run.noterCategorie('catalogue_global', resultats.length);
    }

    console.log(`[JsonStoreCollector] Fin collecte ${this.nom} — Total extrait: ${resultats.length}`);
    return resultats;
  }
}

module.exports = JsonStoreCollector;
