// backend/lib/fusionProduits.js : AUD-181. Fusion des fiches `produits` dont le nom normalisé est strictement identique.
// À T0 (copie de production du 24/09/2026) : 182 groupes, 323 fiches en surplus, dont 41 groupes sans marchand commun
// (jamais comparés entre eux alors que leurs titres sont les mêmes).
//
// Sécurité :
//  - lecture seule par défaut (`execute: false`) : le plan est calculé, rien n'est écrit ;
//  - une fiche n'est supprimée que si TOUTES ses offres ont pu être déplacées ; deux offres d'un même marchand sur
//    la fiche canonique et la fiche en double (contrainte unique produit/marchand) ne sont jamais écrasées : la fiche
//    en double reste en place, avec ses offres, et le conflit est rapporté ;
//  - chaque fiche supprimée laisse une ligne dans `produits_alias` (offres déplacées comprises) : `annulerFusion` la recrée ;
//  - une transaction par groupe.
const matching = require('../services/matching');

// Un titre n'identifie un article que s'il est spécifique : au moins 3 mots dont un chiffre (modèle, taille, capacité).
// « Vêtements femme » n'est pas un produit : ce sont des annonces différentes d'un même marché au titre générique.
function titreEstSpecifique(nomNormalise) {
  const mots = String(nomNormalise || '').split(/\s+/).filter((m) => m.length >= 2);
  return mots.length >= 3 && mots.some((m) => /\d/.test(m));
}

async function remplirNomsNormalises(pool, { lot = 2000 } = {}) {
  let total = 0;
  for (;;) {
    const { rows } = await pool.query('SELECT id, nom FROM produits WHERE nom_normalise IS NULL LIMIT $1', [lot]);
    if (!rows.length) return total;
    for (const r of rows) {
      await pool.query('UPDATE produits SET nom_normalise = $2 WHERE id = $1', [r.id, matching.normaliserTitre(r.nom) || '']);
    }
    total += rows.length;
  }
}

// Noms affichés : entités HTML (`&#215;`, `&Prime;`...) décodées. 614 produits avec offre en portaient à T0.
async function nettoyerNomsEntites(pool, { execute = false } = {}) {
  const { rows } = await pool.query(`SELECT id, nom FROM produits WHERE nom ~ '&#?[a-zA-Z0-9]+;'`);
  let modifies = 0;
  for (const r of rows) {
    const propre = matching.decoderHtmlEntities(r.nom).replace(/\s+/g, ' ').trim();
    if (propre === r.nom) continue;
    modifies++;
    if (execute) await pool.query('UPDATE produits SET nom = $2, nom_normalise = $3 WHERE id = $1', [r.id, propre.slice(0, 255), matching.normaliserTitre(propre) || '']);
  }
  return modifies;
}

async function recalculerAgregats(client, produitId) {
  await client.query(
    `UPDATE produits SET
       prix_min = (SELECT MIN(prix) FROM offres WHERE produit_id = $1 AND stock AND NOT quarantinee),
       nb_offres = (SELECT COUNT(*) FROM offres WHERE produit_id = $1 AND stock AND NOT quarantinee)
     WHERE id = $1`, [produitId]);
}

/**
 * @returns {Promise<{groupes:number, fichesEnSurplus:number, offresDeplacees:number, conflits:number, supprimees:number, exemples:Array}>}
 */
