import type { Metadata } from 'next'
import GuideImmoPage from './GuideImmoContent'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export const metadata: Metadata = {
  title: 'Guide immobilier — Louer ou acheter au Sénégal',
  description: 'Outil de scoring pour trouver votre logement idéal au Sénégal : louer ou acheter à Dakar, Thiès, Saint-Louis. Comparez appartements, villas, studios selon votre profil.',
  openGraph: {
    title: 'Guide immobilier intelligent — Nopalou',
    description: 'Trouvez votre logement idéal au Sénégal avec un scoring personnalisé selon votre budget et votre profil.',
    type: 'website',
  },
  alternates: { canonical: `${BASE}/guide-immo` },
}

export default GuideImmoPage
