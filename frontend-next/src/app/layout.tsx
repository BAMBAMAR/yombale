import type { Metadata, Viewport } from 'next';
import { Inter, Archivo } from 'next/font/google';
import Script from 'next/script';
import { headers } from 'next/headers';
import Image from 'next/image';
import './globals.css';
import { getOptionalSession } from '@/lib/dal';

// ── Sentry (optionnel, front-end error tracking) ────────────────
let Sentry;
try {
  Sentry = require('@sentry/nextjs');
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.1,
      integrations: [
        new Sentry.Replay({ maskAllText: true, blockAllMedia: true }),
      ],
      replaySessionSampleRate: 0.1,
      replayOnErrorSampleRate: 1.0,
    });
  }
} catch (err) {
  // Sentry pas disponible, c'est OK (frontend peut fonctionner sans)
}

import NavbarActions from './NavbarActions';
import NavbarSearch from './NavbarSearch';
import NavbarGuides from './NavbarGuides'
import MobileNav from './MobileNav'
import BottomBars from './BottomBars';
import RegisterSW from './RegisterSW';
import FavToast from './FavToast';
import VerifyEmailToast from './VerifyEmailToast';
import { CartProvider } from '@/context/CartContext';
import { Suspense } from 'react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // safe-area iPhone à encoche (les barres fixes en bas utilisent env(safe-area-inset-bottom))
  themeColor: '#C75B00',
};

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

