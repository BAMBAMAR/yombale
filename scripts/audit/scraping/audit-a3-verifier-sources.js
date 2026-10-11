// scripts/audit/scraping/audit-a3-verifier-sources.js
// Agent 3/3 — Échantillonnage qualité, vérification Decathlon, fraîcheur et doublons
require('dotenv').config();
const path = require('path');
const { pool } = require(path.join(__dirname, '../../../backend/models/db'));

async function executer() {
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('  AGENT 3/3 — VÉRIFICATION QUALITÉ, ÉCHANTILLONNAGE ET SOURCES EN BDD');
  console.log('═══════════════════════════════════════════════════════════════════════════\n');

  // 1. Analyse détaillée Decathlon
  console.log('1. ENQUÊTE DÉCATHLON : POURQUOI 22 OFFRES EN BDD ?');
  const { rows: decathlonOffres } = await pool.query(`
    SELECT o.id, o.prix, o.titre_marchand, o.url_achat, o.scraped_at, o.stock, o.quarantinee,
           p.nom as produit_nom, p.categorie_id
    FROM offres o
    JOIN produits p ON p.id = o.produit_id
    WHERE o.marchand_id = (SELECT id FROM marchands WHERE nom = 'Decathlon')
    ORDER BY o.scraped_at DESC
  `);
  console.log(`Nombre total d'offres Decathlon trouvées : ${decathlonOffres.length}`);
  console.table(decathlonOffres.map(o => ({
    titre_marchand: o.titre_marchand,
    produit_nom: o.produit_nom,
    prix: Number(o.prix),
    url: (o.url_achat || '').slice(0, 60),
  })));

  // 2. Échantillon de qualité sur 5 sources distinctes (20 offres par source)
  console.log('\n2. ÉCHANTILLON DE QUALITÉ SUR 5 SOURCES DIFFÉRENTES (100 OFFRES TOTAL) :');
  const sourcesEchantillon = ['Soumari', 'Promo.sn', 'Master Office Déco', 'CoinAfrique', 'Expat-Dakar'];
  const echantillonResultats = [];

  for (const src of sourcesEchantillon) {
    const { rows: items } = await pool.query(`
      SELECT o.id, o.prix, o.titre_marchand, o.url_achat, o.scraped_at, o.stock, o.quarantinee,
             p.nom as produit_nom, p.image_url, p.marque, p.description,
             m.nom as marchand_nom
      FROM offres o
      JOIN produits p ON p.id = o.produit_id
      JOIN marchands m ON m.id = o.marchand_id
      WHERE m.nom = $1 AND o.stock = true
      ORDER BY o.id DESC
      LIMIT 20
    `, [src]);

    for (const item of items) {
      const anomalies = [];
      const prixNum = Number(item.prix);
      if (!prixNum || prixNum < 500) anomalies.push('PRIX_TROP_BAS');
      if (prixNum > 50000000) anomalies.push('PRIX_ABERRANT');
      if (!item.titre_marchand || item.titre_marchand.length < 4) anomalies.push('TITRE_COURT');
      if (!item.url_achat || !item.url_achat.startsWith('http')) anomalies.push('URL_INVALIDE');
      if (!item.image_url || !item.image_url.startsWith('http')) anomalies.push('IMAGE_ABSENTE');
      if (/test|undefined|null|placeholder/i.test(item.titre_marchand)) anomalies.push('TITRE_SUSPECT');

      echantillonResultats.push({
        source: src,
        titre: item.titre_marchand.slice(0, 30),
        prix: prixNum,
        anomalies: anomalies.length ? anomalies.join(',') : 'AUCUNE',
        hasImage: Boolean(item.image_url && item.image_url.startsWith('http')),
        hasUrl: Boolean(item.url_achat && item.url_achat.startsWith('http')),
        date: item.scraped_at ? new Date(item.scraped_at).toISOString().slice(0, 10) : 'none',
      });
    }
  }

  // Bilan échantillon
  const anomaliesDetectees = echantillonResultats.filter(e => e.anomalies !== 'AUCUNE');
  console.log(`Taille totale échantillon : ${echantillonResultats.length}`);
  console.log(`Offres sans anomalie : ${echantillonResultats.length - anomaliesDetectees.length} (${Math.round(((echantillonResultats.length - anomaliesDetectees.length)/echantillonResultats.length)*100)}%)`);
  console.log(`Offres avec anomalies : ${anomaliesDetectees.length}`);
  if (anomaliesDetectees.length) {
    console.table(anomaliesDetectees);
  }

  // 3. Analyse de fraîcheur par tranche de dates
  console.log('\n3. ANALYSE DE FRAÎCHEUR DES OFFRES EN BASE :');
  const { rows: fraicheur } = await pool.query(`
    SELECT 
      CASE 
        WHEN scraped_at >= NOW() - INTERVAL '24 hours' THEN '1. Moins de 24h'
        WHEN scraped_at >= NOW() - INTERVAL '7 days' THEN '2. 1 à 7 jours'
        WHEN scraped_at >= NOW() - INTERVAL '30 days' THEN '3. 7 à 30 jours'
        WHEN scraped_at >= NOW() - INTERVAL '45 days' THEN '4. 30 à 45 jours'
        ELSE '5. Plus de 45 jours (Obsolète)'
      END as tranche_age,
      COUNT(*) as total_offres,
      COUNT(*) FILTER (WHERE stock = true) as stock_true,
      COUNT(*) FILTER (WHERE stock = false) as stock_false
    FROM offres
    GROUP BY tranche_age
    ORDER BY tranche_age ASC
  `);
  console.table(fraicheur);

  // 4. Examen approfondi de Keur-Immo (60 annonces)
  console.log('\n4. EXAMEN APPROFONDI DES ANNONCES KEUR-IMMO :');
  const { rows: keurImmoSample } = await pool.query(`
    SELECT id, titre, prix, type_bien, quartier, ville, contact_tel, contact_nom, 
           jsonb_array_length(photos) as nb_photos, url_source, actif, rejete
    FROM annonces_immo
    WHERE source = 'keur_immo'
    ORDER BY id ASC
    LIMIT 10
  `);
  console.table(keurImmoSample.map(k => ({
    id: k.id,
    titre: k.titre.slice(0, 30),
    prix: Number(k.prix),
    type: k.type_bien,
    quartier: k.quartier,
    ville: k.ville,
    tel: k.contact_tel,
    agence: (k.contact_nom || '').slice(0, 15),
    photos: k.nb_photos,
    actif: k.actif,
    rejete: k.rejete,
  })));

  await pool.end();
}

executer().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
