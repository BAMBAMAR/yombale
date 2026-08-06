const fs = require('fs');
let css = fs.readFileSync('src/app/globals.css', 'utf8');

// Replace all .footer-trust { ... } blocks
css = css.replace(/\/\* ── Bandeau confiance footer ──────────────────────────────────── \*\/\s*\.footer-trust\s*\{[\s\S]*?\}/g, '');
css = css.replace(/\.footer-trust\s*\{[^}]+\}/g, '');

const correct = `
/* ── Bandeau confiance footer ──────────────────────────────────── */
.footer-trust {
  background: transparent;
  border-top: 1px solid rgba(255,255,255,.08);
  padding: 16px 5%;
  display: flex;
  justify-content: center;
  gap: 32px;
  flex-wrap: wrap;
}
`;
css = css + correct;

fs.writeFileSync('src/app/globals.css', css);
console.log('Fixed footer-trust duplicates');
