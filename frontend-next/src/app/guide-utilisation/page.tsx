import type { Metadata } from 'next'
import GuideUtilisationClient from './GuideUtilisationClient'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export const metadata: Metadata = {
  title: 'Guide d\'Utilisation Simplifié : Compte, Boutique & Caisse POS | Nopalou',
  description:
    'Découvrez le mode d\'emploi complet de Nopalou : comment créer votre compte, configurer votre boutique, utiliser la Caisse POS hors-ligne, gérer vos dettes clients et émettre des factures OHADA.',
  alternates: {
    canonical: `${BASE}/guide-utilisation`,
  },
  openGraph: {
    title: 'Guide d\'Utilisation Simplifié : Compte, Boutique & Caisse POS | Nopalou',
    description:
      'Mode d\'emploi interactif pas-à-pas pour maîtriser toutes les fonctionnalités de votre boutique en ligne et de votre caisse magasin au Sénégal.',
    url: `${BASE}/guide-utilisation`,
    type: 'article',
  },
}

export default function GuideUtilisationPage() {
  return <GuideUtilisationClient />
}
