import type { Metadata } from 'next'
import GuideAchatPage from './GuideAchatContent'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
const SSR_SECRET = process.env.SSR_SECRET || ''
const SSR_HEADERS: Record<string, string> = SSR_SECRET ? { 'X-SSR-Token': SSR_SECRET } : {}

export const metadata: Metadata = {
  title: 'Guide d\'achat — Trouver le meilleur produit au Sénégal',
  description: 'Outil de scoring personnalisé pour choisir le meilleur produit selon votre budget, vos specs et votre profil d\'achat. Comparez smartphones, TV, informatique au Sénégal.',
  openGraph: {
    title: 'Guide d\'achat intelligent — Nopalou',
    description: 'Scoring personnalisé pour trouver le meilleur produit selon votre budget et vos critères.',
    type: 'website',
  },
  alternates: { canonical: `${BASE}/guide-achat` },
}

export default async function Page() {
  let categoriesActives: string[] | null = null
  try {
    const res = await fetch(`${BACKEND}/api/produits/categories-actives`, { cache: 'no-store', headers: SSR_HEADERS })
    if (res.ok) {
      categoriesActives = await res.json()
    }
  } catch (e) {}

  return <GuideAchatPage categoriesActives={categoriesActives} />
}
