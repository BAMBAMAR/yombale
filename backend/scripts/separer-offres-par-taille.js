#!/usr/bin/env node
// Sépare automatiquement les offres mal groupées selon la taille d'écran ET la marque.
// Usage :
//   node backend/scripts/separer-offres-par-taille.js --dry-run   (simulation)
//   node backend/scripts/separer-offres-par-taille.js             (applique les corrections)

require('dotenv').config();
const { pool } = require('../models/db');

const DRY_RUN = process.argv.includes('--dry-run');

// Extrait la taille d'écran en pouces depuis un titre
function extrairePouce(titre) {
  const m = (titre || '').match(/\b(\d{2,3})\s*(?:pouces?|['""″]|\binch)/i);
  return m ? parseInt(m[1], 10) : null;
}

// Extrait la marque principale depuis un titre (heuristique)
const MARQUES = ['lg', 'samsung', 'hisense', 'tcl', 'sony', 'philips', 'astech', 'bruhm',
  'skyworth', 'finix', 'enduro', 'ibson', 'wow', 'haier', 'sharp', 'panasonic', 'xiaomi'];

function extraireMarque(titre) {
  const t = (titre || '').toLowerCase();
  return MARQUES.find(m => t.includes(m)) || null;
}

async function main() {
  console.log(DRY_RUN ? '\n[DRY-RUN] Simulation — aucune modification\n' : '\n[LIVE] Application des corrections\n');

  // Récupérer tous les produits ayant au moins 2 offres
  const { rows: produits } = await pool.query(`
    SELECT p.id, p.nom, p.marque, p.categorie_id, COUNT(o.id) AS nb_offres
    FROM produits p
    JOIN offres o ON o.produit_id = p.id AND o.stock = true
    GROUP BY p.id
    HAVING COUNT(o.id) >= 2
    ORDER BY COUNT(o.id) DESC
  `);

  console.log(`Analyse de ${produits.length} produits avec ≥ 2 offres…\n`);

  let nbProduitsSepares = 0;
  let nbOffresDeplacees  = 0;

  for (const produit of produits) {
    // Récupérer les offres avec leur titre marchand
    const { rows: offres } = await pool.query(`
      SELECT o.id, o.prix, o.titre_marchand, m.nom AS marchand
      FROM offres o
      JOIN marchands m ON m.id = o.marchand_id
      WHERE o.produit_id = $1 AND o.stock = true
    `, [produit.id]);

    // Extraire taille et marque de chaque offre
    const offresMeta = offres.map(o => ({
      ...o,
      pouce:  extrairePouce(o.titre_marchand),
      marque: extraireMarque(o.titre_marchand),
    }));

    // Taille de référence du produit (depuis son nom)
    const pouceProduit = extrairePouce(produit.nom);
    const marqueProduit = (produit.marque || '').toLowerCase() || extraireMarque(produit.nom);

    // Identifier les offres mal placées :
    // - taille différente de plus de 10 pouces par rapport au produit
    // - OU marque différente si les deux sont connues
    const offresADeplacer = offresMeta.filter(o => {
      const tailleOK  = !pouceProduit || !o.pouce || Math.abs(o.pouce - pouceProduit) <= 10;
      const marqueOK  = !marqueProduit || !o.marque || o.marque === marqueProduit;
      return !tailleOK || !marqueOK;
    });

    if (offresADeplacer.length === 0) continue;

    // Grouper les offres mal placées par (taille, marque)
    const groupes = {};
    for (const o of offresADeplacer) {
      const key = `${o.pouce || 'inconnue'}_${o.marque || 'inconnue'}`;
      if (!groupes[key]) groupes[key] = [];
      groupes[key].push(o);
    }

    console.log(`\n📦 Produit : "${produit.nom}" (${produit.nb_offres} offres)`);
    console.log(`   Taille référence : ${pouceProduit || '?'}"  Marque : ${marqueProduit || '?'}`);

    for (const [key, groupe] of Object.entries(groupes)) {
      const [tailleStr, marqueStr] = key.split('_');
      const taille = tailleStr !== 'inconnue' ? parseInt(tailleStr) : null;
      const marque = marqueStr !== 'inconnue' ? marqueStr : null;

      // Construire le nom du nouveau produit
      const premiereOffre = groupe[0];
      const nomNouveauProduit = premiereOffre.titre_marchand
        ? premiereOffre.titre_marchand.slice(0, 120)
        : `TV ${marque ? marque.toUpperCase() : ''} ${taille ? taille + '"' : ''}`.trim();

      console.log(`   → Groupe [${key}] : ${groupe.length} offre(s) à séparer`);
      groupe.forEach(o => console.log(`     - ${o.marchand} : "${o.titre_marchand || '?'}" → ${o.prix.toLocaleString()} FCFA`));
      console.log(`     Nouveau produit : "${nomNouveauProduit}"`);

      if (!DRY_RUN) {
        // Créer le nouveau produit
        const { rows: nouveau } = await pool.query(
          `INSERT INTO produits (nom, marque, categorie_id)
           VALUES ($1, $2, $3) RETURNING id`,
          [nomNouveauProduit, marque || null, produit.categorie_id]
        );
        const nouveauId = nouveau[0].id;

        // Déplacer les offres
        for (const o of groupe) {
          await pool.query(
            `UPDATE offres SET produit_id = $1 WHERE id = $2`,
            [nouveauId, o.id]
          );
        }
        console.log(`     ✅ Créé produit ${nouveauId}, ${groupe.length} offre(s) déplacée(s)`);
      }

      nbProduitsSepares++;
      nbOffresDeplacees += groupe.length;
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Résultat : ${nbProduitsSepares} groupe(s) à séparer, ${nbOffresDeplacees} offre(s) ${DRY_RUN ? 'concernée(s)' : 'déplacée(s)'}`);
  if (DRY_RUN) console.log('Relancez sans --dry-run pour appliquer.');

  await pool.end();
}

main().catch(err => {
  console.error('[ERREUR]', err.message);
  pool.end();
  process.exit(1);
});
