import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getOptionalSession } from '@/lib/dal'
import PageHeader from '@/components/PageHeader'
import FormulaireImmo from './FormulaireImmo'
import { getServerTranslation } from '@/i18n/server'

export const metadata: Metadata = {
  title: 'Publier une annonce immobilière',
  description: 'Publiez gratuitement votre bien immobilier à louer ou à vendre au Sénégal.',
}

export default async function DeposerImmoPage() {
  const session = await getOptionalSession()

  if (!session) {
    redirect('/connexion?redirect=/deposer-immo')
  }

  const { t } = getServerTranslation()

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: t('account.navMyRealEstate'), href: '/mes-annonces-immo' },
          { label: t('account.navPublishRealEstate') }
        ]}
        emoji="🏡"
        titre={t('account.immoPageTitle')}
        compteur={t('account.immoPageSubtitle')}
      />

      <FormulaireImmo />
    </div>
  )
}
