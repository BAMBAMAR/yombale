#!/usr/bin/env node
// Détecte et corrige les prix avec ×100/÷100 erreurs dans toute la base
// en comparant chaque produit à la médiane de sa catégorie.
// Usage : node backend/scripts/detecter-prix-suspects.js [--dry-run]

require('dotenv').config();
const { pool } = require('../models/db');

const DRY_RUN = process.argv.includes('--dry-run');

function mediane(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
}

// Mots-clés d'accessoires bon marché — ces produits sont légitimement peu chers
// et ne doivent pas être corrigés à la hausse par ×100
const ACCESSOIRES_KEYWORDS = [
  'coque', 'chargeur', 'cable', 'câble', 'adaptateur', 'tapis souris', 'tapis de souris',
  'souris', 'clavier', 'écouteur', 'casque', 'télécommande', 'telecommande',
  'coton', 'swisspers', 'lingette', 'protection', 'étui', 'housse', 'pochette',
  'stylet', 'support', 'ventilateur', 'hub', 'rallonge', 'multiprise',
  'carte mémoire', 'clé usb', 'cle usb', 'lecteur carte',
];

function estAccessoire(nomProduit) {
  const s = (nomProduit || '').toLowerCase();
  return ACCESSOIRES_KEYWORDS.some(k => s.includes(k));
}

function tentativeCorrection(prix, medCat, nomProduit) {
  // Pour les accessoires, accepter uniquement les corrections à la BAISSE (÷100, ÷1000)
  // Pour les autres, accepter aussi à la hausse (×100, ×1000)
  const accessoire = estAccessoire(nomProduit);
  const candidats = accessoire
    ? [
        { val: Math.round(prix / 10),   label: '÷10'   },
        { val: Math.round(prix / 100),  label: '÷100'  },
        { val: Math.round(prix / 1000), label: '÷1000' },
      ]
    : [
        { val: Math.round(prix / 10),   label: '÷10'   },
        { val: Math.round(prix / 100),  label: '÷100'  },
        { val: Math.round(prix / 1000), label: '÷1000' },
        { val: prix * 10,               label: '×10'   },
        { val: prix * 100,              label: '×100'  },
        { val: prix * 1000,             label: '×1000' },
      ];

  // Garde seulement ceux dans la plage 0.1×–10× médiane
  const valides = candidats.filter(c =>
    c.val > 0 && c.val >= medCat * 0.1 && c.val <= medCat * 10
  );
  if (!valides.length) return null;
  // Prend le plus proche de la médiane
  valides.sort((a, b) => Math.abs(a.val - medCat) - Math.abs(b.val - medCat));
  return valides[0];
}

async function main() {
  console.log(DRY_RUN
    ? '[DRY-RUN] Simulation — rien ne sera modifié en base'
    : '[LIVE] Corrections appliquées en base'
  );

  // 1. Charger tous les produits avec leur prix minimum d'offre et leur catégorie
  const { rows: produits } = await pool.query(`
    SELECT
      p.id        AS produit_id,
      p.nom       AS produit_nom,
      p.categorie_id,
      c.nom       AS categorie,
      MIN(o.prix) AS prix_min
    FROM produits p
    JOIN offres o    ON o.produit_id = p.id AND o.stock = true AND o.prix > 0
    JOIN categories c ON c.id = p.categorie_id
    GROUP BY p.id, p.nom, p.categorie_id, c.nom
  `);

  console.log(`${produits.length} produits analysés dans ${new Set(produits.map(r => r.categorie_id)).size} catégories\n`);

  // 2. Calculer la médiane par catégorie
  const parCat = {};
  for (const row of produits) {
    (parCat[row.categorie_id] = parCat[row.categorie_id] || []).push(+row.prix_min);
  }
  const medianeParCat = {};
  for (const [catId, prix] of Object.entries(parCat)) {
    if (prix.length >= 3) medianeParCat[catId] = mediane(prix);
  }

  // 3. Identifier les suspects (ratio < 2% ou > 50× la médiane)
  // Exclusion : accessoires < 10 000 FCFA légitimement bon marché
  const suspects = produits.filter(row => {
    const med = medianeParCat[row.categorie_id];
    if (!med) return false;
    const ratio = +row.prix_min / med;
    if (ratio < 0.02 && +row.prix_min < 10000 && estAccessoire(row.produit_nom)) return false;
    return ratio < 0.02 || ratio > 50;
  });

  if (!suspects.length) {
    console.log('Aucun produit suspect détecté.');
    await pool.end();
    return;
  }

  console.log(`${suspects.length} produit(s) suspect(s) :\n`);

  let nbCorrigés = 0;
  let nbManuel = 0;

  for (const row of suspects) {
    const med = medianeParCat[row.categorie_id];
    const ratio = (+row.prix_min / med).toFixed(3);
    const correction = tentativeCorrection(+row.prix_min, med, row.produit_nom);

    if (correction) {
      console.log(
        `[AUTO] [${row.categorie}] "${row.produit_nom}"\n` +
        `       Prix : ${(+row.prix_min).toLocaleString()} FCFA  |  ` +
        `Médiane cat : ${Math.round(med).toLocaleString()} FCFA  |  ratio : ${ratio}\n` +
        `       → Correction ${correction.label} : ${correction.val.toLocaleString()} FCFA\n`
      );

      if (!DRY_RUN) {
        // Met à jour toutes les offres de ce produit dont le prix est dans la même plage erreur
        await pool.query(`
          UPDATE offres
          SET prix = $1
          WHERE produit_id = $2
            AND stock = true
            AND prix > 0
            AND ABS(prix - $3) < $3 * 0.2
        `, [correction.val, row.produit_id, +row.prix_min]);
      }
      nbCorrigés++;
    } else {
      console.log(
        `[MANUEL] [${row.categorie}] "${row.produit_nom}"\n` +
        `         Prix : ${(+row.prix_min).toLocaleString()} FCFA  |  ` +
        `Médiane cat : ${Math.round(med).toLocaleString()} FCFA  |  ratio : ${ratio}\n` +
        `         → Aucune correction automatique possible\n`
      );
      nbManuel++;
    }
  }

  console.log(`\nRésultat : ${nbCorrigés} corrigé(s) automatiquement, ${nbManuel} à traiter manuellement.`);
  await pool.end();
}

main().catch(err => {
  console.error('[ERREUR]', err.message);
  pool.end();
  process.exit(1);
});
