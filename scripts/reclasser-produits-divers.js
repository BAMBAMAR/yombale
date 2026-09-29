const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const REGLES_RECLASSEMENT = [
  {
    slug: 'tv-electro',
    regex: /\b(televiseur|television|tv|pouces|smart tv|led tv|oled|qled|refrigerat|frigo|congelat|climatiseur|split|lave-linge|machine a laver|cuisiniere|feux|encastrable|micro-onde|four|blender|mixeur|bouilloire|aspirateur|fer a repasser|ventilateur|air fryer|hachoir|plaque de cuisson|presse-agrume)\b/i
  },
  {
    slug: 'smartphones',
    regex: /\b(smartphone|iphone|galaxy [asmnz]|redmi|tecno|infinix|oppo|vivo|realme|itel|telephone portable|huawei p|huawei nova|xiaomi poco)\b/i
  },
  {
    slug: 'informatique',
    regex: /\b(ordinateur|laptop|pc portable|macbook|thinkpad|ideapad|dell inspiron|hp pavilion|imprimante|moniteur|ecran pc|disque dur|ssd|clavier|souris|routeur|tablette|ipad|canon|camera ip|camera)\b/i
  },
  {
    slug: 'beaute',
    regex: /\b(parfum|eau de parfum|eau de toilette|creme|serum|visage|lait de beaute|lait corporel|shampoing|gel douche|gommage|savon|maquillage|rouge a levres|fond de teint|mascara|cosmetique|soin corps|collagene|cheveux)\b/i
  },
  {
    slug: 'maison',
    regex: /\b(tableau|decoration|decoratif|vase|canape|fauteuil|chaise|table basse|table a manger|armoire|commode|lit|matelas|meuble|cuisine|drap|rideau|coussin|vaisselle)\b/i
  },
  {
    slug: 'mode',
    regex: /\b(robe|chemise|pantalon|chaussure|sandale|basket|sneaker|sac a main|sacoche|montre|bazin|t-shirt|costume|veste|talons)\b/i
  },
  {
    slug: 'alimentation',
    regex: /\b(riz|huile|sucre|cafe|the vert|chocolat|biscuit|boisson|soda|eau minerale|mayonnaise|moutarde|ketchup|pate|spaghetti|lait en poudre)\b/i
  },
  {
    slug: 'auto-moto',
    regex: /\b(pneu|batterie voiture|piece auto|entretien voiture|huile moteur|casque moto|moto|scooter)\b/i
  }
];

async function main() {
  console.log('=== DÉBUT RECLASSEMENT INTELLIGENT DES PRODUITS "DIVERS" ===');
  const client = await pool.connect();

  try {
    // 1. Récupérer les ID des catégories
    const { rows: cats } = await client.query('SELECT id, slug, nom FROM categories');
    const catMap = {};
    cats.forEach(c => catMap[c.slug] = c.id);

    const diversId = catMap['divers'];
    if (!diversId) throw new Error('Catégorie divers introuvable');

    // 2. Extraire tous les produits en catégorie Divers
    const { rows: prods } = await client.query(`
      SELECT id, nom, description 
      FROM produits 
      WHERE categorie_id = $1
    `, [diversId]);
    console.log(`Produits trouvés dans "Divers" : ${prods.length}`);

    let reclasses = 0;
    const stats = {};

    for (const p of prods) {
      // Nettoyer les entités HTML résiduelles
      const texte = `${p.nom || ''} ${p.description || ''}`
        .replace(/&#8211;/g, '-')
        .replace(/&rsquo;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"');

      let cibleSlug = null;
      for (const regle of REGLES_RECLASSEMENT) {
        if (regle.regex.test(texte)) {
          cibleSlug = regle.slug;
          break;
        }
      }

      if (cibleSlug && catMap[cibleSlug]) {
        await client.query(`
          UPDATE produits 
          SET categorie_id = $1,
              nom = REGEXP_REPLACE(nom, '&#8211;', '-', 'g')
          WHERE id = $2
        `, [catMap[cibleSlug], p.id]);
        reclasses++;
        stats[cibleSlug] = (stats[cibleSlug] || 0) + 1;
      }
    }

    console.log(`\n✅ ${reclasses} produits reclassés avec succès depuis "Divers" !`);
    console.table(stats);

    // 3. Nouveau décompte dans Divers
    const { rows: [restant] } = await client.query(`
      SELECT count(*) as cnt FROM produits WHERE categorie_id = $1
    `, [diversId]);
    console.log(`Produits restants dans Divers : ${restant.cnt} (contre ${prods.length} initialement)`);

  } catch (err) {
    console.error('Erreur reclassification :', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
