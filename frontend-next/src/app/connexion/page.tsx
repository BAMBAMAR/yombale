import type { Metadata } from 'next'
import ConnexionClient from './ConnexionClient'

export const metadata: Metadata = {
  alternates: { canonical: '/connexion' },
  title: 'Connexion',
  description: 'Connectez-vous à votre compte Nopalou.',
}

export default function ConnexionPage() {
  return <ConnexionClient />
}
