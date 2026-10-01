import type { Metadata } from 'next'
import InscriptionClient from './InscriptionClient'

export const metadata: Metadata = {
  title: 'Créer un compte',
  description: 'Créez votre compte Nopalou : suivez vos commandes et vos loyers, publiez vos annonces et, si vous vendez, ouvrez votre boutique WhatsApp.',
}

export default function InscriptionPage() {
  return <InscriptionClient />
}
