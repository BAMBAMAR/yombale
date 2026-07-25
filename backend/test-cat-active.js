require('dotenv').config();
const { pool } = require('./models/db');
(async () => {
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT c.slug
      FROM categories c 
      JOIN produits p ON p.categorie_id = c.id 
      JOIN offres o ON o.produit_id = p.id 
      WHERE o.stock = true AND o.quarantinee = false
      UNION
      SELECT DISTINCT categorie as slug FROM boutique_produits WHERE en_stock = true
    `);
    const activeSlugs = rows.map(r => r.slug).filter(Boolean);
    
    // Add other verticals if they have at least one active item
    const [immo, annonces, telecom] = await Promise.all([
      pool.query('SELECT 1 FROM annonces_immo WHERE actif = true LIMIT 1').catch(() => ({ rows: [] })),
      pool.query('SELECT 1 FROM annonces_classifiees WHERE actif = true LIMIT 1').catch(() => ({ rows: [] })),
      pool.query('SELECT 1 FROM forfaits_telecom WHERE actif = true LIMIT 1').catch(() => ({ rows: [] }))
    ]);
    
    if (immo.rows.length > 0) activeSlugs.push('immo');
    if (annonces.rows.length > 0) activeSlugs.push('annonces');
    if (telecom.rows.length > 0) activeSlugs.push('telecom');
    
    console.log(activeSlugs);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
