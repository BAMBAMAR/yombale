/**
 * Quality Gate & Pré-Validation Nopalou Commerce OS
 * Vérifie l'ensemble des règles de qualité avant tout déploiement ou push :
 * 1. TypeScript Strict (frontend-next)
 * 2. Anti-AI-Slop & Anti-Silent-Catches Linter
 * 3. Tests Unitaires Frontend (61 tests)
 * 4. Tests Unitaires Backend Jest (209 tests)
 */

import { execSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const ROOT_DIR = process.cwd()
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend-next')

function step(title, fn) {
  console.log(`\n======================================================`)
  console.log(`🚀 ${title}`)
  console.log(`======================================================`)
  const start = Date.now()
  try {
    fn()
    const duration = ((Date.now() - start) / 1000).toFixed(2)
    console.log(`✅ ${title} : VALIDÉ (${duration}s)`)
  } catch (err) {
    console.error(`❌ ÉCHEC SUR : ${title}`)
    process.exit(1)
  }
}

console.log('🛡️  DÉMARRAGE DU QUALITY GATE NOPALOU (STANDARD INGÉNIEUR SENIOR)\n')

// 1. TypeScript Validation
step('1. Compilation TypeScript (frontend-next)', () => {
  execSync('npx tsc --noEmit', { cwd: FRONTEND_DIR, stdio: 'inherit' })
})

// 2. Anti-AI-Slop Linter
step('2. Anti-AI-Slop & Zéro Silent Catches', () => {
  execSync('node scripts/lint-ai-slop.mjs', { cwd: FRONTEND_DIR, stdio: 'inherit' })
})

// 3. Tests Unitaires Frontend
step('3. Tests Unitaires Frontend (69 tests)', () => {
  execSync('node --experimental-strip-types scripts/run-unit-tests.mjs', { cwd: FRONTEND_DIR, stdio: 'inherit' })
})

// 4. Tests Unitaires Backend Jest
step('4. Tests Unitaires Backend Jest (373 tests)', () => {
  execSync('npx jest tests/unit --runInBand --forceExit', { cwd: ROOT_DIR, stdio: 'inherit' })
})

// 5. Tests d'Intégration & Sécurité Multi-Tenant / Webhooks
step('5. Tests d\'Intégration & Sécurité Multi-Tenant', () => {
  execSync('npx jest tests/integration --runInBand --forceExit', { cwd: ROOT_DIR, stdio: 'inherit' })
})

console.log(`\n🎉 TOUS LES GATES DE QUALITÉ SONT FRANCHIS AVEC SUCCÈS (100% OK) !`)
console.log(`✨ Nopalou Commerce OS est stable, typé et prêt pour la production.`)
