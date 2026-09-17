// scripts/enrich-immo-contacts.js
// Rétro-enrichit les annonces immobilières scrapées (CoinAfrique & Expat-Dakar)
// avec leur numéro de téléphone direct, nom de vendeur et nettoyage du quartier.
//
// Usage:
//   node scripts/enrich-immo-contacts.js --limit 50
//   node scripts/enrich-immo-contacts.js --id <uuid>
//   node scripts/enrich-immo-contacts.js --all

require('dotenv').config();
const { pool } = require('../backend/models/db');
const { extraireContactDetail: extractCoin, parseLocalisation: parseLocCoin } = require('../backend/services/scraper-immo-coinafrique');
const { extraireContactDetail: extractExpat } = require('../backend/services/scraper-immo-expat');

const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const limitVal = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 30;
const idIdx = args.indexOf('--id');
const idVal = idIdx !== -1 ? args[idIdx + 1] : null;
const isAll = args.includes('--all');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function enrichirContacts() {
  console.log('=== DÉMARRAGE ENRICHISSEMENT CONTACTS IMMO SCRAPÉS ===');

  let query = '';
  let params = [];

  if (idVal) {
    query = `
      SELECT id, titre, source, url_source, quartier, ville, contact_tel, contact_nom
      FROM annonces_immo
      WHERE id = $1
    `;
    params = [idVal];
  } else {
    query = `
      SELECT id, titre, source, url_source, quartier, ville, contact_tel, contact_nom
      FROM annonces_immo
      WHERE source IN ('coinafrique', 'expat-dakar')
        AND (actif IS NULL OR actif = true)
        AND (supprimee IS NULL OR supprimee = false)
        AND url_source IS NOT NULL
        AND (contact_tel IS NULL OR quartier ILIKE '%cfa%' OR quartier ~ '^\\d+$')
      ORDER BY created_at DESC
      ${isAll ? '' : 'LIMIT $1'}
    `;
    if (!isAll) params = [limitVal];
  }

  const { rows } = await pool.query(query, params);
  console.log(`[ENRICH-IMMO] ${rows.length} annonce(s) à traiter.`);

  let misAJour = 0;
  let sansNumero = 0;
  let erreurs = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const prefix = `[${i + 1}/${rows.length}]`;

    try {
      let detail = { contact_tel: null, contact_nom: null, description: null };
      try {
        if (row.source === 'coinafrique' || row.url_source.includes('coinafrique')) {
          detail = await extractCoin(row.url_source);
        } else if (row.source === 'expat-dakar' || row.url_source.includes('expat-dakar')) {
          detail = await extractExpat(row.url_source);
        }
      } catch (fErr) {
        if (fErr.response?.status === 404) {
          await pool.query('UPDATE annonces_immo SET actif = false, updated_at = NOW() WHERE id = $1', [row.id]);
          console.log(`${prefix} 🗑️ Annonce 404 sur source originale -> désactivée (actif = false)`);
          continue;
        }
      }

      // Nettoyage ou détection quartier si absent ou corrompu par un prix (ex: "200 000CFA")
      let cleanQuartier = row.quartier;
      if (!cleanQuartier || /cfa/i.test(cleanQuartier) || /^\d[\d\s]*$/.test(cleanQuartier)) {
        cleanQuartier = null;
        // On essaie d'extraire depuis le titre
        const QUARTIERS = [
          { pattern: /sacr[eé][\s-]c[oœe]ur/i, name: 'Sacré-Cœur' },
          { pattern: /almadies/i, name: 'Almadies' },
          { pattern: /mermoz/i, name: 'Mermoz' },
          { pattern: /ouakam/i, name: 'Ouakam' },
          { pattern: /ngor/i, name: 'Ngor' },
          { pattern: /fann/i, name: 'Fann' },
          { pattern: /point[\s-]e/i, name: 'Point E' },
          { pattern: /plateau/i, name: 'Plateau' },
          { pattern: /yoff/i, name: 'Yoff' },
          { pattern: /mamelles/i, name: 'Mamelles' },
          { pattern: /libert[eé][\s-]?\d/i, name: 'Liberté' },
          { pattern: /nord[\s-]foire/i, name: 'Nord Foire' },
          { pattern: /grand[\s-]yoff/i, name: 'Grand Yoff' },
          { pattern: /maristes/i, name: 'Maristes' },
          { pattern: /hann/i, name: 'Hann Maristes' },
          { pattern: /virage/i, name: 'Virage' },
        ];
        for (const q of QUARTIERS) {
          if (q.pattern.test(row.titre)) {
            cleanQuartier = q.name;
            break;
          }
        }
      }

      const updates = [];
      const updateParams = [];

      if (detail.contact_tel) {
        updateParams.push(detail.contact_tel);
        updates.push(`contact_tel = $${updateParams.length}`);
      }
      if (detail.contact_nom) {
        updateParams.push(detail.contact_nom);
        updates.push(`contact_nom = $${updateParams.length}`);
      }
      if (detail.description) {
        updateParams.push(detail.description);
        updates.push(`description = COALESCE(description, $${updateParams.length})`);
      }
      if (cleanQuartier !== row.quartier) {
        updateParams.push(cleanQuartier);
        updates.push(`quartier = $${updateParams.length}`);
      }

      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        updateParams.push(row.id);
        const qUpdate = `
          UPDATE annonces_immo
          SET ${updates.join(', ')}
          WHERE id = $${updateParams.length}
        `;
        await pool.query(qUpdate, updateParams);
        misAJour++;
        console.log(`${prefix} ✅ ${row.titre.slice(0, 40)}... -> Tel: ${detail.contact_tel || '(aucun)'} | Vendeur: ${detail.contact_nom || '(aucun)'} | Quartier: ${cleanQuartier || 'N/A'}`);
      } else {
        sansNumero++;
        console.log(`${prefix} ⚠️ ${row.titre.slice(0, 40)}... -> Aucun contact extrait`);
      }

      // Petite pause pour respecter les serveurs sources
      await sleep(1000);
    } catch (err) {
      erreurs++;
      console.error(`${prefix} ❌ Erreur sur ${row.id} (${row.url_source}): ${err.message}`);
    }
  }

  console.log(`\n=== BILAN ENRICHISSEMENT ===`);
  console.log(`Total traités : ${rows.length}`);
  console.log(`Mis à jour     : ${misAJour}`);
  console.log(`Sans contact   : ${sansNumero}`);
  console.log(`Erreurs        : ${erreurs}`);

  process.exit(0);
}

enrichirContacts().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
