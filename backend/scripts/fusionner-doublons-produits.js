#!/usr/bin/env node
// Fusion one-shot des produits en doublon.
// Critère STRICT (décision utilisateur 17/07/2026) : ne fusionner que les fiches ayant
// même nom normalisé ET même catégorie ET même marque ET même prix_min ET même(s) marchand(s).
// Usage : node backend/scripts/fusionner-doublons-produits.js [--dry-run]
// --dry-run : affiche les groupes et ce qui serait fusionné, AUCUNE écriture.
//
// Canonique par groupe : fiche avec EAN, sinon le plus d'offres, sinon la plus ancienne.
// Rattache offres (conflit UNIQUE(produit_id,marchand_id) : l'offre la plus récente gagne,
// l'historique_prix de la perdante est rattaché à la gagnante), alertes, clics_affiliation.
// Une transaction PAR GROUPE. Recalcul final prix_min/nb_offres des canoniques.
// ⚠️ À n'exécuter en réel qu'APRÈS déploiement du fix de matching (sinon les doublons reviennent).

require('dotenv').config();
const { pool } = require('../models/db');
const { sqlNomNormalise } = require('../services/scraper');

const DRY_RUN = process.argv.includes('--dry-run');
const NORM = sqlNomNormalise('p.nom');

async function listerGroupes() {
  // Clés de groupe strictes : nom normalisé + catégorie + marque + prix_min + ensemble
  // ordonné des marchands des offres. NULL groupé avec NULL (jamais avec une valeur).
  const { rows } = await pool.query(`
    SELECT p.nom_n || ' | cat:' || COALESCE(p.categorie_id::text,'∅') || ' | marque:' || COALESCE(p.marque,'∅')
           || ' | prix:' || COALESCE(p.prix_min::text,'∅') || ' | marchands:' || COALESCE(p.marchands,'∅') AS cle,
           json_agg(json_build_object('id', p.id, 'nom', p.nom, 'ean', p.ean, 'nb', p.nb, 'created_at', p.created_at)
                    ORDER BY (p.ean IS NOT NULL) DESC, p.nb DESC, p.created_at ASC, p.id ASC) AS membres
    FROM (
      SELECT p.*, ${NORM} AS nom_n,
             (SELECT COUNT(*) FROM offres o WHERE o.produit_id = p.id)::int AS nb,
             (SELECT string_agg(DISTINCT o.marchand_id::text, ',' ORDER BY o.marchand_id::text)
              FROM offres o WHERE o.produit_id = p.id) AS marchands
      FROM produits p
    ) p
    GROUP BY p.nom_n, p.categorie_id, p.marque, p.prix_min, p.marchands
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
  `);
  return rows;
}

async function fusionnerGroupe(client, canon, doublons) {
  let offresSupprimees = 0;
  for (const dup of doublons) {
    // Conflits UNIQUE(produit_id, marchand_id) : le canonique a déjà une offre du même marchand
    const { rows: conflits } = await client.query(
      `SELECT od.id AS dup_offre, od.scraped_at AS dup_at, oc.id AS can_offre, oc.scraped_at AS can_at
       FROM offres od
       JOIN offres oc ON oc.produit_id = $1 AND oc.marchand_id = od.marchand_id
       WHERE od.produit_id = $2`,
      [canon.id, dup.id]
    );
    for (const c of conflits) {
      // L'offre la plus récemment scrapée gagne ; l'historique de la perdante est rattaché à la gagnante.
      const dupGagne = new Date(c.dup_at) > new Date(c.can_at);
      const gagnante = dupGagne ? c.dup_offre : c.can_offre;
      const perdante = dupGagne ? c.can_offre : c.dup_offre;
      await client.query('UPDATE historique_prix SET offre_id = $1 WHERE offre_id = $2', [gagnante, perdante]);
      await client.query('DELETE FROM offres WHERE id = $1', [perdante]);
      offresSupprimees++;
    }
    // Plus aucun conflit : rattacher le reste
    await client.query('UPDATE offres SET produit_id = $1 WHERE produit_id = $2', [canon.id, dup.id]);
    await client.query('UPDATE alertes SET produit_id = $1 WHERE produit_id = $2', [canon.id, dup.id]);
    await client.query('UPDATE clics_affiliation SET produit_id = $1 WHERE produit_id = $2', [canon.id, dup.id]);
    await client.query('DELETE FROM produits WHERE id = $1', [dup.id]);
  }
  return offresSupprimees;
}

async function main() {
  console.log(DRY_RUN ? '[DRY-RUN] Simulation — aucune modification en base' : '[LIVE] Fusion en base de production');

  const groupes = await listerGroupes();
  const totalDoublons = groupes.reduce((s, g) => s + g.membres.length - 1, 0);
  console.log(`${groupes.length} groupe(s) de doublons, ${totalDoublons} fiche(s) à supprimer.\n`);
  console.log('Top 15 :');
  for (const g of groupes.slice(0, 15)) {
    console.log(`  ${String(g.membres.length).padStart(4)}x  ${g.cle}`);
  }

  if (DRY_RUN) {
    console.log('\nExemples détaillés (3 premiers groupes) :');
    for (const g of groupes.slice(0, 3)) {
      const [canon, ...doublons] = g.membres;
      console.log(`\n« ${g.cle} » — canonique ${canon.id} (ean:${canon.ean || '—'}, offres:${canon.nb}, créé:${canon.created_at})`);
      console.log(`  ${doublons.length} doublon(s), dont offres cumulées: ${doublons.reduce((s, d) => s + d.nb, 0)}`);
    }
    console.log(`\n[DRY-RUN] Terminé. Relancer sans --dry-run pour fusionner.`);
    await pool.end();
    return;
  }

  let groupesOk = 0, groupesKo = 0, fichesSupprimees = 0, offresSupprimees = 0;
  const canonsTouches = [];
  for (const g of groupes) {
    const [canon, ...doublons] = g.membres;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      offresSupprimees += await fusionnerGroupe(client, canon, doublons);
      await client.query('COMMIT');
      groupesOk++; fichesSupprimees += doublons.length; canonsTouches.push(canon.id);
    } catch (err) {
      await client.query('ROLLBACK');
      groupesKo++;
      console.error(`[ECHEC] groupe « ${g.cle} » :`, err.message);
    } finally {
      client.release();
    }
  }

  // Recalcul prix_min / nb_offres des canoniques (même requête que le batch du scraper)
  if (canonsTouches.length) {
    await pool.query(`
      UPDATE produits SET
        prix_min = sub.prix_min,
        nb_offres = sub.nb_offres
      FROM (
        SELECT p.id,
          MIN(CASE WHEN o.stock THEN o.prix END) AS prix_min,
          COUNT(o.id) AS nb_offres
        FROM produits p
        LEFT JOIN offres o ON o.produit_id = p.id
        WHERE p.id = ANY($1::uuid[])
        GROUP BY p.id
      ) sub
      WHERE produits.id = sub.id`,
      [canonsTouches]
    );
  }

  console.log(`\nRésultat : ${groupesOk} groupe(s) fusionné(s), ${groupesKo} échec(s), ${fichesSupprimees} fiche(s) supprimée(s), ${offresSupprimees} offre(s) en conflit supprimée(s), ${canonsTouches.length} canonique(s) recalculé(s).`);
  await pool.end();
}

main().catch(err => {
  console.error('[ERREUR]', err.message);
  pool.end();
  process.exit(1);
});
