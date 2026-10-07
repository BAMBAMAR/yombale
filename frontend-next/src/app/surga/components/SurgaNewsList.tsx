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

import { formaterHeurePublication } from '@/lib/surga-formatting'

function assainirResume(resume?: string): string {
  if (!resume) return ''
  const trimmed = resume.trim()
  // Si le résumé se termine par un mot tronqué de 1 à 4 lettres avant '...', reculer au mot complet
  if (/\b[a-zA-ZÀ-ÿ']{1,4}\.\.\.$/.test(trimmed)) {
    return trimmed.replace(/\s+[a-zA-ZÀ-ÿ']{1,4}\.\.\.$/, '...')
  }
  return trimmed
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
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--surga-text1, #0F172A)', lineHeight: 1.35 }}>
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
            <p style={{ fontSize: 13, color: 'var(--surga-text2, #475569)', margin: 0, lineHeight: 1.4 }}>
              {assainirResume(item.resume)}
            </p>
          )}

          {/* Ligne 2 : Métadonnées et actions rapides calibrées mobile (Zéro débordement) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              marginTop: 4,
              paddingTop: 8,
              borderTop: '1px solid var(--surga-border, #E2E8F0)',
              fontSize: 12,
              color: 'var(--surga-text3, #94A3B8)',
            }}
          >
            {/* Source & Date (monoligne sécurisé) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                minWidth: 0,
                flex: '1 1 auto',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  color: 'var(--surga-primary, #0F172A)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.source_nom}
              </span>
              <span>•</span>
              <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                {formaterHeurePublication(item.published_at)}
              </span>
            </div>

            {/* 3 Actions rapides ergonomiques 32x32px (Zéro troncature, aucun débordement) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
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
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: '1px solid',
                      borderColor: estEnNote ? 'var(--surga-accent, #D97706)' : 'var(--surga-border, #E2E8F0)',
                      backgroundColor: estEnNote ? 'rgba(217, 119, 6, 0.12)' : 'var(--surga-surface, #FFFFFF)',
                      color: estEnNote ? 'var(--surga-accent, #D97706)' : 'var(--surga-primary, #0F172A)',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all 0.15s ease',
                    }}
                    title={estEnNote ? "Brève enregistrée dans vos Notes — Cliquer pour retirer" : "Épingler cette brève dans vos Notes"}
                    aria-label="Épingler en note"
                  >
                    <Bookmark
                      size={14}
                      fill={estEnNote ? 'currentColor' : 'none'}
                      color={estEnNote ? 'var(--surga-accent, #D97706)' : undefined}
                    />
                  </button>
                )
              })()}

              {/* Partage Web Share / WhatsApp sans bouton de copie redondant */}
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
                sansCopier
                taille="sm"
              />

              {/* Lien direct vers la source */}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`Lire l'article complet sur ${item.source_nom}`}
                aria-label="Lire l'article complet"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid var(--surga-border, #E2E8F0)',
                  backgroundColor: 'var(--surga-surface, #FFFFFF)',
                  color: 'var(--surga-accent, #D97706)',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <ExternalLink size={14} />
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
