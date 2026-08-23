// tests/unit/magic-import.test.js — Tests unitaires de la Baguette Magique (Import Rapide)
const {
  validateSafeUrl,
  convertCurrencyToFcfa,
  detectCategory,
  cleanTitle,
  cleanImageUrls,
  scrapeProductFromUrl,
  translateProductTitleToFrench,
} = require('../../backend/services/magic-import');

jest.mock('axios');
const axios = require('axios');

describe('🌟 Baguette Magique (Import Rapide) — Tests Unitaires', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Sécurité & Protection SSRF (validateSafeUrl)', () => {
    test('accepte les URLs publiques valides (HTTPS & HTTP)', () => {
      expect(validateSafeUrl('https://fr.aliexpress.com/item/1005006789.html')).toContain('https://fr.aliexpress.com');
      expect(validateSafeUrl('http://shein.com/goods-p-12345.html')).toContain('http://shein.com');
      expect(validateSafeUrl('amazon.fr/dp/B08N5WRWNW')).toContain('https://amazon.fr');
    });

    test('bloque strictement les adresses locales et privées (SSRF)', () => {
      expect(() => validateSafeUrl('http://localhost:3000/api/admin')).toThrow('SSRF Protection');
      expect(() => validateSafeUrl('http://127.0.0.1:8080')).toThrow('SSRF Protection');
      expect(() => validateSafeUrl('http://169.254.169.254/latest/meta-data')).toThrow('SSRF Protection');
      expect(() => validateSafeUrl('http://192.168.1.1/admin')).toThrow('SSRF Protection');
      expect(() => validateSafeUrl('http://10.0.0.1/status')).toThrow('SSRF Protection');
      expect(() => validateSafeUrl('http://0.0.0.0:4000')).toThrow('SSRF Protection');
    });

    test('bloque les protocoles dangereux (file://, ftp://)', () => {
      expect(() => validateSafeUrl('file:///etc/passwd')).toThrow('Protocole non supporté');
      expect(() => validateSafeUrl('ftp://ftp.server.com')).toThrow('Protocole non supporté');
    });
  });

  describe('2. Conversion de Prix & Marge Indicative (convertCurrencyToFcfa)', () => {
    test('convertit correctement le USD vers FCFA avec calcul de marge', () => {
      const conv = convertCurrencyToFcfa('10.50', 'USD');
      expect(conv.prix_source).toBe(10.5);
      expect(conv.devise_source).toBe('USD');
      // 10.5 * 605 = 6352.5 FCFA coût achat
      expect(conv.prix_achat_fcfa).toBeGreaterThan(6000);
      expect(conv.prix_vente_suggere_fcfa).toBeGreaterThan(conv.prix_achat_fcfa);
      // Arrondi aux 500 FCFA
      expect(conv.prix_vente_suggere_fcfa % 500).toBe(0);
      expect(conv.prix_barre_suggere_fcfa).toBeGreaterThan(conv.prix_vente_suggere_fcfa);
    });

    test('convertit l\'EUR vers FCFA', () => {
      const conv = convertCurrencyToFcfa('20.00', 'EUR');
      expect(conv.devise_source).toBe('EUR');
      // 20 * 655.957 = 13119 FCFA
      expect(conv.prix_achat_fcfa).toBe(13119);
      expect(conv.prix_vente_suggere_fcfa).toBeGreaterThanOrEqual(18500);
    });

    test('convertit le CNY (Yuan chinois) vers FCFA', () => {
      const conv = convertCurrencyToFcfa('100', 'CNY');
      expect(conv.devise_source).toBe('CNY');
      // 100 * 84.5 = 8450 FCFA
      expect(conv.prix_achat_fcfa).toBe(8450);
      expect(conv.prix_vente_suggere_fcfa).toBeGreaterThan(conv.prix_achat_fcfa);
    });

    test('gère les montants invalides ou nuls', () => {
      const conv = convertCurrencyToFcfa('gratuit', 'USD');
      expect(conv.prix_achat_fcfa).toBe(0);
      expect(conv.prix_vente_suggere_fcfa).toBe(0);
    });
  });

  describe('3. Auto-Détection de Catégorie (detectCategory)', () => {
    test('détecte les articles de mode', () => {
      expect(detectCategory('Robe de soirée élégante en satin')).toBe('mode');
      expect(detectCategory('Sneakers de sport respirantes pour homme')).toBe('mode');
      expect(detectCategory('Montre connectée étanche quartz')).toBe('mode');
      expect(detectCategory('Plain Casual Elegant Asymmetric Short Sleeve Top And Casual Wide Leg Pants')).toBe('mode');
    });

    test('détecte les smartphones et accessoires mobiles', () => {
      expect(detectCategory('iPhone 15 Pro Max Coque silicone antichoc')).toBe('smartphones');
      expect(detectCategory('Chargeur rapide 65W USB-C pour Samsung Galaxy')).toBe('smartphones');
    });

    test('détecte l\'informatique', () => {
      expect(detectCategory('Clavier mécanique gamer RGB souris sans fil')).toBe('informatique');
      expect(detectCategory('Ordinateur portable Dell 16GB RAM SSD 512GB')).toBe('informatique');
    });

    test('détecte l\'électroménager & TV', () => {
      expect(detectCategory('Friteuse sans huile Air Fryer 6L')).toBe('tv-electro');
      expect(detectCategory('Mixeur blender plongeant haute puissance')).toBe('tv-electro');
    });

    test('détecte la beauté et soins', () => {
      expect(detectCategory('Sérum visage acide hyaluronique hydratant')).toBe('beaute');
      expect(detectCategory('Tondeuse à barbe professionnelle rechargeable')).toBe('beaute');
    });

    test('fallback sur autre pour les produits non catégorisés', () => {
      expect(detectCategory('Produit sans mot-clé spécifique')).toBe('autre');
    });
  });

  describe('4. Nettoyage de Titre (cleanTitle)', () => {
    test('supprime les mentions de plateformes et mots-clés de bourrage SEO', () => {
      const raw = '2026 Newest High Quality Robe Longue Fleurie Femme - AliExpress';
      expect(cleanTitle(raw)).toBe('Robe Longue Fleurie Femme');
    });

    test('nettoie les entités HTML', () => {
      const raw = 'T-Shirt Coton Homme &amp; Femme &quot;Édition Limitée&quot;';
      expect(cleanTitle(raw)).toBe('T-Shirt Coton Homme & Femme "Édition Limitée"');
    });
  });

  describe('4b. Traduction Automatique en Français (translateProductTitleToFrench)', () => {
    test('traduit les termes de mode anglais en français', async () => {
      const titleEn = "Women's Plain Casual Elegant Asymmetric Short Sleeve Top And Casual Wide Leg Pants";
      const fr = await translateProductTitleToFrench(titleEn);
      expect(fr.toLowerCase()).toContain('pantalon');
      expect(fr.toLowerCase()).toContain('femme');
    });

    test('préserve les titres déjà en français', async () => {
      const titleFr = "Robe de soirée élégante en satin";
      const res = await translateProductTitleToFrench(titleFr);
      expect(res).toBe(titleFr);
    });
  });

  describe('5. Nettoyage & Galerie Multi-Photos (cleanImageUrls)', () => {
    test('transforme les vignettes AliExpress, SHEIN et Amazon en images HD et limite à 5 photos', () => {
      const rawImages = [
        'https://ae01.alicdn.com/kf/S123456_50x50.jpg',
        '//ae01.alicdn.com/kf/S654321_120x120.jpg',
        'https://m.media-amazon.com/images/I/71abc._AC_US40_.jpg',
        'https://img.ltwebstatic.com/images3_pi/2024/01/10/1704876543_thumbnail_600x.webp',
        'https://ae01.alicdn.com/kf/S999999.jpg',
        'https://ae01.alicdn.com/kf/S000000.jpg', // 6e image, doit être ignorée
      ];

      const cleaned = cleanImageUrls(rawImages);
      expect(cleaned.length).toBe(5);
      expect(cleaned[0]).toBe('https://ae01.alicdn.com/kf/S123456.jpg');
      expect(cleaned[1]).toBe('https://ae01.alicdn.com/kf/S654321.jpg');
      expect(cleaned[2]).toBe('https://m.media-amazon.com/images/I/71abc._AC_SL1500_.jpg');
      expect(cleaned[3]).toBe('https://img.ltwebstatic.com/images3_pi/2024/01/10/1704876543.webp');
    });
  });

  describe('6. Scraper Produit Intégré (scrapeProductFromUrl)', () => {
    test('extrait les données réelles Schema.org JSON-LD avec prix en devises et photos', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Montre Homme Luxe Quartz Chronographe - AliExpress</title>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": "Montre Homme Luxe Quartz Chronographe",
                "description": "Montre en acier inoxydable étanche 30m, cadran lumineux.",
                "image": [
                  "https://ae01.alicdn.com/kf/S111_50x50.jpg",
                  "https://ae01.alicdn.com/kf/S222_50x50.jpg"
                ],
                "offers": {
                  "@type": "Offer",
                  "price": "14.99",
                  "priceCurrency": "USD"
                }
              }
            </script>
          </head>
          <body></body>
        </html>
      `;

      axios.get.mockResolvedValue({ data: mockHtml });

      const result = await scrapeProductFromUrl('https://fr.aliexpress.com/item/100500123456789.html');
      expect(result.titre).toBe('Montre Homme Luxe Quartz Chronographe');
      expect(result.description).toContain('acier inoxydable');
      expect(result.prix_source).toBe(14.99);
      expect(result.devise_source).toBe('USD');
      expect(result.prix).toBeGreaterThan(12000); // 14.99 * 605 * marge
      expect(result.prix_achat).toBe(9069); // 14.99 * 605
      expect(result.images.length).toBe(2);
      expect(result.images[0]).toBe('https://ae01.alicdn.com/kf/S111.jpg');
      expect(result.categorie).toBe('mode');
    });

    test('extrait les données et photos d\'une fiche SHEIN avec JSON échappé', async () => {
      const mockSheinHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>SHEIN Ensemble Haut Asymétrique et Pantalon Fluide</title>
            <script>
              var gbCommonConfig = {
                "goods_name": "Ensemble Haut Asymétrique et Pantalon Fluide",
                "retailPrice": { "amountWithSymbol": "18.99€" }
              };
              var productImages = [
                "https:\\/\\/img.ltwebstatic.com\\/images3_pi\\/2024\\/02\\/01\\/pic1_thumbnail_900x.webp",
                "https:\\/\\/img.ltwebstatic.com\\/images3_pi\\/2024\\/02\\/01\\/pic2_thumbnail_900x.webp"
              ];
            </script>
          </head>
          <body></body>
        </html>
      `;

      axios.get.mockResolvedValue({ data: mockSheinHtml });

      const result = await scrapeProductFromUrl('https://fr.shein.com/goods-p-541261665.html');
      expect(result.titre).toBe('Ensemble Haut Asymétrique et Pantalon Fluide');
      expect(result.prix_achat).toBeGreaterThan(10000);
      expect(result.images.length).toBe(2);
      expect(result.images[0]).toBe('https://img.ltwebstatic.com/images3_pi/2024/02/01/pic1.webp');
      expect(result.categorie).toBe('mode');
    });

    test('extrait les données d\'une fiche Amazon avec data-a-dynamic-image', async () => {
      const mockAmazonHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <span id="productTitle">Casque Audio Sans Fil Réduction Bruit</span>
            <span class="a-price"><span class="a-offscreen">49.99€</span></span>
            <img id="landingImage" data-a-dynamic-image='{"https://m.media-amazon.com/images/I/81XYZ._AC_SX679_.jpg":[679,679],"https://m.media-amazon.com/images/I/91ABC._AC_SX679_.jpg":[679,679]}' />
          </head>
          <body></body>
        </html>
      `;

      axios.get.mockResolvedValue({ data: mockAmazonHtml });

      const result = await scrapeProductFromUrl('https://www.amazon.fr/dp/B08N5WRWNW');
      expect(result.titre).toBe('Casque Audio Sans Fil Réduction Bruit');
      expect(result.prix_achat).toBeGreaterThan(30000);
      expect(result.images.length).toBeGreaterThanOrEqual(2);
      expect(result.images[0]).toBe('https://m.media-amazon.com/images/I/81XYZ._AC_SL1500_.jpg');
    });

    test('gère le fallback intelligemment si la requête échoue', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      const result = await scrapeProductFromUrl('https://fr.aliexpress.com/item/10050099999.html');
      expect(result.titre).toContain('AliExpress');
      expect(result.prix).toBeGreaterThan(0);
      expect(result.prix_achat).toBeGreaterThan(0);
      expect(result.prix_barre).toBeGreaterThan(result.prix);
    });
  });

});
