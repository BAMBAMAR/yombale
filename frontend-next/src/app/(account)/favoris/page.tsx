import type { Metadata } from 'next'
import FavorisClient from './FavorisClient'

export const metadata: Metadata = {
  title: 'Mes favoris — Nopalou',
  description: 'Vos produits favoris enregistrés sur Nopalou.',
}

export default function FavorisPage() {
  return <FavorisClient />
}
