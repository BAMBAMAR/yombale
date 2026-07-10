import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getOptionalSession } from '@/lib/dal'
import Link from 'next/link'
import FormulaireAnnonce from './FormulaireAnnonce'

export const metadata: Metadata = {
  title: 'Publier une annonce — Nopalou',
  description: 'Publiez votre annonce gratuitement sur Nopalou : téléphones, informatique, mode, auto, services et plus au Sénégal.',
}

export default async function DeposerAnnoncePage() {
  const session = await getOptionalSession()

  if (!session) {
    redirect('/connexion?redirect=/deposer-annonce')
  }

  return (
    <div>
      <FormulaireAnnonce email={session.email ?? ''} />

      <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
        En publiant, vous acceptez nos{' '}
        <Link href="/cgu" style={{ color: 'var(--accent)' }}>Conditions Générales d&apos;Utilisation</Link>.
        Les annonces ne respectant pas nos règles seront supprimées.
      </p>
    </div>
  )
}
