'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { SECTIONS_PAR_DEFAUT, SectionItem } from '../StudioDispositionSections'
import type { BoutiqueCustomizationData, StylePreset } from './types'
import type { BoutiqueTheme } from '@/lib/boutique-themes'

export function useStudioPersonnalisation({
  boutique,
  onSaved,
}: {
  boutique: BoutiqueCustomizationData
  onSaved?: () => void
}) {
  const [themeId, setThemeId] = useState<string>(boutique.theme_id || 'classique')
  const [categorie, setCategorie] = useState<string>(boutique.categorie || 'mixte')
  const [styleActif, setStyleActif] = useState<string>(boutique.theme_style || 'moderne')
  const [couleurTheme, setCouleurTheme] = useState<string>(boutique.couleur_theme || '#C75B00')
  const [couleurSecondaire, setCouleurSecondaire] = useState<string>(boutique.couleur_secondaire || '#F8F5F0')
  const [formeBoutons, setFormeBoutons] = useState<string>(boutique.forme_boutons || 'squircle')
  const [dispositionCatalogue, setDispositionCatalogue] = useState<string>(boutique.disposition_catalogue || 'grille')
  const [dispositionSections, setDispositionSections] = useState<SectionItem[]>(() => {
    if (boutique.disposition_sections) {
      try {
        const parsed =
          typeof boutique.disposition_sections === 'string'
            ? JSON.parse(boutique.disposition_sections)
            : boutique.disposition_sections
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped: SectionItem[] = []
          for (const item of parsed) {
            const id = typeof item === 'string' ? item : item.id
            const def = SECTIONS_PAR_DEFAUT.find((s) => s.id === id)
            if (def) {
              mapped.push({
                ...def,
                visible: typeof item === 'object' && item.visible !== undefined ? item.visible : true,
              })
            }
          }
          for (const def of SECTIONS_PAR_DEFAUT) {
            if (!mapped.some((m) => m.id === def.id)) {
              mapped.push(def)
            }
          }
          return mapped
        }
      } catch (err) {
        console.warn('[StudioPersonnalisation] Erreur parsing disposition_sections:', err)
      }
    }
    return [...SECTIONS_PAR_DEFAUT]
  })

  const [slogan, setSlogan] = useState<string>(boutique.slogan || '')
  const [bandeauPromo, setBandeauPromo] = useState<string>(boutique.bandeau_promo || '')
  const [bandeauPromoActif, setBandeauPromoActif] = useState<boolean>(boutique.bandeau_promo_actif || false)
  const [messageAccueil, setMessageAccueil] = useState<string>(boutique.message_accueil || '')

  const [coverUrl, setCoverUrl] = useState<string>(boutique.cover_url || '')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreviewLocal, setCoverPreviewLocal] = useState<string | null>(null)

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreviewLocal, setLogoPreviewLocal] = useState<string | null>(null)

  const [logoExtractedColors, setLogoExtractedColors] = useState<string[]>([])
  const [isExtractingLogo, setIsExtractingLogo] = useState(false)
  const [photoFeedback, setPhotoFeedback] = useState<{ type: 'ok' | 'info' | 'warn'; msg: string } | null>(null)
  const [activeCategoryCoversTab, setActiveCategoryCoversTab] = useState<string>(
    (boutique.categorie || 'mode').toLowerCase()
  )

  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const coverInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (categorie) {
      setActiveCategoryCoversTab(categorie.toLowerCase())
    }
  }, [categorie])

  const scoreData = useMemo(() => {
    const checks = [
      { id: 'logo', label: 'Logo de la boutique', done: Boolean(boutique.logo_url || logoPreviewLocal), points: 20 },
      { id: 'cover', label: 'Photo de couverture', done: Boolean(coverUrl || coverPreviewLocal), points: 20 },
      { id: 'slogan', label: 'Slogan accrocheur', done: Boolean(slogan.trim()), points: 15 },
      {
        id: 'promo',
        label: "Bandeau d'annonce promo",
        done: Boolean(bandeauPromoActif && bandeauPromo.trim()),
        points: 10,
      },
      {
        id: 'whatsapp',
        label: 'Numéro WhatsApp vérifié',
        done: Boolean(boutique.whatsapp || boutique.telephone),
        points: 15,
      },
      {
        id: 'adresse',
        label: 'Adresse ou quartier renseigné',
        done: Boolean(boutique.adresse || boutique.ville),
        points: 10,
      },
      {
        id: 'horaires',
        label: "Horaires d'ouverture",
        done: Boolean(boutique.horaires && Object.keys(boutique.horaires).length > 0),
        points: 10,
      },
    ]
    const total = checks.reduce((acc, c) => acc + (c.done ? c.points : 0), 0)
    return { score: total, checks }
  }, [boutique, logoPreviewLocal, coverUrl, coverPreviewLocal, slogan, bandeauPromoActif, bandeauPromo])

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    const localUrl = URL.createObjectURL(file)
    setCoverPreviewLocal(localUrl)

    const img = new Image()
    img.src = localUrl
    img.onload = () => {
      const ratio = img.width / img.height
      if (ratio < 1.2) {
        setPhotoFeedback({
          type: 'warn',
          msg: "Votre image est au format portrait ou carré. Pour une bannière optimale, un format horizontal (16:9 ou panoramique) est recommandé afin d'éviter un rognage important.",
        })
      } else if (img.width < 600) {
        setPhotoFeedback({
          type: 'warn',
          msg: 'La résolution de cette image est inférieure à 600px. Elle pourrait apparaître floue sur les grands écrans.',
        })
      } else {
        setPhotoFeedback({
          type: 'ok',
          msg: 'Superbe photo ! La résolution et le cadrage panoramique sont parfaitement adaptés à votre vitrine.',
        })
      }
    }
  }

  const extraireCouleursDepuisImage = useCallback((imgSrc: string) => {
    setIsExtractingLogo(true)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imgSrc
    img.onload = () => {
      try {
        const canvas = canvasRef.current || document.createElement('canvas')
        canvas.width = 64
        canvas.height = 64
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0, 64, 64)
        const imgData = ctx.getImageData(0, 0, 64, 64).data

        const colorCounts: Record<string, { r: number; g: number; b: number; count: number; sat: number }> = {}
        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i]
          const g = imgData[i + 1]
          const b = imgData[i + 2]
          const a = imgData[i + 3]

          if (a < 150) continue
          if (r > 240 && g > 240 && b > 240) continue
          if (r < 15 && g < 15 && b < 15) continue

          const max = Math.max(r, g, b)
          const min = Math.min(r, g, b)
          const sat = max === 0 ? 0 : (max - min) / max

          const key = `${Math.round(r / 20) * 20}-${Math.round(g / 20) * 20}-${Math.round(b / 20) * 20}`
          if (!colorCounts[key]) {
            colorCounts[key] = { r, g, b, count: 1, sat }
          } else {
            colorCounts[key].count++
          }
        }

        const sorted = Object.values(colorCounts)
          .sort((a, b) => b.count * (1 + b.sat * 1.5) - a.count * (1 + a.sat * 1.5))
          .slice(0, 4)
          .map((c) => {
            const hexR = c.r.toString(16).padStart(2, '0')
            const hexG = c.g.toString(16).padStart(2, '0')
            const hexB = c.b.toString(16).padStart(2, '0')
            return `#${hexR}${hexG}${hexB}`
          })

        if (sorted.length > 0) {
          setLogoExtractedColors(sorted)
        }
      } catch (err) {
        console.warn("Impossible d'extraire les couleurs du logo:", err)
      } finally {
        setIsExtractingLogo(false)
      }
    }
    img.onerror = () => setIsExtractingLogo(false)
  }, [])

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const localUrl = URL.createObjectURL(file)
    setLogoPreviewLocal(localUrl)
    extraireCouleursDepuisImage(localUrl)
  }

  useEffect(() => {
    if (boutique.logo_url && logoExtractedColors.length === 0) {
      extraireCouleursDepuisImage(boutique.logo_url)
    }
  }, [boutique.logo_url, logoExtractedColors.length, extraireCouleursDepuisImage])

  const appliquerPresetStyle = (preset: StylePreset) => {
    setStyleActif(preset.id)
    setCouleurTheme(preset.couleurTheme)
    setCouleurSecondaire(preset.couleurSecondaire)
    setFormeBoutons(preset.formeBoutons)
    setDispositionCatalogue(preset.disposition)
  }

  const appliquerTheme = (theme: BoutiqueTheme) => {
    setThemeId(theme.id)
    setCouleurTheme(theme.css.primary)
    setCouleurSecondaire(theme.css.background)
    if (theme.id === 'mode-chic') setFormeBoutons('droit')
    else if (theme.id === 'nature-vert') setFormeBoutons('arrondi')
    else setFormeBoutons('squircle')
  }

  const handleEnregistrer = async () => {
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      const formData = new FormData()
      formData.append('categorie', categorie)
      formData.append('theme_style', styleActif)
      formData.append('theme_id', themeId)
      formData.append('couleur_theme', couleurTheme)
      formData.append('couleur_secondaire', couleurSecondaire)
      formData.append('forme_boutons', formeBoutons)
      formData.append('disposition_catalogue', dispositionCatalogue)
      formData.append('slogan', slogan)
      formData.append('bandeau_promo', bandeauPromo)
      formData.append('bandeau_promo_actif', String(bandeauPromoActif))
      formData.append('message_accueil', messageAccueil)
      formData.append('disposition_sections', JSON.stringify(dispositionSections))

      if (coverFile) {
        formData.append('cover', coverFile)
      } else if (coverUrl) {
        formData.append('cover_url', coverUrl)
      }

      if (logoFile) {
        formData.append('logo', logoFile)
      }

      const res = await fetch(`/api/boutiques/${boutique.id}`, {
        method: 'PUT',
        body: formData,
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || "Impossible d'enregistrer la personnalisation.")
      }

      boutique.categorie = categorie
      boutique.theme_id = themeId
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 5000)
      if (onSaved) onSaved()
    } catch (err: any) {
      setSaveError(err.message || 'Erreur lors de la sauvegarde.')
    } finally {
      setIsSaving(false)
    }
  }

  return {
    categorie,
    setCategorie,
    styleActif,
    couleurTheme,
    setCouleurTheme,
    couleurSecondaire,
    setCouleurSecondaire,
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
    isExtractingLogo,
    photoFeedback,
    setPhotoFeedback,
    activeCategoryCoversTab,
    setActiveCategoryCoversTab,
    scoreData,
    themeId,
    setThemeId,
    appliquerTheme,
    isSaving,
    saveSuccess,
    saveError,
    coverInputRef,
    logoInputRef,
    canvasRef,
    handleCoverFileChange,
    handleLogoFileChange,
    extraireCouleursDepuisImage,
    appliquerPresetStyle,
    handleEnregistrer,
  }
}
