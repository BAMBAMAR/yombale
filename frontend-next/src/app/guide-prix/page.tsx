import type { Metadata } from 'next'
import GuidePrixPage from './GuidePrixContent'
import { OG_IMAGES } from '@/lib/social'


const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'



export const metadata: Metadata = {
  title: 'Guide prix — Comparer les prix et créer des alertes au Sénégal',
  description: 'Utilisez Nopalou pour ne jamais payer trop cher au Sénégal : historique des prix, alertes baisse, comparaison multi-marchands pour smartphones, TV, électroménager.',
  openGraph: { images: OG_IMAGES,
    title: 'Guide prix — Nopalou',
    description: 'Maîtrisez vos achats au Sénégal grâce aux alertes prix et à l\'historique des prix sur Nopalou.',
    type: 'website',
  },
  alternates: { canonical: `${BASE}/guide-prix` },
}

import { apiFetch } from '@/lib/api'

export default async function Page() {
  let categoriesActives: string[] | null = null
  try {
    categoriesActives = await apiFetch<string[]>('/produits/categories-actives')
  } catch (e) {
    console.warn('[Nopalou:GuidePrix:categoriesActives]', e)
  }

  return <GuidePrixPage categoriesActives={categoriesActives} />
}
