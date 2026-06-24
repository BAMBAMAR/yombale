import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import './globals.css';
import { getOptionalSession } from '@/lib/dal';
import NavbarActions from './NavbarActions';
import NavbarSearch from './NavbarSearch';
import CompareBar from './CompareBar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Nopalou — Comparateur de prix Sénégal',
    template: '%s | Nopalou',
  },
  description:
    'Comparez les prix de milliers de produits, annonces immo et forfaits télécom au Sénégal. Trouvez les meilleures offres à Dakar.',
  keywords: ['comparateur prix', 'Sénégal', 'Dakar', 'achat en ligne', 'immobilier', 'forfait télécom', 'Nopalou'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.sn'),
  openGraph: {
    siteName: 'Nopalou',
    locale: 'fr_SN',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Nopalou — Comparateur de prix Sénégal' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@nopalou_sn',
    title: 'Nopalou — Comparateur de prix Sénégal',
    description: 'Comparez les prix de milliers de produits au Sénégal.',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nopalou',
  },
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
  },
};

const ORG_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Nopalou',
  url: 'https://nopalou.sn',
  logo: 'https://nopalou.sn/icons/icon-512.svg',
  description: 'Comparateur de prix en ligne au Sénégal — produits, immobilier, forfaits télécom.',
  areaServed: 'SN',
  inLanguage: 'fr',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getOptionalSession();

  return (
    <html lang="fr" className={`${inter.variable} ${sora.variable}`}>
      <head>
        <meta name="theme-color" content="#C75B00" />
        <meta name="color-scheme" content="light" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
        />
      </head>
      <body>
        <nav className="navbar">
          <a href="/" className="logo">
            Nopa<span>lou</span>
          </a>
          <div className="navbar-links">
            <a href="/" className="navbar-link">Produits</a>
            <a href="/immo" className="navbar-link">Immobilier</a>
            <a href="/telecom" className="navbar-link">Télécom</a>
          </div>
          <NavbarSearch />
          <div className="navbar-actions">
            <a href="/deposer-annonce" className="navbar-deposer">
              + Déposer
            </a>
            {session ? (
              <NavbarActions nom={session.nom ?? session.email ?? 'Mon compte'} />
            ) : (
              <>
                <a href="/connexion" className="navbar-link">Connexion</a>
                <a href="/inscription" className="navbar-inscription">S&apos;inscrire</a>
              </>
            )}
          </div>
        </nav>

        <main>{children}</main>

        <CompareBar />

        <footer className="site-footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <a href="/" className="footer-logo">Nopa<span>lou</span></a>
              <p className="footer-tagline">Comparateur de prix au Sénégal 🇸🇳</p>
            </div>
            <div className="footer-links">
              <div className="footer-col">
                <p className="footer-col-titre">Explorer</p>
                <a href="/">Produits</a>
                <a href="/immo">Immobilier</a>
                <a href="/telecom">Télécom</a>
                <a href="/favoris">Favoris</a>
              </div>
              <div className="footer-col">
                <p className="footer-col-titre">Mon compte</p>
                <a href="/connexion">Connexion</a>
                <a href="/inscription">Inscription</a>
                <a href="/deposer-annonce">Déposer une annonce</a>
                <a href="/mes-annonces">Mes annonces</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Nopalou. Tous droits réservés.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
