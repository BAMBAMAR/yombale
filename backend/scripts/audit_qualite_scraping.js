require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function q(sql) { const { rows } = await pool.query(sql); return rows; }
function sep(t){ console.log("\n" + "=".repeat(70) + "\n  " + t + "\n" + "=".repeat(70)); }
function tbl(rows, cols) {
  if (!rows.length) { console.log("  (vide)"); return; }
  const w = cols.map(c => Math.max(c.length, ...rows.map(r => String(r[c] != null ? r[c] : "").length)));
  console.log("  " + cols.map((c,i) => c.padEnd(w[i])).join(" | "));
  console.log("  " + w.map(x => "-".repeat(x)).join("-+-"));
  for (const r of rows) console.log("  " + cols.map((c,i) => String(r[c] != null ? r[c] : "").padEnd(w[i])).join(" | "));
}
async function main() {
  console.log("\nAUDIT DONNÉES SCRAPING NOPALOU — " + new Date().toISOString());

  sep("1A. VOLUME OFFRES PAR MARCHAND");
  const vm = await q("SELECT m.nom AS marchand, m.site_url, COUNT(o.id) AS total_offres, COUNT(o.id) FILTER(WHERE o.stock=true) AS en_stock, COUNT(o.id) FILTER(WHERE o.prix>0) AS avec_prix, COUNT(o.id) FILTER(WHERE o.prix IS NULL OR o.prix=0) AS sans_prix, COUNT(o.id) FILTER(WHERE o.url_achat IS NOT NULL AND o.url_achat<>'') AS avec_url, MIN(o.scraped_at)::date AS premiere_offre, MAX(o.scraped_at)::date AS derniere_maj, ROUND(AVG(o.prix)) AS prix_moyen FROM offres o JOIN marchands m ON m.id=o.marchand_id GROUP BY m.nom, m.site_url ORDER BY total_offres DESC");
  tbl(vm, ["marchand","total_offres","en_stock","avec_prix","sans_prix","avec_url","premiere_offre","derniere_maj","prix_moyen"]);

  sep("1B. VOLUME OFFRES PAR CATEGORIE");
  const vc = await q("SELECT c.nom AS categorie, c.slug, COUNT(o.id) AS total_offres, COUNT(DISTINCT o.produit_id) AS produits_uniques, COUNT(DISTINCT o.marchand_id) AS marchands, COUNT(o.id) FILTER(WHERE o.stock=true) AS en_stock, ROUND(AVG(o.prix)) AS prix_moyen, MIN(o.prix) AS prix_min, MAX(o.prix) AS prix_max FROM offres o JOIN produits p ON p.id=o.produit_id JOIN categories c ON c.id=p.categorie_id GROUP BY c.nom, c.slug ORDER BY total_offres DESC");
  tbl(vc, ["categorie","slug","total_offres","produits_uniques","marchands","en_stock","prix_moyen","prix_min","prix_max"]);

  sep("1C. TOTAUX GLOBAUX");
  const tot = await q("SELECT (SELECT COUNT(*) FROM produits) AS total_produits, (SELECT COUNT(*) FROM offres) AS total_offres, (SELECT COUNT(*) FROM offres WHERE stock=true) AS offres_actives, (SELECT COUNT(*) FROM marchands) AS total_marchands, (SELECT COUNT(*) FROM annonces_classifiees) AS total_annonces_classifiees, (SELECT COUNT(*) FROM annonces_classifiees WHERE actif=true) AS annonces_actives, (SELECT COUNT(*) FROM annonces_classifiees WHERE source='facebook') AS annonces_fb, (SELECT COUNT(*) FROM annonces_immo) AS total_immo, (SELECT COUNT(*) FROM annonces_immo WHERE actif=true) AS immo_actives");
  console.log(JSON.stringify(tot[0], null, 2));

  sep("2A. QUALITE PRODUITS — CHAMPS MANQUANTS PAR CATEGORIE");
  const qp = await q("SELECT c.slug AS categorie, COUNT(*) AS total, COUNT(*) FILTER(WHERE p.image_url IS NULL OR p.image_url='') AS sans_image, COUNT(*) FILTER(WHERE p.description IS NULL OR p.description='') AS sans_desc, COUNT(*) FILTER(WHERE p.marque IS NULL OR p.marque='') AS sans_marque, ROUND(100.0*COUNT(*) FILTER(WHERE p.image_url IS NOT NULL AND p.image_url<>'')/NULLIF(COUNT(*),0),1) AS pct_image FROM produits p JOIN categories c ON c.id=p.categorie_id GROUP BY c.slug ORDER BY total DESC");
  tbl(qp, ["categorie","total","sans_image","sans_desc","sans_marque","pct_image"]);

  sep("2B. PRIX SUSPECTS PAR MARCHAND");
  const ps = await q("SELECT m.nom AS marchand, COUNT(*) FILTER(WHERE o.prix<500) AS prix_trop_bas, COUNT(*) FILTER(WHERE o.prix BETWEEN 500 AND 999) AS prix_500_999, COUNT(*) FILTER(WHERE o.prix>100000000) AS prix_aberrant, COUNT(*) FILTER(WHERE o.prix IS NULL OR o.prix=0) AS prix_nul, MIN(o.prix) FILTER(WHERE o.prix>0) AS min_valide, MAX(o.prix) AS max_prix FROM offres o JOIN marchands m ON m.id=o.marchand_id GROUP BY m.nom ORDER BY prix_nul DESC, prix_trop_bas DESC");
  tbl(ps, ["marchand","prix_trop_bas","prix_500_999","prix_aberrant","prix_nul","min_valide","max_prix"]);

  sep("2C. QUALITE ANNONCES FACEBOOK PAR CATEGORIE");
  const qf = await q("SELECT categorie_slug, COUNT(*) AS total, COUNT(*) FILTER(WHERE contact_tel IS NOT NULL AND contact_tel<>'' AND contact_tel<>'Voir sur Facebook') AS avec_tel, COUNT(*) FILTER(WHERE prix IS NOT NULL AND prix>0) AS avec_prix, COUNT(*) FILTER(WHERE photos IS NOT NULL AND photos::text<>'[]' AND photos::text<>'null') AS avec_photos, COUNT(*) FILTER(WHERE description IS NOT NULL AND description<>'') AS avec_desc, ROUND(100.0*COUNT(*) FILTER(WHERE contact_tel IS NOT NULL AND contact_tel<>'')/NULLIF(COUNT(*),0),1) AS pct_tel FROM annonces_classifiees WHERE source='facebook' GROUP BY categorie_slug ORDER BY total DESC");
  tbl(qf, ["categorie_slug","total","avec_tel","avec_prix","avec_photos","avec_desc","pct_tel"]);

  sep("2D. QUALITE ANNONCES IMMO PAR SOURCE");
  const qi = await q("SELECT source, COUNT(*) AS total, COUNT(*) FILTER(WHERE actif=true) AS actives, COUNT(*) FILTER(WHERE prix>0) AS avec_prix, COUNT(*) FILTER(WHERE contact_tel IS NOT NULL) AS avec_tel, COUNT(*) FILTER(WHERE photos IS NOT NULL AND photos::text<>'[]') AS avec_photos, COUNT(*) FILTER(WHERE ville IS NOT NULL AND ville<>'') AS avec_ville, MAX(created_at)::date AS derniere_insertion FROM annonces_immo GROUP BY source ORDER BY total DESC");
  tbl(qi, ["source","total","actives","avec_prix","avec_tel","avec_photos","avec_ville","derniere_insertion"]);

  sep("3A. DOUBLONS URL OFFRES PAR MARCHAND");
  const du = await q("SELECT m.nom AS marchand, COUNT(*) AS urls_dupliquees, SUM(cnt)-COUNT(*) AS doublons FROM (SELECT marchand_id, url_achat, COUNT(*) AS cnt FROM offres WHERE url_achat IS NOT NULL GROUP BY marchand_id, url_achat HAVING COUNT(*)>1) d JOIN marchands m ON m.id=d.marchand_id GROUP BY m.nom ORDER BY urls_dupliquees DESC");
  tbl(du, ["marchand","urls_dupliquees","doublons"]);

  sep("3B. DOUBLONS PRODUITS — MEME NOM + CATEGORIE");
  const dp = await q("SELECT c.slug, COUNT(*) AS groupes_doublons, SUM(cnt)-COUNT(*) AS doublons_net FROM (SELECT p.categorie_id, LOWER(TRIM(p.nom)) AS n, COUNT(*) AS cnt FROM produits p WHERE p.nom IS NOT NULL AND p.nom<>'' GROUP BY p.categorie_id, LOWER(TRIM(p.nom)) HAVING COUNT(*)>1) d JOIN categories c ON c.id=d.categorie_id GROUP BY c.slug ORDER BY doublons_net DESC");
  tbl(dp, ["slug","groupes_doublons","doublons_net"]);

  sep("3C. DOUBLONS ANNONCES FB — MEME CONTACT_TEL MEME JOUR");
  const df = await q("SELECT categorie_slug, COUNT(*) AS groupes, SUM(cnt)-COUNT(*) AS doublons_par_tel FROM (SELECT categorie_slug, contact_tel, DATE(created_at) AS jour, COUNT(*) AS cnt FROM annonces_classifiees WHERE contact_tel IS NOT NULL AND contact_tel<>'' AND source='facebook' GROUP BY categorie_slug, contact_tel, DATE(created_at) HAVING COUNT(*)>1) d GROUP BY categorie_slug ORDER BY doublons_par_tel DESC");
  tbl(df, ["categorie_slug","groupes","doublons_par_tel"]);

  sep("3D. TAUX DOUBLON GLOBAL OFFRES (URL)");
  const td = await q("SELECT COUNT(*) AS total, COUNT(DISTINCT url_achat) FILTER(WHERE url_achat IS NOT NULL) AS urls_uniques, COUNT(*)-COUNT(DISTINCT url_achat) FILTER(WHERE url_achat IS NOT NULL) AS doublons_url, ROUND(100.0*(COUNT(*)-COUNT(DISTINCT url_achat) FILTER(WHERE url_achat IS NOT NULL))/NULLIF(COUNT(*),0),2) AS taux_pct FROM offres");
  console.log(JSON.stringify(td[0], null, 2));

  sep("4A. FRAICHEUR OFFRES PAR MARCHAND (scraped_at)");
  const fm = await q("SELECT m.nom AS marchand, MAX(o.scraped_at) AS derniere_maj, ROUND(EXTRACT(EPOCH FROM(NOW()-MAX(o.scraped_at)))/3600) AS heures_depuis, COUNT(o.id) FILTER(WHERE o.scraped_at>NOW()-INTERVAL '24 hours') AS maj_24h, COUNT(o.id) FILTER(WHERE o.scraped_at>NOW()-INTERVAL '7 days') AS maj_7j, COUNT(o.id) FILTER(WHERE o.scraped_at<NOW()-INTERVAL '30 days') AS age_30j_plus FROM offres o JOIN marchands m ON m.id=o.marchand_id GROUP BY m.nom ORDER BY derniere_maj DESC");
  tbl(fm, ["marchand","derniere_maj","heures_depuis","maj_24h","maj_7j","age_30j_plus"]);

  sep("4B. FRAICHEUR ANNONCES FACEBOOK (created_at)");
  const ff = await q("SELECT categorie_slug, COUNT(*) AS total, COUNT(*) FILTER(WHERE created_at>NOW()-INTERVAL '24 hours') AS moins_24h, COUNT(*) FILTER(WHERE created_at>NOW()-INTERVAL '7 days') AS moins_7j, COUNT(*) FILTER(WHERE created_at>NOW()-INTERVAL '30 days') AS moins_30j, COUNT(*) FILTER(WHERE created_at<NOW()-INTERVAL '30 days') AS plus_30j, MAX(created_at) AS derniere_insertion FROM annonces_classifiees WHERE source='facebook' GROUP BY categorie_slug ORDER BY total DESC");
  tbl(ff, ["categorie_slug","total","moins_24h","moins_7j","moins_30j","plus_30j","derniere_insertion"]);

  sep("4C. FRAICHEUR ANNONCES IMMO");
  const fi = await q("SELECT source, COUNT(*) AS total, COUNT(*) FILTER(WHERE created_at>NOW()-INTERVAL '7 days') AS moins_7j, COUNT(*) FILTER(WHERE created_at<NOW()-INTERVAL '30 days') AS plus_30j, MAX(created_at)::date AS derniere FROM annonces_immo GROUP BY source ORDER BY total DESC");
  tbl(fi, ["source","total","moins_7j","plus_30j","derniere"]);

  sep("4D. OFFRES POTENTIELLEMENT OBSOLETES (stock=true mais >30j)");
  const obs = await q("SELECT m.nom AS marchand, COUNT(*) AS obsoletes FROM offres o JOIN marchands m ON m.id=o.marchand_id WHERE o.stock=true AND o.scraped_at<NOW()-INTERVAL '30 days' GROUP BY m.nom ORDER BY obsoletes DESC");
  tbl(obs, ["marchand","obsoletes"]);

  sep("5A. EXPLOITABILITE — OFFRES AVEC IMAGE + PRIX + URL PAR CATEGORIE");
  const ex = await q("SELECT c.slug, COUNT(o.id) AS total, COUNT(o.id) FILTER(WHERE o.stock=true AND o.prix>0 AND p.image_url IS NOT NULL AND o.url_achat IS NOT NULL) AS complets, COUNT(o.id) FILTER(WHERE o.stock=true AND o.prix>0) AS avec_prix_stock, ROUND(100.0*COUNT(o.id) FILTER(WHERE o.stock=true AND o.prix>0 AND p.image_url IS NOT NULL AND o.url_achat IS NOT NULL)/NULLIF(COUNT(o.id),0),1) AS pct_complets FROM offres o JOIN produits p ON p.id=o.produit_id JOIN categories c ON c.id=p.categorie_id GROUP BY c.slug ORDER BY total DESC");
  tbl(ex, ["slug","total","complets","avec_prix_stock","pct_complets"]);

  sep("5B. COUVERTURE GEO ANNONCES FACEBOOK");
  const gf = await q("SELECT COALESCE(ville,'non precise') AS ville, COUNT(*) AS annonces, COUNT(DISTINCT categorie_slug) AS categories FROM annonces_classifiees WHERE source='facebook' GROUP BY ville ORDER BY annonces DESC LIMIT 15");
  tbl(gf, ["ville","annonces","categories"]);

  sep("5C. PRODUITS DANS COMPARATEUR (2+ marchands actifs)");
  const cm = await q("SELECT c.slug, COUNT(DISTINCT p.id) AS produits_comparables, COUNT(DISTINCT o.id) AS offres FROM produits p JOIN categories c ON c.id=p.categorie_id JOIN offres o ON o.produit_id=p.id AND o.stock=true AND o.prix>0 WHERE p.id IN(SELECT produit_id FROM offres WHERE stock=true AND prix>0 GROUP BY produit_id HAVING COUNT(DISTINCT marchand_id)>=2) GROUP BY c.slug ORDER BY produits_comparables DESC");
  tbl(cm, ["slug","produits_comparables","offres"]);

  sep("5D. SCRAPING_RUNS — HISTORIQUE DES RUNS ENREGISTRES");
  const sr = await q("SELECT source, statut, COUNT(*) AS nb_runs, SUM(items_extraits) AS total_extraits, SUM(items_inseres) AS total_inseres, SUM(items_doublons) AS total_doublons, SUM(pages_cibles) AS pages_cibles, SUM(pages_ok) AS pages_ok, SUM(pages_erreur) AS pages_erreur, MIN(started_at)::date AS premier_run, MAX(started_at)::date AS dernier_run FROM scraping_runs GROUP BY source, statut ORDER BY nb_runs DESC LIMIT 30");
  tbl(sr, ["source","statut","nb_runs","total_extraits","total_inseres","total_doublons","pages_cibles","pages_ok","pages_erreur","premier_run","dernier_run"]);

  sep("5E. ECHANTILLON 15 ANNONCES FB RECENTES (qualite concrete)");
  const ef = await q("SELECT categorie_slug, SUBSTRING(titre,1,50) AS titre, prix, ville, CASE WHEN contact_tel IS NOT NULL AND contact_tel<>'' THEN 'OUI' ELSE 'NON' END AS tel, CASE WHEN photos::text!='[]' AND photos::text!='null' THEN 'OUI' ELSE 'NON' END AS photo, created_at::date AS date FROM annonces_classifiees WHERE source='facebook' ORDER BY created_at DESC LIMIT 15");
  tbl(ef, ["categorie_slug","titre","prix","ville","tel","photo","date"]);

  sep("5F. ECHANTILLON 15 OFFRES PRODUITS RECENTES (qualite concrete)");
  const eo = await q("SELECT m.nom AS marchand, SUBSTRING(p.nom,1,50) AS produit, o.prix, CASE WHEN p.image_url IS NOT NULL THEN 'OUI' ELSE 'NON' END AS image, CASE WHEN o.url_achat IS NOT NULL THEN 'OUI' ELSE 'NON' END AS url, o.stock, o.scraped_at::date AS maj FROM offres o JOIN produits p ON p.id=o.produit_id JOIN marchands m ON m.id=o.marchand_id WHERE o.stock=true ORDER BY o.scraped_at DESC LIMIT 15");
  tbl(eo, ["marchand","produit","prix","image","url","stock","maj"]);

  sep("6. COHERENCE — ORPHELINES ET PRODUITS SANS OFFRE");
  const orp = await q("SELECT COUNT(*) AS offres_orphelines FROM offres o WHERE NOT EXISTS(SELECT 1 FROM produits p WHERE p.id=o.produit_id)");
  console.log("  Offres sans produit:", orp[0].offres_orphelines);
  const pso = await q("SELECT c.slug, COUNT(p.id) AS produits_sans_offre FROM produits p JOIN categories c ON c.id=p.categorie_id WHERE NOT EXISTS(SELECT 1 FROM offres o WHERE o.produit_id=p.id) GROUP BY c.slug ORDER BY produits_sans_offre DESC");
  tbl(pso, ["slug","produits_sans_offre"]);

  sep("7. SYNTHESE FINALE");
  const syn = await q("SELECT (SELECT COUNT(*) FROM marchands WHERE actif=true) AS sources_actives, (SELECT COUNT(*) FROM produits) AS produits_db, (SELECT COUNT(*) FROM offres) AS offres_db, (SELECT COUNT(*) FROM offres WHERE stock=true AND prix>0) AS offres_actives_avec_prix, (SELECT COUNT(*) FROM offres WHERE stock=true AND prix>0 AND url_achat IS NOT NULL AND produit_id IN(SELECT id FROM produits WHERE image_url IS NOT NULL)) AS offres_exploitables_complets, (SELECT COUNT(*) FROM annonces_classifiees WHERE source='facebook') AS fb_total, (SELECT COUNT(*) FROM annonces_classifiees WHERE source='facebook' AND actif=true) AS fb_actives, (SELECT COUNT(*) FROM annonces_classifiees WHERE source='facebook' AND actif=true AND contact_tel IS NOT NULL AND contact_tel<>'') AS fb_avec_contact, (SELECT COUNT(*) FROM annonces_classifiees WHERE source='facebook' AND actif=true AND prix>0) AS fb_avec_prix, (SELECT COUNT(*) FROM annonces_immo) AS immo_total, (SELECT COUNT(*) FROM annonces_immo WHERE actif=true) AS immo_actives");
  console.log(JSON.stringify(syn[0], null, 4));

  await pool.end();
  console.log("\n=== Audit termine. ===");
}
main().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
