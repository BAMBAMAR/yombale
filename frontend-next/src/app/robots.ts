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
        // AUD-138 / décision du propriétaire : on interdit l'entraînement de modèles et les aspirateurs de données,
        // on laisse passer les assistants qui répondent à la demande d'un utilisateur (ChatGPT-User, OAI-SearchBot,
        // Perplexity-User…). Indicatif seulement : l'application réelle passe par les règles du CDN.
        userAgent: [
          'GPTBot',
          'CCBot',
          'ClaudeBot',
          'anthropic-ai',
          'Google-Extended',
          'Applebot-Extended',
          'Bytespider',
          'PerplexityBot',
          'Amazonbot',
          'meta-externalagent',
          'cohere-ai',
          'Diffbot',
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
