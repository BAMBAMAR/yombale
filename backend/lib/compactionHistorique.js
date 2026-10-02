// backend/lib/compactionHistorique.js : AUD-190. Compaction de `historique_prix`.
// À T0 (copie de production du 24/09/2026) : 1 277 479 lignes, 715 979 (56 %) identiques à la précédente, soit 108 lignes par
// offre en moyenne, héritage d'avant l'idempotence des re-scrapings (qui n'écrit plus de ligne sans changement de prix).
//
// Règle : on supprime une ligne quand le prix de la ligne PRÉCÉDENTE et celui de la SUIVANTE de la même offre sont identiques au sien
// (milieu d'un palier). Le premier et le dernier relevé de chaque palier restent : les dates d'entrée et de sortie de chaque prix,
// donc la forme de la courbe, sont conservées. Seules les lignes plus anciennes que `joursMin` sont touchées : le détecteur
// d'anomalies calcule la moyenne des 30 derniers jours par ligne, la fenêtre récente ne doit pas être modifiée.
// Lecture seule par défaut ; par lots d'offres ; une transaction par lot.

async function compacterHistorique(pool, { execute = false, joursMin = 35, lotOffres = 500 } = {}) {
  const bilan = { lignesAvant: 0, supprimables: 0, supprimees: 0, offres: 0 };
  bilan.lignesAvant = Number((await pool.query('SELECT count(*)::bigint n FROM historique_prix')).rows[0].n);
  const { rows: offres } = await pool.query(
    `SELECT offre_id FROM historique_prix GROUP BY offre_id HAVING count(*) > 2 ORDER BY offre_id`);
  bilan.offres = offres.length;
  const requete = (action) => `
    WITH r AS (
      SELECT id, date, prix,
             lag(prix)  OVER w AS avant,
             lead(prix) OVER w AS apres
      FROM historique_prix WHERE offre_id = ANY($1::uuid[])
      WINDOW w AS (PARTITION BY offre_id ORDER BY date, id)
    ), a_retirer AS (
      SELECT id FROM r WHERE avant = prix AND apres = prix AND date < NOW() - ($2 || ' days')::interval
    )
    ${action}`;

  for (let i = 0; i < offres.length; i += lotOffres) {
    const ids = offres.slice(i, i + lotOffres).map((o) => o.offre_id);
    if (!execute) {
      const { rows } = await pool.query(requete('SELECT count(*)::int AS n FROM a_retirer'), [ids, String(joursMin)]);
      bilan.supprimables += rows[0].n;
      continue;
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const r = await client.query(requete('DELETE FROM historique_prix h USING a_retirer x WHERE h.id = x.id'), [ids, String(joursMin)]);
      await client.query('COMMIT');
      bilan.supprimees += r.rowCount;
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  }
  if (execute) bilan.supprimables = bilan.supprimees;
  return bilan;
}

module.exports = { compacterHistorique };
