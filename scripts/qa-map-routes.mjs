import fs from 'fs';
import path from 'path';

const routesDir = './backend/routes';
let total = 0;
const summary = {};

fs.readdirSync(routesDir).forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(routesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const endpoints = [];

    lines.forEach((line, i) => {
      const match = line.match(/router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)/);
      if (match) {
        endpoints.push({ method: match[1].toUpperCase(), path: match[2], line: i + 1 });
      }
    });

    if (endpoints.length > 0) {
      summary[file] = endpoints;
      total += endpoints.length;
    }
  }
});

console.log(`=== BACKEND ROUTES MAP (${total} endpoints across ${Object.keys(summary).length} files) ===`);
for (const [file, eps] of Object.entries(summary)) {
  console.log(`\n📁 ${file} (${eps.length} endpoints):`);
  eps.forEach(e => console.log(`  [${e.method.padEnd(6)}] ${e.path} (L${e.line})`));
}
