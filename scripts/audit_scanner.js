const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(full));
        } else if (/\.(tsx|ts|jsx|js)$/.test(file)) {
            results.push(full);
        }
    });
    return results;
}

const frontendSrc = path.resolve('frontend-next/src');
const files = walk(frontendSrc);

console.log('Total files to scan:', files.length);

const links = [];
const apiEndpoints = [];

files.forEach(f => {
    const relFile = path.relative(frontendSrc, f).replace(/\\/g, '/');
    const code = fs.readFileSync(f, 'utf8');

    // Link hrefs: href="..." or href={`...`}
    const hrefRegex = /href=["']([^"']+)["']|href=\{`([^`]+)`\}/g;
    let match;
    while ((match = hrefRegex.exec(code)) !== null) {
        const target = match[1] || match[2];
        if (target && !target.startsWith('http') && !target.startsWith('#') && !target.startsWith('mailto:') && !target.startsWith('tel:')) {
            links.push({ file: relFile, target, raw: match[0] });
        }
    }

    // router.push('...') or router.push(`...`)
    const pushRegex = /router\.push\(\s*["']([^"']+)["']|router\.push\(\s*`([^`]+)`/g;
    while ((match = pushRegex.exec(code)) !== null) {
        const target = match[1] || match[2];
        links.push({ file: relFile, target, isPush: true });
    }

    // api calls: fetch('...'), apiFetch('...'), axios.get('...')
    const apiRegex = /(?:fetch|apiFetch|get|post|put|delete|patch)\(\s*["'](\/api\/[^"']+)["']|(?:fetch|apiFetch|get|post|put|delete|patch)\(\s*`(\/api\/[^`]+)`/g;
    while ((match = apiRegex.exec(code)) !== null) {
        const target = match[1] || match[2];
        apiEndpoints.push({ file: relFile, endpoint: target });
    }
});

console.log('Total internal links / router.push found:', links.length);
console.log('Total /api/ calls found:', apiEndpoints.length);

fs.writeFileSync('scripts/audit-scan-results.json', JSON.stringify({ links, apiEndpoints }, null, 2));
console.log('Wrote to scripts/audit-scan-results.json');