const SITE_NAV_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Navigation Principale Nopalou',
  itemListElement: [
    {
      '@type': 'SiteNavigationElement',
      position: 1,
      name: 'Téléphones & Smartphones',
      description: 'Comparez les prix des téléphones Samsung, iPhone, Xiaomi à Dakar',
      url: 'https://nopalou.com/categorie/smartphones',
    },
    {
      '@type': 'SiteNavigationElement',
      position: 2,
      name: 'Informatique & Laptops',
      description: 'Ordinateurs portables, MacBooks et imprimantes au meilleur prix au Sénégal',
      url: 'https://nopalou.com/categorie/informatique',
    },
    {
      '@type': 'SiteNavigationElement',
      position: 3,
      name: 'TV & Électroménager',
      description: 'Téléviseurs Smart TV, climatiseurs, réfrigérateurs et machines à laver à Dakar',
      url: 'https://nopalou.com/categorie/tv-electro',
    },
    {
      '@type': 'SiteNavigationElement',
      position: 4,
      name: 'Immobilier Sénégal',
      description: 'Locations d\'appartements, chambres et terrains à vendre à Dakar',
      url: 'https://nopalou.com/immo',
    },
    {
      '@type': 'SiteNavigationElement',
      position: 5,
      name: 'Forfaits Télécom',
      description: 'Comparateur de forfaits internet et pass Orange, Free, Expresso',
      url: 'https://nopalou.com/telecom',
    },
    {
      '@type': 'SiteNavigationElement',
      position: 6,
      name: 'Annonces Classifiées',
      description: 'Petites annonces d\'achats et ventes de particuliers et professionnels',
      url: 'https://nopalou.com/annonces',
    },
    {
      '@type': 'SiteNavigationElement',
      position: 7,
      name: 'Boutiques Partenaires',
      description: 'Découvrez les boutiques certifiées et vendeurs pro au Sénégal',
      url: 'https://nopalou.com/boutiques',
    },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getOptionalSession();
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html lang="fr" className={`${inter.variable} ${archivo.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="color-scheme" content="light" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="facebook-domain-verification" content="cuulztpcqwrgoat2wfubj3cuerfwu0" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_NAV_JSON_LD) }}
        />
      </head>
      <body>
        <CartProvider>
        {/* Lien d'évitement pour la navigation au clavier (WCAG 2.4.1) */}
        <a href="#app-main" className="skip-link">
          Aller au contenu principal
        </a>

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-GD7365PKTS"
          strategy="afterInteractive"
          nonce={nonce}
        />
        <Script id="ga4-init" strategy="afterInteractive" nonce={nonce}>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-GD7365PKTS');
          `}
        </Script>
        <Script id="ripple-handler" strategy="afterInteractive" nonce={nonce}>
          {`
            document.addEventListener('click', function(e) {
              const target = e.target.closest('button, .chip, .pcard, .nav-user, .navbar-link, .btn-primary');
              if (!target) return;
              const rect = target.getBoundingClientRect();
              const circle = document.createElement('span');
              const diameter = Math.max(rect.width, rect.height);
              const radius = diameter / 2;
              circle.style.width = circle.style.height = diameter + 'px';
              circle.style.left = (e.clientX - rect.left - radius) + 'px';
              circle.style.top = (e.clientY - rect.top - radius) + 'px';
              circle.classList.add('ripple');
              const existing = target.getElementsByClassName('ripple')[0];
              if (existing) existing.remove();
              target.appendChild(circle);
            });
          `}
        </Script>

        <header role="banner">
          <nav className="navbar" aria-label="Navigation principale">
            <div className="navbar-top-row">
              <a href="/" className="logo" aria-label="Nopalou - Comparateur de prix au Sénégal">
                <Image src="/icons/logo-mark.svg" alt="" className="logo-icon" width={28} height={28} priority />
                <span className="logo-name" data-suffix="lou">Nopa</span>
              </a>
              <div className="navbar-links" role="menubar" style={{ whiteSpace: 'nowrap' }}>
                <a href="/" className="navbar-link" role="menuitem">Produits</a>
                <a href="/immo" className="navbar-link" role="menuitem">Immobilier</a>
                <a href="/telecom" className="navbar-link" role="menuitem">Télécom</a>
                <a href="/annonces" className="navbar-link" role="menuitem">Annonces</a>
                <a href="/boutiques" className="navbar-link" role="menuitem">Boutiques</a>
                <NavbarGuides />
              </div>
              <div className="navbar-search-desktop">
                <NavbarSearch />
              </div>
              <div className="navbar-actions">
                {session ? (
                  <a href="/boutique" className="navbar-maboutique" aria-label="Accéder à ma boutique" style={{ background: 'var(--navy)', color: '#fff', padding: '8px 14px', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                    🏪 Ma Boutique
                  </a>
                ) : (
                  <a href="/creer-boutique" className="navbar-taftaf" aria-label="Créer Boutique Taf Taf" style={{ background: '#E8F5E9', color: '#166534', border: '1px solid #22c55e', padding: '8px 16px', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                    ⚡ Boutique Taf Taf
                  </a>
                )}
                <a href="/deposer-annonce" className="navbar-deposer" aria-label="Publier une nouvelle annonce" style={{ whiteSpace: 'nowrap' }}>
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
              {/* Mobile-only icon actions */}
              <div className="navbar-icon-actions">
                <a href="/assistant-whatsapp" className="navbar-icon-btn navbar-icon-btn--whatsapp" aria-label="Assistant WhatsApp" title="Assistant WhatsApp">💬</a>
                <a href="/favoris" className="navbar-icon-btn navbar-icon-btn--favoris" aria-label="Mes favoris" title="Favoris">❤</a>
                <a href="/creer-boutique" className="navbar-icon-btn" aria-label="Boutique Taf Taf" title="Taf Taf" style={{ color: '#25D366' }}>⚡</a>
                <a href="/deposer-annonce" className="navbar-icon-btn navbar-icon-btn--publier" aria-label="Publier" title="Publier">➕</a>
                <a href={session ? "/compte" : "/connexion"} className="navbar-icon-btn navbar-icon-btn--profil" aria-label="Profil" title="Profil">👤</a>
              </div>
              <MobileNav
                isLoggedIn={!!session}
                nom={session?.nom ?? session?.email ?? undefined}
              />
            </div>
          </nav>
        </header>

        <main id="app-main" tabIndex={-1}>{children}</main>

        <BottomBars />
        <RegisterSW />
        <FavToast />
        <Suspense fallback={null}>
          <VerifyEmailToast />
        </Suspense>

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
                <a href="https://www.facebook.com/profile.php?id=61591675701726" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="footer-social-link">f</a>
                <a href="https://twitter.com/nopalou_sn" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="footer-social-link">𝕏</a>
                <a href="https://www.instagram.com/nopalousn/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="footer-social-link">▣</a>
                <a href="https://wa.me/221708717942" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="footer-social-link">💬</a>
              </div>
            </div>

            <div className="footer-links">
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

          {/* Recherches populaires — maillage SEO */}
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>Recherches populaires</p>
            <div style={{ display: 'flex', gap: '8px 18px', flexWrap: 'wrap', fontSize: 13 }}>
              <a href="/categorie/tv-electro/climatiseurs">Climatiseur prix Dakar</a>
              <a href="/categorie/smartphones/iphone">iPhone prix Dakar</a>
              <a href="/categorie/smartphones/samsung">Samsung prix Dakar</a>
              <a href="/categorie/tv-electro/televiseurs">TV prix Dakar</a>
              <a href="/categorie/tv-electro/refrigerateurs">Frigo prix Dakar</a>
              <a href="/categorie/informatique/ordinateurs">Ordinateur portable Dakar</a>
              <a href="/immo/location-appartement-dakar">Location appartement Dakar</a>
              <a href="/immo/location-chambre-dakar">Chambre à louer Dakar</a>
              <a href="/immo/vente-terrain-dakar">Terrain à vendre Dakar</a>
              <a href="/telecom/orange">Forfaits Orange</a>
              <a href="/telecom/yas">Forfaits Yas</a>
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
        </CartProvider>
      </body>
    </html>
  );
}
