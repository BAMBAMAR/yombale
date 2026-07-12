import type { Metadata } from 'next'
import FavorisClient from './FavorisClient'

export const metadata: Metadata = {
  title: 'Mes favoris',
  description: 'Vos produits favoris enregistrés sur Nopalou.',
}

export default function FavorisPage() {
  return <FavorisClient />
}
