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
    console.log(`🚀 Exécution : node ${scriptRelPath} ${args.join(' ')}`);
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
  console.log(`\n════════════════════════════════════════════════════════════`);
  console.log(`🔄 NOPALOU COMBO SCRAPER : SEQUENCE COMPLETE AUTOMATISEE`);
  console.log(`════════════════════════════════════════════════════════════\n`);

  // Phase 1 : Omnisource Immo
  console.log(`▶ [PHASE 1/2] Collecte Omnisource (Google, Maps, TikTok, Insta)...`);
  const codeOmni = await execScript('scripts/collecte-omnisource.js', ['--immo']);
  console.log(`✔ Phase 1 terminée (code ${codeOmni})`);

  // Phase 2 : Facebook Immo
  console.log(`\n▶ [PHASE 2/2] Scraping Immo Facebook (Groupes rotatifs & Cloudinary)...`);
  const codeFb = await execScript('scripts/sync-immo-local.js', ['--facebook']);
  console.log(`✔ Phase 2 terminée (code ${codeFb})`);

  console.log(`\n════════════════════════════════════════════════════════════`);
  console.log(`✅ Séquence Combo terminée avec succès.`);
  console.log(`════════════════════════════════════════════════════════════\n`);
  process.exit(codeFb === 0 ? codeOmni : codeFb);
}

main().catch(err => {
  console.error('Erreur fatale combo scraper:', err);
  process.exit(1);
});
