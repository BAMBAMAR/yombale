'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import ExternalImg from '@/components/ExternalImg'
import {
  Palette, Sparkles, Image as ImageIcon, Check, RefreshCw, Smartphone,
  Monitor, Eye, Upload, Info, AlertTriangle, ShieldCheck, Share2,
  Copy, Tag, MessageCircle, ExternalLink, CheckCircle2, ChevronRight,
  Sliders, Wand2, Store, Heart, ShoppingCart
} from 'lucide-react'

export interface BoutiqueCustomizationData {
  id: string
  nom: string
  slug: string | null
  description?: string | null
  categorie?: string | null
  telephone?: string | null
  whatsapp?: string | null
  ville?: string | null
  adresse?: string | null
  logo_url?: string | null
  cover_url?: string | null
  couleur_theme?: string | null
  couleur_secondaire?: string | null
  slogan?: string | null
  theme_style?: string | null
  forme_boutons?: string | null
  bandeau_promo?: string | null
  bandeau_promo_actif?: boolean
  message_accueil?: string | null
  disposition_catalogue?: string | null
  horaires?: Record<string, string> | null
}

interface StylePreset {
  id: string
  nom: string
  description: string
  badge: string
  couleurTheme: string
  couleurSecondaire: string
  formeBoutons: 'squircle' | 'pill' | 'arrondi' | 'droit'
  disposition: 'grille' | 'lookbook' | 'compact'
  icon: string
  exemples: string
}

const STYLES_PRESETS: StylePreset[] = [
  {
    id: 'elegant',
    nom: 'Élégant & Chic',
    description: 'Tons raffinés, contrastes nobles et finitions soignées pour sublimer vos créations.',
    badge: 'Mode, Bijoux, Parfums',
    couleurTheme: '#832729', // Bordeaux noble
    couleurSecondaire: '#FDFBF7',
    formeBoutons: 'squircle',
    disposition: 'lookbook',
    icon: '🖤',
    exemples: 'Idéal pour le prêt-à-porter de luxe, couture sur-mesure et maroquinerie fine.',
  },
  {
    id: 'moderne',
    nom: 'Moderne & High-Tech',
    description: 'Interface épurée, cartes nettes et accents technologiques pour rassurer les acheteurs.',
    badge: 'Smartphones, PC, Électro',
    couleurTheme: '#0284c7', // Bleu technologique
    couleurSecondaire: '#F8FAFC',
    formeBoutons: 'squircle',
    disposition: 'grille',
    icon: '✨',
    exemples: 'Parfait pour les smartphones, ordinateurs et équipements connectés.',
  },
  {
    id: 'naturel',
    nom: 'Naturel & Frais',
    description: 'Harmonie végétale et tons chaleureux invitant à la fraîcheur et à l\'authenticité.',
    badge: 'Alimentation, Bio, Épicerie',
    couleurTheme: '#0A5C36', // Vert forêt profond
    couleurSecondaire: '#F0FDF4',
    formeBoutons: 'arrondi',
    disposition: 'grille',
    icon: '🌿',
    exemples: 'Conseillé pour fruits & légumes, alimentation générale, santé et cosmétique bio.',
  },
  {
    id: 'dynamique',
    nom: 'Dynamique & Promo',
    description: 'Couleurs vibrantes et bannières énergiques pour capter l\'attention et booster les ventes.',
    badge: 'Bons plans, Destockage',
    couleurTheme: '#EA580C', // Orange solaire percutant
    couleurSecondaire: '#FFF7ED',
    formeBoutons: 'pill',
    disposition: 'grille',
    icon: '🔥',
    exemples: 'Idéal pour les boutiques à fort volume, promos régulières et articles populaires.',
  },
  {
    id: 'professionnel',
    nom: 'Pro & Sérieux',
    description: 'Sobriété institutionnelle, lignes rassurantes inspirant la confiance des pros et particuliers.',
    badge: 'Quincaillerie, Auto, BTP',
    couleurTheme: '#1C2B4A', // Bleu marine confiance
    couleurSecondaire: '#F8FAFC',
    formeBoutons: 'droit',
    disposition: 'compact',
    icon: '💼',
    exemples: 'Recommandé pour quincaillerie, pièces automobiles, outillage et services pro.',
  },
  {
    id: 'colore',
    nom: 'Pop & Coloré',
    description: 'Ambiance pétillante, joyeuse et chaleureuse qui donne le sourire et donne envie d\'explorer.',
    badge: 'Enfants, Déco, Fêtes',
    couleurTheme: '#7C3AED', // Violet éclatant
    couleurSecondaire: '#FAF5FF',
    formeBoutons: 'pill',
    disposition: 'grille',
    icon: '🎨',
    exemples: 'Idéal pour univers bébé, jouets, cadeaux, accessoires et déco de fête.',
  },
]

