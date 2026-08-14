import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getOptionalSession } from '@/lib/dal'
import PageHeader from '@/components/PageHeader'
import FormulaireImmo from './FormulaireImmo'

export const metadata: Metadata = {
  title: 'Publier une annonce immobilière',
  description: 'Publiez gratuitement votre bien immobilier à louer ou à vendre au Sénégal.',
}

export default async function DeposerImmoPage() {
  const session = await getOptionalSession()

  if (!session) {
    redirect('/connexion?redirect=/deposer-immo')
  }

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: 'Mes biens immo', href: '/mes-annonces-immo' },
          { label: 'Publier' }
        ]}
        emoji="🏡"
        titre="Publier un bien immobilier"
        compteur="Gratuit et rapide — votre annonce sera visible après validation par notre équipe."
      />

      <FormulaireImmo />
    </div>
  )
}
