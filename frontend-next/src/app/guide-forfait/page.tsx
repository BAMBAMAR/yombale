import type { Metadata } from 'next'
import '@/styles/guides.css'
import GuideForfaitPage from './GuideForfaitContent'import { OG_IMAGES } from '@/lib/social'


const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export const metadata: Metadata = {
  title: 'Guide forfaits télécom — Choisir son forfait au Sénégal',
  description: 'Comparez les forfaits Sonatel/Orange, Free, Expresso et Promobile au Sénégal. Scoring personnalisé pour trouver le meilleur rapport qualité/prix selon vos usages.',
  openGraph: { images: OG_IMAGES,
    title: 'Guide forfaits télécom — Nopalou',
    description: 'Trouvez le meilleur forfait télécom au Sénégal selon vos usages avec un outil de scoring personnalisé.',
    type: 'website',
  },
  alternates: { canonical: `${BASE}/guide-forfait` },
}

export default GuideForfaitPage
