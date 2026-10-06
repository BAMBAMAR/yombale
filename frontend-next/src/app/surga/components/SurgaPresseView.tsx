'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Newspaper, X, RefreshCw, Filter, TrendingUp, Cpu, Landmark, Users, BookOpen, Radio } from 'lucide-react'
import SurgaKiosqueUnes, { type UneItem } from './SurgaKiosqueUnes'
import SurgaArticleCard from './SurgaArticleCard'

export interface ArticlePresse {
  id?: string
  source_nom: string
  titre: string
  resume: string
  url: string
  categorie?: string
  rubrique_presse?: string
  published_at?: string
}

interface SurgaPresseViewProps {
  isOpen: boolean
  onClose: () => void
  initialRubrique?: string
  onOpenRadios?: () => void
}

const RUBRIQUES: Array<{ key: string; label: string; icon: React.ReactNode }> = [
  { key: 'toutes', label: 'Toutes', icon: <Newspaper size={13} /> },
  { key: 'economie', label: 'Économie', icon: <TrendingUp size={13} /> },
  { key: 'societe', label: 'Société', icon: <Users size={13} /> },
  { key: 'tech', label: 'Tech & Digital', icon: <Cpu size={13} /> },
  { key: 'politique', label: 'Institutions', icon: <Landmark size={13} /> },
]

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

