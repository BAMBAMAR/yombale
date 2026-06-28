// backend/routes/facebook-posts.js — Gestion des publications Facebook + Instagram
const express = require('express');
const router  = express.Router();
const { pool } = require('../models/db');
const { adminSecretOnly } = require('../middlewares/auth');
const https = require('https');
const qs    = require('querystring');

router.use(adminSecretOnly);

// ── Helpers token ────────────────────────────────────────────────────────────

async function getToken() {
  try {
    const { rows } = await pool.query(`SELECT value FROM settings WHERE key='fb_page_access_token'`);
    if (rows.length && rows[0].value) return rows[0].value;
  } catch (_) {}
  return process.env.FB_PAGE_ACCESS_TOKEN || null;
}

async function setToken(token) {
  await pool.query(
    `INSERT INTO settings (key, value, updated_at) VALUES ('fb_page_access_token', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET value=$1, updated_at=NOW()`,
    [token]
  );
}

// GET /api/facebook-posts/token-status
router.get('/token-status', async (req, res) => {
  const token = await getToken();
  if (!token) return res.json({ status: 'missing', message: 'Aucun token configuré' });
  try {
    const r    = await fetch(`https://graph.facebook.com/v19.0/me?fields=name,id&access_token=${token}`);
    const data = await r.json();
    if (data.error) {
      return res.json({ status: 'expired', message: data.error.message });
    }
    // Récupère la date d'expiration via debug_token
    const appToken = `${process.env.FB_APP_ID}|${process.env.FB_APP_SECRET}`;
    const dbg  = await fetch(`https://graph.facebook.com/v19.0/debug_token?input_token=${token}&access_token=${appToken}`);
    const dbgD = await dbg.json();
    const exp  = dbgD.data?.expires_at;
    const type = dbgD.data?.type;
    return res.json({
      status: 'ok',
      name: data.name,
      id: data.id,
      type,
      expires_at: exp ? new Date(exp * 1000).toISOString() : null,
      is_page_token: type === 'PAGE',
    });
  } catch (e) {
    return res.json({ status: 'error', message: e.message });
  }
});

