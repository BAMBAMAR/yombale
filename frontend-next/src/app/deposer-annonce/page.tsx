import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getOptionalSession } from '@/lib/dal'
import Link from 'next/link'
import FormulaireAnnonce from './FormulaireAnnonce'

export const metadata: Metadata = {
  title: 'Déposer une annonce — Nopalou',
  description: 'Publiez votre annonce gratuitement sur Nopalou : téléphones, informatique, mode, auto, services et plus au Sénégal.',
}

export default async function DeposerAnnoncePage() {
  const session = await getOptionalSession()

  if (!session) {
    redirect('/connexion?redirect=/deposer-annonce')
  }

  return (
    <div className="page-container" style={{ paddingTop: '2rem', maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--navy)', margin: '0 0 6px' }}>
          Déposer une <span style={{ color: 'var(--accent)' }}>annonce</span>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text2)', margin: 0 }}>
          Publiez gratuitement sur Nopalou — les 2 premières annonces sont publiées instantanément.
        </p>
      </div>

      <FormulaireAnnonce email={session.email ?? ''} />

      <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
        En publiant, vous acceptez nos{' '}
        <Link href="/cgu" style={{ color: 'var(--accent)' }}>Conditions Générales d&apos;Utilisation</Link>.
        Les annonces ne respectant pas nos règles seront supprimées.
      </p>
    </div>
  )
}
