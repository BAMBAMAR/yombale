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
          fontSize: 12,
          fontWeight: 600,
          background: 'rgba(0,0,0,0.03)',
          padding: '4px 14px',
          borderRadius: '20px',
          border: '1px solid rgba(0,0,0,0.06)',
          marginBottom: 14,
        }}
      >
        {breadcrumb.map((c, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
            {i > 0 && <span style={{ margin: '0 6px', opacity: 0.35, fontSize: 11 }}>/</span>}
            {c.href ? (
              <Link href={c.href} style={{ color: 'var(--text3)', textDecoration: 'none' }}>{c.label}</Link>
            ) : (
              <span style={{ color: 'var(--text1)', fontWeight: 700 }}>{c.label}</span>
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