const PALETTES_POPULAIRES = [
  { nom: 'Orange Solaire (Nopalou)', hex: '#C75B00' },
  { nom: 'Bordeaux Chic', hex: '#832729' },
  { nom: 'Bleu Royal Tech', hex: '#2563EB' },
  { nom: 'Vert Forêt Bio', hex: '#0A5C36' },
  { nom: 'Émeraude Frais', hex: '#16A34A' },
  { nom: 'Bleu Marine Pro', hex: '#1C2B4A' },
  { nom: 'Violet Impérial', hex: '#7C3AED' },
  { nom: 'Rose Poudré / Pop', hex: '#DB2777' },
  { nom: 'Noir Carbone Chic', hex: '#1A1612' },
  { nom: 'Ocre Doré', hex: '#D97706' },
]

const COUVERTURES_MODELES: Record<string, { titre: string; url: string; badge: string }[]> = {
  mode: [
    { titre: 'Boutique Chic & Vêtements', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80', badge: 'Chic' },
    { titre: 'Atelier Couture & Bazin', url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80', badge: 'Traditionnel' },
    { titre: 'Mode Pastel & Tendance', url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80', badge: 'Tendance' },
    { titre: 'Maroquinerie & Chaussures', url: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=1200&q=80', badge: 'Luxe' },
  ],
  smartphones: [
    { titre: 'Showroom Smartphones', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80', badge: 'Tech' },
    { titre: 'Réparation & Accessoires', url: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=1200&q=80', badge: 'Service' },
    { titre: 'Mobiles Haute Gamme', url: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=1200&q=80', badge: 'Premium' },
  ],
  informatique: [
    { titre: 'Setup Laptops & Informatique', url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80', badge: 'Pro' },
    { titre: 'Écrans & Bureautique', url: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=1200&q=80', badge: 'Bureau' },
    { titre: 'Gaming & Accessoires', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80', badge: 'Gaming' },
  ],
  alimentation: [
    { titre: 'Épicerie Fine & Marché', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80', badge: 'Frais' },
    { titre: 'Rayons Propres Supermarché', url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=80', badge: 'Épicerie' },
    { titre: 'Étal de Fruits & Légumes', url: 'https://images.unsplash.com/photo-1506617420156-8e4536971650?auto=format&fit=crop&w=1200&q=80', badge: 'Marché' },
  ],
  beaute: [
    { titre: 'Cosmétiques & Soins Doux', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80', badge: 'Douceur' },
    { titre: 'Parfumerie & Luxe Doré', url: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80', badge: 'Luxe' },
    { titre: 'Salon de Beauté & Soins', url: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=1200&q=80', badge: 'Bien-être' },
  ],
  'auto-moto': [
    { titre: 'Garage & Pièces Mécaniques', url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80', badge: 'Atelier' },
    { titre: 'Véhicules & Showroom Auto', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80', badge: 'Showroom' },
    { titre: 'Lubrifiants & Entretien', url: 'https://images.unsplash.com/photo-1635784065399-c020521e6490?auto=format&fit=crop&w=1200&q=80', badge: 'Pro' },
  ],
  quincaillerie: [
    { titre: 'Outillage & Matériel BTP', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80', badge: 'BTP' },
    { titre: 'Bricolage & Équipements', url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80', badge: 'Matériaux' },
  ],
}

// Fonction de calcul de contraste WCAG simple pour garantir la lisibilité
function getContrastColor(hexColor: string): string {
  const cleanHex = hexColor.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0
  // Formule de luminance relative standard YIQ
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 140 ? '#111827' : '#ffffff'
}

export default function StudioPersonnalisation({
  boutique,
  onSaved,
}: {
  boutique: BoutiqueCustomizationData
  onSaved?: () => void
}) {
  // ── États du formulaire de personnalisation ─────────────────────────────────
  const [styleActif, setStyleActif] = useState<string>(boutique.theme_style || 'moderne')
  const [couleurTheme, setCouleurTheme] = useState<string>(boutique.couleur_theme || '#C75B00')
  const [couleurSecondaire, setCouleurSecondaire] = useState<string>(boutique.couleur_secondaire || '#F8F5F0')
  const [formeBoutons, setFormeBoutons] = useState<string>(boutique.forme_boutons || 'squircle')
  const [dispositionCatalogue, setDispositionCatalogue] = useState<string>(boutique.disposition_catalogue || 'grille')
  
  const [slogan, setSlogan] = useState<string>(boutique.slogan || '')
  const [bandeauPromo, setBandeauPromo] = useState<string>(boutique.bandeau_promo || '')
  const [bandeauPromoActif, setBandeauPromoActif] = useState<boolean>(boutique.bandeau_promo_actif || false)
  const [messageAccueil, setMessageAccueil] = useState<string>(boutique.message_accueil || '')
  
  const [coverUrl, setCoverUrl] = useState<string>(boutique.cover_url || '')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreviewLocal, setCoverPreviewLocal] = useState<string | null>(null)
  
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreviewLocal, setLogoPreviewLocal] = useState<string | null>(null)

  // ── Outils d'aide & IA ──────────────────────────────────────────────────────
  const [logoExtractedColors, setLogoExtractedColors] = useState<string[]>([])
  const [isExtractingLogo, setIsExtractingLogo] = useState(false)
  const [photoFeedback, setPhotoFeedback] = useState<{ type: 'ok' | 'info' | 'warn'; msg: string } | null>(null)
  const [activeCategoryCoversTab, setActiveCategoryCoversTab] = useState<string>(
    (boutique.categorie || 'mode').toLowerCase()
  )

  // ── Aperçu en direct (Mobile vs Desktop Mockup) ─────────────────────────────
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile')
  const [activeScreenTab, setActiveScreenTab] = useState<'editeur' | 'apercu'>('editeur')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const coverInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // ── Calcul du score d'attractivité de la boutique (0 - 100%) ────────────────
  const scoreData = useMemo(() => {
    const checks = [
      { id: 'logo', label: 'Logo de la boutique', done: Boolean(boutique.logo_url || logoPreviewLocal), points: 20 },
      { id: 'cover', label: 'Photo de couverture', done: Boolean(coverUrl || coverPreviewLocal), points: 20 },
      { id: 'slogan', label: 'Slogan accrocheur', done: Boolean(slogan.trim()), points: 15 },
      { id: 'promo', label: 'Bandeau d\'annonce promo', done: Boolean(bandeauPromoActif && bandeauPromo.trim()), points: 10 },
      { id: 'whatsapp', label: 'Numéro WhatsApp vérifié', done: Boolean(boutique.whatsapp || boutique.telephone), points: 15 },
      { id: 'adresse', label: 'Adresse ou quartier renseigné', done: Boolean(boutique.adresse || boutique.ville), points: 10 },
      { id: 'horaires', label: 'Horaires d\'ouverture', done: Boolean(boutique.horaires && Object.keys(boutique.horaires).length > 0), points: 10 },
    ]
    const total = checks.reduce((acc, c) => acc + (c.done ? c.points : 0), 0)
    return { score: total, checks }
  }, [boutique, logoPreviewLocal, coverUrl, coverPreviewLocal, slogan, bandeauPromoActif, bandeauPromo])

  // ── Gestion du recadrage & avertissements sur la couverture ──────────────────
  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    const localUrl = URL.createObjectURL(file)
    setCoverPreviewLocal(localUrl)

    // Analyse des dimensions de l'image
    const img = new Image()
    img.src = localUrl
    img.onload = () => {
      const ratio = img.width / img.height
      if (ratio < 1.2) {
        setPhotoFeedback({
          type: 'warn',
          msg: '💡 Votre image est au format portrait ou carré. Pour une bannière optimale, un format horizontal (16:9 ou panoramique) est recommandé afin d\'éviter un rognage important.',
        })
      } else if (img.width < 600) {
        setPhotoFeedback({
          type: 'warn',
          msg: '⚠️ La résolution de cette image est inférieure à 600px. Elle pourrait apparaître floue sur les grands écrans.',
        })
      } else {
        setPhotoFeedback({
          type: 'ok',
          msg: '✨ Superbe photo ! La résolution et le cadrage panoramique sont parfaitement adaptés à votre vitrine.',
        })
      }
    }
  }

  // ── Gestion du changement de logo ───────────────────────────────────────────
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const localUrl = URL.createObjectURL(file)
    setLogoPreviewLocal(localUrl)
    extraireCouleursDepuisImage(localUrl)
  }

  // ── Extracteur automatique de couleurs depuis le Logo via Canvas HTML5 ──────
  const extraireCouleursDepuisImage = (imgSrc: string) => {
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

        // Échantillonnage des couleurs dominantes non blanches et non transparentes
        const colorCounts: Record<string, { r: number; g: number; b: number; count: number; sat: number }> = {}
        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i]
          const g = imgData[i + 1]
          const b = imgData[i + 2]
          const a = imgData[i + 3]

          if (a < 150) continue // Ignorer transparent
          // Ignorer quasi blanc et quasi noir absolu
          if (r > 240 && g > 240 && b > 240) continue
          if (r < 15 && g < 15 && b < 15) continue

          const max = Math.max(r, g, b)
          const min = Math.min(r, g, b)
          const sat = max === 0 ? 0 : (max - min) / max

          // Regrouper par bloc de 16 nuances
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
          .map(c => {
            const hexR = c.r.toString(16).padStart(2, '0')
            const hexG = c.g.toString(16).padStart(2, '0')
            const hexB = c.b.toString(16).padStart(2, '0')
            return `#${hexR}${hexG}${hexB}`
          })

        if (sorted.length > 0) {
          setLogoExtractedColors(sorted)
        }
      } catch (err) {
        console.warn('Impossible d\'extraire les couleurs du logo:', err)
      } finally {
        setIsExtractingLogo(false)
      }
    }
    img.onerror = () => setIsExtractingLogo(false)
  }

  // Tenter l'extraction sur le logo initial existant
  useEffect(() => {
    if (boutique.logo_url && logoExtractedColors.length === 0) {
      extraireCouleursDepuisImage(boutique.logo_url)
    }
  }, [boutique.logo_url])

  // ── Sélection en 1 clic d'un style prédéfini ─────────────────────────────────
  const appliquerPresetStyle = (preset: StylePreset) => {
    setStyleActif(preset.id)
    setCouleurTheme(preset.couleurTheme)
    setCouleurSecondaire(preset.couleurSecondaire)
    setFormeBoutons(preset.formeBoutons)
    setDispositionCatalogue(preset.disposition)
  }

  // ── Sauvegarde globale des paramètres de personnalisation ───────────────────
  const handleEnregistrer = async () => {
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      const formData = new FormData()
      formData.append('theme_style', styleActif)
      formData.append('couleur_theme', couleurTheme)
      formData.append('couleur_secondaire', couleurSecondaire)
      formData.append('forme_boutons', formeBoutons)
      formData.append('disposition_catalogue', dispositionCatalogue)
      formData.append('slogan', slogan)
      formData.append('bandeau_promo', bandeauPromo)
      formData.append('bandeau_promo_actif', String(bandeauPromoActif))
      formData.append('message_accueil', messageAccueil)

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
        throw new Error(d.error || 'Impossible d\'enregistrer la personnalisation.')
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 5000)
      if (onSaved) onSaved()
    } catch (err: any) {
      setSaveError(err.message || 'Erreur lors de la sauvegarde.')
    } finally {
      setIsSaving(false)
    }
  }

  // Couverture active pour l'aperçu
  const activeCover = coverPreviewLocal || coverUrl || boutique.cover_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80'
  const activeLogo = logoPreviewLocal || boutique.logo_url
  const contrastBtnText = getContrastColor(couleurTheme)
  const publicShopUrl = `/boutiques/${boutique.slug || boutique.id}`

  // Rayon de bordure selon le style choisi
  const radiusMap: Record<string, string> = {
    droit: '4px',
    squircle: '12px',
    arrondi: '16px',
    pill: '9999px',
  }
  const currentRadius = radiusMap[formeBoutons] || '12px'

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 60 }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* ── EN-TÊTE DU STUDIO AVEC SCORE D'ATTRACTIVITÉ ────────────────────────── */}
      <div style={{
        background: '#ffffff',
        borderRadius: 18,
        padding: '20px 24px',
        border: '1.5px solid #E2E8F0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        marginBottom: 20,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
      }}>
        <div style={{ minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>🎨</span>
            <div>
              <h1 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontSize: 20, fontWeight: 850, margin: 0, color: '#0F172A' }}>
                Personnaliser ma boutique
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748B' }}>
                Donnez à <strong>{boutique.nom}</strong> son identité visuelle unique et séduisez vos clients.
              </p>
            </div>
          </div>
        </div>

        {/* Jauge Score d'Attractivité */}
        <div style={{
          background: scoreData.score >= 80 ? '#F0FDF4' : '#FFF7ED',
          border: `1.5px solid ${scoreData.score >= 80 ? '#BBF7D0' : '#FED7AA'}`,
          borderRadius: 14,
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: scoreData.score >= 80 ? '#166534' : '#9A3412' }}>
                ✨ Attractivité de votre boutique
              </span>
              <span style={{ fontSize: 14, fontWeight: 900, color: scoreData.score >= 80 ? '#15803D' : '#C2410C' }}>
                {scoreData.score}%
              </span>
            </div>
            {/* Barre de progression */}
            <div style={{ width: 160, height: 7, background: '#e2e8f0', borderRadius: 10, marginTop: 5, overflow: 'hidden' }}>
              <div style={{
                width: `${scoreData.score}%`,
                height: '100%',
                background: scoreData.score >= 80 ? '#16A34A' : '#EA580C',
                borderRadius: 10,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        </div>

        {/* Boutons d'Action Rapide */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <a
            href={publicShopUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              background: '#F8FAFC',
              border: '1.5px solid #CBD5E1',
              color: '#1E293B',
              fontSize: 12.5,
              fontWeight: 750,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ExternalLink size={14} />
            <span>Voir ma boutique en ligne</span>
          </a>

          <button
            onClick={handleEnregistrer}
            disabled={isSaving}
            style={{
              padding: '9px 18px',
              borderRadius: 10,
              background: couleurTheme,
              color: contrastBtnText,
              border: 'none',
              fontSize: 13,
              fontWeight: 800,
              cursor: isSaving ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
            <span>{isSaving ? 'Enregistrement…' : 'Publier les modifications'}</span>
          </button>
        </div>
      </div>

      {/* Messages d'Alerte & Feedback */}
      {saveSuccess && (
        <div style={{
          background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 12,
          padding: '12px 18px', color: '#166534', fontSize: 13.5, fontWeight: 700,
          marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <CheckCircle2 size={18} />
          <span>✅ Modifications enregistrées et publiées avec succès sur votre vitrine !</span>
        </div>
      )}
      {saveError && (
        <div style={{
          background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 12,
          padding: '12px 18px', color: '#DC2626', fontSize: 13.5, fontWeight: 700,
          marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <AlertTriangle size={18} />
          <span>{saveError}</span>
        </div>
      )}

      {/* ── SÉLECTEUR MOBILE : ÉDITEUR / APERÇU ──────────────────────────────────── */}
      <div className="studio-mobile-switcher" style={{
        background: '#F1F5F9', borderRadius: 12, padding: 3, marginBottom: 16,
      }}>
        <button
          onClick={() => setActiveScreenTab('editeur')}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 9, border: 'none',
            background: activeScreenTab === 'editeur' ? '#ffffff' : 'transparent',
            color: activeScreenTab === 'editeur' ? '#0F172A' : '#64748B',
            fontWeight: 800, fontSize: 13, cursor: 'pointer',
            boxShadow: activeScreenTab === 'editeur' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          ✏️ Personnaliser
        </button>
        <button
          onClick={() => setActiveScreenTab('apercu')}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 9, border: 'none',
            background: activeScreenTab === 'apercu' ? '#ffffff' : 'transparent',
            color: activeScreenTab === 'apercu' ? '#0F172A' : '#64748B',
            fontWeight: 800, fontSize: 13, cursor: 'pointer',
            boxShadow: activeScreenTab === 'apercu' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          👁️ Aperçu direct
        </button>
      </div>

      {/* ── CORPS PRINCIPAL DU STUDIO : 2 COLONNES (Éditeur à gauche, Mockup à droite) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, alignItems: 'start' }}>
        
        {/* COLONNE GAUCHE : LES CONTRÔLES SIMPLES DU MARCHAND */}
        <div className={`studio-editor-col ${activeScreenTab === 'apercu' ? 'studio-editor-hidden-mobile' : ''}`} style={{ flexDirection: 'column', gap: 20 }}>
          
          {/* BLOC 1 : CHOIX DU STYLE (EN 1 CLIC) */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', border: '1.5px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 850, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🎯</span>
                  <span>1. Quel style représente votre boutique ?</span>
                </h2>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>
                  Nopalou configure automatiquement vos couleurs, boutons et ambiance en 1 clic.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              {STYLES_PRESETS.map(preset => {
                const isSelected = styleActif === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => appliquerPresetStyle(preset)}
                    style={{
                      textAlign: 'left',
                      padding: 12,
                      borderRadius: 12,
                      border: isSelected ? `2px solid ${preset.couleurTheme}` : '1.5px solid #E2E8F0',
                      background: isSelected ? '#FAFCFF' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      position: 'relative',
                      boxShadow: isSelected ? '0 3px 12px rgba(0,0,0,0.06)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 20 }}>{preset.icon}</span>
                      <span style={{
                        width: 16, height: 16, borderRadius: '50%', background: preset.couleurTheme,
                        display: 'inline-block', border: '1.5px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }} />
                    </div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: isSelected ? preset.couleurTheme : '#1E293B' }}>
                      {preset.nom}
                    </p>
                    <span style={{ fontSize: 10.5, color: '#64748B', lineHeight: 1.3 }}>
                      {preset.badge}
                    </span>
                    {isSelected && (
                      <span style={{
                        position: 'absolute', top: 6, right: 6, width: 18, height: 18,
                        borderRadius: '50%', background: preset.couleurTheme, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900,
                      }}>
                        ✓
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* BLOC 2 : COULEUR SUR-MESURE & LOGO */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', border: '1.5px solid #E2E8F0' }}>
            <h2 style={{ fontSize: 15, fontWeight: 850, color: '#0F172A', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🎨</span>
              <span>2. Couleur principale de votre marque</span>
            </h2>
            <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 14px' }}>
              Appliquée automatiquement sur vos boutons d&apos;achat, onglets, badges et prix.
            </p>

            {/* Détection automatique depuis le Logo */}
            {logoExtractedColors.length > 0 && (
              <div style={{
                background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 12,
                padding: '12px 14px', marginBottom: 14,
              }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Wand2 size={14} style={{ color: '#C75B00' }} />
                  <span>Couleurs détectées dans votre logo :</span>
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  {logoExtractedColors.map((hex, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCouleurTheme(hex)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 20,
                        border: couleurTheme.toLowerCase() === hex.toLowerCase() ? '2px solid #0F172A' : '1px solid #CBD5E1',
                        background: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 11.5,
                        fontWeight: 750,
                      }}
                    >
                      <span style={{ width: 14, height: 14, borderRadius: '50%', background: hex, display: 'inline-block' }} />
                      <span>{hex.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Nuancier rapide */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
              {PALETTES_POPULAIRES.map(p => {
                const isSelected = couleurTheme.toLowerCase() === p.hex.toLowerCase()
                return (
                  <button
                    key={p.hex}
                    type="button"
                    title={p.nom}
                    onClick={() => setCouleurTheme(p.hex)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: p.hex,
                      border: isSelected ? '3px solid #ffffff' : '1.5px solid rgba(0,0,0,0.1)',
                      boxShadow: isSelected ? `0 0 0 2.5px ${p.hex}` : '0 1px 3px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: 14,
                      fontWeight: 900,
                    }}
                  >
                    {isSelected && '✓'}
                  </button>
                )
              })}
            </div>

            {/* Sélecteur personnalisé HEX */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <input
                type="color"
                value={couleurTheme}
                onChange={e => setCouleurTheme(e.target.value)}
                style={{ width: 44, height: 38, borderRadius: 8, border: '1px solid #D1D5DB', cursor: 'pointer', padding: 2 }}
              />
              <input
                type="text"
                value={couleurTheme}
                onChange={e => setCouleurTheme(e.target.value)}
                maxLength={7}
                placeholder="#C75B00"
                style={{
                  width: 100, height: 38, borderRadius: 8, border: '1px solid #D1D5DB',
                  padding: '0 10px', fontSize: 13, fontWeight: 700, fontFamily: 'monospace',
                }}
              />
              <span style={{ fontSize: 12, color: '#64748B' }}>
                Couleur personnalisée (Code Hex)
              </span>
            </div>
          </div>

          {/* BLOC 3 : PHOTO DE COUVERTURE INTELLIGENTE */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', border: '1.5px solid #E2E8F0' }}>
            <h2 style={{ fontSize: 15, fontWeight: 850, color: '#0F172A', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🖼️</span>
              <span>3. Photo de couverture & Bannière</span>
            </h2>
            <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 14px' }}>
              Choisissez une bannière HD calibrée pour votre activité ou importez la vôtre.
            </p>

            {/* Onglets : Modèles vs Import */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => {
                  coverInputRef.current?.click()
                }}
                style={{
                  padding: '8px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1',
                  background: '#ffffff', color: '#1E293B', fontSize: 12.5, fontWeight: 750,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
              >
                <Upload size={14} />
                <span>Importer ma photo</span>
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverFileChange}
                style={{ display: 'none' }}
              />
            </div>

            {/* Pédagogie de la photo */}
            {photoFeedback && (
              <div style={{
                background: photoFeedback.type === 'warn' ? '#FFFBEB' : '#F0FDF4',
                border: `1.5px solid ${photoFeedback.type === 'warn' ? '#FDE68A' : '#BBF7D0'}`,
                borderRadius: 12, padding: '10px 14px', marginBottom: 14,
                fontSize: 12, color: photoFeedback.type === 'warn' ? '#92400E' : '#166534',
                fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: 8,
              }}>
                <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{photoFeedback.msg}</span>
              </div>
            )}

            {/* Modèles de bannières recommandées pour sa catégorie */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 800, color: '#475569', margin: '0 0 8px' }}>
                Modèles thématiques adaptés à votre secteur :
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
                {(COUVERTURES_MODELES[activeCategoryCoversTab] || COUVERTURES_MODELES['mode']).map((m, idx) => {
                  const isCurrent = coverUrl === m.url && !coverPreviewLocal
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCoverUrl(m.url)
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
                      <img src={m.url} alt={m.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{
                        position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)',
                        display: 'flex', alignItems: 'flex-end', padding: 6,
                      }}>
                        <span style={{ fontSize: 10, color: '#fff', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                          {m.titre}
                        </span>
                      </div>
                      {isCurrent && (
                        <span style={{
                          position: 'absolute', top: 4, right: 4, width: 18, height: 18,
                          borderRadius: '50%', background: couleurTheme, color: contrastBtnText,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900,
                        }}>
                          ✓
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* BLOC 4 : SLOGAN & BANDEAU PROMO COMMERCIALE */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', border: '1.5px solid #E2E8F0' }}>
            <h2 style={{ fontSize: 15, fontWeight: 850, color: '#0F172A', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📢</span>
              <span>4. Slogan & Annonces Commerciales</span>
            </h2>
            <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 14px' }}>
              Communiquez immédiatement vos points forts et vos offres promotionnelles.
            </p>

            {/* Champ Slogan */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 750, color: '#1E293B', marginBottom: 5 }}>
                Slogan de la boutique
              </label>
              <input
                type="text"
                value={slogan}
                onChange={e => setSlogan(e.target.value)}
                maxLength={120}
                placeholder="Ex: L'élégance et le raffinement au cœur de Dakar"
                style={{
                  width: '100%', height: 40, borderRadius: 10, border: '1px solid #CBD5E1',
                  padding: '0 12px', fontSize: 13, outline: 'none', background: '#F8FAFC',
                }}
              />
              <p style={{ margin: '3px 0 0', fontSize: 11, color: '#94A3B8' }}>
                Affiché sous le nom de votre boutique pour résumer votre promesse client.
              </p>
            </div>

            {/* Bandeau Promotionnel */}
            <div style={{
              background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: 12, padding: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: '#9A3412', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🔥</span>
                  <span>Bandeau d&apos;Annonce Promotionnel</span>
                </span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#9A3412' }}>
                  <input
                    type="checkbox"
                    checked={bandeauPromoActif}
                    onChange={e => setBandeauPromoActif(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#EA580C', cursor: 'pointer' }}
                  />
                  <span>{bandeauPromoActif ? 'Actif sur la boutique' : 'Désactivé'}</span>
                </label>
              </div>

              <input
                type="text"
                value={bandeauPromo}
                onChange={e => setBandeauPromo(e.target.value)}
                disabled={!bandeauPromoActif}
                placeholder="Ex: PROMO SPÉCIALE : -20% sur toute la collection jusqu'à dimanche !"
                style={{
                  width: '100%', height: 38, borderRadius: 8, border: '1px solid #FDBA74',
                  padding: '0 10px', fontSize: 12.5, outline: 'none', background: bandeauPromoActif ? '#ffffff' : '#f3f4f6',
                  color: '#9A3412', fontWeight: 600, opacity: bandeauPromoActif ? 1 : 0.6,
                }}
              />
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#C2410C' }}>
                Bandeau défilant visible en tête de vitrine pour déclencher des achats impulsifs.
              </p>
            </div>
          </div>

          {/* BLOC 5 : FORME DES BOUTONS & DISPOSITION */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', border: '1.5px solid #E2E8F0' }}>
            <h2 style={{ fontSize: 15, fontWeight: 850, color: '#0F172A', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📐</span>
              <span>5. Forme des boutons & Catalogue</span>
            </h2>
            <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 14px' }}>
              Harmonisez l&apos;ergonomie visuelle de vos boutons de commande.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
              {[
                { id: 'squircle', nom: 'Squircle (Doux)', radius: '10px' },
                { id: 'pill', nom: 'Pilule (Rond)', radius: '999px' },
                { id: 'arrondi', nom: 'Arrondi standard', radius: '14px' },
                { id: 'droit', nom: 'Droit (Moderne)', radius: '4px' },
              ].map(f => {
                const isSelected = formeBoutons === f.id
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormeBoutons(f.id)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: f.radius,
                      border: isSelected ? `2px solid ${couleurTheme}` : '1.5px solid #E2E8F0',
                      background: isSelected ? couleurTheme : '#F8FAFC',
                      color: isSelected ? contrastBtnText : '#1E293B',
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    {f.nom}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : PRÉVISUALISATION TEMPS RÉEL (MOCKUP INTERACTIF) */}
        <div
          className={`studio-preview-col ${activeScreenTab === 'editeur' ? 'studio-preview-hidden-mobile' : ''}`}
          style={{
            position: 'sticky',
            top: 80,
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* Barre d'outils du Mockup */}
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: '8px 14px',
            border: '1.5px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Eye size={15} style={{ color: couleurTheme }} />
              <span>Aperçu en direct pour vos clients</span>
            </span>

            {/* Toggle Mobile / Desktop */}
            <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 8, padding: 2 }}>
              <button
                type="button"
                onClick={() => setPreviewMode('mobile')}
                style={{
                  padding: '4px 8px', borderRadius: 6, border: 'none',
                  background: previewMode === 'mobile' ? '#ffffff' : 'transparent',
                  color: previewMode === 'mobile' ? '#0F172A' : '#64748B',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700,
                }}
              >
                <Smartphone size={13} />
                <span>Mobile</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('desktop')}
                style={{
                  padding: '4px 8px', borderRadius: 6, border: 'none',
                  background: previewMode === 'desktop' ? '#ffffff' : 'transparent',
                  color: previewMode === 'desktop' ? '#0F172A' : '#64748B',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700,
                }}
              >
                <Monitor size={13} />
                <span>PC</span>
              </button>
            </div>
          </div>

          {/* CHÂSSIS DE PRÉVISUALISATION DU SMARTPHONE OU DESKTOP */}
          <div style={{
            background: '#ffffff',
            borderRadius: previewMode === 'mobile' ? 32 : 16,
            border: previewMode === 'mobile' ? '8px solid #0F172A' : '2px solid #E2E8F0',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            maxWidth: previewMode === 'mobile' ? 360 : '100%',
            margin: '0 auto',
            width: '100%',
          }}>
            
            {/* Écran Mockup */}
            <div style={{ background: '#FAF9F6', minHeight: 480, overflowY: 'auto' }}>
              
              {/* Bandeau Promo Virtuel si actif */}
              {bandeauPromoActif && bandeauPromo.trim() && (
                <div style={{
                  background: couleurTheme,
                  color: contrastBtnText,
                  padding: '6px 12px',
                  fontSize: 11,
                  fontWeight: 800,
                  textAlign: 'center',
                  letterSpacing: '0.02em',
                }}>
                  {bandeauPromo}
                </div>
              )}

              {/* Bannière de Couverture Virtuelle */}
              <div style={{ position: 'relative', height: previewMode === 'mobile' ? 140 : 180, overflow: 'hidden' }}>
                <img
                  src={activeCover}
                  alt={boutique.nom}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6) 100%)',
                }} />
              </div>

              {/* Carte En-Tête de Boutique Virtuelle */}
              <div style={{
                margin: '-30px 12px 10px',
                background: '#ffffff',
                borderRadius: 14,
                padding: '12px 14px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                border: '1px solid #E2E8F0',
                position: 'relative',
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {/* Logo */}
                  <div style={{
                    width: 52, height: 52, borderRadius: 12, overflow: 'hidden',
                    background: '#ffffff', border: '2px solid #ffffff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {activeLogo ? (
                      <img src={activeLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%', background: couleurTheme, color: contrastBtnText,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18,
                      }}>
                        {(boutique.nom || 'B').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Nom & Slogan */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 850, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {boutique.nom}
                    </h3>
                    {slogan ? (
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#475569', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {slogan}
                      </p>
                    ) : (
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8' }}>
                        {boutique.ville || 'Dakar, Sénégal'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Boutons d'Action Virtuels */}
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button
                    type="button"
                    style={{
                      flex: 1, padding: '7px 10px', borderRadius: currentRadius,
                      background: '#25D366', color: '#ffffff', border: 'none',
                      fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}
                  >
                    <MessageCircle size={13} />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: '7px 10px', borderRadius: currentRadius,
                      background: '#F1F5F9', color: '#1E293B', border: '1px solid #CBD5E1',
                      fontSize: 11, fontWeight: 700,
                    }}
                  >
                    Partager
                  </button>
                </div>
              </div>

              {/* Onglets Catalogue Virtuels */}
              <div style={{
                display: 'flex', gap: 6, padding: '0 12px 10px', overflowX: 'auto',
              }}>
                <span style={{
                  padding: '5px 12px', borderRadius: currentRadius, background: couleurTheme,
                  color: contrastBtnText, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap',
                }}>
                  Catalogue (12)
                </span>
                <span style={{
                  padding: '5px 12px', borderRadius: currentRadius, background: '#ffffff',
                  color: '#64748B', fontSize: 11, fontWeight: 600, border: '1px solid #E2E8F0', whiteSpace: 'nowrap',
                }}>
                  Nouveautés
                </span>
                <span style={{
                  padding: '5px 12px', borderRadius: currentRadius, background: '#ffffff',
                  color: '#64748B', fontSize: 11, fontWeight: 600, border: '1px solid #E2E8F0', whiteSpace: 'nowrap',
                }}>
                  Infos & Horaires
                </span>
              </div>

              {/* Grille Produits Virtuelle */}
              <div style={{ padding: '0 12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { nom: 'Article Tendance A', prix: '15 000 FCFA', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80' },
                  { nom: 'Article Star B', prix: '28 500 FCFA', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80' },
                ].map((prod, i) => (
                  <div key={i} style={{ background: '#ffffff', borderRadius: 12, padding: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ aspectRatio: '1/1', borderRadius: 8, overflow: 'hidden', background: '#f8fafc', marginBottom: 6 }}>
                      <img src={prod.img} alt={prod.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {prod.nom}
                    </p>
                    <p style={{ margin: '2px 0 6px', fontSize: 12, fontWeight: 900, color: couleurTheme }}>
                      {prod.prix}
                    </p>
                    <button
                      type="button"
                      style={{
                        width: '100%', padding: '5px 8px', borderRadius: currentRadius,
                        background: couleurTheme, color: contrastBtnText, border: 'none',
                        fontSize: 10.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      }}
                    >
                      <ShoppingCart size={11} />
                      <span>Ajouter</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Signature discrète de réassurance */}
              <div style={{ textAlign: 'center', padding: '12px 14px 20px', borderTop: '1px solid #E2E8F0' }}>
                <p style={{ margin: 0, fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>
                  Vitrine propulsée par <strong>Nopalou</strong> · Paiements Wave et Orange Money sécurisés
                </p>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
