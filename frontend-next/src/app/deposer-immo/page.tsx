import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getOptionalSession } from '@/lib/dal'
import FormulaireImmo from './FormulaireImmo'

export const metadata: Metadata = {
  title: 'Publier une annonce immobilière — Nopalou',
  description: 'Publiez gratuitement votre bien immobilier à louer ou à vendre au Sénégal.',
}

export default async function DeposerImmoPage() {
  const session = await getOptionalSession()

  if (!session) {
    redirect('/connexion?redirect=/deposer-immo')
  }

  return (
    <div className="deposer-immo-page">
      {/* Fil d'Ariane */}
      <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
        <Link href="/">Accueil</Link>
        {' › '}
        <Link href="/immo">Immobilier</Link>
        {' › '}
        <span>Publier une annonce</span>
      </p>

      <h1 className="deposer-immo-titre">🏠 Publier une annonce immo</h1>
      <p className="deposer-immo-sub">
        Gratuit et rapide — votre annonce sera visible après validation par notre équipe.
      </p>

      <div style={{ background: 'var(--orange2)', border: '1px solid var(--accent)', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: 'var(--accent)' }}>
        💡 Connecté en tant que <strong>{session.email}</strong>
      </div>

      <FormulaireImmo />
    </div>
  )
}
