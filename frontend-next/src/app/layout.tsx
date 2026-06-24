import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import './globals.css';
import { getOptionalSession } from '@/lib/dal';
import NavbarActions from './NavbarActions';
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
    'Comparez les prix des produits et des annonces immobilières au Sénégal. Trouvez les meilleures offres sur Dakar et partout au Sénégal.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.sn'
  ),
  openGraph: {
    siteName: 'Nopalou',
    locale: 'fr_SN',
    type: 'website',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getOptionalSession();

  return (
    <html lang="fr" className={`${inter.variable} ${sora.variable}`}>
      <body>
        <nav className="navbar">
          <a href="/" className="logo">
            Nopa<span>lou</span>
          </a>
          <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
            <a
              href="/"
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text2)',
              }}
            >
              Produits
            </a>
            <a
              href="/immo"
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text2)',
              }}
            >
              Immobilier
            </a>
            <a
              href="/telecom"
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text2)',
              }}
            >
              Télécom
            </a>
          </div>
          <a
            href="/deposer-annonce"
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--accent)',
              border: '1.5px solid var(--accent)',
              whiteSpace: 'nowrap',
            }}
          >
            + Déposer
          </a>
          {session ? (
            <NavbarActions nom={session.nom ?? session.email ?? 'Mon compte'} />
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href="/connexion"
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text2)',
                }}
              >
                Connexion
              </a>
              <a
                href="/inscription"
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#fff',
                  background: 'var(--blue2)',
                }}
              >
                S&apos;inscrire
              </a>
            </div>
          )}
        </nav>
        <main>{children}</main>
        <CompareBar />
      </body>
    </html>
  );
}
