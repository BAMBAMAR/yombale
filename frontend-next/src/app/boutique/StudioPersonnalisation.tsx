'use client'

import '@/styles/studio.css'
import React, { useState, useMemo } from 'react'
import {
  Palette,
  Eye,
  Sliders,
  RefreshCw,
  Check,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import StudioDispositionSections from './StudioDispositionSections'
import { useStudioPersonnalisation } from './studio/useStudioPersonnalisation'
import StudioThemeSelector from './studio/StudioThemeSelector'
import StudioPresetAndCategory from './studio/StudioPresetAndCategory'
import StudioColorsAndButtons from './studio/StudioColorsAndButtons'
import StudioMediaUploader from './studio/StudioMediaUploader'
import StudioMarketingTexts from './studio/StudioMarketingTexts'
import StudioMockupPreview from './studio/StudioMockupPreview'
import { RADIUS_MAP, getContrastColor } from './studio/constants'
import type { BoutiqueCustomizationData } from './studio/types'

export type { BoutiqueCustomizationData }

export default function StudioPersonnalisation({
  boutique,
  onSaved,
}: {
  boutique: BoutiqueCustomizationData
  onSaved?: () => void
}) {
  const [activeScreenTab, setActiveScreenTab] = useState<'editeur' | 'apercu'>('editeur')

  const {
    categorie,
    setCategorie,
    styleActif,
    couleurTheme,
    setCouleurTheme,
    formeBoutons,
    setFormeBoutons,
    dispositionCatalogue,
    setDispositionCatalogue,
    dispositionSections,
    setDispositionSections,
    slogan,
    setSlogan,
    bandeauPromo,
    setBandeauPromo,
    bandeauPromoActif,
    setBandeauPromoActif,
    messageAccueil,
    setMessageAccueil,
    coverUrl,
    setCoverUrl,
    coverPreviewLocal,
    setCoverPreviewLocal,
    setCoverFile,
    logoPreviewLocal,
    logoExtractedColors,
    photoFeedback,
    setPhotoFeedback,
    activeCategoryCoversTab,
    setActiveCategoryCoversTab,
    scoreData,
    themeId,
    appliquerTheme,
    isSaving,
    saveSuccess,
    saveError,
    coverInputRef,
    logoInputRef,
    canvasRef,
    handleCoverFileChange,
    handleLogoFileChange,
    appliquerPresetStyle,
    handleEnregistrer,
  } = useStudioPersonnalisation({ boutique, onSaved })

  const currentRadius = RADIUS_MAP[formeBoutons] || '10px'
  const contrastBtnText = useMemo(() => getContrastColor(couleurTheme), [couleurTheme])
  const activeCover =
    coverPreviewLocal ||
    coverUrl ||
    boutique.cover_url ||
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80'
  const activeLogo = logoPreviewLocal || boutique.logo_url || null
  const publicShopUrl = `/boutiques/${boutique.slug || boutique.id}`

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 0 80px' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* En-Tête du Studio */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 18,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 260 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `${couleurTheme}15`,
              color: couleurTheme,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Palette size={22} />
          </div>
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-archivo), sans-serif',
                fontSize: 19,
                fontWeight: 850,
                margin: 0,
                color: '#0F172A',
                lineHeight: 1.25,
              }}
            >
              Personnaliser ma boutique
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748B' }}>
              Donnez à <strong>{boutique.nom}</strong> son identité visuelle unique.
            </p>
          </div>
        </div>

        {/* Jauge Score d'Attractivité */}
        <div
          style={{
            background: scoreData.score >= 80 ? '#F0FDF4' : '#FFF7ED',
            border: `1.5px solid ${scoreData.score >= 80 ? '#BBF7D0' : '#FED7AA'}`,
            borderRadius: 14,
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flex: '0 1 auto',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: scoreData.score >= 80 ? '#166534' : '#9A3412',
                }}
              >
                Attractivité
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: scoreData.score >= 80 ? '#15803D' : '#C2410C',
                }}
              >
                {scoreData.score}%
              </span>
            </div>
            <div
              style={{
                width: 140,
                height: 6,
                background: '#e2e8f0',
                borderRadius: 10,
                marginTop: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${scoreData.score}%`,
                  height: '100%',
                  background: scoreData.score >= 80 ? '#16A34A' : '#EA580C',
                  borderRadius: 10,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* Boutons d'Action Rapide */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: '0 0 auto' }}>
          <a
            href={publicShopUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              background: '#F8FAFC',
              border: '1.5px solid #CBD5E1',
              color: '#1E293B',
              fontSize: 12,
              fontWeight: 750,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <ExternalLink size={13} />
            <span>Voir vitrine</span>
          </a>

          <button
            onClick={handleEnregistrer}
            disabled={isSaving}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              background: couleurTheme,
              color: contrastBtnText,
              border: 'none',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: isSaving ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} strokeWidth={3} />}
            <span>{isSaving ? 'Enregistrement…' : 'Publier'}</span>
          </button>
        </div>
      </div>

      {/* Messages d'Alerte & Feedback */}
      {saveSuccess && (
        <div
          style={{
            background: '#F0FDF4',
            border: '1.5px solid #86EFAC',
            borderRadius: 12,
            padding: '12px 18px',
            color: '#166534',
            fontSize: 13.5,
            fontWeight: 700,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircle2 size={18} />
          <span>Modifications enregistrées et publiées avec succès sur votre vitrine !</span>
        </div>
      )}
      {saveError && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1.5px solid #FECACA',
            borderRadius: 12,
            padding: '12px 18px',
            color: '#DC2626',
            fontSize: 13.5,
            fontWeight: 700,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={18} />
          <span>{saveError}</span>
        </div>
      )}

      {/* Sélecteur Mobile : Éditeur / Aperçu */}
      <div
        className="studio-mobile-switcher"
        style={{
          background: '#F1F5F9',
          borderRadius: 12,
          padding: 3,
          marginBottom: 16,
        }}
      >
        <button
          onClick={() => setActiveScreenTab('editeur')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 9,
            border: 'none',
            background: activeScreenTab === 'editeur' ? '#ffffff' : 'transparent',
            color: activeScreenTab === 'editeur' ? '#0F172A' : '#64748B',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            boxShadow: activeScreenTab === 'editeur' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          <Sliders size={14} />
          <span>Personnaliser</span>
        </button>
        <button
          onClick={() => setActiveScreenTab('apercu')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 9,
            border: 'none',
            background: activeScreenTab === 'apercu' ? '#ffffff' : 'transparent',
            color: activeScreenTab === 'apercu' ? '#0F172A' : '#64748B',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            boxShadow: activeScreenTab === 'apercu' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          <Eye size={14} />
          <span>Aperçu direct</span>
        </button>
      </div>

      {/* Corps Principal : 2 Colonnes */}
      <div className="studio-main-grid">
        {/* Colonne Gauche : Contrôles Éditeur */}
        <div
          className={`studio-editor-col ${activeScreenTab === 'apercu' ? 'studio-editor-hidden-mobile' : ''}`}
          style={{ flexDirection: 'column', gap: 16 }}
        >
          <StudioThemeSelector
            themeActif={themeId}
            onSelectTheme={appliquerTheme}
          />

          <StudioPresetAndCategory
            categorie={categorie}
            setCategorie={(cat) => {
              setCategorie(cat)
              setActiveCategoryCoversTab(cat.toLowerCase())
            }}
            styleActif={styleActif}
            couleurTheme={couleurTheme}
            onAppliquerPresetStyle={appliquerPresetStyle}
          />

          <StudioColorsAndButtons
            couleurTheme={couleurTheme}
            setCouleurTheme={setCouleurTheme}
            logoExtractedColors={logoExtractedColors}
            formeBoutons={formeBoutons}
            setFormeBoutons={setFormeBoutons}
            contrastBtnText={contrastBtnText}
          />

          <StudioMediaUploader
            couleurTheme={couleurTheme}
            contrastBtnText={contrastBtnText}
            categorie={categorie}
            coverUrl={coverUrl}
            setCoverUrl={setCoverUrl}
            setCoverFile={setCoverFile}
            coverPreviewLocal={coverPreviewLocal}
            setCoverPreviewLocal={setCoverPreviewLocal}
            coverInputRef={coverInputRef}
            onCoverFileChange={handleCoverFileChange}
            photoFeedback={photoFeedback}
            setPhotoFeedback={setPhotoFeedback}
            activeCategoryCoversTab={activeCategoryCoversTab}
            setActiveCategoryCoversTab={setActiveCategoryCoversTab}
            logoInputRef={logoInputRef}
            onLogoFileChange={handleLogoFileChange}
            logoPreviewLocal={logoPreviewLocal}
            initialLogoUrl={boutique.logo_url}
            boutiqueNom={boutique.nom}
          />

          <StudioMarketingTexts
            couleurTheme={couleurTheme}
            slogan={slogan}
            setSlogan={setSlogan}
            bandeauPromo={bandeauPromo}
            setBandeauPromo={setBandeauPromo}
            bandeauPromoActif={bandeauPromoActif}
            setBandeauPromoActif={setBandeauPromoActif}
            messageAccueil={messageAccueil}
            setMessageAccueil={setMessageAccueil}
          />

          <StudioDispositionSections
            sections={dispositionSections}
            onChange={setDispositionSections}
            dispositionCatalogue={dispositionCatalogue}
            onChangeDispositionCatalogue={setDispositionCatalogue}
          />
        </div>

        {/* Colonne Droite : Prévisualisation & Mobile Bottom Bar */}
        <StudioMockupPreview
          boutique={boutique}
          couleurTheme={couleurTheme}
          contrastBtnText={contrastBtnText}
          currentRadius={currentRadius}
          activeCover={activeCover}
          activeLogo={activeLogo}
          slogan={slogan}
          bandeauPromo={bandeauPromo}
          bandeauPromoActif={bandeauPromoActif}
          activeScreenTab={activeScreenTab}
          setActiveScreenTab={setActiveScreenTab}
          isSaving={isSaving}
          onEnregistrer={handleEnregistrer}
        />
      </div>
    </div>
  )
}
