// backend/services/magic-import.js — Moteur d'extraction et d'import intelligent pour la Baguette Magique
const cheerio = require('cheerio');
const axios = require('axios');

// ── Taux de conversion indicatifs vers FCFA ──
const TAUX_CHANGE_FCFA = {
  'USD': 605,
  'EUR': 655.957,
  'CNY': 84.5,
  'RMB': 84.5,
  'GBP': 785,
  'AED': 165,
  'TRY': 18,
  'MAD': 60,
  'XOF': 1,
  'XAF': 1,
  'FCFA': 1,
  'CFA': 1,
};

// ── Plages IP privées / réservées pour bloquer les attaques SSRF ──
const PRIVATE_IP_REGEX = /^(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|169\.254\.\d+\.\d+|::1|fc00:|fe80:)/i;

/**
 * Valide et sécurise l'URL pour empêcher les requêtes malveillantes (SSRF)
 */
function validateSafeUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') {
    throw new Error('URL invalide ou manquante');
  }

  let trimmed = inputUrl.trim();
  // Si l'utilisateur n'a pas mis de schéma de protocole (ex: "aliexpress.com/item/123"), on ajoute https://
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch (e) {
    throw new Error('Format d\'URL invalide');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Protocole non supporté (seuls HTTP et HTTPS sont autorisés)');
  }

  const hostname = parsed.hostname.toLowerCase();

  // Bloquer localhost et adresses IP privées/internes
  if (PRIVATE_IP_REGEX.test(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    throw new Error('Accès aux adresses locales et privées interdit (SSRF Protection)');
  }

  return parsed.toString();
}

/**
 * Convertit un montant étranger en FCFA avec estimation du prix d'achat et du prix de vente suggéré
 */
function convertCurrencyToFcfa(priceAmount, currencyCode) {
  const numPrice = parseFloat(String(priceAmount).replace(/[^0-9.,]/g, '').replace(',', '.'));
  if (isNaN(numPrice) || numPrice <= 0) {
    return {
      prix_source: null,
      devise_source: null,
      prix_achat_fcfa: 0,
      prix_vente_suggere_fcfa: 0,
      prix_barre_suggere_fcfa: 0,
    };
  }

  const code = (currencyCode || 'USD').toUpperCase().trim();
  const rate = TAUX_CHANGE_FCFA[code] || TAUX_CHANGE_FCFA['USD'];

  // Coût d'achat estimé converti
  const coutAchatFcfa = Math.round(numPrice * rate);

  // Prix de vente recommandé (marge marchande indicative ~35% à 50% selon tranche, arrondi aux 500 FCFA supérieurs)
  let margeMultiplier = 1.45;
  if (coutAchatFcfa < 5000) margeMultiplier = 1.6;
  else if (coutAchatFcfa > 50000) margeMultiplier = 1.3;

  const brutVente = coutAchatFcfa * margeMultiplier;
  const prixVenteArrondi = Math.ceil(brutVente / 500) * 500;
  const prixBarreArrondi = Math.ceil((prixVenteArrondi * 1.25) / 500) * 500;

  return {
    prix_source: numPrice,
    devise_source: code,
    prix_achat_fcfa: coutAchatFcfa,
    prix_vente_suggere_fcfa: Math.max(prixVenteArrondi, 1000),
    prix_barre_suggere_fcfa: Math.max(prixBarreArrondi, prixVenteArrondi + 1000),
  };
}

/**
 * Détection automatique de la catégorie Nopalou à partir des mots-clés
 */
