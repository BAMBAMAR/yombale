'use client'

import React, { useState, useEffect } from 'react'
import { ExternalLink, Newspaper, Bookmark } from 'lucide-react'
import SurgaShareButton from './SurgaShareButton'
import { formaterPartageBreve } from '@/lib/surga-share'
import { estArticleEnNote, toggleArticleEnNote } from '@/lib/surga-cross-actions'

export interface BriefingNewsItem {
  id?: string
  source_nom: string
  titre: string
  resume: string
  url: string
  categorie?: string
  published_at?: string
}

interface SurgaNewsListProps {
  items: BriefingNewsItem[]
  onVoirPlus?: () => void
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Aujourd’hui'
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime()
    const diffMin = Math.floor(diffMs / (60 * 1000))
    if (diffMin < 60) return `Il y a ${Math.max(1, diffMin)} min`
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `Il y a ${diffHours} h`
    return 'Hier'
  } catch {
    return 'Récent'
  }
}

export default function SurgaNewsList({ items, onVoirPlus }: SurgaNewsListProps) {
  const [articlesEnNote, setArticlesEnNote] = useState<string[]>([])

  useEffect(() => {
    const synchroniser = () => {
      const enNoteIds = items
        .filter((it) => estArticleEnNote(it))
        .map((it) => it.url || it.titre)
      setArticlesEnNote(enNoteIds)
    }
    synchroniser()
    if (typeof window !== 'undefined') {
      window.addEventListener('surga-data-change', synchroniser)
      return () => window.removeEventListener('surga-data-change', synchroniser)
    }
  }, [items])

  if (!items || items.length === 0) {
    return (
      <div className="surga-card" style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text2, #5A4E42)' }}>
        <Newspaper size={24} style={{ opacity: 0.5, marginBottom: 8 }} />
        <div style={{ fontSize: 14 }}>Aucune brève disponible pour le moment.</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, idx) => (
        <article
          key={item.id || item.url || idx}
          className="surga-item-row"
          style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6, padding: '12px 14px' }}
        >
          {/* Ligne 1 : Titre complet */}
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text1, #1A1612)', lineHeight: 1.35 }}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit', textDecoration: 'none' }}
              title="Lire l’article complet sur le site source"
            >
              {item.titre}
            </a>
          </div>

          {/* Résumé court sourcé (Règle d'or Low-Data) */}
          {item.resume && item.resume !== item.titre && (
            <p style={{ fontSize: 13, color: 'var(--text2, #5A4E42)', margin: 0, lineHeight: 1.4 }}>
              {item.resume}
            </p>
          )}

          {/* Ligne 2 : Métadonnées et actions rapides */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 4,
              paddingTop: 6,
              borderTop: '1px solid #F1EBE4',
              fontSize: 12,
              color: 'var(--text3, #73675E)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>{item.source_nom}</span>
              <span>•</span>
              <span>{formatRelativeTime(item.published_at)}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {(() => {
                const itemKey = item.url || item.titre
                const estEnNote = articlesEnNote.includes(itemKey)
                return (
                  <button
                    type="button"
                    onClick={() => {
                      const actif = toggleArticleEnNote(item)
                      setArticlesEnNote((prev) =>
                        actif ? [...prev, itemKey] : prev.filter((k) => k !== itemKey)
                      )
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      padding: '4px 7px',
                      borderRadius: 6,
                      border: '1px solid',
                      borderColor: estEnNote ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
                      backgroundColor: estEnNote ? 'rgba(28, 43, 74, 0.1)' : '#FFFFFF',
                      color: 'var(--navy, #1C2B4A)',
                      fontSize: 11,
                      fontWeight: estEnNote ? 700 : 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    title={estEnNote ? "Brève présente dans vos Notes — Cliquer pour retirer" : "Épingler cette brève dans mes Notes"}
                  >
                    <Bookmark size={11} color="var(--navy, #1C2B4A)" />
                    <span>{estEnNote ? 'Épinglé ✓' : 'En Note'}</span>
                  </button>
                )
              })()}

              {/* Partage Web Share / WhatsApp */}
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

              {/* Lien vers l'original */}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  color: 'var(--accent, #C75B00)',
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontSize: 12,
                }}
              >
                <span>Lire</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </article>
      ))}

      {onVoirPlus && (
        <button
          type="button"
          onClick={onVoirPlus}
          className="surga-btn-secondary"
          style={{
            marginTop: 4,
            padding: '10px 14px',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            width: '100%',
          }}
        >
          <Newspaper size={15} />
          <span>Consulter toute la revue de presse</span>
        </button>
      )}
    </div>
  )
}
