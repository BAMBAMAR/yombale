import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.sn'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/compte/', '/mes-annonces', '/payer-annonce/', '/paiement/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
