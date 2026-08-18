import type { Metadata } from 'next'
import InscriptionClient from './InscriptionClient'

export const metadata: Metadata = {
  title: 'Créer un compte',
  description: 'Créez votre compte Nopalou gratuitement pour gérer vos annonces et favoris.',
}

export default function InscriptionPage() {
  return <InscriptionClient />
}
