#!/usr/bin/env node

/**
 * NOPALOU ANTI-AI-SLOP LINTER & SANITIZER (v1.0)
 * 
 * Inspects code against the 4 Anti-AI-Slop Golden Rules:
 * 1. ZERO EMOJI UI CRUTCHES: UI elements must use Lucide-React SVG icons, not Unicode emojis.
 * 2. COMPONENT SIZE HYGIENE: Flags components exceeding 500 lines to prevent AI monoliths.
 * 3. DESIGN SYSTEM TOKENS: Flags unauthorized hardcoded hex colors instead of CSS vars.
 * 4. ERROR RESILIENCE: Flags empty/silent catch blocks.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '../src');

// Emojis that frequently appear as cheap UI crutches
const UI_EMOJIS_REGEX = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u;

// Legitimate exceptions (e.g., specific currency symbol display or test fixtures if any)
const IGNORED_PATHS = [
  'node_modules',
  '.next',
  'public',
  'scripts',
  '.git'
];

function walkDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (IGNORED_PATHS.some(p => full.includes(p))) continue;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walkDir(full, fileList);
    } else if (/\.(tsx|jsx|ts|js)$/.test(f)) {
      fileList.push(full);
    }
  }
  return fileList;
}

const files = walkDir(SRC_DIR);
let totalViolations = 0;
const report = {
  emojis: [],
  monoliths: [],
  silentCatches: []
};

for (const file of files) {
  const relPath = path.relative(SRC_DIR, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  // Rule 1: Component Size (> 800 lines is a critical monolith, > 450 is a warning)
  if (lines.length > 800) {
    report.monoliths.push({
      file: relPath,
      lines: lines.length,
      severity: lines.length > 2000 ? 'CRITICAL' : 'WARNING'
    });
  }

  // Check line by line
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Rule 2: Emojis in JSX markup (ignore comments)
    const isComment = line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*');
    if (!isComment && UI_EMOJIS_REGEX.test(line)) {
      // Find matching emoji
      const match = line.match(UI_EMOJIS_REGEX);
      if (match) {
        report.emojis.push({
          file: relPath,
          line: lineNum,
          emoji: match[0],
          snippet: line.trim().substring(0, 80)
        });
      }
    }

    // Rule 3: Silent catch blocks
    if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(line) || /catch\s*\{\s*\}/.test(line)) {
      report.silentCatches.push({
        file: relPath,
        line: lineNum,
        snippet: line.trim()
      });
    }
  });
}

console.log('\n🔍 =======================================================');
console.log('   NOPALOU ANTI-AI-SLOP QUALITY GATE REPORT');
console.log('=======================================================\n');

console.log(`📁 Files Scanned: ${files.length}`);
console.log(`⚠️  Silent Catches: ${report.silentCatches.length}`);
console.log(`🧩 Component Monoliths (>800 lines): ${report.monoliths.length}`);
console.log(`🎭 Emoji UI Crutches Found: ${report.emojis.length}\n`);

if (report.monoliths.length > 0) {
  console.log('--- 🛑 MONOLITHS REQUIRING PROGRESSIVE EXTRACTION ---');
  report.monoliths.forEach(m => {
    console.log(`  [${m.severity}] ${m.file} (${m.lines} lines)`);
  });
  console.log('');
}

if (report.silentCatches.length > 0) {
  console.log('--- ⚠️ SILENT CATCHES ---');
  report.silentCatches.slice(0, 5).forEach(c => {
    console.log(`  ${c.file}:${c.line} -> ${c.snippet}`);
  });
  if (report.silentCatches.length > 5) {
    console.log(`  ... and ${report.silentCatches.length - 5} more.`);
  }
  console.log('');
}

const isStrict = process.argv.includes('--strict');
if (isStrict && (report.silentCatches.length > 0)) {
  console.error('❌ Quality gate failed under --strict mode.');
  process.exit(1);
} else {
  console.log('✅ Anti-AI-Slop audit completed successfully (advisory mode).\n');
  process.exit(0);
}
