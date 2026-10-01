import type { Metadata } from 'next'

// AUD-165 : la page est un composant client (pas de métadonnées possibles) ; titre propre et hors index (suivi personnel)
export const metadata: Metadata = {
  title: 'Suivre ma commande',
  description: 'Suivez votre commande Nopalou avec sa référence et votre numéro de téléphone.',
  robots: { index: false, follow: true },
}

export default function SuiviCommandeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
