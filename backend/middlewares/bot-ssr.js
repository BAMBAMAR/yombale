// Middleware SSR pour les bots (Googlebot, Bingbot…)
// Pour les vraies URLs /produit/:id et /immo/:id, on sert du HTML pré-rendu
// avec le contenu visible + JSON-LD pour l'indexation. Les humains passent
// directement à l'index.html et récupèrent la SPA normalement.

const path = require('path');
const { pool } = require('../models/db');

const BOT_RE = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|exabot|facebot|ia_archiver|twitterbot|linkedinbot|whatsapp|applebot|rogerbot|semrushbot|ahrefsbot/i;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FRONTEND = path.join(__dirname, '../../frontend/index.html');

function isBot(ua) { return BOT_RE.test(ua || ''); }

function esc(s) {
  return (s == null ? '' : String(s))
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fcfa(n) {
  return new Intl.NumberFormat('fr-FR').format(Number(n)) + ' FCFA';
}

function ssrPage({ title, desc, canonical, body, schema }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)} | Nopalou</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${esc(canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:image" content="https://nopalou.com/icons/icon-512.png">
  ${schema ? `<script type="application/ld+json">${schema}</script>` : ''}
  <link rel="stylesheet" href="/style.css?v=15">
</head>
<body>
<nav style="background:#fff;border-bottom:1px solid #e2e8f0;padding:12px 20px">
  <a href="/" style="font-weight:800;color:#1d4ed8;text-decoration:none;font-size:18px">Nopalou</a>
</nav>
${body}
<script src="/app.js?v=27" defer></script>
</body>
</html>`;
}

async function renderProduit(req, res, id) {
  try {
    const [pRes, oRes] = await Promise.all([
      pool.query('SELECT * FROM produits WHERE id = $1', [id]),
      pool.query(
        `SELECT o.prix, o.url_achat, m.nom AS marchand_nom
         FROM offres o JOIN marchands m ON o.marchand_id = m.id
         WHERE o.produit_id = $1 AND o.actif = true
         ORDER BY o.prix ASC LIMIT 20`,
        [id]
      ),
    ]);
    if (!pRes.rows[0]) return res.sendFile(FRONTEND);

    const p = pRes.rows[0];
    const offres = oRes.rows;
    const offresValides = offres.filter(function(o) {
      if (offres.length < 3) return true;
      const sorted = offres.map(function(x) { return +x.prix; }).sort(function(a,b){return a-b;});
      const med = sorted[Math.floor(sorted.length / 2)];
      const ratio = +o.prix / med;
      return ratio >= 0.1 && ratio <= 15;
    });
    const prixMin = offresValides.length
      ? Math.min.apply(null, offresValides.map(function(o){ return +o.prix; }))
      : null;

    const offresRows = offresValides.map(function(o) {
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9">${esc(o.marchand_nom)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-weight:700;color:#1d4ed8">${fcfa(o.prix)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9">
          <a href="${esc(o.url_achat || '#')}" rel="nofollow noopener" target="_blank"
             style="color:#1d4ed8">Voir l'offre →</a>
        </td>
      </tr>`;
    }).join('');

    const schema = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.nom,
      image: p.image_url || '',
      brand: p.marque ? { '@type': 'Brand', name: p.marque } : undefined,
      offers: offresValides.map(function(o) {
        return {
          '@type': 'Offer',
          price: +o.prix,
          priceCurrency: 'XOF',
          availability: 'https://schema.org/InStock',
          url: o.url_achat || ('https://nopalou.com/produit/' + id),
          seller: { '@type': 'Organization', name: o.marchand_nom || '' },
        };
      }),
    });

    const body = `
<div style="max-width:960px;margin:32px auto;padding:0 20px 80px">
  <a href="/" style="color:#1d4ed8;font-size:13px;text-decoration:none">← Retour</a>
  <h1 style="margin:16px 0 4px;font-size:26px">${esc(p.nom)}</h1>
  ${p.marque ? `<p style="color:#64748b;margin:0 0 12px">Marque : ${esc(p.marque)}</p>` : ''}
  ${prixMin ? `<p style="font-size:28px;font-weight:800;color:#1d4ed8;margin:0 0 20px">À partir de ${fcfa(prixMin)}</p>` : ''}
  ${p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(p.nom)}" loading="lazy"
       style="max-width:280px;border-radius:12px;margin-bottom:24px;display:block">` : ''}
  <h2 style="font-size:18px;margin-bottom:12px">Comparaison des prix</h2>
  <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">
    <thead style="background:#f8fafc">
      <tr>
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b">Marchand</th>
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b">Prix</th>
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b"></th>
      </tr>
    </thead>
    <tbody>${offresRows || '<tr><td colspan="3" style="padding:16px;color:#64748b">Aucune offre disponible</td></tr>'}</tbody>
  </table>
</div>`;

    res.send(ssrPage({
      title: p.nom,
      desc: `Comparez les prix de ${p.nom}${prixMin ? ' — à partir de ' + fcfa(prixMin) : ''} chez les meilleurs marchands au Sénégal.`,
      canonical: 'https://nopalou.com/produit/' + id,
      body,
      schema,
    }));
  } catch (err) {
    console.error('[BOT-SSR produit]', err.message);
    res.sendFile(FRONTEND);
  }
}

async function renderImmo(req, res, id) {
  try {
    const r = await pool.query(
      "SELECT * FROM annonces_immo WHERE id = $1 AND statut = 'approuvee'",
      [id]
    );
    if (!r.rows[0]) return res.sendFile(FRONTEND);
    const a = r.rows[0];

    const schema = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'RealEstateListing',
      name: a.titre,
      description: a.description || '',
      url: 'https://nopalou.com/immo/' + id,
      address: {
        '@type': 'PostalAddress',
        addressLocality: a.ville || 'Dakar',
        addressCountry: 'SN',
      },
    });

    const body = `
<div style="max-width:960px;margin:32px auto;padding:0 20px 80px">
  <a href="/immo" style="color:#1d4ed8;font-size:13px;text-decoration:none">← Annonces immobilières</a>
  <h1 style="margin:16px 0 8px;font-size:26px">${esc(a.titre)}</h1>
  <p style="font-size:24px;font-weight:800;color:#1d4ed8;margin:0 0 8px">
    ${a.prix ? fcfa(a.prix) : 'Prix sur demande'}
  </p>
  <p style="color:#64748b;margin:0 0 16px">
    ${esc(a.ville || '')}${a.quartier ? ' — ' + esc(a.quartier) : ''}
  </p>
  ${a.description ? `<p style="line-height:1.7;color:#334155">${esc(a.description)}</p>` : ''}
</div>`;

    res.send(ssrPage({
      title: a.titre,
      desc: `${a.titre} — ${a.ville || 'Dakar'}${a.prix ? ' — ' + fcfa(a.prix) : ''}. Annonce immobilière sur Nopalou.`,
      canonical: 'https://nopalou.com/immo/' + id,
      body,
      schema,
    }));
  } catch (err) {
    console.error('[BOT-SSR immo]', err.message);
    res.sendFile(FRONTEND);
  }
}

module.exports = function botSsr(req, res, next) {
  if (!isBot(req.headers['user-agent'])) return next();

  const p = req.path;
  let m;

  if ((m = p.match(/^\/produit\/([^/?#]+)/))) {
    if (!UUID_RE.test(m[1])) return next();
    return renderProduit(req, res, m[1]);
  }
  if ((m = p.match(/^\/immo\/([^/?#]+)/))) {
    if (!UUID_RE.test(m[1])) return next();
    return renderImmo(req, res, m[1]);
  }

  next();
};
