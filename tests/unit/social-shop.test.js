// tests/unit/social-shop.test.js
// Tests unitaires pour le service Social Shop & Smart Matching

const {
  detectPlatform,
  extractExternalPostId,
  normalizeText,
  matchProductsWithCaption,
  cleanUsername,
  parseBatchUrls,
  exploreProfile,
} = require('../../backend/services/social-parser');

describe('Social Parser — Détection de plateforme (detectPlatform)', () => {
  test('détecte correctement une URL TikTok vidéo standard', () => {
    expect(detectPlatform('https://www.tiktok.com/@senegal_mode/video/7289123456789')).toBe('tiktok');
  });

  test('détecte correctement une URL TikTok courte', () => {
    expect(detectPlatform('https://vm.tiktok.com/ZM8xABCDE/')).toBe('tiktok');
  });

  test('détecte correctement un Reel Instagram', () => {
    expect(detectPlatform('https://www.instagram.com/reel/C8_XYZ123/?igsh=abcdef')).toBe('instagram');
  });

  test('détecte correctement un Post Instagram', () => {
    expect(detectPlatform('https://instagram.com/p/DB1234567/')).toBe('instagram');
  });

  test('détecte correctement un Post / Vidéo Facebook', () => {
    expect(detectPlatform('https://www.facebook.com/watch/?v=987654321')).toBe('facebook');
    expect(detectPlatform('https://fb.watch/abcd1234/')).toBe('facebook');
  });

  test('détecte correctement YouTube Shorts', () => {
    expect(detectPlatform('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('youtube');
  });

  test('rejette les domaines non autorisés ou invalides', () => {
    expect(detectPlatform('https://example.com/video/123')).toBeNull();
    expect(detectPlatform('pas une url')).toBeNull();
    expect(detectPlatform('')).toBeNull();
    expect(detectPlatform(null)).toBeNull();
  });
});

describe('Social Parser — Extraction de post ID (extractExternalPostId)', () => {
  test('extrait l\'ID d\'un Reel Instagram', () => {
    const id = extractExternalPostId('https://www.instagram.com/reel/C8_XYZ123/?igsh=123', 'instagram');
    expect(id).toBe('C8_XYZ123');
  });

  test('extrait l\'ID d\'un Post Instagram', () => {
    const id = extractExternalPostId('https://instagram.com/p/DB_ABC999/', 'instagram');
    expect(id).toBe('DB_ABC999');
  });

  test('extrait l\'ID d\'une vidéo TikTok', () => {
    const id = extractExternalPostId('https://www.tiktok.com/@shop/video/7289123456789', 'tiktok');
    expect(id).toBe('7289123456789');
  });

  test('extrait l\'ID d\'une vidéo Facebook', () => {
    const id = extractExternalPostId('https://www.facebook.com/watch/?v=123456789', 'facebook');
    expect(id).toBe('123456789');
  });
});

describe('Social Parser — Normalisation textuelle (normalizeText)', () => {
  test('supprime les accents, la casse et la ponctuation', () => {
    expect(normalizeText('Robe ÉTÉ & Satinée, Dakar !')).toBe('robe ete satinee dakar');
  });

  test('gère les chaînes vides ou nulles sans erreur', () => {
    expect(normalizeText('')).toBe('');
    expect(normalizeText(null)).toBe('');
  });
});

describe('Social Parser — Moteur de Smart Matching (matchProductsWithCaption)', () => {
  const mockProducts = [
    {
      id: 'prod-1',
      nom: 'Robe Satinée Noire',
      description: 'Superbe robe fluide pour cocktail ou soirée',
      categorie: 'mode',
      prix: 25000,
    },
    {
      id: 'prod-2',
      nom: 'Chaussures Escarpins Cuir',
      description: 'Escarpins élégants talon 7cm',
      categorie: 'mode',
      prix: 30000,
    },
    {
      id: 'prod-3',
      nom: 'Montre Quartz Dorée',
      description: 'Montre étanche avec bracelet acier',
      categorie: 'accessoires',
      prix: 18000,
    },
    {
      id: 'prod-4',
      nom: 'Téléphone Samsung S23',
      description: 'Smartphone 256Go 8Go RAM',
      categorie: 'smartphones',
      prix: 350000,
    },
  ];

  test('détecte avec haute confiance la correspondance exacte du nom dans la légende', () => {
    const caption = 'Nouvel arrivage spécial 🔥 La Robe Satinée Noire est enfin disponible en boutique à Dakar ! Contactez-nous pour commander.';
    const matches = matchProductsWithCaption(caption, mockProducts);

    expect(matches.length).toBeGreaterThan(0);
    const topMatch = matches[0];
    expect(topMatch.produit.id).toBe('prod-1');
    expect(topMatch.confidence_score).toBeGreaterThanOrEqual(0.85);
  });

  test('détecte plusieurs produits pertinents si mentionnés dans la même publication', () => {
    const caption = 'Look du jour chic : Robe Satinée avec les Chaussures Escarpins Cuir ! Tout est disponible en livraison rapide.';
    const matches = matchProductsWithCaption(caption, mockProducts);

    expect(matches.length).toBeGreaterThanOrEqual(2);
    const productIds = matches.map(m => m.produit.id);
    expect(productIds).toContain('prod-1');
    expect(productIds).toContain('prod-2');
  });

  test('ignore les produits totalement hors contexte', () => {
    const caption = 'Promotion exceptionnelle sur notre Montre Quartz !';
    const matches = matchProductsWithCaption(caption, mockProducts);

    const matchIds = matches.map(m => m.produit.id);
    expect(matchIds).toContain('prod-3'); // Montre Quartz
    expect(matchIds).not.toContain('prod-4'); // Samsung S23
  });

  test('ignore les stop-words fréquents (prix, fcfa, dakar, promo, arrivage)', () => {
    const caption = 'Promo arrivage dakar livraison rapide meilleur prix fcfa !';
    const matches = matchProductsWithCaption(caption, mockProducts);

    // Aucun produit spécifique ne doit matcher juste à cause des mots génériques
    expect(matches.length).toBe(0);
  });

  test('gère gracieusement les captions vides ou sans produits', () => {
    expect(matchProductsWithCaption('', mockProducts)).toEqual([]);
    expect(matchProductsWithCaption('Super vidéo', [])).toEqual([]);
    expect(matchProductsWithCaption(null, null)).toEqual([]);
  });
});

describe('Social Parser — Nettoyage de nom d\'utilisateur (cleanUsername)', () => {
  test('nettoie les @ et espaces superflus', () => {
    expect(cleanUsername('@wax_dakar ')).toBe('wax_dakar');
    expect(cleanUsername('@@boutique_chic')).toBe('boutique_chic');
  });

  test('extrait le pseudo depuis une URL de profil', () => {
    expect(cleanUsername('https://www.instagram.com/wax_dakar/')).toBe('wax_dakar');
    expect(cleanUsername('https://tiktok.com/@senegal_mode')).toBe('senegal_mode');
  });

  test('gère les entrées vides ou non-chaînes', () => {
    expect(cleanUsername('')).toBe('');
    expect(cleanUsername(null)).toBe('');
  });
});

describe('Social Parser — Découpage par lot multi-URLs (parseBatchUrls)', () => {
  test('extrait plusieurs URLs TikTok, Instagram et Facebook depuis un texte multi-lignes', () => {
    const rawText = `
      https://www.tiktok.com/@shop/video/1111111111111
      https://www.instagram.com/reel/C_XYZ987/
      https://www.facebook.com/watch/?v=222222222
      texte inutile ignorer
      https://www.tiktok.com/@shop/video/1111111111111 (doublon)
    `;

    const parsed = parseBatchUrls(rawText);
    expect(parsed.length).toBe(3); // 3 uniques valides
    expect(parsed[0].platform).toBe('tiktok');
    expect(parsed[1].platform).toBe('instagram');
    expect(parsed[2].platform).toBe('facebook');
  });

  test('gère un tableau d\'URLs avec dédoublonnage', () => {
    const arr = [
      'https://www.instagram.com/p/ABC12345/',
      'https://www.instagram.com/p/ABC12345/',
      'pas une url valide',
    ];
    const parsed = parseBatchUrls(arr);
    expect(parsed.length).toBe(1);
    expect(parsed[0].url).toBe('https://www.instagram.com/p/ABC12345/');
  });

  test('renvoie un tableau vide pour du texte sans URL valide', () => {
    expect(parseBatchUrls('')).toEqual([]);
    expect(parseBatchUrls(null)).toEqual([]);
    expect(parseBatchUrls('bonjour tout le monde')).toEqual([]);
  });
});

describe('Social Parser — Exploration de profil (exploreProfile)', () => {
  test('rejette un pseudo vide avec une erreur explicite', async () => {
    const res = await exploreProfile('tiktok', '');
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  test('génère un résultat structuré pour un profil TikTok', async () => {
    const res = await exploreProfile('tiktok', 'wax_dakar');
    expect(res.platform).toBe('tiktok');
    expect(res.username).toBe('wax_dakar');
    expect(Array.isArray(res.posts)).toBe(true);
  });

  test('génère un résultat structuré pour un profil Instagram', async () => {
    const res = await exploreProfile('instagram', 'boutique_senegal');
    expect(res.platform).toBe('instagram');
    expect(res.username).toBe('boutique_senegal');
    expect(Array.isArray(res.posts)).toBe(true);
  });
});

