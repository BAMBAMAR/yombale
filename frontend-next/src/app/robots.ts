import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Espaces privés, authentifiés et administration
          '/admin/',
          '/api/',
          '/compte',
          '/compte/',
          '/boutique/',
          '/agence/',
          '/deposer-annonce',
          '/deposer-immo',
          '/mes-annonces',
          '/mes-annonces-immo',
          '/payer-annonce/',
          '/payer-boost/',
          '/payer-sponsoring-boutique/',
          '/payer-sponsoring-immo/',
          '/payer-sponsoring-produit/',
          '/payer-loyer/',
          '/checkout-express',
          '/retour-paiement',
          '/suivi-commande',
          '/favoris',
          // Paramètres d'URL et filtres combinatoires (évite le duplicate content & économise le crawl budget)
          '/*?*q=*',
          '/*?*tri=*',
          '/*?*ids=*',
          '/*?*prixMax=*',
          '/*?*prixMin=*',
          '/*?*categorie=undefined',
        ],
      },
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'Bytespider',
          'CCBot',
          'ClaudeBot',
          'ImagesiftBot',
          'Scrapy',
          'AhrefsBot',
          'SemrushBot',
          'DotBot',
          'MJ12bot',
          'PetalBot',
          'DataForSeoBot'
        ],
        disallow: '/',
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
