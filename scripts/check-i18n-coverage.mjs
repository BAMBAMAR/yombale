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
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getFiles(path.resolve('frontend-next/src'));
const tCalls = new Set();
const fileKeyMap = [];

files.forEach(f => {
  if (f.includes('i18n') || f.includes('__tests__')) return;
  const content = fs.readFileSync(f, 'utf-8');
  // Match t('namespace.key') specifically
  const regex = /\bt\(\s*['"]((?:account|auth|caisse|common|errors|shop)\.[a-zA-Z0-9_.]+)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    tCalls.add(match[1]);
    fileKeyMap.push({ file: path.relative('frontend-next/src', f), key: match[1] });
  }
});

console.log('Total unique t(...) calls found:', tCalls.size);

const locales = ['fr', 'en', 'ar'];
const namespaces = ['account', 'auth', 'caisse', 'common', 'errors', 'shop'];

const dicts = { fr: {}, en: {}, ar: {} };

locales.forEach(loc => {
  namespaces.forEach(ns => {
    const filePath = path.resolve(`frontend-next/src/i18n/locales/${loc}/${ns}.ts`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      dicts[loc][ns] = new Set();
      const lines = content.split('\n');
      lines.forEach(l => {
        const m = l.match(/^\s*([a-zA-Z0-9_]+)\s*:/);
        if (m) dicts[loc][ns].add(m[1]);
      });
    }
  });
});

locales.forEach(loc => {
  const missing = [];
  tCalls.forEach(call => {
    const [ns, ...rest] = call.split('.');
    const key = rest.join('.');
    if (!dicts[loc][ns] || !dicts[loc][ns].has(key)) {
      const usages = fileKeyMap.filter(x => x.key === call).map(x => x.file);
      missing.push({ call, usages });
    }
  });
  console.log(`\n=== Missing keys in ${loc.toUpperCase()} dictionary (${missing.length}) ===`);
  if (missing.length > 0) {
    console.log(JSON.stringify(missing, null, 2));
  } else {
    console.log(`✅ All ${tCalls.size} keys present in ${loc}!`);
  }
});
