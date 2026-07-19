import Link from 'next/link'

interface SeoCardBlurb {
  emoji: string
  text: React.ReactNode
}

interface SeoCardChip {
  href: string
  emoji: string
  label: string
  small?: boolean
}

interface SeoCardChipRow {
  label: string
  chips: SeoCardChip[]
}

interface SeoCardProps {
  titre: string
  tag?: string
  blurbs: SeoCardBlurb[]
  chipRows: SeoCardChipRow[]
  foot?: React.ReactNode
}

export default function SeoCard({ titre, tag, blurbs, chipRows, foot }: SeoCardProps) {
  return (
    <div className="seo-card-wrap">
      <div className="seo-card">
        <div className="seo-head">
          <h2>{titre}</h2>
          {tag && <span className="seo-tag">{tag}</span>}
        </div>

        <div className="seo-cols-wrap">
          <div className="seo-cols-grid">
            {blurbs.map((b, i) => (
              <div key={i} className="seo-blurb">
                <span className="seo-icon">{b.emoji}</span>
                <p>{b.text}</p>
              </div>
            ))}
          </div>
        </div>

        {chipRows.map((row, i) => (
          <div key={i}>
            <p className="chip-row-label">{row.label}</p>
            <div className="chip-row">
              {row.chips.map(c => (
                <Link key={c.href} href={c.href} className={`chip${c.small ? ' chip-small' : ''}`}>
                  <span className="chip-em">{c.emoji}</span>
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        {foot && (
          <div className="seo-foot">
            <span className="seo-dot" />
            {foot}
          </div>
        )}
      </div>
    </div>
  )
}
