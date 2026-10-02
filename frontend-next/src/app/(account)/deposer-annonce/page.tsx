import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getOptionalSession } from '@/lib/dal'
import { backendAuthFetch } from '@/lib/backendFetch'
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

  // AUD-219 : la vérification de l'e-mail est exigée à la publication ; on prévient dès l'ouverture du formulaire
  let emailVerifie = true
  try {
    const res = await backendAuthFetch('/auth/statut')
    if (res.ok) emailVerifie = (await res.json()).email_verifie === true
  } catch {
    emailVerifie = true // en cas d'erreur réseau, on ne bloque pas : le serveur refusera de toute façon si besoin
  }

  return (
    <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      <PageHeader
        breadcrumb={[
          { label: t('account.navMyAds'), href: '/mes-annonces' },
          { label: t('account.navPublishAd') }
        ]}
        emoji=""
        titre={t('account.navPublishAd')}
      />
      <FormulaireAnnonce email={session.email ?? ''} emailVerifie={emailVerifie} />

      <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
        {t('account.termsNotice')}{' '}
        <Link href="/cgu" style={{ color: 'var(--accent)' }}>CGU</Link>.
      </p>
    </div>
  )
}
