import type { Metadata } from 'next'
import GuidePrixPage from './GuidePrixContent'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
const SSR_SECRET = process.env.SSR_SECRET || ''
const SSR_HEADERS: Record<string, string> = SSR_SECRET ? { 'X-SSR-Token': SSR_SECRET } : {}

export const metadata: Metadata = {
  title: 'Guide prix — Comparer les prix et créer des alertes au Sénégal',
  description: 'Utilisez Nopalou pour ne jamais payer trop cher au Sénégal : historique des prix, alertes baisse, comparaison multi-marchands pour smartphones, TV, électroménager.',
  openGraph: {
    title: 'Guide prix — Nopalou',
    description: 'Maîtrisez vos achats au Sénégal grâce aux alertes prix et à l\'historique des prix sur Nopalou.',
    type: 'website',
  },
  alternates: { canonical: `${BASE}/guide-prix` },
}

export default async function Page() {
  let categoriesActives: string[] | null = null
  try {
    const res = await fetch(`${BACKEND}/api/produits/categories-actives`, { cache: 'no-store', headers: SSR_HEADERS })
    if (res.ok) {
      categoriesActives = await res.json()
    }
  } catch (e) {}

  return <GuidePrixPage categoriesActives={categoriesActives} />
}
