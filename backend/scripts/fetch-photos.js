/**
 * fetch-photos.js — Script automatisé pour récupérer 879 photos Unsplash uniques
 * 
 * Usage: 
 *   set UNSPLASH_ACCESS_KEY=votre_cle_ici
 *   node backend/scripts/fetch-photos.js
 * 
 * Prérequis: Clé API Unsplash gratuite → https://unsplash.com/developers
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
if (!ACCESS_KEY) {
  console.error('❌ Variable UNSPLASH_ACCESS_KEY manquante.');
  console.error('   1. Créez un compte sur https://unsplash.com/developers');
  console.error('   2. Créez une application (Demo) et copiez le Access Key');
  console.error('   3. Relancez avec: set UNSPLASH_ACCESS_KEY=votre_cle && node backend/scripts/fetch-photos.js');
  process.exit(1);
}

// --- Traducteur intelligent FR → EN pour les recherches Unsplash ---
const SEARCH_TERMS = {
  // ALIMENTATION
  'riz': 'rice bag grain',
  'lait': 'milk powder can',
  'nido': 'powdered milk can',
  'café': 'coffee beans ground',
  'nescafé': 'instant coffee jar',
  'thé': 'tea bags box',
  'infusion': 'herbal tea',
  'ketchup': 'ketchup bottle red',
  'mayonnaise': 'mayonnaise jar white',
  'moutarde': 'mustard jar yellow',
  'harissa': 'harissa chili paste',
  'sauce piment': 'hot sauce bottle chili',
  'bouillon': 'bouillon cubes seasoning',
  'jumbo': 'seasoning cubes african',
  'maggi': 'maggi seasoning bottle',
  'knorr': 'seasoning cube',
  'vinaigre': 'vinegar bottle glass',
  'huile dinor': 'cooking oil bottle yellow',
  'huile niani': 'vegetable oil bottle',
  'huile lesieur': 'sunflower oil bottle',
  'huile de palme': 'palm oil red bottle',
  'huile d\'arachide': 'peanut oil bottle',
  'huile d\'olive': 'olive oil bottle glass',
  'huile de sésame': 'sesame oil bottle',
  'huile de mais': 'corn oil bottle',
  'beurre': 'butter block',
  'margarine': 'margarine tub',
  'chocolat': 'chocolate spread jar',
  'nutella': 'nutella jar chocolate',
  'milo': 'milo chocolate drink powder',
  'nesquik': 'chocolate powder drink',
  'sucre en poudre': 'white sugar bag',
  'sucre en morceaux': 'sugar cubes white',
  'sucre roux': 'brown sugar',
  'miel': 'honey jar golden',
  'confiture': 'jam jar fruit preserves',
  'jus': 'fruit juice bottle',
  'eau': 'water bottle mineral',
  'canette': 'soda can drink',
  'coca': 'coca cola bottle',
  'fanta': 'fanta orange soda',
  'sprite': 'sprite green soda',
  'energy': 'energy drink can',
  'bissap': 'hibiscus drink red',
  'sirop': 'syrup bottle',
  'pâtes': 'pasta spaghetti box',
  'spaghetti': 'spaghetti pasta pack',
  'macaroni': 'macaroni pasta',
  'coquillettes': 'shell pasta',
  'vermicelles': 'vermicelli noodles',
  'couscous': 'couscous grain bowl',
  'farine': 'flour bag white',
  'thiakry': 'millet grain african',
  'araw': 'millet couscous',
  'sankhal': 'millet grain',
  'oignon': 'onions bag',
  'pommes de terre': 'potatoes bag',
  'ail': 'garlic cloves',
  'gingembre': 'ginger root',
  'arachide': 'peanuts groundnuts',
  'sardines': 'sardines canned fish tin',
  'thon': 'tuna canned fish',
  'corned beef': 'corned beef tin',
  'kethiakh': 'dried fish african',
  'guedj': 'dried fish',
  'crevettes': 'dried shrimp',

  // SMARTPHONES
  'iphone': 'iphone apple smartphone',
  'samsung galaxy': 'samsung galaxy smartphone',
  'redmi': 'xiaomi redmi smartphone',
  'xiaomi': 'xiaomi smartphone',
  'poco': 'poco smartphone',
  'tecno': 'tecno smartphone android',
  'infinix': 'infinix smartphone',
  'oppo': 'oppo smartphone',
  'realme': 'realme smartphone',
  'airpods': 'apple airpods wireless earbuds',
  'buds': 'wireless earbuds',
  'jbl': 'jbl speaker bluetooth',
  'enceinte': 'bluetooth speaker portable',
  'chargeur': 'phone charger usb',
  'power bank': 'power bank portable charger',
  'montre': 'smartwatch wristwatch',
  'support': 'phone holder car mount',
  'carte mémoire': 'micro sd memory card',

  // INFORMATIQUE
  'macbook': 'macbook apple laptop silver',
  'hp': 'hp laptop computer',
  'dell': 'dell laptop computer',
  'lenovo': 'lenovo laptop thinkpad',
  'asus': 'asus laptop',
  'acer': 'acer laptop',
  'imprimante': 'printer office inkjet',
  'epson': 'epson printer',
  'canon': 'canon printer',
  'scanner': 'barcode scanner handheld',
  'douchette': 'barcode scanner gun',
  'écran': 'computer monitor screen',
  'clavier': 'keyboard computer',
  'souris': 'computer mouse',
  'disque dur': 'external hard drive',
  'ssd': 'ssd solid state drive',
  'clé usb': 'usb flash drive',
  'onduleur': 'ups uninterruptible power supply',
  'routeur': 'wifi router networking',
  'webcam': 'webcam camera computer',
  'casque micro': 'headset microphone office',
  'sac à dos pc': 'laptop backpack',

  // TV & ELECTRO
  'tv led': 'flat screen television',
  'tv': 'smart tv flatscreen',
  'climatiseur': 'air conditioner split unit',
  'ventilateur': 'standing fan electric',
  'réfrigérateur': 'refrigerator fridge',
  'congélateur': 'chest freezer',
  'micro-ondes': 'microwave oven',
  'four': 'electric oven kitchen',
  'cuisinière': 'gas stove cooker',
  'blender': 'blender kitchen',
  'mixeur': 'food processor mixer',
  'robot': 'kitchen robot food processor',
  'fer à repasser': 'clothes iron steam',
  'machine à laver': 'washing machine front load',
  'bouilloire': 'electric kettle stainless',
  'cafetière': 'coffee maker machine',
  'aspirateur': 'vacuum cleaner',
  'chauffe-eau': 'water heater electric',

  // MODE
  't-shirt': 't-shirt cotton basic',
  'polo': 'polo shirt cotton',
  'chemise': 'dress shirt formal',
  'jean': 'blue jeans denim',
  'pantalon': 'pants trousers',
  'chino': 'chino pants beige',
  'short': 'shorts casual',
  'costume': 'suit formal men',
  'blazer': 'blazer jacket formal',
  'bazin': 'african bazin fabric traditional',
  'boubou': 'african boubou traditional dress',
  'djellaba': 'djellaba traditional robe',
  'robe': 'women dress elegant',
  'jupe': 'skirt women',
  'mocassins': 'loafers shoes leather',
  'richelieu': 'oxford shoes leather formal',
  'baskets': 'sneakers shoes white',
  'sandales': 'sandals shoes',
  'escarpins': 'high heels women shoes',
  'sac à main': 'handbag leather women',
  'portefeuille': 'leather wallet men',
  'ceinture': 'leather belt men',
  'parfum': 'perfume bottle luxury',
  'lunettes': 'sunglasses fashion',

  // MAISON
  'drap': 'bed sheets bedding',
  'couverture': 'blanket warm',
  'oreiller': 'pillow white',
  'matelas': 'mattress bed',
  'tapis': 'area rug carpet',
  'canapé': 'sofa couch living room',
  'fauteuil': 'armchair comfortable',
  'table': 'dining table wooden',
  'chaise': 'chair wooden',
  'poêle': 'frying pan cooking',
  'marmite': 'cooking pot stainless',
  'casserole': 'saucepan cooking',
  'assiette': 'dinner plates set',
  'verre': 'drinking glass set',
  'seau': 'cleaning bucket mop',
  'balai': 'broom cleaning floor',
  'horloge': 'wall clock modern',
  'miroir': 'wall mirror',
  'rideau': 'curtains window',
  'lampe': 'table lamp modern',

  // AUTO-MOTO
  'huile moteur': 'motor oil bottle lubricant',
  'liquide': 'car coolant fluid bottle',
  'nettoyant': 'car cleaning product',
  'polish': 'car polish wax',
  'batterie voiture': 'car battery 12v',
  'pneu': 'car tire rubber',
  'casque moto': 'motorcycle helmet',
  'gants moto': 'motorcycle gloves',
  'cric': 'car jack hydraulic',
  'extincteur': 'fire extinguisher car',

  // JEUX
  'ps5': 'playstation 5 console',
  'ps4': 'playstation 4 console',
  'switch': 'nintendo switch console',
  'xbox': 'xbox console',
  'manette': 'game controller gamepad',
  'jeu': 'video game disc case',
  'fifa': 'fifa video game',
  'casque gamer': 'gaming headset rgb',
  'chaise gamer': 'gaming chair rgb',

  // BEAUTE
  'lotion': 'body lotion moisturizer',
  'crème': 'face cream moisturizer',
  'savon': 'bar soap beauty',
  'parfum': 'perfume bottle luxury',
  'shampoing': 'shampoo bottle hair',
  'huile d\'argan': 'argan oil beauty',
  'rouge à lèvres': 'lipstick red cosmetics',
  'fond de teint': 'foundation makeup',
  'mascara': 'mascara cosmetics',
  'sèche-cheveux': 'hair dryer professional',
  'tondeuse': 'hair clipper barber',
  'lisseur': 'hair straightener flat iron',
  'perruque': 'wig hair extension',

  // SPORT
  'maillot': 'football jersey soccer',
  'crampons': 'football cleats soccer shoes',
  'ballon': 'soccer ball football',
  'haltères': 'dumbbells weights gym',
  'tapis de yoga': 'yoga mat fitness',

  // FOURNITURES
  'cahier': 'notebook school exercise',
  'stylo': 'ballpoint pen bic',
  'crayon': 'pencil school',
  'papier': 'paper ream office',
  'classeur': 'binder folder office',
  'calculatrice': 'scientific calculator casio',
  'sac scolaire': 'school backpack',
  'trousse': 'pencil case school',

  // QUINCAILLERIE
  'ciment': 'cement bag construction',
  'peinture': 'paint can bucket',
  'perceuse': 'power drill electric',
  'meuleuse': 'angle grinder power tool',
  'marteau': 'hammer tool',
  'tournevis': 'screwdriver set tool',
  'ampoule': 'led light bulb',
  'rallonge': 'power extension cord',
  'cadenas': 'padlock security',
  'serrure': 'door lock',

  // PIECES RECHANGE
  'plaquettes': 'brake pads car',
  'filtre à huile': 'oil filter car',
  'filtre à air': 'air filter car engine',
  'bougie': 'spark plug car',
  'alternateur': 'car alternator',
  'amortisseur': 'shock absorber car',
  'courroie': 'timing belt car',
  'radiateur': 'car radiator',

  // BIJOUTERIE
  'collier': 'gold necklace jewelry',
  'pendentif': 'gold pendant necklace',
  'bracelet': 'silver bracelet jewelry',
  'bague': 'gold ring jewelry',
  'alliance': 'wedding ring gold',
  'boucles d\'oreilles': 'gold earrings jewelry',

  // MARAICHAGE
  'mangue': 'mango fruit fresh',
  'papaye': 'papaya fruit tropical',
  'citron': 'lemon lime citrus',
  'pastèque': 'watermelon fruit',
  'avocat': 'avocado fruit',
  'banane': 'banana fruit bunch',
  'orange': 'orange fruit citrus',
  'tomate': 'tomato red fresh',
  'carotte': 'carrots fresh vegetables',
  'chou': 'cabbage vegetable',
  'concombre': 'cucumber vegetable',
  'gombo': 'okra vegetable',
  'aubergine': 'eggplant vegetable',
  'persil': 'parsley herbs fresh',
  'menthe': 'mint herb fresh',
  'salade': 'lettuce salad green',

  // ELEVAGE
  'mouton': 'sheep ram livestock',
  'bélier': 'ram sheep',
  'chèvre': 'goat livestock',
  'taureau': 'bull cattle',
  'vache': 'cow dairy cattle',
  'poussin': 'chicks baby chickens',
  'poule': 'chicken hen poultry',
  'couveuse': 'egg incubator',
  'aliment pondeuse': 'poultry feed bag',
  'tourteau': 'animal feed grain',
  'foin': 'hay bale animal feed',

  // PRODUITS AGRICOLES
  'engrais': 'fertilizer bag npk',
  'semences': 'seeds bag agricultural',
  'pulvérisateur': 'agricultural sprayer pump',
  'motopompe': 'water pump irrigation',
  'bâche': 'tarpaulin agricultural',
  'tuyau': 'irrigation hose pipe',

  // SOLAIRE & ENERGIE
  'panneau solaire': 'solar panel monocrystalline',
  'batterie solaire': 'solar battery storage',
  'projecteur': 'led flood light solar',
  'ampoule led': 'led light bulb',
  'lampadaire': 'solar street light',
  'régulateur': 'solar charge controller',
  'convertisseur': 'power inverter solar',
  'ventilateur solaire': 'solar fan',

  // SANTE & PHARMA
  'paracétamol': 'paracetamol pills medicine',
  'doliprane': 'medicine pills box',
  'sirop': 'cough syrup medicine bottle',
  'vitamine': 'vitamin supplement pills',
  'thermomètre': 'digital thermometer medical',
  'tensiomètre': 'blood pressure monitor',
  'masque': 'surgical mask medical',
  'gel hydroalcoolique': 'hand sanitizer gel',
  'pansement': 'bandage adhesive medical',
  'préservatifs': 'condom pack',

  // BEBE & ENFANTS
  'couches': 'baby diapers pack',
  'pampers': 'pampers diapers baby',
  'lingettes': 'baby wipes pack',
  'biberon': 'baby bottle feeding',
  'sucette': 'baby pacifier',
  'poussette': 'baby stroller pram',
  'lit parapluie': 'baby travel cot',
  'transat': 'baby bouncer chair',
  'siège auto': 'baby car seat',
  'jouets': 'baby toys colorful',
};

// Génère un terme de recherche en anglais pour chaque produit
function getSearchQuery(nom, categorie) {
  const n = nom.toLowerCase();
  
  // Chercher le meilleur match dans SEARCH_TERMS (du plus spécifique au plus générique)
  const sortedKeys = Object.keys(SEARCH_TERMS).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (n.includes(key)) {
      return SEARCH_TERMS[key];
    }
  }
  
  // Fallback: utiliser le nom du produit tel quel + catégorie
  const catMapping = {
    'alimentation': 'food product',
    'smartphones': 'smartphone phone',
    'informatique': 'computer technology',
    'tv-electro': 'home appliance',
    'mode': 'fashion clothing',
    'maison': 'home furniture',
    'auto-moto': 'car automotive',
    'jeux': 'video game gaming',
    'beaute': 'beauty cosmetics',
    'sport': 'sports equipment',
    'fournitures': 'school office supplies',
    'quincaillerie': 'hardware tools construction',
    'pieces-rechange': 'auto parts car spare',
    'bijouterie': 'jewelry gold silver',
    'maraichage': 'fresh vegetables market',
    'elevage': 'livestock farm animal',
    'produits-agricoles': 'agriculture farming',
    'solaire-energie': 'solar energy panel',
    'sante-pharma': 'medicine pharmacy health',
    'bebe-enfants': 'baby children products',
  };
  
  return catMapping[categorie] || 'product';
}

// Requête HTTPS vers l'API Unsplash
function searchUnsplash(query) {
  return new Promise((resolve, reject) => {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=squarish`;
    const options = {
      headers: {
        'Authorization': `Client-ID ${ACCESS_KEY}`,
        'Accept-Version': 'v1',
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.results && json.results.length > 0) {
            const photo = json.results[0];
            resolve(photo.urls.raw + '&w=400&h=400&fit=crop');
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

// Pause pour respecter le rate limit (50 req/heure = 1 req/72sec pour demo, 5000/hr pour production)
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // Charger le catalogue
  const catalogPath = path.join(__dirname, '..', 'data', 'catalogues-standards.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  
  // Charger le mapping existant s'il existe
  const mappingPath = path.join(__dirname, '..', 'data', 'photo-mapping.json');
  let mapping = {};
  if (fs.existsSync(mappingPath)) {
    mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    console.log(`📂 Mapping existant chargé: ${Object.keys(mapping).length} photos`);
  }
  
  // Collecter les produits distincts
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
  
  console.log(`\n🔍 ${products.length} produits à rechercher (${Object.keys(mapping).length} déjà mappés)\n`);
  
  if (products.length === 0) {
    console.log('✅ Tous les produits ont déjà une photo assignée !');
    return;
  }
  
  let successCount = 0;
  let failCount = 0;
  let rateLimitHit = false;
  
  for (let i = 0; i < products.length; i++) {
    if (rateLimitHit) break;
    
    const product = products[i];
    const query = getSearchQuery(product.nom, product.categorie);
    
    process.stdout.write(`[${i + 1}/${products.length}] ${product.nom} → "${query}" ... `);
    
    try {
      const photoUrl = await searchUnsplash(query);
      if (photoUrl) {
        mapping[product.nom] = photoUrl;
        successCount++;
        console.log('✅');
      } else {
        failCount++;
        console.log('❌ (aucun résultat)');
      }
    } catch (err) {
      if (err.message && err.message.includes('Rate Limit')) {
        console.log('⚠️ Rate limit atteint ! Sauvegarde partielle...');
        rateLimitHit = true;
      } else {
        failCount++;
        console.log('❌ ' + err.message);
      }
    }
    
    // Pause entre les requêtes (1.5 sec pour rester sous le rate limit)
    await sleep(1500);
    
    // Sauvegarde intermédiaire toutes les 50 photos
    if ((i + 1) % 50 === 0) {
      fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2), 'utf8');
      console.log(`\n💾 Sauvegarde intermédiaire: ${Object.keys(mapping).length} photos\n`);
    }
  }
  
  // Sauvegarde finale
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2), 'utf8');
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📸 Résultat: ${successCount} photos trouvées, ${failCount} échouées`);
  console.log(`📂 Total dans le mapping: ${Object.keys(mapping).length} photos`);
  console.log(`💾 Sauvegardé dans: ${mappingPath}`);
  
  if (rateLimitHit) {
    console.log(`\n⚠️  Rate limit atteint. Relancez le script pour continuer le téléchargement.`);
    console.log(`    Les photos déjà trouvées sont sauvegardées et ne seront pas re-téléchargées.`);
  }
  
  if (products.length - successCount - failCount > 0) {
    console.log(`\n🔄 Il reste ${products.length - successCount} produits à traiter.`);
    console.log(`   Relancez: node backend/scripts/fetch-photos.js`);
  }
}

main().catch(console.error);
