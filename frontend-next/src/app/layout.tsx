import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import './globals.css';

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
