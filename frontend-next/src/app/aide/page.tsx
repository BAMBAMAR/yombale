import { Metadata } from 'next'
import AideClient from './AideClient'

export const metadata: Metadata = {
  title: "Centre d'Aide & Support — Nopalou Sénégal",
  description: "Guides pratiques, foire aux questions et assistance officielle pour gérer votre boutique en ligne, caisse POS et paiements au Sénégal.",
}

export default function AidePage() {
  return <AideClient />
}
