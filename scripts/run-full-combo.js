#!/usr/bin/env node
/**
 * scripts/run-full-combo.js
 * Exécute la séquence complète de scraping Nopalou :
 * Phase 1 : Omnisource (Google Search, Maps OSM, Réseaux Sociaux Dorking)
 * Phase 2 : Facebook Immo Scraper avec rotation des groupes et persistance Cloudinary
 */

'use strict';

const { spawn } = require('child_process');
const path = require('path');

function execScript(scriptRelPath, args = []) {
  return new Promise((resolve) => {
    const fullPath = path.resolve(__dirname, '..', scriptRelPath);
    console.log(`\n==================================================`);
    console.log(`[RUN] node ${scriptRelPath} ${args.join(' ')}`);
    console.log(`==================================================\n`);

    const child = spawn(process.execPath, [fullPath, ...args], {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
      env: process.env
    });

    child.on('close', (code) => {
      resolve(code);
    });

    child.on('error', (err) => {
      console.error(`Erreur d'exécution de ${scriptRelPath}:`, err.message);
      resolve(1);
    });
  });
}

async function main() {
  console.log(`\n============================================================`);
  console.log(`[COMBO] NOPALOU COMBO SCRAPER : SEQUENCE COMPLETE AUTOMATISEE`);
  console.log(`============================================================\n`);

  // Phase 1 : Omnisource Immo
  console.log(`[PHASE 1/2] Collecte Omnisource (Google, Maps, TikTok, Insta)...`);
  const codeOmni = await execScript('scripts/collecte-omnisource.js', ['--immo']);
  if (codeOmni !== 0) {
    console.error(`[PHASE 1/2] ECHEC avec code ${codeOmni}`);
  } else {
    console.log(`[PHASE 1/2] OK (code ${codeOmni})`);
  }

  // Phase 2 : Facebook Immo
  console.log(`\n[PHASE 2/2] Scraping Immo Facebook (Groupes rotatifs & Cloudinary)...`);
  const codeFb = await execScript('scripts/sync-immo-local.js', ['--facebook']);
  if (codeFb !== 0) {
    console.error(`[PHASE 2/2] ECHEC avec code ${codeFb}`);
  } else {
    console.log(`[PHASE 2/2] OK (code ${codeFb})`);
  }

  // Retourne le premier code non-zero rencontré (Phase 1 prioritaire)
  const exitCode = codeOmni !== 0 ? codeOmni : codeFb;
  console.log(`\n============================================================`);
  console.log(`[COMBO] Sequence terminee. Code de sortie final : ${exitCode}`);
  console.log(`============================================================\n`);
  process.exit(exitCode);
}

main().catch(err => {
  console.error('Erreur fatale combo scraper:', err);
  process.exit(1);
});
