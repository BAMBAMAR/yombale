const fs = require('fs');
const path = require('path');

// 1. Gather all frontend page routes
function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(full));
        } else {
            results.push(full);
        }
    });
    return results;
}

const appDir = path.resolve('frontend-next/src/app');
const pageFiles = walk(appDir).filter(f => /page\.(tsx|jsx|js|ts)$/.test(f));
const frontendRoutes = pageFiles.map(f => {
    let rel = path.relative(appDir, f).replace(/\\/g, '/');
    rel = rel.replace(/\/page\.(tsx|jsx|js|ts)$/, '');
    if (rel === 'page.tsx' || rel === 'page.ts' || rel === 'page.jsx' || rel === 'page.js' || rel === '') {
        rel = '/';
    } else {
        // remove route groups e.g. (account)/, (auth)/, (protected)/
        const parts = rel.split('/').filter(p => !p.startsWith('(') || !p.endsWith(')'));
        rel = '/' + parts.join('/');
    }
    return rel;
});

console.log('Normalized frontend routes count:', frontendRoutes.length);

// 2. Load scanned links
const scanData = JSON.parse(fs.readFileSync('scripts/audit-scan-results.json', 'utf8'));
const links = scanData.links;

function routeMatches(target, routePattern) {
    // Convert Next.js route pattern e.g. /boutiques/[id] to regex
    // Clean target (strip query params, hash)
    let cleanTarget = target.split('?')[0].split('#')[0];
    if (cleanTarget === '') cleanTarget = '/';
    if (cleanTarget.endsWith('/') && cleanTarget.length > 1) {
        cleanTarget = cleanTarget.slice(0, -1);
    }
    
    // Exact match
    if (cleanTarget === routePattern) return true;

    // Convert route pattern to regex: [id] -> [^/]+, [...path] -> .+
    let regexStr = '^' + routePattern
        .replace(/\[\.\.\.([^\]]+)\]/g, '(.+)')
        .replace(/\[\[\.\.\.([^\]]+)\]\]/g, '(.*)')
        .replace(/\[([^\]]+)\]/g, '([^/]+)') + '$';
    
    try {
        const re = new RegExp(regexStr);
        return re.test(cleanTarget);
    } catch(e) {
        return false;
    }
}

// Check which links don't match ANY frontend route
const brokenLinks = [];
links.forEach(item => {
    let target = item.target;
    // skip dynamic expression placeholders like ${...} by replacing them with dummy string for test
    let testTarget = target.replace(/\${[^}]+}/g, 'dummy_val');
    // Also skip static assets like /images/..., /icon..., /manifest...
    if (testTarget.startsWith('/assets') || testTarget.startsWith('/images') || testTarget.startsWith('/icons') || testTarget.endsWith('.png') || testTarget.endsWith('.jpg') || testTarget.endsWith('.svg') || testTarget.endsWith('.ico') || testTarget.endsWith('.webp')) {
        return;
    }

    const matches = frontendRoutes.some(route => routeMatches(testTarget, route));
    if (!matches) {
        brokenLinks.push(item);
    }
});

console.log('Potentially broken or unmatched links count:', brokenLinks.length);
brokenLinks.forEach(b => {
    console.log(`[Broken/Unmatched] Target: "${b.target}" in ${b.file}`);
});
