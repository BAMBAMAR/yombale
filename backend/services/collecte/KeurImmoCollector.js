// backend/services/collecte/KeurImmoCollector.js
// ══════════════════════════════════════════════════════════════════════════════
// ARCHITECTURE DE COLLECTE V2 — ADAPTATEUR IMMOBILIER KEUR-IMMO
// Extraction annonces vérifiées, mandats agences, WhatsApp direct et photos HD
// ══════════════════════════════════════════════════════════════════════════════

const BaseCollector = require('./BaseCollector');
const { pool } = require('../../models/db');
const { parsePrix } = require('../../lib/prix');

const SECTIONS_KEUR_IMMO = [
  { transaction: 'vente',    path: '/senegal/immobilier-a-vendre-senegal/' },
  { transaction: 'location', path: '/senegal/immobilier-a-louer-senegal/' },
];

class KeurImmoCollector extends BaseCollector {
  constructor(config = {}) {
    super({
      sourceId: 'keur_immo',
      nom: 'Keur-Immo',
      baseUrl: 'https://keur-immo.com',
      systeme: 'immo',
      delaiMs: 2000,
      timeoutMs: 25000,
      ...config,
    });
    this.maxPagesParSection = config.maxPages || config.maxPagesParSection || 5;
    this.enrichirDetails = config.enrichirDetails !== false; // Active par défaut
  }

  detecterTypeBien(titre, url = '') {
    const t = `${titre} ${url}`.toLowerCase();
    if (t.includes('villa')) return 'villa';
    if (t.includes('terrain') || t.includes('parcelle')) return 'terrain';
    if (t.includes('appartement meuble') || t.includes('meubl')) return 'appartement_meuble';
    if (t.includes('appartement')) return 'appartement';
    if (t.includes('studio')) return 'studio';
    if (t.includes('chambre')) return 'chambre';
    if (t.includes('immeuble')) return 'immeuble';
    if (t.includes('bureau') || t.includes('commercial')) return 'bureau';
    return 'appartement';
  }

  detecterVilleEtQuartier(titre, locTxt = '') {
    const brut = `${titre} ${locTxt}`.trim();
    const VILLES = ['Dakar', 'Saly', 'Somone', 'Mbour', 'Ngaparou', 'Thiès', 'Saint-Louis', 'Touba', 'Ziguinchor'];
    let ville = 'Dakar';
    for (const v of VILLES) {
      if (new RegExp(`\\b${v}\\b`, 'i').test(brut)) {
        ville = v;
        break;
      }
    }
    // Quartier : premier mot avant les deux-points dans le titre ou localisation
    let quartier = null;
    const matchPrefix = titre.match(/^([A-Za-zÀ-ÿ\s-]+)\s*:/);
    if (matchPrefix) {
      quartier = matchPrefix[1].trim();
    }
    return { ville, quartier };
  }

