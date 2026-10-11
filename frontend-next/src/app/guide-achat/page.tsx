import type { Metadata } from 'next'
import '@/styles/guides.css'
import GuideAchatPage from './GuideAchatContent'
import { OG_IMAGES } from '@/lib/social'


const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'



export const metadata: Metadata = {
  title: 'Guide d\'achat — Trouver le meilleur produit au Sénégal',
  description: 'Outil de scoring personnalisé pour choisir le meilleur produit selon votre budget, vos specs et votre profil d\'achat. Comparez smartphones, TV, informatique au Sénégal.',
  openGraph: { images: OG_IMAGES,
    title: 'Guide d\'achat intelligent — Nopalou',
    description: 'Scoring personnalisé pour trouver le meilleur produit selon votre budget et vos critères.',
    type: 'website',
  },
  alternates: { canonical: `${BASE}/guide-achat` },
}

import { apiFetch } from '@/lib/api'

export default async function Page() {
  let categoriesActives: string[] | null = null
  try {
    categoriesActives = await apiFetch<string[]>('/produits/categories-actives')
  } catch (e) {
    console.warn('[Nopalou:GuideAchat:categoriesActives]', e)
  }

  return <GuideAchatPage categoriesActives={categoriesActives} />
}
