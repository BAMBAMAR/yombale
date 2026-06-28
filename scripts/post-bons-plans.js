/**
 * post-bons-plans.js
 * Publie automatiquement les meilleurs prix du jour sur Facebook et Instagram.
 *
 * Usage manuel : node scripts/post-bons-plans.js
 * Usage cron   : appelé automatiquement chaque matin à 8h par le backend
 *
 * Variables d'environnement requises :
 *   FB_PAGE_ID           — ID de la Page Facebook Nopalou
 *   FB_PAGE_ACCESS_TOKEN — Token d'accès Page (jamais expirant recommandé)
 *   IG_USER_ID           — ID du compte Instagram Business (optionnel)
 *   DATABASE_URL         — PostgreSQL
 *   NEXT_PUBLIC_SITE_URL — ex: https://nopalou.com
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const { Pool }  = require('pg')
const https     = require('https')

const pool   = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const SITE   = (process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com').replace(/\/$/, '')
const FB_API = 'https://graph.facebook.com/v19.0'

// ── Récupérer les meilleures baisses de prix (24h) ────────────────
async function getBaissesPrix() {
  const { rows } = await pool.query(`
    SELECT
      p.id, p.nom, p.marque,
      c.nom AS categorie_nom,
      p.image_url,
      MIN(o.prix) AS prix_actuel,
      (
        SELECT h.prix
        FROM historique_prix h
        JOIN offres o2 ON o2.id = h.offre_id
        WHERE o2.produit_id = p.id
          AND h.date < NOW() - INTERVAL '20 hours'
          AND h.date > NOW() - INTERVAL '36 hours'
        ORDER BY h.date DESC
        LIMIT 1
      ) AS prix_hier
    FROM produits p
    JOIN offres o ON o.produit_id = p.id AND o.stock = true AND o.prix > 0
    LEFT JOIN categories c ON c.id = p.categorie_id
    WHERE p.sponsorise = false OR p.sponsor_jusqu_au < NOW()
    GROUP BY p.id, c.nom
    HAVING MIN(o.prix) > 0
      AND (
        SELECT h.prix
        FROM historique_prix h
        JOIN offres o2 ON o2.id = h.offre_id
        WHERE o2.produit_id = p.id
          AND h.date < NOW() - INTERVAL '20 hours'
          AND h.date > NOW() - INTERVAL '36 hours'
        ORDER BY h.date DESC
        LIMIT 1
      ) IS NOT NULL
    ORDER BY (
      (
        SELECT h.prix
        FROM historique_prix h
        JOIN offres o2 ON o2.id = h.offre_id
        WHERE o2.produit_id = p.id
          AND h.date < NOW() - INTERVAL '20 hours'
          AND h.date > NOW() - INTERVAL '36 hours'
        ORDER BY h.date DESC
        LIMIT 1
      ) - MIN(o.prix)
    ) / NULLIF((
        SELECT h.prix
        FROM historique_prix h
        JOIN offres o2 ON o2.id = h.offre_id
        WHERE o2.produit_id = p.id
          AND h.date < NOW() - INTERVAL '20 hours'
          AND h.date > NOW() - INTERVAL '36 hours'
        ORDER BY h.date DESC
        LIMIT 1
      ), 0) DESC
    LIMIT 5
  `)
  return rows.filter(r => r.prix_hier && Number(r.prix_hier) > Number(r.prix_actuel))
}

// ── Fallback : top produits si pas de baisses détectées ───────────
async function getTopProduits() {
  const { rows } = await pool.query(`
    SELECT p.id, p.nom, p.marque, c.nom AS categorie_nom, MIN(o.prix) AS prix_actuel,
           COUNT(o.id) AS nb_offres
    FROM produits p
    JOIN offres o ON o.produit_id = p.id AND o.stock = true AND o.prix > 500
    LEFT JOIN categories c ON c.id = p.categorie_id
    GROUP BY p.id, c.nom
    HAVING COUNT(o.id) >= 2
    ORDER BY COUNT(o.id) DESC, MIN(o.prix) ASC
    LIMIT 5
  `)
  return rows
}

// ── Formater le montant en FCFA ────────────────────────────────────
function fcfa(n) {
  return new Intl.NumberFormat('fr-SN').format(Math.round(Number(n))) + ' FCFA'
}

// ── Construire le texte du post ────────────────────────────────────
function buildTexte(baisses, fallback) {
  const jours = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']
  const mois  = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.']
  const now   = new Date()
  const date  = `${jours[now.getDay()]} ${now.getDate()} ${mois[now.getMonth()]}`

  const emojis = { smartphones:'📱', informatique:'💻', 'tv-electro':'📺', mode:'👗', maison:'🏠', 'auto-moto':'🚗', jeux:'🎮' }

  if (baisses.length >= 2) {
    const lignes = baisses.slice(0, 3).map(p => {
      const nom    = p.marque ? `${p.marque} ${p.nom}`.slice(0, 45) : p.nom.slice(0, 45)
      const eco    = fcfa(Number(p.prix_hier) - Number(p.prix_actuel))
      const pct    = Math.round((Number(p.prix_hier) - Number(p.prix_actuel)) / Number(p.prix_hier) * 100)
      const emoji  = emojis[p.categorie_slug] || '🛍'
      return `${emoji} ${nom}\n   ${fcfa(p.prix_actuel)} (-${pct}% · économie de ${eco})`
    }).join('\n\n')

    return `📉 BAISSES DE PRIX DU JOUR — ${date}

${lignes}

👉 Comparez tous les prix sur ${SITE}

#Nopalou #BonPlan #Sénégal #Dakar #PrixMoinsCher #Shopping`
  }

  // Fallback : top produits
  const lignes = fallback.slice(0, 3).map(p => {
    const nom   = p.marque ? `${p.marque} ${p.nom}`.slice(0, 45) : p.nom.slice(0, 45)
    const emoji = '🛍'
    return `${emoji} ${nom} — ${fcfa(p.prix_actuel)} (${p.nb_offres} marchands)`
  }).join('\n')

  return `🔥 MEILLEURS PRIX DU JOUR — ${date}

${lignes}

👉 Comparez sur ${SITE}

#Nopalou #Sénégal #Dakar #PrixMoinsCher #Shopping #Dakar`
}

// ── Appel HTTP vers l'API Graph Facebook ──────────────────────────
function graphPost(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body)
    const url  = new URL(`${FB_API}${path}`)
    const req  = https.request({
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, res => {
      let buf = ''
      res.on('data', c => buf += c)
      res.on('end', () => {
        try { resolve(JSON.parse(buf)) }
        catch { resolve({ raw: buf }) }
      })
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

// ── Publier sur Facebook Page ──────────────────────────────────────
async function posterFacebook(texte) {
  const { FB_PAGE_ID, FB_PAGE_ACCESS_TOKEN } = process.env
  if (!FB_PAGE_ID || !FB_PAGE_ACCESS_TOKEN) {
    console.log('⏭  Facebook — FB_PAGE_ID ou FB_PAGE_ACCESS_TOKEN manquant, skip')
    return null
  }
  const result = await graphPost(`/${FB_PAGE_ID}/feed`, {
    message:      texte,
    link:         SITE,
    access_token: FB_PAGE_ACCESS_TOKEN,
  })
  if (result.id) { console.log(`✅ Facebook publié — post id: ${result.id}`); return result.id }
  console.error('❌ Facebook erreur:', JSON.stringify(result))
  return null
}

// ── Publier sur Instagram (via Conteneur + Publish) ───────────────
async function posterInstagram(texte) {
  const { IG_USER_ID, FB_PAGE_ACCESS_TOKEN } = process.env
  if (!IG_USER_ID || !FB_PAGE_ACCESS_TOKEN) {
    console.log('⏭  Instagram — IG_USER_ID ou FB_PAGE_ACCESS_TOKEN manquant, skip')
    return null
  }
  // Étape 1 : créer le conteneur (text-only = post de type REELS ou caption)
  const container = await graphPost(`/${IG_USER_ID}/media`, {
    caption:      texte,
    media_type:   'REELS',
    video_url:    undefined,
    access_token: FB_PAGE_ACCESS_TOKEN,
  })

  // Instagram text-only non supporté directement — utiliser l'image OG du site
  // On poste avec image_url pointant vers l'OG image de la homepage
  const containerImg = await graphPost(`/${IG_USER_ID}/media`, {
    image_url:    `${SITE}/opengraph-image`,
    caption:      texte,
    access_token: FB_PAGE_ACCESS_TOKEN,
  })

  if (!containerImg.id) {
    console.error('❌ Instagram conteneur erreur:', JSON.stringify(containerImg))
    return null
  }

  // Étape 2 : publier
  const publish = await graphPost(`/${IG_USER_ID}/media_publish`, {
    creation_id:  containerImg.id,
    access_token: FB_PAGE_ACCESS_TOKEN,
  })

  if (publish.id) { console.log(`✅ Instagram publié — post id: ${publish.id}`); return publish.id }
  console.error('❌ Instagram publish erreur:', JSON.stringify(publish))
  return null
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀 Nopalou — Publication bons plans du ${new Date().toLocaleDateString('fr-SN')}\n`)

  let baisses = []
  let fallback = []

  try {
    console.log('📊 Récupération des baisses de prix...')
    baisses = await getBaissesPrix()
    console.log(`   ${baisses.length} baisses détectées`)

    if (baisses.length < 2) {
      console.log('   Pas assez de baisses — fallback top produits')
      fallback = await getTopProduits()
    }
  } catch (err) {
    console.error('❌ Erreur DB:', err.message)
    process.exit(1)
  }

  const texte = buildTexte(baisses, fallback)
  console.log('\n📝 Texte du post :\n─────────────────')
  console.log(texte)
  console.log('─────────────────\n')

  await Promise.allSettled([
    posterFacebook(texte),
    posterInstagram(texte),
  ])

  await pool.end()
  console.log('\n✅ Terminé')
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1) })
