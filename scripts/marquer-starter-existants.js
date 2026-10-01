// scripts/marquer-starter-existants.js — AUD-118
// Passe en statut « exemple » les articles du pack de démarrage insérés AVANT la correction (donc visibles
// du public) et jamais touchés par le marchand : même nom et même prix qu'un article du pack, aucune photo,
// updated_at = created_at, aucune vente ni commande.
//
// Usage (lecture seule par défaut) :
//   node scripts/marquer-starter-existants.js              # affiche le décompte par boutique
//   node scripts/marquer-starter-existants.js --appliquer  # applique, dans une transaction
// À exécuter par l'exploitation avec la base voulue (DATABASE_URL). Jamais lancé automatiquement.
const path = require('path');
const { Pool } = require('pg');
const catalogues = require(path.join(__dirname, '../backend/data/starter-catalogues.json'));

const appliquer = process.argv.includes('--appliquer');
const items = Object.values(catalogues).flat().map(i => ({ nom: i.nom, prix: i.prix }));
const noms = items.map(i => i.nom);
const prix = items.map(i => i.prix);

const SELECTION = `
  SELECT p.id, p.boutique_id
    FROM boutique_produits p
    JOIN UNNEST($1::text[], $2::numeric[]) AS s(nom, prix) ON s.nom = p.nom AND s.prix = p.prix
   WHERE COALESCE(p.statut_moderation, 'actif') = 'actif'
     AND (p.images IS NULL OR array_length(p.images, 1) IS NULL)
     AND p.updated_at <= p.created_at + INTERVAL '1 second'
     AND NOT EXISTS (SELECT 1 FROM commandes_boutique c WHERE c.produit_id = p.id)
     AND NOT EXISTS (SELECT 1 FROM ventes v WHERE v.boutique_id = p.boutique_id AND v.produit_id = p.id)`;

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const { rows } = await client.query(SELECTION, [noms, prix]);
    const parBoutique = rows.reduce((m, r) => ((m[r.boutique_id] = (m[r.boutique_id] || 0) + 1), m), {});
    console.log(`${rows.length} article(s) d'exemple candidat(s) sur ${Object.keys(parBoutique).length} boutique(s).`);
    if (!appliquer) { console.log('Lecture seule. Relancer avec --appliquer pour modifier.'); return; }
    await client.query('BEGIN');
    const r = await client.query(
      `UPDATE boutique_produits SET statut_moderation = 'exemple' WHERE id = ANY($1::uuid[])`,
      [rows.map(x => x.id)]
    );
    await client.query('COMMIT');
    console.log(`${r.rowCount} article(s) passé(s) en « exemple ». Vider le cache catalogue (redémarrage ou invalidation cat:/prod:).`);
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erreur :', e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