async function fusionnerDoublons(pool, { execute = false, limiteGroupes = Infinity } = {}) {
  const bilan = { groupes: 0, fichesEnSurplus: 0, offresDeplacees: 0, conflits: 0, supprimees: 0, groupesIgnoresGeneriques: 0, groupesIgnoresMarcheMeme: 0, exemples: [] };
  const { rows: cles } = await pool.query(
    `SELECT nom_normalise FROM produits WHERE nom_normalise IS NOT NULL AND nom_normalise <> ''
     GROUP BY nom_normalise HAVING COUNT(*) > 1 ORDER BY COUNT(*) DESC, nom_normalise`);

  for (const { nom_normalise: cle } of cles) {
    if (bilan.groupes >= limiteGroupes) break;
    if (!titreEstSpecifique(cle)) { bilan.groupesIgnoresGeneriques++; continue; }
    const { rows: fiches } = await pool.query(
      `SELECT p.id, p.nom, p.created_at,
              (SELECT COUNT(*) FROM offres o WHERE o.produit_id = p.id)::int AS nb
       FROM produits p WHERE p.nom_normalise = $1
       ORDER BY nb DESC, p.created_at ASC, p.id ASC`, [cle]);
    if (fiches.length < 2) continue;
    const [canon, ...doublons] = fiches;
    // groupe dont chaque doublon vend chez un marchand déjà présent sur la fiche canonique : annonces distinctes d'un même
    // marché (même titre, vendeurs différents), pas des doublons de fiche
    const marchandsCanon = new Set((await pool.query('SELECT marchand_id FROM offres WHERE produit_id = $1', [canon.id])).rows.map((o) => o.marchand_id));
    let toutEnConflit = true;
    for (const d of doublons) {
      const m = (await pool.query('SELECT marchand_id FROM offres WHERE produit_id = $1', [d.id])).rows;
      if (m.length === 0 || m.some((o) => !marchandsCanon.has(o.marchand_id))) { toutEnConflit = false; break; }
    }
    if (toutEnConflit) { bilan.groupesIgnoresMarcheMeme++; continue; }
    bilan.groupes++;
    bilan.fichesEnSurplus += doublons.length;

    const client = execute ? await pool.connect() : null;
    const q = client ? client.query.bind(client) : pool.query.bind(pool);
    try {
      if (client) await q('BEGIN');
      for (const d of doublons) {
        const { rows: offres } = await q('SELECT id, marchand_id FROM offres WHERE produit_id = $1', [d.id]);
        const { rows: chezCanon } = await q('SELECT marchand_id FROM offres WHERE produit_id = $1', [canon.id]);
        const pris = new Set(chezCanon.map((o) => o.marchand_id));
        const aDeplacer = offres.filter((o) => !pris.has(o.marchand_id));
        const enConflit = offres.length - aDeplacer.length;
        bilan.conflits += enConflit;
        if (bilan.exemples.length < 40) bilan.exemples.push({ nom_canonique: canon.nom, nom_doublon: d.nom, offres_doublon: offres.length, conflits: enConflit });
        if (!execute) { bilan.offresDeplacees += aDeplacer.length; if (!enConflit) bilan.supprimees++; continue; }

        for (const o of aDeplacer) {
          await q('UPDATE offres SET produit_id = $1 WHERE id = $2', [canon.id, o.id]);
          pris.add(o.marchand_id);
        }
        bilan.offresDeplacees += aDeplacer.length;
        if (enConflit) continue; // la fiche reste avec ses offres en conflit ; rien d'autre n'est touché

        await q('UPDATE alertes SET produit_id = $1 WHERE produit_id = $2', [canon.id, d.id]);
        await q('UPDATE clics_affiliation SET produit_id = $1 WHERE produit_id = $2', [canon.id, d.id]);
        await q(`INSERT INTO produits_alias (ancien_id, canonique_id, ancien_nom, offres_deplacees)
                 VALUES ($1, $2, $3, $4::jsonb) ON CONFLICT (ancien_id) DO NOTHING`,
        [d.id, canon.id, d.nom, JSON.stringify(aDeplacer.map((o) => o.id))]);
        await q('DELETE FROM produits WHERE id = $1', [d.id]);
        bilan.supprimees++;
      }
      if (client) { await recalculerAgregats(client, canon.id); await q('COMMIT'); }
    } catch (e) {
      if (client) await q('ROLLBACK').catch(() => {});
      throw e;
    } finally {
      if (client) client.release();
    }
  }
  return bilan;
}

/** Recrée la fiche supprimée et lui rend les offres qu'elle avait, si elles sont toujours sur la fiche canonique. */
async function annulerFusion(pool, ancienId) {
  const { rows } = await pool.query('SELECT * FROM produits_alias WHERE ancien_id = $1', [ancienId]);
  if (!rows.length) return { annulee: false, motif: 'aucun alias' };
  const a = rows[0];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [canon] } = await client.query('SELECT * FROM produits WHERE id = $1', [a.canonique_id]);
    if (!canon) throw new Error('fiche canonique introuvable');
    await client.query(
      `INSERT INTO produits (id, nom, description, categorie_id, marque, ean, image_url, nom_normalise)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [a.ancien_id, a.ancien_nom, canon.description, canon.categorie_id, canon.marque, null, canon.image_url, canon.nom_normalise]);
    const ids = a.offres_deplacees || [];
    let rendues = 0;
    if (ids.length) {
      const r = await client.query('UPDATE offres SET produit_id = $1 WHERE id = ANY($2::uuid[]) AND produit_id = $3', [a.ancien_id, ids, a.canonique_id]);
      rendues = r.rowCount;
    }
    await client.query('DELETE FROM produits_alias WHERE ancien_id = $1', [ancienId]);
    await recalculerAgregats(client, a.ancien_id);
    await recalculerAgregats(client, a.canonique_id);
    await client.query('COMMIT');
    return { annulee: true, offresRendues: rendues };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { fusionnerDoublons, annulerFusion, remplirNomsNormalises, nettoyerNomsEntites, titreEstSpecifique };
