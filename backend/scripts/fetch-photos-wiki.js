/**
 * fetch-photos-wiki.js — Script automatisé pour récupérer des photos distinctes
 * Utilise l'API publique de Wikipedia/Wikimedia (AUCUNE CLE API REQUISE)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Pause pour ne pas spammer l'API
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Requête vers l'API Wikipedia
function searchWikipedia(query) {
  return new Promise((resolve, reject) => {
    const url = `https://fr.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&generator=search&gsrsearch=${encodeURIComponent(query)}&pithumbsize=500`;
    const options = {
      headers: {
        'User-Agent': 'YombaleCatalogBuilder/1.0 (contact@yombale.com)'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.query && json.query.pages) {
            // Trouver la première page avec une image
            const pages = Object.values(json.query.pages);
            const withImage = pages.find(p => p.thumbnail);
            if (withImage) {
              resolve(withImage.thumbnail.source);
            } else {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Nettoyer le nom pour la recherche
function getCleanQuery(nom, categorie) {
  let query = nom.replace(/\s*\(Modèle\s*\d+\)\s*$/i, '').trim();
  // Retirer les marques trop spécifiques si besoin pour trouver une photo générique
  query = query.replace(/(50kg|25kg|5kg|1kg|500g)/ig, '').trim();
  return query;
}

async function main() {
  const catalogPath = path.join(__dirname, '..', 'data', 'catalogues-standards.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  
  const mappingPath = path.join(__dirname, '..', 'data', 'photo-mapping.json');
  let mapping = {};
  if (fs.existsSync(mappingPath)) {
    mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  }
  
  const products = [];
  for (const [cat, items] of Object.entries(catalog)) {
    const seen = new Set();
    items.forEach(item => {
      const baseName = item.nom.replace(/\s*\(Modèle\s*\d+\)\s*$/i, '').trim();
      if (!seen.has(baseName)) {
        seen.add(baseName);
        if (!mapping[baseName]) {
          products.push({ nom: baseName, categorie: cat });
        }
      }
    });
  }
  
  console.log(`\n🔍 ${products.length} produits à rechercher sur Wikipedia...`);
  
  if (products.length === 0) {
    console.log('✅ Tous les produits ont déjà une photo !');
    return;
  }
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const query = getCleanQuery(product.nom, product.categorie);
    
    process.stdout.write(`[${i + 1}/${products.length}] ${product.nom} -> `);
    
    try {
      const photoUrl = await searchWikipedia(query);
      if (photoUrl) {
        mapping[product.nom] = photoUrl;
        successCount++;
        console.log('✅');
      } else {
        // Fallback en anglais si echec en francais
        const enPhotoUrl = await new Promise((resolve) => {
          const urlEn = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&generator=search&gsrsearch=${encodeURIComponent(query)}&pithumbsize=500`;
          https.get(urlEn, {headers: {'User-Agent': 'YombaleCatalogBuilder/1.0'}}, (res) => {
            let data = ''; res.on('data', chunk => data += chunk);
            res.on('end', () => {
              try {
                const json = JSON.parse(data);
                const pages = json.query && json.query.pages ? Object.values(json.query.pages) : [];
                const img = pages.find(p => p.thumbnail);
                resolve(img ? img.thumbnail.source : null);
              } catch (e) { resolve(null); }
            });
          });
        });
        
        if (enPhotoUrl) {
          mapping[product.nom] = enPhotoUrl;
          successCount++;
          console.log('✅ (EN fallback)');
        } else {
          failCount++;
          console.log('❌');
        }
      }
    } catch (err) {
      failCount++;
      console.log('❌ Erreur');
    }
    
    await sleep(200); // 5 req / second max
    
    if ((i + 1) % 50 === 0) {
      fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2), 'utf8');
    }
  }
  
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2), 'utf8');
  console.log(`\n✅ Terminé ! ${successCount} nouvelles photos trouvées.`);
}

main().catch(console.error);
