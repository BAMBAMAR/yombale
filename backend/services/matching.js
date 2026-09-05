// backend/services/matching.js — Moteur de Matching & Déduplication E-commerce
const MARQUES = [
  'apple','samsung','xiaomi','redmi','poco','tecno','infinix','oppo','vivo','huawei','nokia',
  'hp','lenovo','dell','asus','acer','lg','sony','hisense','haier','tcl','realme','oneplus','motorola',
  'astech','bruhm','skyworth','finix','enduro','nasco','polystar','philips','bose','jbl','sennheiser'
];

const ACCESSOIRE_RE = /\b(coque|housse|etui|étui|verre trempe|film de protection|protecteur ecran|chargeur|cable|câble|adaptateur|support|sacoche|powerbank|power\s*bank|batterie externe|pochette|doigtier|lampe|boite|bobine|cordon)\b/i;

function decoderHtmlEntities(str) {
  return (str || '')
    .replace(/&#8211;/g, '-')
    .replace(/&#8217;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&Prime;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function normaliserTitre(titre) {
  let s = decoderHtmlEntities(titre).toLowerCase();
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Remplacer + par plus pour les modèles (ex: S21+, Note 14 Pro+)
  s = s.replace(/\+/g, ' plus ');
  // Supprimer bruit marketing / commercial
  s = s.replace(/\b(neuf|scelle|scellé|garanti|garantie|original|authentique|venant|simple|promo|promotion|offre|livraison|nouveau|nouveaute|bon etat|etat|occasion|reconditionne|renewed|debloque|esim|sim|dakar|senegal|officiel|boutique)\b/gi, ' ');
  // Nettoyer ponctuation résiduelle
  s = s.replace(/[^\w\s-]/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

function extraireMarque(titre) {
  if (!titre) return null;
  const s = ' ' + normaliserTitre(titre) + ' ';
  for (const m of MARQUES) {
    if (new RegExp(`\\b${m}\\b`, 'i').test(s)) {
      if (m === 'redmi' || m === 'poco') return 'Xiaomi';
      return m.charAt(0).toUpperCase() + m.slice(1);
    }
  }
  if (/\b(iphone|ipad|macbook|airpods|apple watch)\b/i.test(s)) return 'Apple';
  if (/\b(galaxy)\b/i.test(s)) return 'Samsung';
  if (/\b(playstation|ps5|ps4)\b/i.test(s)) return 'Sony';
  return null;
}

function extraireModele(titre) {
  if (!titre) return null;
  let s = normaliserTitre(titre);

  // Normalisation consoles
  s = s.replace(/\bplaystation\s*5\b|\bps5\b/g, 'ps5');
  s = s.replace(/\bplaystation\s*4\b|\bps4\b/g, 'ps4');

  // iPhone: iphone 11..16 (pro max, pro, plus, mini, se)
  const mIphone = s.match(/\b(iphone\s*(?:se|\d{1,2}(?:\s*(?:pro\s*max|pro|plus|mini))?))\b/);
  if (mIphone) return mIphone[1].replace(/\s+/g, ' ');

  // Samsung Galaxy: s/a/m/z/note
  const mGalaxy = s.match(/\b(galaxy\s*[asmnz]\d{1,2}[a-z]?(?:\s*(?:ultra|plus|fe|fold\s*\d?|flip\s*\d?))?)\b/);
  if (mGalaxy) return mGalaxy[1].replace(/\s+/g, ' ');

  // Xiaomi / Redmi
  const mRedmi = s.match(/\b((?:redmi\s*note|redmi|poco)\s*\d{1,2}[a-z]?(?:\s*(?:pro\s*plus|pro))?)\b/);
  if (mRedmi) return mRedmi[1].replace(/\s+/g, ' ');

  // Tecno
  const mTecno = s.match(/\b((?:camon|spark|pova|pop)\s*\d{1,2}[a-z]?(?:\s*(?:pro|premier|plus|go))?)\b/);
  if (mTecno) return mTecno[1].replace(/\s+/g, ' ');

  // Infinix
  const mInfinix = s.match(/\b((?:hot|note|zero|smart)\s*\d{1,2}[a-z]?(?:\s*(?:pro|play|vip|plus|hd))?)\b/);
  if (mInfinix) return mInfinix[1].replace(/\s+/g, ' ');

  // Consoles
  const mConsole = s.match(/\b(ps5|ps4|nintendo\s*switch|xbox\s*series\s*[xs]|xbox\s*one)\b/);
  if (mConsole) return mConsole[1].replace(/\s+/g, ' ');

  // Code modèle alphanumérique standard (ex: 32A4G, QA55Q60, WH-1000XM5)
  // Exclure dimensions (60x60, 90x60), gaz réfrigérants (R410, R32) et nombres de feux (4f, 5feux)
  const mAlphaNum = s.match(/\b([a-z]{1,3}\d{2,4}[a-z0-9]{0,4}|\d{2,3}[a-z]{1,3}\d{1,4})\b/i);
  if (mAlphaNum) {
    const candidate = mAlphaNum[1].toLowerCase();
    if (!/^\d{2,3}x\d{2,3}$|^r\d{2,4}[a-z]?$|^\d+feux?$|^\d+f$/i.test(candidate)) {
      return mAlphaNum[1];
    }
  }

  return null;
}

function extraireTypeAppareil(titre) {
  const s = ' ' + normaliserTitre(titre) + ' ';
  if (/\b(four|fours)\b/.test(s)) return 'four';
  if (/\b(hotte|hottes)\b/.test(s)) return 'hotte';
  if (/\b(plaque|plaques)\b/.test(s)) return 'plaque';
  if (/\b(cuisiniere|cuisinieres|gaziniere)\b/.test(s)) return 'cuisiniere';
  if (/\b(refrigerateur|frigo|refrigerateurs)\b/.test(s)) return 'refrigerateur';
  if (/\b(congelateur|congelateurs)\b/.test(s)) return 'congelateur';
  if (/\b(split|climatiseur|clim)\b/.test(s)) return 'climatiseur';
  if (/\b(lave[- ]linge|machine.{0,6}laver)\b/.test(s)) return 'lave-linge';
  if (/\b(lave[- ]vaisselle)\b/.test(s)) return 'lave-vaisselle';
  if (/\b(televiseur|tv|television)\b/.test(s)) return 'tv';
  if (/\b(smartphone|telephone portable|iphone|galaxy)\b/.test(s)) return 'smartphone';
  return null;
}

function extraireBtu(titre) {
  const m = (titre || '').match(/\b(9000|12000|18000|24000|30000|36000)\s*(?:btu)?\b/i);
  return m ? parseInt(m[1], 10) : null;
}

function estAccessoire(titre) {
  return ACCESSOIRE_RE.test(titre || '');
}

function similariteJaccard(a, b) {
  const normA = normaliserTitre(a);
  const normB = normaliserTitre(b);
  const setA = new Set(normA.split(/\s+/).filter(w => w.length >= 3));
  const setB = new Set(normB.split(/\s+/).filter(w => w.length >= 3));
  if (setA.size === 0 || setB.size === 0) return 0;
  let inter = 0;
  for (const w of setA) {
    if (setB.has(w)) inter++;
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : inter / union;
}

function extraireStockageGo(titre) {
  const s = ' ' + (titre || '').toLowerCase() + ' ';
  const m = s.match(/\b(\d+)\s*(?:go|gb|g)\b(?!\s*ram)/);
  if (m) {
    const val = parseInt(m[1], 10);
    if ([16, 32, 64, 128, 256, 512, 1024].includes(val)) return val;
  }
  const mTo = s.match(/\b(\d+)\s*(?:to|tb)\b/);
  if (mTo) return parseInt(mTo[1], 10) * 1024;
  return null;
}

function extraireRamGo(titre) {
  const s = ' ' + (titre || '').toLowerCase() + ' ';
  const m = s.match(/\b(\d+)\s*(?:go|gb|g)\s*ram\b/) || s.match(/\bram\s*:?\s*(\d+)\s*(?:go|gb|g)\b/);
  if (m) return parseInt(m[1], 10);
  return null;
}

function extrairePouces(titre) {
  const m = (titre || '').match(/\b(\d{2,3})\s*(?:pouces?|"|\binch)/i);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Compare deux produits et décide s'ils représentent le même article e-commerce.
 */
function sontMemeProduit(itemA, itemB) {
  const titreA = itemA.titre || itemA.nom || '';
  const titreB = itemB.titre || itemB.nom || '';

  // 1. EAN identique -> match absolu
  if (itemA.ean && itemB.ean && itemA.ean === itemB.ean) {
    return { match: true, methode: 'ean', confiance: 1.0 };
  }

  // 2. Vérification accessoire vs appareil principal
  const accA = estAccessoire(titreA);
  const accB = estAccessoire(titreB);
  if (accA !== accB) {
    return { match: false, raison: 'accessoire_vs_appareil' };
  }

  // 3. Vérification du type d'appareil (un four n'est pas une plaque ni une hotte)
  const typeA = extraireTypeAppareil(titreA);
  const typeB = extraireTypeAppareil(titreB);
  if (typeA && typeB && typeA !== typeB) {
    return { match: false, raison: 'types_appareils_incompatibles' };
  }

  // 4. Climatiseurs : vérifier la puissance BTU
  if (typeA === 'climatiseur' || typeB === 'climatiseur') {
    const btuA = extraireBtu(titreA);
    const btuB = extraireBtu(titreB);
    if (btuA && btuB && btuA !== btuB) {
      return { match: false, raison: 'btu_different' };
    }
  }

  // 5. Vérification des marques
  const marqueA = extraireMarque(titreA) || itemA.marque || null;
  const marqueB = extraireMarque(titreB) || itemB.marque || null;
  if (marqueA && marqueB && marqueA.toLowerCase() !== marqueB.toLowerCase()) {
    return { match: false, raison: 'marques_incompatibles' };
  }

  // 6. Vérification de la cohérence de prix (si présents)
  const pA = itemA.prix || itemA.prix_min;
  const pB = itemB.prix || itemB.prix_min;
  if (pA && pB && pA > 0 && pB > 0) {
    const ratio = pA / pB;
    if (ratio < 0.35 || ratio > 2.8) {
      return { match: false, raison: 'ecart_prix_excessif' };
    }
  }

  // 7. Titres normalisés strictement identiques
  const normA = normaliserTitre(titreA);
  const normB = normaliserTitre(titreB);
  if (normA && normA === normB) {
    return { match: true, methode: 'titre_exact', confiance: 0.98 };
  }

  // 8. Vérification stricte des déclinaisons / suffixes (Ultra, Pro, Plus, Max, Mini, Lite, Fe, Play, Neo)
  const SUFFIXES = ['ultra', 'pro', 'plus', 'max', 'mini', 'lite', 'fe', 'play', 'neo'];
  const normWordsA = new Set(normA.split(/\s+/));
  const normWordsB = new Set(normB.split(/\s+/));
  for (const suf of SUFFIXES) {
    if (normWordsA.has(suf) !== normWordsB.has(suf)) {
      return { match: false, raison: `declinaison_${suf}_differente` };
    }
  }

  // 9. Matching par Modèle Canonique (exige que les marques soient connues et identiques)
  const modA = extraireModele(titreA);
  const modB = extraireModele(titreB);
  if (modA && modB && marqueA && marqueB) {
    const cleanModA = modA.replace(/\+/g, 'plus');
    const cleanModB = modB.replace(/\+/g, 'plus');
    if (cleanModA === cleanModB) {
      // Modèle identique: vérifier compatibilité specs (stockage / écran)
      const stA = extraireStockageGo(titreA);
      const stB = extraireStockageGo(titreB);
      if (stA && stB && stA !== stB) {
        return { match: false, raison: 'stockage_different' };
      }
      const poA = extrairePouces(titreA);
      const poB = extrairePouces(titreB);
      if (poA && poB && Math.abs(poA - poB) > 3) {
        return { match: false, raison: 'ecran_different' };
      }
      return { match: true, methode: 'modele', modele: modA, confiance: 0.92 };
    } else {
      return { match: false, raison: 'modeles_differents' };
    }
  }

  // 7. Similarité lexicale Jaccard
  const jaccard = similariteJaccard(titreA, titreB);
  if (jaccard >= 0.70) {
    return { match: true, methode: 'jaccard', score: jaccard, confiance: jaccard };
  }

  return { match: false, raison: 'similarite_insuffisante', score: jaccard };
}

/**
 * Recherche dans la base PostgreSQL si un produit existant correspond à l'item scrapé.
 */
async function trouverProduitCorrespondant(pool, item, catId = null) {
  // 1. EAN
  if (item.ean) {
    const { rows: byEan } = await pool.query('SELECT id, nom, prix_min, categorie_id FROM produits WHERE ean = $1 LIMIT 1', [item.ean]);
    if (byEan.length > 0) return byEan[0];
  }

  const titre = item.titre || item.nom;
  if (!titre) return null;

  const normTitre = normaliserTitre(titre);
  const marque = extraireMarque(titre);
  const modele = extraireModele(titre);

  // 2. Exact normalized title
  const { rows: byNom } = await pool.query(
    `SELECT id, nom, prix_min, categorie_id FROM produits WHERE TRIM(LOWER(nom)) = $1 LIMIT 1`,
    [normTitre]
  );
  if (byNom.length > 0) return byNom[0];

  // 3. Match par Modèle identifié
  if (modele) {
    const cleanMod = modele.replace(/\+/g, 'plus');
    const { rows: byModel } = await pool.query(`
      SELECT id, nom, prix_min, categorie_id, marque
      FROM produits
      WHERE LOWER(nom) LIKE '%' || $1 || '%'
      LIMIT 10
    `, [cleanMod]);

    for (const cand of byModel) {
      const cmp = sontMemeProduit(item, cand);
      if (cmp.match) {
        return cand;
      }
    }
  }

  // 4. Recherche par mots-clés discriminants + pg_trgm
  const mots = normTitre.split(/\s+/).filter(w => w.length >= 3 && !['apple','samsung','sony','pour','avec'].includes(w)).slice(0, 3);
  if (mots.length >= 2) {
    const { rows: fuzzy } = await pool.query(`
      SELECT id, nom, prix_min, categorie_id, marque,
             similarity(LOWER(nom), $1) AS sim
      FROM produits
      WHERE LOWER(nom) LIKE '%' || $2 || '%'
      ORDER BY sim DESC
      LIMIT 5
    `, [normTitre, mots[0]]);

    for (const cand of fuzzy) {
      const cmp = sontMemeProduit(item, cand);
      if (cmp.match) {
        return cand;
      }
    }
  }

  return null;
}

module.exports = {
  sontMemeProduit,
  trouverProduitCorrespondant,
  normaliserTitre,
  extraireMarque,
  extraireModele,
  extraireStockageGo,
  extraireRamGo,
  extrairePouces,
  estAccessoire,
  similariteJaccard,
  decoderHtmlEntities
};