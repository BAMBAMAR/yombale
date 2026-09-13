'use client'

import React from 'react'
import { Image as ImageIcon, Upload, Info, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { CATEGORIES } from '@/lib/categories'
import { CATEGORY_COVER_PHOTOS } from '@/lib/boutique-covers'

interface StudioMediaUploaderProps {
  couleurTheme: string
  contrastBtnText: string
  categorie: string
  coverUrl: string
  setCoverUrl: (url: string) => void
  setCoverFile: (file: File | null) => void
  coverPreviewLocal: string | null
  setCoverPreviewLocal: (url: string | null) => void
  coverInputRef: React.RefObject<HTMLInputElement | null>
  onCoverFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  photoFeedback: { type: 'ok' | 'info' | 'warn'; msg: string } | null
  setPhotoFeedback: (fb: { type: 'ok' | 'info' | 'warn'; msg: string } | null) => void
  activeCategoryCoversTab: string
  setActiveCategoryCoversTab: (tab: string) => void
  logoInputRef: React.RefObject<HTMLInputElement | null>
  onLogoFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  logoPreviewLocal: string | null
  initialLogoUrl?: string | null
  boutiqueNom: string
}

export default function StudioMediaUploader({
  couleurTheme,
  contrastBtnText,
  categorie,
  coverUrl,
  setCoverUrl,
  setCoverFile,
  coverPreviewLocal,
  setCoverPreviewLocal,
  coverInputRef,
  onCoverFileChange,
  photoFeedback,
  setPhotoFeedback,
  activeCategoryCoversTab,
  setActiveCategoryCoversTab,
  logoInputRef,
  onLogoFileChange,
  logoPreviewLocal,
  initialLogoUrl,
  boutiqueNom,
}: StudioMediaUploaderProps) {
  const activeLogo = logoPreviewLocal || initialLogoUrl

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '16px 18px', border: '1.5px solid #E2E8F0' }}>
      <h2
        style={{
          fontSize: 15,
          fontWeight: 850,
          color: '#0F172A',
          margin: '0 0 4px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <ImageIcon size={16} style={{ color: couleurTheme }} />
        <span>3. Logo &amp; Photo de couverture</span>
      </h2>
      <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 14px' }}>
        Importez votre logo officiel et habillez votre vitrine avec une bannière attractive.
      </p>

      {/* ── SECTION LOGO OFFICIEL ── */}
      <div
        style={{
          background: '#F8FAFC',
          borderRadius: 14,
          padding: '14px 16px',
          border: '1.5px solid #E2E8F0',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <input
          ref={logoInputRef as any}
          type="file"
          accept="image/*"
          onChange={onLogoFileChange}
          style={{ display: 'none' }}
        />

        {activeLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeLogo}
            alt="Logo boutique"
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              objectFit: 'cover',
              border: '2px solid #ffffff',
              boxShadow: '0 3px 10px rgba(0,0,0,0.12)',
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #1C2B4A 0%, #C75B00 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 900,
              flexShrink: 0,
            }}
          >
            {boutiqueNom ? boutiqueNom.slice(0, 2).toUpperCase() : 'NP'}
          </div>
        )}

        <div style={{ flex: '1 1 200px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
            Logo de votre boutique
          </h3>
          <p style={{ margin: '0 0 8px', fontSize: 11.5, color: '#64748B' }}>
            Format carré ou rond recommandé (PNG, JPG, SVG). Le studio extrait automatiquement les couleurs de votre
            logo.
          </p>
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1.5px solid #CBD5E1',
              background: '#ffffff',
              color: '#1E293B',
              fontSize: 12,
              fontWeight: 750,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Upload size={13} />
            <span>Changer le logo</span>
          </button>
        </div>
      </div>

      {/* ── SECTION BANNIÈRE / COUVERTURE ── */}
      <input
        ref={coverInputRef as any}
        type="file"
        accept="image/*"
        onChange={onCoverFileChange}
        style={{ display: 'none' }}
      />

      {/* Bouton Import Photo Perso */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          style={{
            padding: '8px 14px',
            borderRadius: 10,
            border: '1.5px solid #CBD5E1',
            background: '#ffffff',
            color: '#1E293B',
            fontSize: 12.5,
            fontWeight: 750,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Upload size={14} />
          <span>Importer ma photo personnalisée</span>
        </button>
      </div>

      {/* Feedback qualité photo */}
      {photoFeedback && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            marginBottom: 14,
            fontSize: 12,
            fontWeight: 650,
            lineHeight: 1.4,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            background: photoFeedback.type === 'warn' ? '#FFFBEB' : '#F0FDF4',
            border: `1.5px solid ${photoFeedback.type === 'warn' ? '#FDE68A' : '#BBF7D0'}`,
            color: photoFeedback.type === 'warn' ? '#B45309' : '#15803D',
          }}
        >
          {photoFeedback.type === 'warn' ? (
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          ) : (
            <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          )}
          <span>{photoFeedback.msg}</span>
        </div>
      )}

      {/* Onglets thématiques pour les bannières pré-conçues */}
      <div style={{ marginBottom: 10 }}>
        <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 750, color: '#334155' }}>
          Ou choisissez une bannière professionnelle suggérée :
        </p>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'none' }}>
          {CATEGORIES.filter((c) => !['annonces', 'immo'].includes(c.value)).map((cat) => {
            const isSelected = activeCategoryCoversTab === cat.value
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setActiveCategoryCoversTab(cat.value)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 8,
                  border: isSelected ? 'none' : '1px solid #E2E8F0',
                  background: isSelected ? couleurTheme : '#F8FAFC',
                  color: isSelected ? contrastBtnText : '#475569',
                  fontSize: 11,
                  fontWeight: 750,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.label.replace(/^[^\w\s]+/, '').trim()}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grille des bannières adaptées */}
      <div>
        {(() => {
          const coverPool =
            CATEGORY_COVER_PHOTOS[activeCategoryCoversTab] ||
            CATEGORY_COVER_PHOTOS[categorie] ||
            CATEGORY_COVER_PHOTOS['default'] ||
            []
          return (
            <div className="studio-covers-grid">
              {coverPool.map((photoUrl, idx) => {
                const isCurrent = coverUrl === photoUrl && !coverPreviewLocal
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCoverUrl(photoUrl)
                      setCoverFile(null)
                      setCoverPreviewLocal(null)
                      setPhotoFeedback(null)
                    }}
                    style={{
                      position: 'relative',
                      borderRadius: 10,
                      overflow: 'hidden',
                      aspectRatio: '16/9',
                      border: isCurrent ? `2.5px solid ${couleurTheme}` : '1.5px solid #E2E8F0',
                      cursor: 'pointer',
                      padding: 0,
                      background: '#f1f5f9',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoUrl}
                      alt={`Bannière ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        padding: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          color: '#fff',
                          fontWeight: 700,
                          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                        }}
                      >
                        Modèle {idx + 1} — {activeCategoryCoversTab}
                      </span>
                    </div>
                    {isCurrent && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: couleurTheme,
                          color: contrastBtnText,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 900,
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