// POST /api/facebook-posts/token — mettre à jour le token FB (page token direct)
router.post('/token', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token requis' });
  try {
    const r    = await fetch(`https://graph.facebook.com/v19.0/me?fields=name,id&access_token=${token}`);
    const data = await r.json();
    if (data.error) return res.status(400).json({ error: `Token invalide : ${data.error.message}` });
    await setToken(token);
    res.json({ ok: true, name: data.name, id: data.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/facebook-posts/token-exchange — échange un user token court en page token permanent
// 1. Échange user_token court → long-lived user token (60j)
// 2. Récupère le page token depuis ce long-lived token → ne expire jamais
router.post('/token-exchange', async (req, res) => {
  const { user_token } = req.body;
  if (!user_token) return res.status(400).json({ error: 'user_token requis' });

  const appId     = process.env.FB_APP_ID;
  const appSecret = process.env.FB_APP_SECRET;
  const pageId    = process.env.FB_PAGE_ID;
  if (!appId || !appSecret) return res.status(500).json({ error: 'FB_APP_ID / FB_APP_SECRET non configurés côté serveur' });
  if (!pageId)              return res.status(500).json({ error: 'FB_PAGE_ID non configuré côté serveur' });

  try {
    // Étape 1 : long-lived user token
    const llRes  = await fetch(
      `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${encodeURIComponent(user_token)}`
    );
    const llData = await llRes.json();
    if (llData.error) return res.status(400).json({ error: `Échange échoué : ${llData.error.message}` });
    const longLivedToken = llData.access_token;

    // Étape 2 : page access token (ne expire pas)
    const pgRes  = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}?fields=access_token,name&access_token=${longLivedToken}`
    );
    const pgData = await pgRes.json();
    if (pgData.error) return res.status(400).json({ error: `Récupération page token échouée : ${pgData.error.message}` });
    if (!pgData.access_token) return res.status(400).json({ error: 'Aucun page token retourné — vérifiez que vous avez les droits pages_manage_posts sur cette page' });

    await setToken(pgData.access_token);
    res.json({ ok: true, name: pgData.name, permanent: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/facebook-posts/generer/:type — génère un brouillon depuis la DB
router.get('/generer/:type', async (req, res) => {
  const { type } = req.params;
  try {
    let result = null;

    if (type === 'bon-plan') {
      const { rows } = await pool.query(`
        SELECT p.nom, p.marque, p.image_url, p.id as produit_id,
               MIN(o.prix) as prix_min,
               MAX(o.prix) as prix_max,
               m.nom as marchand
        FROM produits p
        JOIN offres o ON o.produit_id = p.id
        JOIN marchands m ON m.id = o.marchand_id
        WHERE o.stock = true AND o.prix > 0 AND p.image_url IS NOT NULL
        GROUP BY p.id, p.nom, p.marque, p.image_url, m.nom
        HAVING MAX(o.prix) - MIN(o.prix) > 1000
        ORDER BY (MAX(o.prix) - MIN(o.prix)) DESC
        LIMIT 10
      `);
      if (rows.length) {
        const p = rows[Math.floor(Math.random() * rows.length)];
        const eco = Math.round(p.prix_max - p.prix_min);
        const nom = [p.marque, p.nom].filter(Boolean).join(' ');
        result = {
          message: `🔥 BON PLAN DU JOUR !\n\n📱 ${nom}\n💰 À partir de ${Number(p.prix_min).toLocaleString('fr-FR')} FCFA chez ${p.marchand}\n\nÉconomisez jusqu'à ${eco.toLocaleString('fr-FR')} FCFA en comparant avant d'acheter !\n\n👉 Comparez tous les prix sur nopalou.com\n\n#Nopalou #BonPlan #Dakar #Sénégal #PrixMoinsCher`,
          image_url: p.image_url,
          lien: `https://nopalou.com/produit/${p.produit_id}`,
        };
      }
    }

    else if (type === 'immo') {
      const { rows } = await pool.query(`
        SELECT id, titre, prix, ville, quartier, type_bien, transaction, photos
        FROM annonces_immo
        WHERE actif = true AND supprimee = false AND photos IS NOT NULL AND jsonb_array_length(photos) > 0
        ORDER BY created_at DESC LIMIT 5
      `);
      if (rows.length) {
        const a = rows[Math.floor(Math.random() * rows.length)];
        const loc = [a.quartier, a.ville].filter(Boolean).join(', ') || 'Dakar';
        const type = a.transaction === 'vente' ? 'À VENDRE' : 'À LOUER';
        const prix = a.prix ? `${Number(a.prix).toLocaleString('fr-FR')} FCFA${a.transaction !== 'vente' ? '/mois' : ''}` : 'Prix à négocier';
        result = {
          message: `🏠 ${type} — ${a.type_bien || 'Bien immobilier'}\n\n📍 ${loc}\n💰 ${prix}\n\n${a.titre}\n\nDes centaines d'annonces immo disponibles sur Nopalou — villas, appartements, terrains à Dakar et partout au Sénégal.\n\n👉 nopalou.com/immo\n\n#Immobilier #Dakar #Sénégal #${a.transaction === 'vente' ? 'Vente' : 'Location'} #Nopalou`,
          image_url: a.photos?.[0] || null,
          lien: `https://nopalou.com/immo/${a.id}`,
        };
      }
    }

    else if (type === 'comparatif') {
      const { rows } = await pool.query(`
        SELECT p.nom, p.marque, p.image_url, p.id as produit_id,
               COUNT(DISTINCT o.marchand_id) as nb_marchands,
               MIN(o.prix) as prix_min, MAX(o.prix) as prix_max
        FROM produits p
        JOIN offres o ON o.produit_id = p.id
        WHERE o.stock = true AND o.prix > 0 AND p.image_url IS NOT NULL
        GROUP BY p.id, p.nom, p.marque, p.image_url
        HAVING COUNT(DISTINCT o.marchand_id) >= 2 AND MAX(o.prix) - MIN(o.prix) > 3000
        ORDER BY COUNT(DISTINCT o.marchand_id) DESC, (MAX(o.prix) - MIN(o.prix)) DESC
        LIMIT 10
      `);
      if (rows.length) {
        const p = rows[Math.floor(Math.random() * rows.length)];
        const eco = Math.round(p.prix_max - p.prix_min);
        const nom = [p.marque, p.nom].filter(Boolean).join(' ');
        result = {
          message: `📊 COMPARER C'EST ÉCONOMISER !\n\n${nom} est vendu à des prix très différents selon le marchand au Sénégal.\n\n💸 Jusqu'à ${eco.toLocaleString('fr-FR')} FCFA de différence entre les marchands !\n\nNopalou compare ${p.nb_marchands} marchands en temps réel pour vous trouver le meilleur prix.\n\n👉 Voir tous les prix sur nopalou.com\n\n#Nopalou #Comparateur #${(p.marque || 'Tech').replace(/\s/g,'')} #Dakar #Sénégal #PrixMoinsCher`,
          image_url: p.image_url,
          lien: `https://nopalou.com/produit/${p.produit_id}`,
        };
      }
    }

    else if (type === 'conseil') {
      const conseils = [
        {
          message: `💡 CONSEIL ACHAT #1\n\nAvant d'acheter un téléphone en ligne au Sénégal :\n\n✅ Comparez les prix sur plusieurs sites\n✅ Vérifiez la garantie (locale ou importée)\n✅ Lisez les avis des acheteurs\n✅ Privilégiez les vendeurs vérifiés\n✅ Gardez votre reçu de paiement\n\nNopalou compare automatiquement les prix chez tous les marchands en ligne.\n\n👉 nopalou.com\n\n#ConseilAchat #Smartphone #Dakar #Sénégal #Nopalou`,
          image_url: null, lien: 'https://nopalou.com',
        },
        {
          message: `💡 LE SAVIEZ-VOUS ?\n\nAu Sénégal, le même produit peut coûter jusqu'à 40% moins cher selon le site où vous l'achetez.\n\nNopalou indexe en temps réel :\n📦 +3 000 produits\n🏪 9 sites partenaires\n🔄 Mis à jour toutes les 6h\n\nComparez avant d'acheter — c'est gratuit !\n\n👉 nopalou.com\n\n#Nopalou #BonPlan #Dakar #Sénégal #Shopping #PrixMoinsCher`,
          image_url: null, lien: 'https://nopalou.com',
        },
      ];
      result = conseils[Math.floor(Math.random() * conseils.length)];
    }

    if (!result) return res.status(404).json({ error: 'Aucun contenu trouvé pour ce type' });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/facebook-posts
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM facebook_posts ORDER BY created_at DESC LIMIT 100`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/facebook-posts — créer un brouillon
router.post('/', async (req, res) => {
  const { message, lien, image_url, publier_instagram, date_publication } = req.body;
  if (!message) return res.status(400).json({ error: 'message requis' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO facebook_posts (message, lien, image_url, publier_instagram, date_publication)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [message, lien || null, image_url || null, !!publier_instagram, date_publication || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/facebook-posts/:id — modifier
router.patch('/:id', async (req, res) => {
  const { message, lien, image_url, publier_instagram, date_publication, statut } = req.body;
  const allowed = ['brouillon', 'approuve'];
  if (statut && !allowed.includes(statut)) return res.status(400).json({ error: 'statut invalide' });
  try {
    const { rows } = await pool.query(
      `UPDATE facebook_posts
       SET message           = COALESCE($1, message),
           lien              = COALESCE($2, lien),
           image_url         = COALESCE($3, image_url),
           publier_instagram  = CASE WHEN $4::boolean IS NOT NULL THEN $4::boolean ELSE publier_instagram END,
           date_publication  = COALESCE($5, date_publication),
           statut            = COALESCE($6, statut),
           updated_at        = NOW()
       WHERE id = $7 AND statut NOT IN ('publie')
       RETURNING *`,
      [message || null, lien || null, image_url || null,
       publier_instagram !== undefined ? publier_instagram : null,
       date_publication || null, statut || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Post introuvable ou déjà publié' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/facebook-posts/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM facebook_posts WHERE id = $1 AND statut != 'publie'`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/facebook-posts/:id/publier — publication immédiate
router.post('/:id/publier', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(`SELECT * FROM facebook_posts WHERE id = $1`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Post introuvable' });
    const post = rows[0];
    if (post.statut === 'publie') return res.status(400).json({ error: 'Déjà publié' });

    const results = await publierPost(post);

    await pool.query(
      `UPDATE facebook_posts
       SET statut='publie', post_fb_id=$1, post_ig_id=$2, date_publie=NOW(),
           erreur=$3, updated_at=NOW()
       WHERE id=$4`,
      [results.fb_id || null, results.ig_id || null, results.erreur || null, id]
    );

    if (results.erreur && !results.fb_id) return res.status(502).json({ error: results.erreur });
    res.json({ ok: true, fb_id: results.fb_id, ig_id: results.ig_id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Fonctions de publication ──────────────────────────────────────────────────

async function publierPost(post) {
  const results = { fb_id: null, ig_id: null, erreur: null };

  // Publication Facebook
  const fbRes = await publierFacebook(post);
  if (fbRes.id) {
    results.fb_id = fbRes.id;
  } else {
    results.erreur = `FB: ${fbRes.error?.message || 'Erreur inconnue'}`;
  }

  // Publication Instagram (si demandé et FB réussi)
  if (post.publier_instagram && process.env.IG_USER_ID) {
    const igRes = await publierInstagram(post);
    if (igRes.id) {
      results.ig_id = igRes.id;
    } else {
      const igErr = `IG: ${igRes.error?.message || 'Erreur inconnue'}`;
      results.erreur = results.erreur ? `${results.erreur} | ${igErr}` : igErr;
    }
  }

  return results;
}

async function publierFacebook(post) {
  return new Promise(async (resolve) => {
    const pageId = process.env.FB_PAGE_ID;
    const token  = await getToken();
    if (!pageId || !token) return resolve({ error: { message: 'FB_PAGE_ID / FB_PAGE_ACCESS_TOKEN non configurés' } });

    // Post avec photo → /photos, sinon → /feed
    const endpoint = post.image_url ? 'photos' : 'feed';
    const params = { access_token: token };
    if (post.image_url) {
      params.url     = post.image_url;
      params.caption = post.message;
    } else {
      params.message = post.message;
      if (post.lien) params.link = post.lien;
    }

    const body = Buffer.from(qs.stringify(params), 'utf8');
    const opts = {
      hostname: 'graph.facebook.com',
      path: `/v19.0/${pageId}/${endpoint}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': body.length },
    };
    const req = https.request(opts, (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', e => resolve({ error: { message: e.message } }));
    req.write(body);
    req.end();
  });
}

async function publierInstagram(post) {
  const igId = process.env.IG_USER_ID;
  const token = await getToken();
  if (!igId || !token) return { error: { message: 'IG_USER_ID non configuré' } };
  if (!post.image_url) return { error: { message: 'Une image est requise pour Instagram' } };

  // Étape 1 : créer le container média
  const container = await igApiCall('POST', `/${igId}/media`, {
    image_url: post.image_url,
    caption: post.message,
    access_token: token,
  });
  if (!container.id) return container;

  // Étape 2 : publier le container
  return igApiCall('POST', `/${igId}/media_publish`, {
    creation_id: container.id,
    access_token: token,
  });
}

function igApiCall(method, path, params) {
  return new Promise((resolve) => {
    const body = Buffer.from(qs.stringify(params), 'utf8');
    const opts = {
      hostname: 'graph.facebook.com',
      path: `/v19.0${path}`,
      method,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': body.length },
    };
    const req = https.request(opts, (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', e => resolve({ error: { message: e.message } }));
    req.write(body);
    req.end();
  });
}

module.exports = router;
module.exports.publierPost = publierPost;
