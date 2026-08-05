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
}

export default function PageHeader({ breadcrumb, emoji, titre, compteur, cta }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      <nav aria-label="Fil d'Ariane" style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14 }}>
        {breadcrumb.map((c, i) => (
          <span key={i}>
            {i > 0 && ' › '}
            {c.href ? (
              <Link href={c.href} style={{ color: 'var(--text2)' }}>{c.label}</Link>
            ) : (
              <span style={{ color: 'var(--text1)' }}>{c.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, margin: 0 }}>
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
        <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6, overflowWrap: 'break-word', wordBreak: 'break-word', maxWidth: '100%' }}>{compteur}</p>
      )}
    </div>
  )
}
