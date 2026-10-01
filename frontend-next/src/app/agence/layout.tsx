import type { Metadata } from 'next'

// AUD-165 : la page d'accueil de l'espace agence est un composant client sans métadonnées propres ; les pages
// de l'espace de gestion (agence/[slug]) restent privées (robots.txt) et gardent leurs propres titres.
export const metadata: Metadata = {
  title: 'Espace agence immobilière : baux, quittances et loyers',
  description: 'Gérez vos biens, vos baux, vos quittances et l\'encaissement des loyers par Wave et Orange Money depuis un seul espace.',
}

export default function AgenceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
