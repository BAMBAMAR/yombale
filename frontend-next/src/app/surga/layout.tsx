import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import { TEMOIN_CONFIGURE, CLASSE_CONFIGURE } from '@/lib/surga-demarrage'
import React from 'react'
import { ADRESSE_SURGA } from '@/lib/surga-adresse'
import '@/styles/surga.css'
import SurgaSwRegister from './components/SurgaSwRegister'
import SurgaRadioProvider from './components/SurgaRadioProvider'
import SurgaFenetresClavier from './components/SurgaFenetresClavier'
import SurgaAccessibiliteAuto from './components/SurgaAccessibiliteAuto'
import SurgaPwaInstallPrompt from './components/SurgaPwaInstallPrompt'
import SurgaRepriseAppareil from './components/SurgaRepriseAppareil'

export const metadata: Metadata = {
  title: 'Surga — Assistant Personnel de Poche',
  description: 'Votre assistant personnel au quotidien au Sénégal : briefing du matin, gestion des dépenses en FCFA, notes, agenda et services locaux.',
  manifest: '/surga/manifest.json',
  alternates: {
    canonical: ADRESSE_SURGA,
  },
  openGraph: {
    title: 'Surga — Assistant Personnel de Poche',
    description: 'Votre assistant quotidien au Sénégal : briefing du matin, gestion des dépenses en FCFA, notes, agenda et veille locale.',
    url: ADRESSE_SURGA,
    siteName: 'Surga',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: `${ADRESSE_SURGA}/icons/icon-512.png?v=5`,
        width: 512,
        height: 512,
        alt: 'Surga — Assistant Personnel de Poche',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Surga — Assistant Personnel de Poche',
    description: 'Votre assistant quotidien au Sénégal : briefing, dépenses FCFA, notes et agenda.',
    images: [`${ADRESSE_SURGA}/icons/icon-512.png?v=5`],
  },
  icons: {
    icon: '/surga/icons/favicon.svg?v=5',
    shortcut: '/surga/icons/favicon.svg?v=5',
    // Carré plein : iOS découpe lui-même l'icône, des coins transparents y deviendraient noirs.
    apple: '/surga/apple-touch-icon.png?v=5',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Surga',
  },
}

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
}

const surgaJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Surga',
  operatingSystem: 'All',
  applicationCategory: 'UtilitiesApplication',
  description: 'Assistant personnel de poche au quotidien au Sénégal : briefing du matin, dépenses FCFA, notes, agenda et services locaux.',
  url: ADRESSE_SURGA,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'XOF',
  },
}

export default function SurgaLayout({ children }: { children: React.ReactNode }) {
  // SRG-A3-003 : appareil déjà configuré : l'attente de l'application est envoyée à la place de l'accueil public.
  const dejaConfigure = cookies().get(TEMOIN_CONFIGURE)?.value === '1'
  return (
    <div className={dejaConfigure ? `surga-root ${CLASSE_CONFIGURE}` : 'surga-root'}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(surgaJsonLd) }}
      />
      <SurgaSwRegister />
      <SurgaRepriseAppareil />
      <SurgaFenetresClavier />
      <SurgaAccessibiliteAuto />
      <SurgaPwaInstallPrompt />
      <SurgaRadioProvider>
        {children}
      </SurgaRadioProvider>
    </div>
  )
}
