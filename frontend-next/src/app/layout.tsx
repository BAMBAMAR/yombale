import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import Script from 'next/script';
import { headers } from 'next/headers';
import Image from 'next/image';
import './globals.css';
import { getOptionalSession } from '@/lib/dal';
import NavbarActions from './NavbarActions';
import NavbarSearch from './NavbarSearch';
import NavbarGuides from './NavbarGuides'
import MobileNav from './MobileNav'
import BottomBars from './BottomBars';
import RegisterSW from './RegisterSW';

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'),
  openGraph: {
    siteName: 'Nopalou',
    locale: 'fr_SN',
    type: 'website',
    images: [{ url: '/api/og-image', width: 1200, height: 630, alt: 'Nopalou — Comparateur de prix Sénégal' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@nopalou_sn',
    title: 'Nopalou — Comparateur de prix Sénégal',
    description: 'Comparez les prix de milliers de produits au Sénégal.',
    images: ['/api/og-image'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nopalou',
  },
  icons: {
    shortcut: '/icons/icon-192.svg',
  },
};

const ORG_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Nopalou',
  url: 'https://nopalou.com',
  logo: 'https://nopalou.com/icons/icon-512.svg',
  description: 'Comparateur de prix N°1 au Sénégal — trouvez le prix le moins cher à Dakar pour téléphones, TV, électroménager, informatique.',
  inLanguage: 'fr',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://nopalou.com/?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getOptionalSession();
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html lang="fr" className={`${inter.variable} ${sora.variable}`}>
      <head>
        <meta name="theme-color" content="#C75B00" />
        <meta name="color-scheme" content="light" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="facebook-domain-verification" content="cuulztpcqwrgoat2wfubj3cuerfwu0" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
        />
      </head>
      <body>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-3KGE1YBMVJ"
          strategy="afterInteractive"
          nonce={nonce}
        />
        <Script id="ga4-init" strategy="afterInteractive" nonce={nonce}>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-3KGE1YBMVJ');
          `}
        </Script>
        <nav className="navbar">
          <a href="/" className="logo"><Image src="/icons/logo-mark.svg" alt="" className="logo-icon" width={28} height={28} priority /><span className="logo-name" data-suffix="lou">Nopa</span></a>
          <div className="navbar-links">
            <a href="/" className="navbar-link">Produits</a>
            <a href="/immo" className="navbar-link">Immobilier</a>
            <a href="/telecom" className="navbar-link">Télécom</a>
            <a href="/annonces" className="navbar-link">Annonces</a>
            <a href="/boutiques" className="navbar-link">Boutiques</a>
            <NavbarGuides />
          </div>
          <NavbarSearch />
          <div className="navbar-actions">
            <a href="/deposer-annonce" className="navbar-deposer">
              + Publier
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
          <MobileNav
            isLoggedIn={!!session}
            nom={session?.nom ?? session?.email ?? undefined}
          />
        </nav>

        <main>{children}</main>

        <BottomBars />
        <RegisterSW />

        <footer className="site-footer">
          <div className="footer-inner">
            {/* Colonne 1 — Brand */}
            <div className="footer-brand">
              <a href="/" className="footer-logo">
                <Image src="/icons/logo-mark.svg" alt="" width={28} height={28} style={{ borderRadius: 7, flexShrink: 0 }} />
                <span className="footer-logo-name" data-suffix="lou">Nopa</span>
              </a>
              <p className="footer-tagline">Le premier comparateur de prix dédié au marché sénégalais — produits, immobilier, forfaits télécom.</p>
              <div className="footer-social">
                <a href="https://facebook.com/nopalou" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="footer-social-link">f</a>
                <a href="https://twitter.com/nopalou_sn" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="footer-social-link">𝕏</a>
                <a href="https://instagram.com/nopalou_sn" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="footer-social-link">▣</a>
                <a href="https://wa.me/221708717942" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="footer-social-link">💬</a>
              </div>
            </div>

            <div className="footer-links" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {/* Colonne 2 — Catégories */}
              <div className="footer-col">
                <p className="footer-col-titre">Catégories</p>
                <a href="/categorie/smartphones">Téléphones</a>
                <a href="/categorie/informatique">Informatique</a>
                <a href="/categorie/tv-electro">TV &amp; Électro</a>
                <a href="/categorie/mode">Mode</a>
                <a href="/categorie/maison">Maison</a>
                <a href="/categorie/auto-moto">Auto &amp; Moto</a>
                <a href="/telecom">Télécom</a>
                <a href="/immo">Immobilier</a>
                <a href="/annonces">Annonces</a>
              </div>

              {/* Colonne 3 — Mon compte */}
              <div className="footer-col">
                <p className="footer-col-titre">Mon compte</p>
                <a href="/connexion">Connexion</a>
                <a href="/inscription">Inscription</a>
                <a href="/deposer-annonce">Publier une annonce</a>
                <a href="/deposer-immo">Publier un bien immo</a>
                <a href="/mes-annonces">Mes annonces</a>
                <a href="/favoris">Mes favoris</a>
                <a href="/boutique">Ma boutique</a>
                <a href="/compte/apporteur">Devenir apporteur</a>
              </div>

              {/* Colonne 4 — Informations */}
              <div className="footer-col">
                <p className="footer-col-titre">Informations</p>
                <a href="/guide-emploi">Comment ça marche ?</a>
                <a href="/assistant-whatsapp">💬 Assistant WhatsApp</a>
                <a href="/boutiques">Boutiques partenaires</a>
                <a href="/mentions-legales">Mentions légales</a>
                <a href="/confidentialite">Confidentialité</a>
                <a href="/cgu">CGU</a>
              </div>

              {/* Colonne 5 — Contact */}
              <div className="footer-col">
                <p className="footer-col-titre">Contact</p>
                <a href="mailto:contact@nopalou.com">contact@nopalou.com</a>
                <a href="tel:+221708717942">+221 70 871 79 42</a>
                <a href="https://wa.me/221708717942" target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', marginTop: 4 }}>Dakar, Sénégal</span>
              </div>
            </div>
          </div>

          {/* Bandeau confiance */}
          <div className="footer-trust">
            <div className="footer-trust-item">✅ <strong>Gratuit</strong> &amp; indépendant</div>
            <div className="footer-trust-item">🔄 Prix mis à jour <strong>toutes les 6h</strong></div>
            <div className="footer-trust-item">🇸🇳 <strong>100% Sénégal</strong></div>
          </div>

          <div className="footer-bottom">
            <p>© 2026 Nopalou — Une marque de SKYROAD - SARL. Dakar, Sénégal. Tous droits réservés.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
