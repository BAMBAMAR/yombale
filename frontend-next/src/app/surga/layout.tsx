import type { Metadata, Viewport } from 'next'
import React from 'react'
import '@/styles/surga.css'
import SurgaSwRegister from './components/SurgaSwRegister'

export const metadata: Metadata = {
  title: 'Surga — Assistant Personnel de Poche',
  description: 'Votre assistant personnel au quotidien au Sénégal : briefing du matin, gestion des dépenses en FCFA, notes, agenda et services locaux.',
  manifest: '/surga/manifest.json',
  openGraph: {
    title: 'Surga — Assistant Personnel de Poche',
    description: 'Votre assistant quotidien au Sénégal : briefing du matin, gestion des dépenses en FCFA, notes, agenda et veille locale.',
    url: 'https://surga.nopalou.com',
    siteName: 'Surga',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: 'https://nopalou.com/icons/icon-512.png',
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
    images: ['https://nopalou.com/icons/icon-512.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Surga',
  },
}

export const viewport: Viewport = {
  themeColor: '#1C2B4A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function SurgaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="surga-root">
      <SurgaSwRegister />
      {children}
    </div>
  )
}
