const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat && stat.isDirectory()) results = results.concat(walk(full));
        else if (/\.(tsx|ts|jsx|js|css|html)$/.test(file)) results.push(full);
    });
    return results;
}

const frontendSrc = path.resolve('frontend-next/src');
const files = walk(frontendSrc);

const assetRefs = [];
const publicDir = path.resolve('frontend-next/public');

files.forEach(f => {
    const code = fs.readFileSync(f, 'utf8');
    const rel = path.relative(frontendSrc, f).replace(/\\/g, '/');

    // Matches static asset strings like "/icons/...", "/images/...", "/screenshots/...", "/brochure-apporteur.pdf", etc.
    const assetRegex = /["'`]((\/(?:icons|screenshots|images|assets)[^"'`\s?#)]+|\/[a-zA-Z0-9_-]+\.(?:png|jpg|jpeg|svg|ico|webp|pdf|json|mp4)))(?:[?#][^"'`\s]*)?["'`]/g;
    let m;
    while ((m = assetRegex.exec(code)) !== null) {
        const assetPath = m[1];
        // skip Next.js API or special routes
        if (assetPath.startsWith('/api') || assetPath === '/icon' || assetPath === '/apple-icon') continue;
        assetRefs.push({ file: rel, asset: assetPath });
    }
});

console.log('Total static asset references found:', assetRefs.length);

const missingAssets = [];
const checkedAssets = new Map();

assetRefs.forEach(ref => {
    if (checkedAssets.has(ref.asset)) {
        if (!checkedAssets.get(ref.asset)) missingAssets.push(ref);
        return;
    }
    const localPath = path.join(publicDir, ref.asset);
    const exists = fs.existsSync(localPath);
    checkedAssets.set(ref.asset, exists);
    if (!exists) {
        missingAssets.push(ref);
    }
});

console.log('Missing assets count:', missingAssets.length);
missingAssets.forEach(m => {
    console.log(`[MISSING ASSET] ${m.asset} referenced in ${m.file}`);
});
