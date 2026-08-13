require('dotenv').config();
const { pool } = require('../backend/models/db');

async function fullAudit() {
  console.log("=== AUDIT COMPLET DE LA QUALITÉ DU SCRAPING (NOPALOU) ===\n");
  
  try {
    // 1. Audit ANNONCES_CLASSIFIEES
    const totalAnnonces = await pool.query("SELECT COUNT(*) FROM annonces_classifiees");
    const countAnnonces = parseInt(totalAnnonces.rows[0].count);

    // Titres parasites Facebook UI / URL / Whatsapp / Numéro seul / Troncatures / "Voir la traduction" / "Envoyer un message"
    const titlesUiFb = await pool.query(`
      SELECT COUNT(*) 
      FROM annonces_classifiees 
      WHERE titre ~* '(envoyer un message|en voir plus|voir la traduction|cliquer|whatsapp|indicateur de statut|soumettre|recherche|voir les commentaires|partager)'
    `);

    const titlesShortOrNumeric = await pool.query(`
      SELECT COUNT(*)
      FROM annonces_classifiees
      WHERE titre IS NULL 
         OR LENGTH(TRIM(titre)) < 6
         OR titre ~* '^[0-9\\s\\+\\.\\-\\/]{1,15}$'
         OR titre ~* '^(annonce|non spécifié|undefined|null|photo|image)$'
    `);

    const titlesPlusUrl = await pool.query(`
      SELECT COUNT(*)
      FROM annonces_classifiees
      WHERE titre LIKE '%+%' OR titre ~* 'https?:\\/\\/'
    `);

    const unicodeFbNoise = await pool.query(`
      SELECT COUNT(*)
      FROM annonces_classifiees
      WHERE titre ~ '[\\u0300-\\u036F\\u0370-\\u03FF\\u00AD]' OR description ~ '[\\u0300-\\u036F\\u0370-\\u03FF\\u00AD]'
    `);

    const prixNullOrZero = await pool.query(`
      SELECT COUNT(*)
      FROM annonces_classifiees
      WHERE prix IS NULL OR prix <= 0
    `);

    const prixAberrants = await pool.query(`
      SELECT COUNT(*)
      FROM annonces_classifiees
      WHERE prix > 0 AND (prix < 100 OR prix > 500000000)
    `);

    const sansPhotos = await pool.query(`
      SELECT COUNT(*)
      FROM annonces_classifiees
      WHERE photos IS NULL OR photos::text = '[]' OR photos::text = 'null'
    `);

    // Doublons exacts (titre + source)
    const doublons = await pool.query(`
      SELECT COUNT(*) FROM (
        SELECT titre, source, COUNT(*) 
        FROM annonces_classifiees 
        GROUP BY titre, source 
        HAVING COUNT(*) > 1
      ) d
    `);

    // 2. Audit OFFRES E-COMMERCE
    const totalOffres = await pool.query("SELECT COUNT(*) FROM offres");
    const countOffres = parseInt(totalOffres.rows[0].count);

    const offresPrixZero = await pool.query(`
      SELECT COUNT(*) FROM offres WHERE prix IS NULL OR prix <= 0
    `);

    const offresPrixBassesSuspectes = await pool.query(`
      SELECT COUNT(*) 
      FROM offres o
      JOIN produits p ON o.produit_id = p.id
      WHERE o.prix > 0 AND o.prix < 500 
        AND p.nom ~* '(iphone|samsung|télévision|tv|laptop|frigo|climatiseur|ordinateur|macbook)'
    `);

    // Synthèse
    console.log("=== SYNTHÈSE STATISTIQUE DE L'AUDIT ===");
    console.table([
      { Métrique: 'Total Annonces Classifiées BDD', Valeur: countAnnonces, Pct: '100%' },
      { Métrique: 'Annonces avec Titre Parasite UI FB (Envoyer un message, Voir traduction...)', Valeur: parseInt(titlesUiFb.rows[0].count), Pct: `${Math.round(titlesUiFb.rows[0].count/countAnnonces*100)}%` },
      { Métrique: 'Annonces avec Titre Court / Pur Numérique / Invalide', Valeur: parseInt(titlesShortOrNumeric.rows[0].count), Pct: `${Math.round(titlesShortOrNumeric.rows[0].count/countAnnonces*100)}%` },
      { Métrique: 'Annonces avec URL brute ou caractéristiques "+" non décodées', Valeur: parseInt(titlesPlusUrl.rows[0].count), Pct: `${Math.round(titlesPlusUrl.rows[0].count/countAnnonces*100)}%` },
      { Métrique: 'Annonces avec Bruit d\'Obfuscation Unicode FB stealth', Valeur: parseInt(unicodeFbNoise.rows[0].count), Pct: `${Math.round(unicodeFbNoise.rows[0].count/countAnnonces*100)}%` },
      { Métrique: 'Annonces avec Prix Nul ou = 0 FCFA', Valeur: parseInt(prixNullOrZero.rows[0].count), Pct: `${Math.round(prixNullOrZero.rows[0].count/countAnnonces*100)}%` },
      { Métrique: 'Annonces avec Prix Aberrant (<100 ou >500M FCFA)', Valeur: parseInt(prixAberrants.rows[0].count), Pct: `${Math.round(prixAberrants.rows[0].count/countAnnonces*100)}%` },
      { Métrique: 'Annonces Sans Photos', Valeur: parseInt(sansPhotos.rows[0].count), Pct: `${Math.round(sansPhotos.rows[0].count/countAnnonces*100)}%` },
      { Métrique: 'Groupes de Doublons Identiques', Valeur: parseInt(doublons.rows[0].count), Pct: '-' },
      { Métrique: '---', Valeur: '---', Pct: '---' },
      { Métrique: 'Total Offres E-commerce BDD', Valeur: countOffres, Pct: '100%' },
      { Métrique: 'Offres E-commerce Prix Nul ou = 0', Valeur: parseInt(offresPrixZero.rows[0].count), Pct: `${Math.round(offresPrixZero.rows[0].count/countOffres*100)}%` },
      { Métrique: 'Offres E-commerce avec Prix Aberrant Trop Bas (x1000 manquants)', Valeur: parseInt(offresPrixBassesSuspectes.rows[0].count), Pct: `${Math.round(offresPrixBassesSuspectes.rows[0].count/countOffres*100)}%` },
    ]);

  } catch (err) {
    console.error("Erreur durant l'audit:", err);
  } finally {
    await pool.end();
  }
}

fullAudit();