function detectCategory(text) {
  if (!text || typeof text !== 'string') return 'divers';
  const norm = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (/\b(robe|chemise|pantalon|t-shirt|tshirt|veste|manteau|chaussure|basket|sneaker|sac|sacoche|montre|bijou|boucle|collier|bague|lunette|perruque|lingerie|boxer|ceinture|talon|sandale|abaya|boubou|wax|costume|jean|jogging|sweat|hoodie|polo|dress|shirt|pants|shoes|hoodie|jacket|jewelry)\b/i.test(norm)) {
    return 'mode';
  }
  if (/\b(iphone|samsung|galaxy|redmi|xiaomi|tecno|infinix|oppo|huawei|smartphone|telephone|coque|chargeur|ecouteur|airpod|earbud|verre trempe|cable usb|powerbank|smartwatch|phone|case|charger)\b/i.test(norm)) {
    return 'smartphones';
  }
  if (/\b(ordinateur|laptop|pc|macbook|dell|hp|lenovo|asus|acer|clavier|souris|ecran|moniteur|disque dur|ssd|ram|processeur|carte graphique|imprimante|routeur|wifi|cle usb|keyboard|mouse|monitor|gpu|cpu)\b/i.test(norm)) {
    return 'informatique';
  }
  if (/\b(television|tv|frigo|refrigerateur|congelateur|climatiseur|split|ventilateur|lave-linge|machine a laver|micro-onde|four|air fryer|friteuse|blender|mixeur|fer a repasser|aspirateur|gaziniere|plaque induction)\b/i.test(norm)) {
    return 'tv-electro';
  }
  if (/\b(canape|salon|lit|matelas|armoire|table|chaise|meuble|rideau|tapis|lampe|coussin|couette|drap|casserole|poele|vaisselle|ustensile|rangement|decoration|miroir|perceuse|visseuse|tournevis|marteau|scie|bricolage|outillage|drill|screwdriver|wrench|pliers|dewalt|bosch|makita|stanley|milwaukee|tool|tools|cordless)\b/i.test(norm)) {
    return 'maison';
  }
  if (/\b(creme|serum|savon|lotion|shampoing|masque|maquillage|rouge a levres|parfum|eau de toilette|rasoir|tondeuse|lisseur|epilateur|soin visage|brosse|beauty|hair|skin|perfume)\b/i.test(norm)) {
    return 'beaute-sante';
  }
  if (/\b(voiture|moto|scooter|casque|pneu|jante|alarme auto|support telephone voiture|camera de recul|housse de siege|gps|car|motorcycle|helmet)\b/i.test(norm)) {
    return 'auto-moto';
  }
  if (/\b(bebe|enfant|poussette|biberon|couche|jouet|doudou|peluche|lego|trottinette enfant|bavoir|baby|kids|toy)\b/i.test(norm)) {
    return 'enfants-bebes';
  }
  if (/\b(sport|fitness|velo|musculation|ballon|haltere|gourde|tapis de course|tente|camping|yoga|gym|cycling)\b/i.test(norm)) {
    return 'sports-loisirs';
  }

  return 'divers';
}

/**
 * Nettoie le titre pour retirer le bourrage de mots-clés SEO et les mentions de plateformes
 */
