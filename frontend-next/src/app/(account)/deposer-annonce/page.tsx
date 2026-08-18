import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getOptionalSession } from '@/lib/dal'
import Link from 'next/link'
import PageHeader from '@/components/PageHeader'
import FormulaireAnnonce from './FormulaireAnnonce'
import { getServerTranslation } from '@/i18n/server'

export const metadata: Metadata = {
  title: 'Publier une annonce',
  description: 'Publiez votre annonce gratuitement sur Nopalou : téléphones, informatique, mode, auto, services et plus au Sénégal.',
}

export default async function DeposerAnnoncePage() {
  const session = await getOptionalSession()

  if (!session) {
    redirect('/connexion?redirect=/deposer-annonce')
  }

  const { t } = getServerTranslation()

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: t('account.navMyAds'), href: '/mes-annonces' },
          { label: t('account.navPublishAd') }
        ]}
        emoji="📢"
        titre={t('account.navPublishAd')}
      />
      <FormulaireAnnonce email={session.email ?? ''} />

      <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
        {t('account.termsNotice')}{' '}
        <Link href="/cgu" style={{ color: 'var(--accent)' }}>CGU</Link>.
      </p>
    </div>
  )
}
