import type { Metadata } from 'next'
import Link from 'next/link'
import { verifySession } from '@/lib/dal'

export const metadata: Metadata = { title: 'Mon compte' }

export default async function ComptePage() {
  const session = await verifySession()
  const nom = session.nom ?? session.email ?? 'vous'

  const cartes = [
    { href: '/mes-annonces', label: 'Mes annonces', emoji: '📋', actif: true },
    { href: '/boutique',     label: 'Ma boutique',  emoji: '🏪', actif: true },
    { href: '/favoris',      label: 'Mes alertes',  emoji: '🔔', actif: false },
    { href: '/compte/profil',label: 'Mon profil',   emoji: '✏️', actif: false },
  ]

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '22px', marginBottom: '4px' }}>
        Bonjour, {nom} 👋
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--text3)', marginBottom: '32px' }}>
        {session.email}
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
      }}>
        {cartes.map((c) =>
          c.actif ? (
            <Link
              key={c.href}
              href={c.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '24px 20px',
                boxShadow: 'var(--shadow)',
                transition: 'box-shadow 0.2s',
                textDecoration: 'none',
                color: 'var(--text1)',
              }}
            >
              <span style={{ fontSize: '28px' }}>{c.emoji}</span>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '15px' }}>
                {c.label}
              </span>
            </Link>
          ) : (
            <div
              key={c.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '24px 20px',
                opacity: 0.5,
                cursor: 'not-allowed',
                position: 'relative',
              }}
            >
              <span style={{ fontSize: '28px' }}>{c.emoji}</span>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '15px' }}>
                {c.label}
              </span>
              <span style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                fontSize: '10px',
                fontWeight: 700,
                background: 'var(--blue3)',
                color: 'var(--blue2)',
                borderRadius: '20px',
                padding: '2px 8px',
              }}>
                Bientôt
              </span>
            </div>
          )
        )}
      </div>
    </div>
  )
}