function cleanTitle(rawTitle) {
  if (!rawTitle) return '';
  return rawTitle
    .replace(/\s*[-–|•]\s*(AliExpress|SHEIN|Amazon|Alibaba|Temu|Jumia|eBay|Wish|Taobao|1688|\d+).*$/i, '')
    .replace(/\b(202[4-9]|Newest|Hot Sale|High Quality|Free Shipping|Livraison Gratuite|Wholesale|Gros|Nouveau|Tendance 202[4-9])\b/gi, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Nettoie et déduplique les URLs d'images (transforme les vignettes en images HD)
 */
function cleanImageUrls(imageArray) {
  if (!Array.isArray(imageArray)) return [];
  const cleanList = [];

  for (let img of imageArray) {
    if (!img || typeof img !== 'string') continue;
    let url = img.trim();
    if (url.startsWith('//')) url = 'https:' + url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) continue;

    // Suppression des paramètres de réduction de taille (AliExpress / Shein / Amazon / Temu)
    url = url
      .replace(/_[0-9]+x[0-9]+(\.[a-zA-Z0-9]+)$/i, '$1') // AliExpress: S1_50x50.jpg -> S1.jpg
      .replace(/_[0-9]+x[0-9]+$/i, '')
      .replace(/\.jpg_[0-9]+x[0-9]+[a-zA-Z0-9._-]*$/i, '.jpg')
      .replace(/\._AC_US[0-9]+_\./i, '._AC_SL1500_.') // Amazon thumbnail to HD
      .replace(/\._AC_SR[0-9]+,[0-9]+_\./i, '._AC_SL1500_.')
      .replace(/_thumbnail_[0-9]+x[0-9]+\.webp/i, '.webp');

    // Ne pas inclure d'icônes ou de logos génériques
    if (url.includes('avatar') || url.includes('icon') || url.includes('logo') || url.includes('HTB18eCBQXXXXXXfXXXX760XFXXXa')) {
      continue;
    }

    if (!cleanList.includes(url) && cleanList.length < 5) {
      cleanList.push(url);
    }
  }

  return cleanList;
}

/**
 * Scrapeur principal tout-en-un avec stratégie multi-tentatives résiliente
 */
async function scrapeProductFromUrl(rawUrl) {
  const safeUrl = validateSafeUrl(rawUrl);
  const parsedUrl = new URL(safeUrl);
  const host = parsedUrl.hostname.toLowerCase();

  let extracted = {
    titre: '',
    description: '',
    prix: 0,
    prix_achat: 0,
    prix_barre: 0,
    devise_source: null,
    prix_source: null,
    images: [],
    categorie: 'divers',
    source_name: host.replace('www.', ''),
    original_url: safeUrl
  };

  // Extraire l'ID du produit si AliExpress
  let aliItemId = null;
  if (host.includes('aliexpress')) {
    aliItemId = safeUrl.match(/item\/(\d+)/)?.[1] || safeUrl.match(/\/(\d+)\.html/)?.[1];
  }

  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
  ];

  const urlsToTry = [safeUrl];
  if (aliItemId && host.includes('aliexpress')) {
    urlsToTry.push(`https://fr.aliexpress.com/item/${aliItemId}.html`);
    urlsToTry.push(`https://m.aliexpress.com/item/${aliItemId}.html`);
  }

  let html = '';

  for (const targetUrl of urlsToTry) {
    for (const ua of userAgents) {
      try {
        const response = await axios.get(targetUrl, {
          timeout: 6000,
          headers: {
            'User-Agent': ua,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Upgrade-Insecure-Requests': '1',
          },
          maxRedirects: 5,
        });

        if (response.data && typeof response.data === 'string' && response.data.length > 2500) {
          html = response.data;
          break;
        }
      } catch (err) {
        // Essayer le prochain User-Agent ou URL
      }
    }
    if (html) break;
  }

  if (html) {
    const $ = cheerio.load(html);

    // ── 1. Tentative d'extraction JSON-LD Schema.org ──
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const jsonText = $(el).html();
        if (!jsonText) return;
        const parsed = JSON.parse(jsonText.trim());
        const items = Array.isArray(parsed) ? parsed : [parsed];

        for (const item of items) {
          if (!item) continue;
          const target = (item['@type'] === 'Product') ? item : (item.mainEntity && item.mainEntity['@type'] === 'Product' ? item.mainEntity : null);
          if (target) {
            if (!extracted.titre && target.name) extracted.titre = String(target.name);
            if (!extracted.description && target.description) extracted.description = String(target.description);

            if (target.image) {
              const imgArray = Array.isArray(target.image) ? target.image : [target.image];
              imgArray.forEach(img => {
                const src = typeof img === 'string' ? img : (img.url || img.contentUrl);
                if (src) extracted.images.push(src);
              });
            }

            const offer = Array.isArray(target.offers) ? target.offers[0] : target.offers;
            if (offer) {
              const rawP = offer.price || offer.lowPrice || offer.highPrice;
              const rawCurr = offer.priceCurrency || 'USD';
              if (rawP) {
                const conv = convertCurrencyToFcfa(rawP, rawCurr);
                if (conv.prix_vente_suggere_fcfa > 0) {
                  extracted.prix = conv.prix_vente_suggere_fcfa;
                  extracted.prix_achat = conv.prix_achat_fcfa;
                  extracted.prix_barre = conv.prix_barre_suggere_fcfa;
                  extracted.devise_source = conv.devise_source;
                  extracted.prix_source = conv.prix_source;
                }
              }
            }
          }
        }
      } catch (e) {}
    });

    // ── 2. OpenGraph & Meta Tags ──
    if (!extracted.titre) {
      extracted.titre = $('meta[property="og:title"]').attr('content') ||
                        $('meta[name="twitter:title"]').attr('content') ||
                        $('meta[name="title"]').attr('content') ||
                        $('title').text() || '';
    }

    if (!extracted.description) {
      extracted.description = $('meta[property="og:description"]').attr('content') ||
                              $('meta[name="twitter:description"]').attr('content') ||
                              $('meta[name="description"]').attr('content') || '';
    }

    const ogImg = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
    if (ogImg) extracted.images.push(ogImg);
    $('meta[property="og:image:secure_url"]').each((_, el) => {
      const src = $(el).attr('content');
      if (src) extracted.images.push(src);
    });

    if (!extracted.prix || extracted.prix === 0) {
      const ogPrice = $('meta[property="product:price:amount"]').attr('content') ||
                      $('meta[property="og:price:amount"]').attr('content');
      const ogCurr = $('meta[property="product:price:currency"]').attr('content') ||
                     $('meta[property="og:price:currency"]').attr('content') || 'USD';
      if (ogPrice) {
        const conv = convertCurrencyToFcfa(ogPrice, ogCurr);
        if (conv.prix_vente_suggere_fcfa > 0) {
          extracted.prix = conv.prix_vente_suggere_fcfa;
          extracted.prix_achat = conv.prix_achat_fcfa;
          extracted.prix_barre = conv.prix_barre_suggere_fcfa;
          extracted.devise_source = conv.devise_source;
          extracted.prix_source = conv.prix_source;
        }
      }
    }

    // ── 3. Spécificités AliExpress (Deep Regex Extraction) ──
    if (host.includes('aliexpress')) {
      // Extraire toutes les images réelles du CDN AliExpress
      const cdnMatches = html.match(/https:\/\/(?:ae-pic-a1|ae01|ae-pic|ae02|ae03|ae04)\.(?:aliexpress-media\.com|alicdn\.com)\/kf\/[A-Za-z0-9_-]+(?:\.[a-zA-Z0-9]+)?/gi) || [];
      cdnMatches.forEach(img => {
        if (!extracted.images.includes(img) && !img.includes('avatar') && !img.includes('logo')) {
          extracted.images.push(img);
        }
      });

      // Extraire le titre depuis les balises ou scripts si manquant
      if (!extracted.titre || extracted.titre.includes('AliExpress') || extracted.titre.length < 5) {
        const subjectMatch = html.match(/"subject":"([^"]+)"/) || html.match(/"title":"([^"]+)"/);
        if (subjectMatch) extracted.titre = subjectMatch[1];
      }
    }

    // ── 4. Spécificités SHEIN ──
    if (host.includes('shein')) {
      const nameMatch = html.match(/"goods_name":"([^"]+)"/);
      if (nameMatch && !extracted.titre) extracted.titre = nameMatch[1];

      const priceMatch = html.match(/"retailPrice":{"amountWithSymbol":"([^"]+)"/) || html.match(/"salePrice":{"amountWithSymbol":"([^"]+)"/);
      if (priceMatch && (!extracted.prix || extracted.prix === 0)) {
        const conv = convertCurrencyToFcfa(priceMatch[1], 'USD');
        extracted.prix = conv.prix_vente_suggere_fcfa;
        extracted.prix_achat = conv.prix_achat_fcfa;
        extracted.prix_barre = conv.prix_barre_suggere_fcfa;
      }

      const sheinImgs = html.match(/https:\/\/img\.ltwebstatic\.com\/images[^\s"'<>]+\.(?:jpg|png|webp)/gi) || [];
      sheinImgs.forEach(img => extracted.images.push(img));
    }

    // ── 5. Spécificités Amazon ──
    if (host.includes('amazon')) {
      if (!extracted.titre) extracted.titre = $('#productTitle').text().trim();
      const azPrice = $('.a-price .a-offscreen').first().text().trim() || $('#priceblock_ourprice').text().trim() || $('#priceblock_dealprice').text().trim();
      if (azPrice && (!extracted.prix || extracted.prix === 0)) {
        const conv = convertCurrencyToFcfa(azPrice, azPrice.includes('€') ? 'EUR' : 'USD');
        extracted.prix = conv.prix_vente_suggere_fcfa;
        extracted.prix_achat = conv.prix_achat_fcfa;
        extracted.prix_barre = conv.prix_barre_suggere_fcfa;
      }
      const landingImg = $('#landingImage').attr('src') || $('#landingImage').attr('data-old-hires');
      if (landingImg) extracted.images.push(landingImg);
    }
  }

  // ── Nettoyage et formatage ──
  extracted.titre = cleanTitle(extracted.titre);
  extracted.images = cleanImageUrls(extracted.images);

  // ── Extraction intelligente depuis le slug URL si le titre est encore vide ──
  if (!extracted.titre || extracted.titre.length < 3) {
    const pathname = parsedUrl.pathname;
    const slugSegments = pathname.split('/').filter(s => s && !s.endsWith('.html') && isNaN(Number(s)));
    if (slugSegments.length > 0) {
      const candidate = slugSegments[slugSegments.length - 1].replace(/[-_]+/g, ' ').trim();
      if (candidate.length > 3) {
        extracted.titre = cleanTitle(candidate);
      }
    }
  }

  // ── Fallback structuré selon la plateforme sans images génériques trompeuses ──
  if (!extracted.titre || extracted.titre.length < 3) {
    if (host.includes('aliexpress')) {
      const itemId = aliItemId || 'Article';
      extracted.titre = `Article Importé AliExpress (#${itemId})`;
    } else if (host.includes('shein')) {
      extracted.titre = "Article de Mode SHEIN";
    } else if (host.includes('amazon')) {
      extracted.titre = "Produit Importé Amazon";
    } else {
      extracted.titre = `Produit Importé (${extracted.source_name})`;
    }
  }

  // Prix de secours par défaut si non extrait
  if (!extracted.prix || extracted.prix === 0) {
    extracted.prix = 15000;
    extracted.prix_achat = 9000;
    extracted.prix_barre = 20000;
  }

  if (!extracted.description) {
    extracted.description = `${extracted.titre} — Importé via la Baguette Magique depuis ${extracted.source_name}. Produit de qualité disponible à la commande.`;
  }

  // Détection de catégorie automatique
  extracted.categorie = detectCategory(`${extracted.titre} ${extracted.description}`);

  return extracted;
}

module.exports = {
  validateSafeUrl,
  convertCurrencyToFcfa,
  detectCategory,
  cleanTitle,
  cleanImageUrls,
  scrapeProductFromUrl,
  TAUX_CHANGE_FCFA
};

