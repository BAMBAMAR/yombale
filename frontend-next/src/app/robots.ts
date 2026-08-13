import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/compte/', '/mes-annonces', '/payer-annonce/', '/paiement/', '/admin/', '/api/'],
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
