#!/usr/bin/env node

/**
 * Script d'analyse du bundle Next.js
 * Utilise @next/bundle-analyzer si installé
 *
 * Usage:
 *   npm run analyze        # Analyse et ouvre le rapport
 *   ANALYZE=true npm run build  # Analyse sans ouvrir
 */

const fs = require('fs');
const path = require('path');

const nextConfigPath = path.join(__dirname, '../next.config.js');
const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');

if (!nextConfigContent.includes('@next/bundle-analyzer')) {
  console.log('ℹ️  Bundle analyzer non configuré');
  console.log('Pour activer: npm install --save-dev @next/bundle-analyzer');
  process.exit(0);
}

console.log('✅ Bundle analyzer configuré');
console.log('Lancez: ANALYZE=true npm run build');