  async extraireDetailAnnonce(url) {
    try {
      const { $ } = await this.fetchHttp(url);
      if (!$) return null;

      // Téléphone ou WhatsApp
      let phone = null;
      const telHref = $('a[href^="tel:"]').first().attr('href');
      if (telHref) {
        phone = telHref.replace(/^tel:/, '').trim();
      } else {
        const waHref = $('a[href*="wa.me"], a[href*="whatsapp"]').first().attr('href');
        if (waHref) {
          const m = waHref.match(/(?:\+|phone=)(\d{9,15})/);
          if (m) phone = '+' + m[1];
        }
      }

      // Agence
      const agence = $('[class*="agent"], [class*="agency"], .property-agent').first().text().trim().replace(/\s+/g, ' ') || null;

      // Photos HD
      const photos = [];
      $('img').each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && src.includes('uploads') && !src.includes('logo') && !photos.includes(src)) {
          photos.push(src);
        }
      });

      // Description
      const description = $('.property-description, .entry-content, [class*="description"]')
        .first()
        .text()
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, 1000) || null;

      return {
        contact_tel: phone,
        contact_nom: agence ? agence.slice(0, 80) : null,
        photos,
        description,
      };
    } catch (e) {
      return null;
    }
  }

  async collecter({ run = null, dryRun = false } = {}) {
    const resultats = [];
    const vusUrls = new Set();

    console.log(`[KeurImmoCollector] Début collecte Keur-Immo (${SECTIONS_KEUR_IMMO.length} sections)`);

    for (const sec of SECTIONS_KEUR_IMMO) {
      let articlesSection = 0;
      for (let page = 1; page <= this.maxPagesParSection; page++) {
        const pageUrl = page === 1
          ? `${this.baseUrl}${sec.path}`
          : `${this.baseUrl}${sec.path}page/${page}/`;

        try {
          const { $, status } = await this.fetchHttp(pageUrl);
          if (!$) break;

          const cards = $('article, .property-card, div:has(> a[href*="/annonce-immobiliere-senegal/"])');
          const liensAnnonces = new Map();

          $('a[href*="/annonce-immobiliere-senegal/"]').each((_, el) => {
            const href = $(el).attr('href');
            if (!href || vusUrls.has(href)) return;
            const container = $(el).closest('article, .property-card, .col, div');
            const titre = $(el).text().trim() || container.find('h2, h3').text().trim();
            const prixTxt = container.find('[class*="price"]').text().trim();
            if (titre && href) {
              liensAnnonces.set(href, { titre, prixTxt, href });
            }
          });

          if (liensAnnonces.size === 0) {
            console.log(`[KeurImmoCollector] ${sec.transaction} p${page} : Fin (0 nouvelle annonce)`);
            break;
          }

          let itemsPage = 0;
          for (const [href, data] of liensAnnonces.entries()) {
            vusUrls.add(href);
            const titre = this.normaliserTitre(data.titre);
            const prix = parsePrix(data.prixTxt, { min: 15000 });
            const typeBien = this.detecterTypeBien(titre, href);
            const { ville, quartier } = this.detecterVilleEtQuartier(titre);

            let details = { contact_tel: null, contact_nom: null, photos: [], description: null };
            if (this.enrichirDetails) {
              await this.sleep(1000);
              const extra = await this.extraireDetailAnnonce(href);
              if (extra) details = extra;
            }

            // Génération de la référence externe unique
            const refM = href.match(/annonce-immobiliere-senegal\/([^/]+)/);
            const refExterne = refM ? `keur-${refM[1]}` : `keur-${Buffer.from(href).toString('base64').slice(0, 16)}`;

            const annonce = {
              titre,
              type_bien: typeBien,
              transaction: sec.transaction,
              prix: prix || null,
              ville,
              quartier,
              description: details.description || titre,
              photos: details.photos,
              url_source: href,
              source: 'keur_immo',
              ref_externe: refExterne,
              contact_nom: details.contact_nom,
              contact_tel: details.contact_tel,
              meuble: typeBien.includes('meuble'),
            };

            resultats.push(annonce);
            itemsPage++;
            articlesSection++;
          }

          console.log(`[KeurImmoCollector] ${sec.transaction} p${page} : ${itemsPage} annonces extraites (total: ${articlesSection})`);
          await this.sleep(this.delaiMs);
        } catch (err) {
          const code = err.response?.status;
          console.warn(`[KeurImmoCollector] ${sec.transaction} p${page} : Erreur ${code || err.code || err.message}`);
          break;
        }
      }

      if (run) {
        run.noterCategorie(sec.transaction, articlesSection);
      }
      await this.sleep(this.delaiMs);
    }

    console.log(`[KeurImmoCollector] Fin collecte Keur-Immo — Total extrait: ${resultats.length}`);
    return resultats;
  }

  /**
   * Persistance spécialisée pour les annonces immobilières
   */
  async persisterAnnoncesImmo(annonces, { dryRun = false } = {}) {
    const stats = { total: annonces.length, inseres: 0, mis_a_jour: 0, actifs: 0, erreurs: 0 };
    if (!annonces.length || dryRun) return stats;

    for (const a of annonces) {
      try {
        const isActif = Boolean(a.contact_tel && a.contact_tel.length >= 7 && a.prix && a.prix >= 10000);
        const motifRejet = !isActif ? 'a_completer' : null;

        const res = await pool.query(`
          INSERT INTO annonces_immo
            (titre, type_bien, transaction, prix, ville, quartier, description,
             photos, url_source, source, ref_externe, meuble, contact_nom, contact_tel,
             actif, rejete, motif_rejet, created_at, updated_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW(),NOW())
          ON CONFLICT (source, ref_externe) WHERE ref_externe IS NOT NULL
          DO UPDATE SET
            titre = EXCLUDED.titre,
            prix = COALESCE(EXCLUDED.prix, annonces_immo.prix),
            photos = CASE WHEN jsonb_array_length(EXCLUDED.photos) > 0 THEN EXCLUDED.photos ELSE annonces_immo.photos END,
            description = COALESCE(EXCLUDED.description, annonces_immo.description),
            contact_nom = COALESCE(EXCLUDED.contact_nom, annonces_immo.contact_nom),
            contact_tel = COALESCE(EXCLUDED.contact_tel, annonces_immo.contact_tel),
            actif = CASE WHEN EXCLUDED.actif THEN true ELSE annonces_immo.actif END,
            rejete = CASE WHEN EXCLUDED.actif THEN false ELSE annonces_immo.rejete END,
            motif_rejet = CASE WHEN EXCLUDED.actif THEN NULL ELSE annonces_immo.motif_rejet END,
            updated_at = NOW()
          RETURNING id, (xmax = 0) AS est_insertion
        `, [
          a.titre, a.type_bien, a.transaction, a.prix, a.ville, a.quartier,
          a.description, JSON.stringify(a.photos || []), a.url_source, a.source,
          a.ref_externe, a.meuble, a.contact_nom, a.contact_tel,
          isActif, !isActif, motifRejet
        ]);

        if (res.rows[0]?.est_insertion) {
          stats.inseres++;
        } else {
          stats.mis_a_jour++;
        }
        if (isActif) stats.actifs++;
      } catch (err) {
        console.error(`[KeurImmo persister] Erreur "${a.titre}":`, err.message);
        stats.erreurs++;
      }
    }

    return stats;
  }
}

module.exports = KeurImmoCollector;
