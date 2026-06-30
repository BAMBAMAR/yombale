import type { Metadata } from 'next'
import GuideAchatPage from './GuideAchatContent'

export const metadata: Metadata = {
  title: 'Guide d\'achat — Trouver le meilleur produit au Sénégal',
  description: 'Outil de scoring personnalisé pour choisir le meilleur produit selon votre budget, vos specs et votre profil d\'achat. Comparez smartphones, TV, informatique au Sénégal.',
  openGraph: {
    title: 'Guide d\'achat intelligent — Nopalou',
    description: 'Scoring personnalisé pour trouver le meilleur produit selon votre budget et vos critères.',
    type: 'website',
  },
}

export default GuideAchatPage
