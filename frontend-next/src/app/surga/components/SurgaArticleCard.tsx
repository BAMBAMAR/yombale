'use client'

import React from 'react'
import { ExternalLink } from 'lucide-react'
import SurgaShareButton from './SurgaShareButton'
import { formaterPartageBreve } from '@/lib/surga-share'
import type { ArticlePresse } from './SurgaPresseView'

interface SurgaArticleCardProps {
  item: ArticlePresse
  formatRelativeTime: (dateStr?: string) => string
}

export default function SurgaArticleCard({
  item,
  formatRelativeTime,
}: SurgaArticleCardProps) {
  return (
    <article
      className="surga-card"
      style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px', margin: 0 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, fontWeight: 700 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              padding: '2px 6px',
              borderRadius: 4,
              backgroundColor: 'rgba(28, 43, 74, 0.08)',
              color: 'var(--navy, #1C2B4A)',
            }}
          >
            {item.rubrique_presse || 'general'}
          </span>
          <span style={{ color: 'var(--text1, #1A1612)' }}>{item.source_nom}</span>
        </div>
        <span style={{ color: 'var(--text3, #73675E)' }}>{formatRelativeTime(item.published_at)}</span>
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1, #1A1612)', margin: 0, lineHeight: 1.35 }}>
        <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
          {item.titre}
        </a>
      </h3>

      {item.resume && (
        <p style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', margin: 0, lineHeight: 1.4 }}>
          {item.resume}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, paddingTop: 6, borderTop: '1px solid #F1EBE4' }}>
        <SurgaShareButton
          payload={{
            titre: `Surga : ${item.titre}`,
            texte: formaterPartageBreve({
              titre: item.titre,
              source: item.source_nom,
              resume: item.resume,
              urlSource: item.url,
            }),
            url: item.url,
          }}
          libelle="Partager"
          taille="sm"
        />

        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--accent, #C75B00)',
            textDecoration: 'none',
          }}
        >
          <span>Source</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </article>
  )
}
