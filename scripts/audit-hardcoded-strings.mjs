import fs from 'fs';
import path from 'path';

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        results = results.concat(getFiles(fullPath));
      }
    } else if (file.endsWith('.tsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const targetDirs = [
  'frontend-next/src/app/boutique',
  'frontend-next/src/app/(account)',
  'frontend-next/src/app/connexion',
  'frontend-next/src/app/inscription',
  'frontend-next/src/app/mot-de-passe-oublie',
  'frontend-next/src/components'
];

const suspicious = [];

targetDirs.forEach(td => {
  const dirPath = path.resolve(td);
  if (!fs.existsSync(dirPath)) return;
  const files = getFiles(dirPath);

  files.forEach(file => {
    if (file.includes('__tests__')) return;
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      // Skip imports, comments, styles, svg paths, console.log
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('import ') || trimmed.startsWith('export type')) return;
      if (trimmed.includes('console.') || trimmed.includes('style={{') || trimmed.includes('<svg') || trimmed.includes('<path') || trimmed.includes('className=')) {
        // Still check for placeholder or title or raw text in line
      }

      // Check for raw French text in JSX tags: >Texte en français<
      const jsxTextMatch = line.match(/>([^<>{}\n]+)</g);
      if (jsxTextMatch) {
        jsxTextMatch.forEach(m => {
          const txt = m.replace(/^>/, '').replace(/<$/, '').trim();
          // Filter out numbers, punctuation, emojis only, currency, single chars, variables
          if (txt.length > 2 && /[a-zA-ZÀ-ÿ]{3,}/.test(txt) && !txt.startsWith('http') && !txt.includes('var(--') && !txt.includes('fcfa(')) {
            suspicious.push({
              file: path.relative('frontend-next/src', file),
              line: idx + 1,
              type: 'JSX text',
              text: txt
            });
          }
        });
      }

      // Check for placeholder="Texte" without t(...)
      const placeholderMatch = line.match(/placeholder=["']([^"']+)["']/);
      if (placeholderMatch) {
        const ph = placeholderMatch[1].trim();
        if (ph.length > 2 && /[a-zA-ZÀ-ÿ]{3,}/.test(ph) && !ph.includes('{') && !ph.includes('t(')) {
          suspicious.push({
            file: path.relative('frontend-next/src', file),
            line: idx + 1,
            type: 'placeholder',
            text: ph
          });
        }
      }

      // Check for title="Texte"
      const titleMatch = line.match(/title=["']([^"']+)["']/);
      if (titleMatch) {
        const tt = titleMatch[1].trim();
        if (tt.length > 2 && /[a-zA-ZÀ-ÿ]{3,}/.test(tt) && !tt.includes('{') && !tt.includes('t(')) {
          suspicious.push({
            file: path.relative('frontend-next/src', file),
            line: idx + 1,
            type: 'title',
            text: tt
          });
        }
      }

      // Check for alert("Texte") or confirm("Texte") without t(
      const alertMatch = line.match(/(?:alert|confirm|prompt)\s*\(\s*["'`][^"'`]+["'`]/);
      if (alertMatch) {
        suspicious.push({
          file: path.relative('frontend-next/src', file),
          line: idx + 1,
          type: 'alert/confirm',
          text: alertMatch[0]
        });
      }
    });
  });
});

console.log(`Found ${suspicious.length} potentially hardcoded items in target components:`);
const byFile = {};
suspicious.forEach(item => {
  if (!byFile[item.file]) byFile[item.file] = [];
  byFile[item.file].push(item);
});

for (const [f, items] of Object.entries(byFile)) {
  console.log(`\n📄 ${f} (${items.length} items):`);
  items.slice(0, 10).forEach(i => {
    console.log(`  L${i.line} [${i.type}]: ${i.text}`);
  });
  if (items.length > 10) console.log(`  ... and ${items.length - 10} more`);
}