export default function SurgaPresseView({
  isOpen,
  onClose,
  initialRubrique = 'toutes',
  onOpenRadios,
}: SurgaPresseViewProps) {
  const [vueMode, setVueMode] = useState<'articles' | 'kiosque'>('articles')
  const [rubriqueActive, setRubriqueActive] = useState<string>(initialRubrique)
  const [articles, setArticles] = useState<ArticlePresse[]>([])
  const [unes, setUnes] = useState<UneItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [loadingUnes, setLoadingUnes] = useState<boolean>(false)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

  const chargerArticles = useCallback(async (rubrique: string) => {
    setLoading(true)
    try {
      const url =
        rubrique === 'toutes'
          ? '/api/surga/presse'
          : `/api/surga/presse?rubrique=${encodeURIComponent(rubrique)}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success && Array.isArray(data.articles)) {
        setArticles(data.articles)
      }
    } catch (err) {
      console.warn('[SURGA PRESSE FETCH WARN]:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const chargerUnes = useCallback(async () => {
    setLoadingUnes(true)
    try {
      const res = await fetch('/api/surga/kiosque?limit=50')
      const data = await res.json()
      if (data.success && Array.isArray(data.unes)) {
        setUnes(data.unes)
      }
    } catch (err) {
      console.warn('[SURGA KIOSQUE FETCH WARN]:', err)
    } finally {
      setLoadingUnes(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      if (vueMode === 'articles') {
        chargerArticles(rubriqueActive)
      } else {
        chargerUnes()
      }
    }
  }, [isOpen, vueMode, rubriqueActive, chargerArticles, chargerUnes])

  const handleActualiser = async () => {
    setRefreshing(true)
    setFeedbackMessage(null)
    try {
      const res = await fetch('/api/surga/presse/refresh', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setFeedbackMessage(data.message || 'Flux actualisés avec succès.')
        if (vueMode === 'articles') await chargerArticles(rubriqueActive)
        else await chargerUnes()
      }
    } catch {
      setFeedbackMessage('Actualisation impossible hors connexion.')
    } finally {
      setRefreshing(false)
      setTimeout(() => setFeedbackMessage(null), 3000)
    }
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Revue de presse et kiosque Surga"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 43, 74, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
      }}
    >
      <div
        className="surga-sheet"
        style={{
          width: '100%',
          maxWidth: 620,
          maxHeight: '92vh',
          backgroundColor: 'var(--bg, #F8F5F0)',
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -6px 24px rgba(0, 0, 0, 0.14)',
          overflow: 'hidden',
          animation: 'slideUp 0.25s ease-out',
        }}
      >
        {/* Header Revue de presse & Kiosque */}
        <div
          style={{
            padding: '14px 16px 10px 16px',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: 'rgba(199, 91, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent, #C75B00)',
              }}
            >
              <Newspaper size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                Presse &amp; Kiosque Sénégal
              </h2>
              <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
                Sources vérifiées : Seneweb, APS, Le Soleil, PressAfrik, SeneNews...
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={handleActualiser}
              disabled={refreshing || loading}
              aria-label="Actualiser les flux"
              style={{
                background: 'none',
                border: '1px solid var(--border, #E8DDD2)',
                borderRadius: 8,
                width: 34,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text2, #5A4E42)',
              }}
            >
              <RefreshCw
                size={15}
                style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}
              />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer la revue de presse"
              style={{
                background: 'none',
                border: 'none',
                width: 34,
                height: 34,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text2, #5A4E42)',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Sélecteur de mode : Dépêches vs Kiosque des Unes */}
        <div
          style={{
            display: 'flex',
            padding: '8px 16px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={() => setVueMode('articles')}
            style={{
              flex: 1,
              padding: '7px 10px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              border: vueMode === 'articles' ? '1px solid var(--navy, #1C2B4A)' : '1px solid var(--border, #E8DDD2)',
              backgroundColor: vueMode === 'articles' ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
              color: vueMode === 'articles' ? '#FFFFFF' : 'var(--text2, #5A4E42)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Newspaper size={14} />
            <span>Dépêches &amp; Articles</span>
          </button>

          <button
            type="button"
            onClick={() => setVueMode('kiosque')}
            style={{
              flex: 1,
              padding: '7px 10px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              border: vueMode === 'kiosque' ? '1px solid var(--navy, #1C2B4A)' : '1px solid var(--border, #E8DDD2)',
              backgroundColor: vueMode === 'kiosque' ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
              color: vueMode === 'kiosque' ? '#FFFFFF' : 'var(--text2, #5A4E42)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <BookOpen size={14} />
            <span>Kiosque des Unes</span>
          </button>

          {onOpenRadios && (
            <button
              type="button"
              onClick={onOpenRadios}
              title="Écouter les radios locales sénégalaises"
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                border: '1px solid var(--border, #E8DDD2)',
                backgroundColor: 'var(--bg, #F8F5F0)',
                color: 'var(--accent, #C75B00)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
              }}
            >
              <Radio size={14} />
              <span>Radios FM</span>
            </button>
          )}
        </div>

        {/* Message d'action éphémère */}
        {feedbackMessage && (
          <div
            style={{
              padding: '6px 16px',
              backgroundColor: 'rgba(10, 92, 54, 0.08)',
              color: 'var(--price, #0A5C36)',
              fontSize: 12,
              fontWeight: 700,
              textAlign: 'center',
              borderBottom: '1px solid var(--border, #E8DDD2)',
            }}
          >
            {feedbackMessage}
          </div>
        )}

        {/* Barre de filtres horizontaux par rubrique (mode articles seulement) */}
        {vueMode === 'articles' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              backgroundColor: '#FFFFFF',
              borderBottom: '1px solid var(--border, #E8DDD2)',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              scrollbarWidth: 'none',
            }}
          >
            {RUBRIQUES.map((rub) => {
              const isActive = rubriqueActive === rub.key
              return (
                <button
                  key={rub.key}
                  type="button"
                  onClick={() => setRubriqueActive(rub.key)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 11px',
                    borderRadius: 14,
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 600,
                    border: isActive ? '1px solid var(--navy, #1C2B4A)' : '1px solid var(--border, #E8DDD2)',
                    backgroundColor: isActive ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : 'var(--text2, #5A4E42)',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {rub.icon}
                  <span>{rub.label}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Corps défilable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {vueMode === 'kiosque' ? (
            <SurgaKiosqueUnes unes={unes} loading={loadingUnes} />
          ) : loading ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text3, #73675E)' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1.2s linear infinite', opacity: 0.6 }} />
              <div style={{ marginTop: 10, fontSize: 13 }}>Chargement des dépêches...</div>
            </div>
          ) : articles.length === 0 ? (
            <div className="surga-card" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text2, #5A4E42)' }}>
              <Filter size={28} style={{ opacity: 0.4, marginBottom: 10 }} />
              <div style={{ fontSize: 14, fontWeight: 700 }}>Aucune brève trouvée</div>
              <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', marginTop: 4 }}>
                Aucune actualité ne correspond à cette rubrique pour l instant.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {articles.map((item, idx) => (
                <SurgaArticleCard
                  key={item.id || item.url || idx}
                  item={item}
                  formatRelativeTime={formatRelativeTime}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
