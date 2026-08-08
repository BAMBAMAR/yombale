import type { Metadata } from 'next'
import { ReactNode } from 'react'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export const metadata: Metadata = {
  title: 'Créer une Boutique en Ligne au Sénégal | Tarifs & Forfaits Vendeurs | Nopalou',
  description:
    'Lancez votre boutique en ligne et votre commerce sur WhatsApp au Sénégal en 2 minutes. Découvrez nos forfaits (Taf Taf 5.000 FCFA/mois, Vendeur Pro, Business VIP). Alternative N°1 à Shopify, adaptée à Wave et Orange Money.',
  keywords: [
    'créer boutique en ligne Sénégal',
    'lancer son commerce Dakar',
    'faire son business Sénégal',
    'forfait boutique en ligne',
    'tarif forfait vendeur Dakar',
    'alternative Shopify Sénégal',
    'Shopify Wave Orange Money',
    'acheter sur Alibaba pour vendre au Sénégal',
    'revente AliExpress Dakar',
    'vendre sur WhatsApp Sénégal',
    'solution e-commerce pas chère Dakar',
    'Nopalou boutique',
  ],
  alternates: {
    canonical: `${BASE}/creer-boutique`,
  },
  openGraph: {
    title: 'Créer une Boutique en Ligne au Sénégal | 1 Mois Offert | Nopalou',
    description:
      'Créez votre commerce en ligne et vendez sur WhatsApp sans carte bancaire avec paiement Wave & Orange Money. Découvrez nos formules d’abonnement dès 5.000 FCFA/mois.',
    url: `${BASE}/creer-boutique`,
    siteName: 'Nopalou',
    locale: 'fr_SN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Créer une Boutique en Ligne au Sénégal | Nopalou',
    description:
      'Lancez votre business e-commerce au Sénégal en 2 minutes avec Nopalou. 0% de commission, paiement Wave & Orange Money.',
  },
}

// Données structurées Schema.org pour Google
const JSON_LD_SERVICE = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Création de Boutique en Ligne Nopalou',
  provider: {
    '@type': 'Organization',
    name: 'Nopalou',
    url: BASE,
  },
  areaServed: {
    '@type': 'Country',
    name: 'Sénégal',
  },
  description:
    'Solution de création de boutique en ligne et vitrine e-commerce connectée à WhatsApp et Wave pour les vendeurs et commerçants au Sénégal.',
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Formules & Forfaits Vendeurs Nopalou',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Formule Boutique Taf Taf',
          description: 'Catalogue produits illimité, commandes WhatsApp directes, 1 mois offert.',
        },
        price: '2500',
        priceCurrency: 'XOF',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '2500',
          priceCurrency: 'XOF',
          unitText: 'MONTH',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Formule Vendeur Pro',
          description: 'Badge certifié, référencement prioritaire sur le comparateur Nopalou, support dédié.',
        },
        price: '5000',
        priceCurrency: 'XOF',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '5000',
          priceCurrency: 'XOF',
          unitText: 'MONTH',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Formule Business VIP',
          description: 'Accompagnement VIP, campagnes marketing, analytics avancés.',
        },
        price: '10000',
        priceCurrency: 'XOF',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '10000',
          priceCurrency: 'XOF',
          unitText: 'MONTH',
        },
      },
    ],
  },
}

const JSON_LD_BREADCRUMB = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Accueil',
      item: BASE,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Vendeurs & Tarifs',
      item: `${BASE}/tarifs-boutique`,
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Créer une boutique',
      item: `${BASE}/creer-boutique`,
    },
  ],
}

export default function CreerBoutiqueLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_SERVICE) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_BREADCRUMB) }}
      />
      {children}
    </>
  )
}
