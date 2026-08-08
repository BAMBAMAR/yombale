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
                  <a href="/boutique" className="navbar-maboutique hidden-mobile" aria-label="Accéder à ma boutique" style={{ background: '#0f172a', color: '#fff', padding: '8px 14px', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', border: '1px solid #334155' }}>
                    🏪 Ma Boutique
                  </a>
                ) : (
                  <a href="/creer-boutique" className="navbar-taftaf hidden-mobile" aria-label="Créer Boutique Taf Taf" style={{ background: '#0f172a', color: '#fff', border: '1px solid #1e293b', padding: '8px 16px', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(15,23,42,0.1)' }}>
                    <span style={{ color: '#C75B00' }}>⚡</span> Boutique Taf Taf
                  </a>
                )}
                <a href="/deposer-annonce" className="navbar-deposer" aria-label="Publier une nouvelle annonce" style={{ whiteSpace: 'nowrap' }}>
                  + Publier
                </a>
                {session ? (
                  <NavbarActions nom={session.nom?.trim() || session.email?.trim() || 'Mon compte'} />
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
                <a href="/creer-boutique" className="navbar-pill-btn" aria-label="Boutique Taf Taf">🏪 Boutique</a>
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
              <div className="footer-social" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                <a href="https://www.tiktok.com/@nopalou.com?_r=1&_t=ZS-98f75NgDJNS" target="_blank" rel="noopener noreferrer" aria-label="TikTok" title="TikTok Officiel" className="footer-social-link footer-social-link--tiktok">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-2.85V7.6a6.34 6.34 0 0 0-5.1 6.2 6.34 6.34 0 1 0 10.9-4.38v-3.7a8.16 8.16 0 0 0 4.31 1.25v-3.28a4.85 4.85 0 0 1-.03-.01z"/></svg>
                </a>
                <a href="https://whatsapp.com/channel/0029Vb8fc4bBadmW40AFKx33" target="_blank" rel="noopener noreferrer" aria-label="Canal WhatsApp" title="Canal WhatsApp Officiel" className="footer-social-link footer-social-link--whatsapp">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.99c-.002 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
                <a href="https://www.facebook.com/profile.php?id=61591675701726" target="_blank" rel="noopener noreferrer" aria-label="Facebook" title="Facebook Page" className="footer-social-link footer-social-link--facebook">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://www.instagram.com/nopalousn/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram" className="footer-social-link footer-social-link--instagram">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="https://twitter.com/nopalou_sn" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" title="Twitter / X" className="footer-social-link footer-social-link--twitter">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
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
                <a href="/categorie/jeux">Jeux Vidéo</a>
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
                <a href="/tarifs-boutique">Tarifs &amp; Forfaits Vendeurs</a>
                <a href="/guide-creer-boutique">Guide Vendeur &amp; Sourcing</a>
                <a href="/demo">Démo Commerciale</a>
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
