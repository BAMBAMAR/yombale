// tests/unit/social-shop.test.js
// Tests unitaires pour le service Social Shop & Smart Matching

const {
  detectPlatform,
  extractExternalPostId,
  normalizeText,
  matchProductsWithCaption,
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
