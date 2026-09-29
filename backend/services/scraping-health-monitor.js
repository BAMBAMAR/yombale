// backend/services/scraping-health-monitor.js
// Moniteur quotidien de santé et d'intégrité du scraping Nopalou

const { pool } = require('../models/db');
let adminAlerts = null;
try { adminAlerts = require('./admin-alerts'); } catch (_) {}

async function verifierSanteScraping() {
  const anomalies = [];
  const rapport = {
    timestamp: new Date().toISOString(),
    ecommerce: {},
    immo: {},
    classifiees: {},
    statut_global: 'SAIN'
  };

  try {
    // 1. Contrôle Marchands E-commerce actifs sans mise à jour depuis > 48h
    const { rows: staleMarchands } = await pool.query(`
      SELECT m.nom, MAX(o.scraped_at) as dernier_scrape,
             COUNT(o.id) as total_offres,
             COUNT(o.id) FILTER (WHERE o.stock = true) as offres_en_stock
      FROM marchands m
      JOIN offres o ON o.marchand_id = m.id
      WHERE m.actif = true
      GROUP BY m.id, m.nom
      HAVING MAX(o.scraped_at) < NOW() - INTERVAL '48 hours'
    `);
    rapport.ecommerce.marchands_en_retard = staleMarchands;
    if (staleMarchands.length > 0) {
      anomalies.push(`${staleMarchands.length} marchand(s) actif(s) non synchronisé(s) depuis > 48h : ${staleMarchands.map(m => m.nom).join(', ')}`);
    }

    // 2. Contrôle Offres avec prix nuls ou en anomalie
    const { rows: [prixAnormaux] } = await pool.query(`
      SELECT COUNT(*) as nb
      FROM offres
      WHERE stock = true AND (prix IS NULL OR prix <= 0 OR prix < 100)
    `);
    rapport.ecommerce.offres_prix_invalide = parseInt(prixAnormaux.nb);
    if (parseInt(prixAnormaux.nb) > 0) {
      anomalies.push(`${prixAnormaux.nb} offre(s) active(s) avec un prix nul ou suspect (< 100 FCFA)`);
    }

    // 3. Contrôle Annonces Immo Actives corrompues (sans téléphone ou prix aberrant)
    const { rows: [immoCorrompu] } = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE contact_tel IS NULL OR length(regexp_replace(contact_tel, '[^0-9]', '', 'g')) < 9) as sans_tel,
        COUNT(*) FILTER (WHERE transaction = 'vente' AND prix < 1000000) as fausses_ventes,
        COUNT(*) FILTER (WHERE transaction = 'location' AND prix > 10000000) as faux_loyers,
        COUNT(*) FILTER (WHERE titre ~ '^[A-ZÀÂÉÈÊÙÏÎ][a-zA-ZÀ-ÿ-]+(\\s+[A-ZÀÂÉÈÊÙÏÎ][a-zA-ZÀ-ÿ-]+){1,2}$') as faux_titres_personnes
      FROM annonces_immo
      WHERE actif = true AND (supprimee IS NULL OR supprimee = false) AND (rejete IS NULL OR rejete = false)
    `);
    rapport.immo.anomalies_actives = immoCorrompu;
    if (parseInt(immoCorrompu.sans_tel) > 0 || parseInt(immoCorrompu.fausses_ventes) > 0 || parseInt(immoCorrompu.faux_titres_personnes) > 0) {
      anomalies.push(`Annonces Immo Actives polluées : ${immoCorrompu.sans_tel} sans tél, ${immoCorrompu.fausses_ventes} fausses ventes (<1M F), ${immoCorrompu.faux_titres_personnes} faux titres noms propres`);
    }

    // 4. Contrôle Images Facebook expirées (fbcdn)
    const { rows: [fbcdnImages] } = await pool.query(`
      SELECT 
        (SELECT count(*) FROM annonces_immo WHERE actif = true AND photos::text LIKE '%fbcdn.net%') +
        (SELECT count(*) FROM annonces_classifiees WHERE actif = true AND photos::text LIKE '%fbcdn.net%') as nb_fbcdn
    `);
    rapport.classifiees.images_fbcdn_ephemeres = parseInt(fbcdnImages.nb_fbcdn);
    if (parseInt(fbcdnImages.nb_fbcdn) > 0) {
      anomalies.push(`${fbcdnImages.nb_fbcdn} annonce(s) avec des images non pérennes fbcdn.net`);
    }

    // 5. Bilan global
    if (anomalies.length > 0) {
      rapport.statut_global = 'ANOMALIES_DETECTEES';
      rapport.anomalies = anomalies;
      console.warn(`[HEALTH MONITOR] ⚠️ ${anomalies.length} anomalie(s) détectée(s) :`);
      anomalies.forEach(a => console.warn(`  - ${a}`));

      if (adminAlerts && typeof adminAlerts.envoyerAlerteAdmin === 'function') {
        adminAlerts.envoyerAlerteAdmin('ALERTE SCRAPING NOPALOU', anomalies.join('\n'));
      }
    } else {
      console.log('[HEALTH MONITOR] ✅ Pipeline de scraping et données 100% sains.');
    }

    return rapport;
  } catch (err) {
    console.error('[HEALTH MONITOR] Erreur lors du contrôle de santé :', err.message);
    rapport.statut_global = 'ERREUR_EXECUTION';
    rapport.erreur = err.message;
    return rapport;
  }
}

if (require.main === module) {
  verifierSanteScraping().then(r => {
    console.log(JSON.stringify(r, null, 2));
    process.exit(0);
  });
}

module.exports = { verifierSanteScraping };
