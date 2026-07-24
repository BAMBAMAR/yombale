import { Metadata } from 'next'
import CaisseClient from './CaisseClient'

export const metadata: Metadata = {
  title: 'Caisse Enregistreuse POS — Nopalou',
  description: 'Point de vente physique et caisse enregistreuse connectée aux lecteurs code-barres et imprimantes thermiques.',
}

export default function CaissePage() {
  return <CaisseClient />
}
