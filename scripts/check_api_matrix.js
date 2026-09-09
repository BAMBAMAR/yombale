const fs = require('fs');
const path = require('path');

// 1. Gather all backend Express endpoints
const appJs = fs.readFileSync('backend/app.js', 'utf8');
const routesDir = 'backend/routes';

const mountRegex = /app\.use\(\s*['"](\/api[^'"]*)['"]\s*,\s*require\(['"]\.\/routes\/([^'"]+)['"]\)\)/g;
let m;
const routeFilesByPrefix = {};
while ((m = mountRegex.exec(appJs)) !== null) {
    const prefix = m[1];
    const file = m[2] + (m[2].endsWith('.js') ? '' : '.js');
    if (!routeFilesByPrefix[file]) routeFilesByPrefix[file] = [];
    routeFilesByPrefix[file].push(prefix);
}

const backendEndpoints = [];

Object.entries(routeFilesByPrefix).forEach(([file, prefixes]) => {
    const fullPath = path.join(routesDir, file);
    if (!fs.existsSync(fullPath)) return;
    const content = fs.readFileSync(fullPath, 'utf8');

    const epRegex = /router\.(get|post|put|delete|patch)\(\s*['"]([^'"]+)['"]/g;
    let epMatch;
    while ((epMatch = epRegex.exec(content)) !== null) {
        const method = epMatch[1].toUpperCase();
        let sub = epMatch[2];
        if (sub === '/') sub = '';
        prefixes.forEach(pref => {
            let full = pref + (sub.startsWith('/') ? sub : (sub ? '/' + sub : ''));
            backendEndpoints.push({ method, path: full, file });
        });
    }
});

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat && stat.isDirectory()) results = results.concat(walk(full));
        else if (/route\.(ts|js)$/.test(file)) results.push(full);
    });
    return results;
}

const nextApiFiles = walk('frontend-next/src/app/api');
const nextApiRoutes = nextApiFiles.map(f => {
    let rel = path.relative('frontend-next/src/app', f).replace(/\\/g, '/');
    rel = '/' + rel.replace(/\/route\.(ts|js)$/, '');
    return rel;
});

console.log('Total backend Express endpoints:', backendEndpoints.length);
console.log('Total Next.js API routes:', nextApiRoutes.length);

const scanData = JSON.parse(fs.readFileSync('scripts/audit-scan-results.json', 'utf8'));
const apiCalls = scanData.apiEndpoints;

function matchesPattern(call, pattern) {
    const callParts = call.split('?')[0].split('/').filter(Boolean);
    const patParts = pattern.split('/').filter(Boolean);

    let i = 0;
    let j = 0;
    while (i < callParts.length && j < patParts.length) {
        const p = patParts[j];
        if (p.startsWith('[...') || p.startsWith('[[...')) {
            return true; // catch-all matches rest
        }
        if (p.startsWith(':') || (p.startsWith('[') && p.endsWith(']'))) {
            // parameter wildcard
            i++;
            j++;
            continue;
        }
        if (callParts[i].startsWith('${') && callParts[i].endsWith('}')) {
            // dynamic expression in frontend call
            i++;
            j++;
            continue;
        }
        if (callParts[i] !== p) {
            return false;
        }
        i++;
        j++;
    }

    if (j < patParts.length && (patParts[j].startsWith('[[...') || patParts[j].startsWith('[...'))) {
        return true;
    }

    return i === callParts.length && j === patParts.length;
}

const unmatched = [];
apiCalls.forEach(callItem => {
    const target = callItem.endpoint;
    const matchExp = backendEndpoints.some(b => matchesPattern(target, b.path));
    const matchNxt = nextApiRoutes.some(n => matchesPattern(target, n));
    if (!matchExp && !matchNxt) {
        unmatched.push(callItem);
    }
});

console.log('Unmatched API calls count:', unmatched.length);
unmatched.forEach(u => {
    console.log(`[Unmatched API] ${u.endpoint} in ${u.file}`);
});
