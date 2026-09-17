import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getOptionalSession } from '@/lib/dal'
import PageHeader from '@/components/PageHeader'
import FavorisClient from './FavorisClient'

export const metadata: Metadata = {
  title: 'Mes favoris',
  description: 'Vos produits favoris enregistrés sur Nopalou.',
}

export default async function FavorisPage() {
  const session = await getOptionalSession()
  if (session) {
    redirect('/compte?tab=favoris')
  }

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: 'Accueil', href: '/' },
          { label: 'Mes favoris' }
        ]}
        emoji=""
        titre="Mes favoris"
      />
      <FavorisClient />
    </div>
  )
}
