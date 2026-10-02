// backend/lib/ordreCollecte.js : AUD-194. Ordre de visite des sites : les plus en retard d'abord.
// Constat à T0 (24/09/2026) : les 13 « nouveaux sites » étaient toujours parcourus dans le même ordre, et chaque redémarrage
// du service (déploiement automatique) coupait le passage en cours. Les sites de fin de liste (Promo.sn, Soumari, Electrolux,
// AfriQ Market, Electroménager Dakar, Univers Cosmetix : 3 833 offres, 31 % du stock) avaient 3 à 5 jours de retard, ceux de tête
// étaient frais. En visitant le plus ancien d'abord, un passage interrompu reprend naturellement là où il s'est arrêté au
// passage suivant : aucun point d'arrêt à stocker.

/** Fonction pure. `dates` : Map nom du site -> Date du dernier relevé réussi (absent : jamais réussi, visité en dernier). */
function trierParAnciennete(configs, dates) {
  return configs
    .map((c, i) => ({ c, i, t: dates.get(c.nom) ? new Date(dates.get(c.nom)).getTime() : null }))
    .sort((a, b) => {
      if (a.t === null && b.t === null) return a.i - b.i;   // jamais réussis : ordre de configuration
      if (a.t === null) return 1;                           // un site qui n'a jamais rien rendu passe après ceux qu'on sait lire
      if (b.t === null) return -1;
      return a.t - b.t || a.i - b.i;                        // le plus ancien d'abord
    })
    .map((x) => x.c);
}

/** Date du dernier relevé réussi par site : passages `ok` ou `degrade`, ou à défaut la dernière offre relevée. */
async function datesDernierReleve(pool, noms) {
  const dates = new Map();
  const garder = (nom, d) => { if (d && (!dates.has(nom) || new Date(d) > new Date(dates.get(nom)))) dates.set(nom, d); };
  try {
    const { rows } = await pool.query(
      `SELECT source, MAX(ended_at) AS dernier FROM scraping_runs
       WHERE systeme = 'produits' AND statut IN ('ok', 'degrade') AND source = ANY($1) GROUP BY source`, [noms]);
    rows.forEach((r) => garder(r.source, r.dernier));
  } catch (_) { /* table absente ou base indisponible : on retombe sur les offres */ }
  try {
    const { rows } = await pool.query(
      `SELECT m.nom, MAX(o.scraped_at) AS dernier FROM marchands m JOIN offres o ON o.marchand_id = m.id
       WHERE m.nom = ANY($1) GROUP BY m.nom`, [noms]);
    rows.forEach((r) => garder(r.nom, r.dernier));
  } catch (_) { /* ordre de configuration */ }
  return dates;
}

async function ordreParAnciennete(pool, configs) {
  const dates = await datesDernierReleve(pool, configs.map((c) => c.nom));
  return trierParAnciennete(configs, dates);
}

module.exports = { trierParAnciennete, datesDernierReleve, ordreParAnciennete };
