import type { Metadata } from 'next'

// AUD-165 : étape de paiement, composant client sans métadonnées propres ; titre propre et hors index
export const metadata: Metadata = {
  title: 'Commande express',
  robots: { index: false, follow: false },
}

export default function CheckoutExpressLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
