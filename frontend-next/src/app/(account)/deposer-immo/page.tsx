import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
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
    <div>
      <p className="deposer-immo-sub">
        Gratuit et rapide — votre annonce sera visible après validation par notre équipe.
      </p>

      <FormulaireImmo />
    </div>
  )
}
