import Link from 'next/link'

export interface Crumb {
  label: string
  href?: string
}

export interface PageHeaderCta {
  label: string
  href?: string
  onClick?: () => void
}

export interface PageHeaderProps {
  breadcrumb: Crumb[]
  emoji?: string
  titre: string
  compteur?: string
  cta?: PageHeaderCta
  centered?: boolean
}

export default function PageHeader({ breadcrumb, emoji, titre, compteur, cta, centered }: PageHeaderProps) {
  const textAlign = centered ? 'center' : 'left'
  const alignFlex = centered ? 'center' : 'flex-start'
  const justifyFlex = centered ? 'center' : 'space-between'

  return (
    <div style={{ marginBottom: 20, textAlign }}>
      <nav
        aria-label="Fil d'Ariane"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          fontWeight: 600,
          background: 'var(--orange2, #FFF3E8)',
          padding: '5px 14px',
          borderRadius: '20px',
          border: '1px solid rgba(199, 91, 0, 0.12)',
          boxShadow: '0 1px 3px rgba(199, 91, 0, 0.05)',
          marginBottom: 14,
        }}
      >
        {breadcrumb.map((c, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #C75B00)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
            {c.href ? (
              <Link
                href={c.href}
                style={{
                  color: 'var(--text2, #6B5E52)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'color 0.15s ease',
                }}
              >
                {i === 0 && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #C75B00)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                )}
                <span>{c.label}</span>
              </Link>
            ) : (
              <span
                style={{
                  color: 'var(--accent, #C75B00)',
                  fontWeight: 800,
                  background: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                }}
              >
                {c.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: alignFlex, justifyContent: justifyFlex, gap: 16, flexWrap: 'wrap', flexDirection: centered ? 'column' : 'row' }}>
        <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, margin: 0, textAlign }}>
          {emoji ? `${emoji} ` : ''}{titre}
        </h1>
        {cta && (
          cta.href ? (
            <Link href={cta.href} className="annonces-cta-btn">{cta.label}</Link>
          ) : (
            <button type="button" className="annonces-cta-btn" onClick={cta.onClick}>{cta.label}</button>
          )
        )}
      </div>

      {compteur && (
        <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6, overflowWrap: 'break-word', wordBreak: 'break-word', maxWidth: '100%', textAlign }}>{compteur}</p>
      )}
    </div>
  )
}
