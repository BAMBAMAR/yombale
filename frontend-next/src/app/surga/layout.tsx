import type { Metadata, Viewport } from 'next'
import React from 'react'
import '@/styles/surga.css'
import SurgaSwRegister from './components/SurgaSwRegister'
import SurgaRadioProvider from './components/SurgaRadioProvider'

export const metadata: Metadata = {
  title: 'Surga — Assistant Personnel de Poche',
  description: 'Votre assistant personnel au quotidien au Sénégal : briefing du matin, gestion des dépenses en FCFA, notes, agenda et services locaux.',
  manifest: '/surga/manifest.json',
  alternates: {
    canonical: 'https://surga.nopalou.com',
  },
  openGraph: {
    title: 'Surga — Assistant Personnel de Poche',
    description: 'Votre assistant quotidien au Sénégal : briefing du matin, gestion des dépenses en FCFA, notes, agenda et veille locale.',
    url: 'https://surga.nopalou.com',
    siteName: 'Surga',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: 'https://surga.nopalou.com/surga/icons/icon-512.png',
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
    images: ['https://surga.nopalou.com/surga/icons/icon-512.png'],
  },
  icons: {
    icon: '/surga/icons/favicon.svg',
    shortcut: '/surga/icons/favicon.svg',
    apple: '/surga/icons/icon-192.png',
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
  url: 'https://surga.nopalou.com',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'XOF',
  },
}

export default function SurgaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="surga-root">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(surgaJsonLd) }}
      />
      <SurgaSwRegister />
      <SurgaRadioProvider>
        {children}
      </SurgaRadioProvider>
    </div>
  )
}
