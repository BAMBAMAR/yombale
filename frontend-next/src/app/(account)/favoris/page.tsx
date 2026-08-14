import type { Metadata } from 'next'
import PageHeader from '@/components/PageHeader'
import FavorisClient from './FavorisClient'

export const metadata: Metadata = {
  title: 'Mes favoris',
  description: 'Vos produits favoris enregistrés sur Nopalou.',
}

export default function FavorisPage() {
  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: 'Mon compte', href: '/compte' },
          { label: 'Mes favoris' }
        ]}
        emoji="❤️"
        titre="Mes favoris"
      />
      <FavorisClient />
    </div>
  )
}
