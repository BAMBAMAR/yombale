'use client'
import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { creerAnnonce } from '@/app/actions/annonces'

const CATEGORIES = [
  { slug: 'smartphones',  label: 'Téléphone',     emoji: '📱' },
  { slug: 'informatique', label: 'Informatique',   emoji: '💻' },
  { slug: 'tv-electro',   label: 'TV & Électro',   emoji: '📺' },
  { slug: 'mode',         label: 'Mode',           emoji: '👗' },
  { slug: 'maison',       label: 'Maison',         emoji: '🏠' },
  { slug: 'auto-moto',    label: 'Auto & Moto',    emoji: '🚗' },
  { slug: 'jeux',         label: 'Jeux',           emoji: '🎮' },
  { slug: 'services',     label: 'Services',       emoji: '🛠' },
]

const ETATS = ['Neuf', 'Bon état', 'Occasion', 'Pour pièces']
const PLATEFORMES = ['PS4', 'PS5', 'Xbox One', 'Xbox Series', 'Nintendo Switch', 'PC', 'Mobile']
const GENRES = ['Homme', 'Femme', 'Enfant', 'Unisexe']
const VILLES = ['Dakar', 'Thiès', 'Ziguinchor', 'Saint-Louis', 'Kaolack', 'Rufisque', 'Pikine', 'Touba', 'Autre']

interface CaracteristiquesProps {
  slug: string
  values: Record<string, string>
  onChange: (k: string, v: string) => void
}

function CaracteristiquesFields({ slug, values, onChange }: CaracteristiquesProps) {
  const inp = (k: string, label: string, placeholder = '') => (
    <div className="form-field" key={k}>
      <label className="form-label">{label} <span className="required">*</span></label>
      <input
        type="text"
        value={values[k] ?? ''}
        onChange={e => onChange(k, e.target.value)}
        className="form-input"
        placeholder={placeholder}
        required
      />
    </div>
  )

  const sel = (k: string, label: string, opts: string[], req = true) => (
    <div className="form-field" key={k}>
      <label className="form-label">{label}{req && <span className="required"> *</span>}</label>
      <select
        value={values[k] ?? ''}
        onChange={e => onChange(k, e.target.value)}
        className="form-input"
        required={req}
      >
        <option value="">Choisir…</option>
        {opts.map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}
      </select>
    </div>
  )

  if (slug === 'smartphones' || slug === 'informatique' || slug === 'tv-electro') {
    return <>{inp('marque', 'Marque', 'ex: Samsung, Apple…')}{sel('etat', 'État', ETATS)}</>
  }
  if (slug === 'auto-moto') {
    return <>
      {inp('marque', 'Marque', 'ex: Toyota…')}
      {inp('modele', 'Modèle', 'ex: Corolla…')}
      <div className="form-field">
        <label className="form-label">Année <span className="required">*</span></label>
        <input type="number" min="1980" max="2026" value={values['annee'] ?? ''} onChange={e => onChange('annee', e.target.value)} className="form-input" placeholder="ex: 2019" required />
      </div>
      {sel('etat', 'État', ETATS)}
    </>
  }
  if (slug === 'jeux') {
    return <>{sel('plateforme', 'Plateforme', PLATEFORMES)}{sel('etat', 'État', ETATS)}</>
  }
  if (slug === 'mode') {
    return <>
      {inp('taille', 'Taille', 'ex: M, 42, XL…')}
      {sel('genre', 'Genre', GENRES)}
      {sel('etat', 'État', ETATS)}
    </>
  }
  if (slug === 'maison') {
    return <>{inp('type_article', 'Type d\'article', 'ex: Canapé, Réfrigérateur…')}{sel('etat', 'État', ETATS)}</>
  }
  if (slug === 'services') {
    return <>{inp('type_service', 'Type de service', 'ex: Plomberie, Cours, Transport…')}</>
  }
  return null
}

export default function FormulaireAnnonce({ email }: { email: string }) {
  const router = useRouter()
  const [step, setStep]   = useState<1 | 2 | 3>(1)
  const [slug, setSlug]   = useState('')
  const [car, setCar]     = useState<Record<string, string>>({})
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  // Conserve les champs de l'étape 2 (perdus quand le formulaire est démonté)
  const step2Data = useRef<Record<string, string>>({})

  function handleCarChange(k: string, v: string) {
    setCar(prev => ({ ...prev, [k]: v }))
  }

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5)
    setPhotos(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  function removePhoto(i: number) {
    const next = photos.filter((_, j) => j !== i)
    setPhotos(next)
    setPreviews(p => p.filter((_, j) => j !== i))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('categorie_slug', slug)
    fd.set('caracteristiques', JSON.stringify(car))
    // Réinjecter les champs de l'étape 2 (titre, prix, ville, contact_tel…)
    Object.entries(step2Data.current).forEach(([k, v]) => { if (!fd.has(k) || !fd.get(k)) fd.set(k, v) })
    // Replace photos in FormData
    fd.delete('photos')
    photos.forEach(f => fd.append('photos', f))

    startTransition(async () => {
      const res = await creerAnnonce(fd)
      if (res.ok) {
        // Redirect to payment page — backend will show "already active" if free quota
        router.push(res.id ? `/payer-annonce/${res.id}` : '/mes-annonces?created=1')
      } else {
        setError(res.error ?? 'Une erreur est survenue.')
      }
    })
  }

  // Step 1 — choix catégorie
  if (step === 1) {
    return (
      <div className="annonce-steps">
        <div className="annonce-step-header">
          <span className="annonce-step-num">1 / 3</span>
          <h2 className="annonce-step-titre">Choisissez une catégorie</h2>
        </div>
        <div className="annonce-cats-grid">
          {CATEGORIES.map(c => (
            <button
              key={c.slug}
              type="button"
              onClick={() => { setSlug(c.slug); setCar({}); setStep(2) }}
              className={`annonce-cat-btn${slug === c.slug ? ' active' : ''}`}
            >
              <span className="annonce-cat-emoji">{c.emoji}</span>
              <span className="annonce-cat-label">{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Step 2 — infos + caractéristiques
  if (step === 2) {
    const cat = CATEGORIES.find(c => c.slug === slug)!
    return (
      <div className="annonce-steps">
        <div className="annonce-step-header">
          <button type="button" onClick={() => setStep(1)} className="annonce-back">← Retour</button>
          <span className="annonce-step-num">2 / 3</span>
          <h2 className="annonce-step-titre">{cat.emoji} {cat.label} — Détails</h2>
        </div>
        <form className="annonce-form" onSubmit={e => {
          e.preventDefault()
          // Sauvegarder tous les champs de l'étape 2 avant de changer d'étape
          const fd = new FormData(e.currentTarget)
          const saved: Record<string, string> = {}
          fd.forEach((v, k) => { if (typeof v === 'string') saved[k] = v })
          step2Data.current = saved
          setStep(3)
        }}>
          {/* Titre */}
          <div className="form-field">
            <label className="form-label">Titre de l&apos;annonce <span className="required">*</span></label>
            <input name="titre" type="text" className="form-input" placeholder="ex: iPhone 13 Pro 256Go Bleu" required minLength={8} maxLength={150} />
            <span className="form-hint">8 à 150 caractères — évitez les majuscules</span>
          </div>

          {/* Prix */}
          <div className="form-field">
            <label className="form-label">Prix (FCFA)</label>
            <input name="prix" type="number" min="100" max="500000000" className="form-input" placeholder="Laisser vide si prix à débattre" />
          </div>

          {/* Caractéristiques catégorie */}
          <div className="form-section-title">Caractéristiques</div>
          <CaracteristiquesFields slug={slug} values={car} onChange={handleCarChange} />

          {/* Localisation */}
          <div className="form-section-title">Localisation</div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Ville</label>
              <select name="ville" className="form-input">
                <option value="">Choisir…</option>
                {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Quartier</label>
              <input name="quartier" type="text" className="form-input" placeholder="ex: Plateau, Almadies…" />
            </div>
          </div>

          {/* Description */}
          <div className="form-field">
            <label className="form-label">Description</label>
            <textarea name="description" className="form-input form-textarea" rows={4} placeholder="Décrivez votre article : état, accessoires inclus, raison de vente…" maxLength={2000} />
          </div>

          {/* Contact */}
          <div className="form-section-title">Contact</div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Nom / Pseudo</label>
              <input name="contact_nom" type="text" className="form-input" placeholder="Votre nom" maxLength={80} />
            </div>
            <div className="form-field">
              <label className="form-label">Téléphone <span className="required">*</span></label>
              <input name="contact_tel" type="tel" className="form-input" placeholder="ex: 77 123 45 67" required />
            </div>
          </div>

          <button type="submit" className="annonce-next-btn">
            Continuer → Photos
          </button>
        </form>
      </div>
    )
  }

  // Step 3 — photos + soumission
  const cat = CATEGORIES.find(c => c.slug === slug)!
  return (
    <div className="annonce-steps">
      <div className="annonce-step-header">
        <button type="button" onClick={() => setStep(2)} className="annonce-back">← Retour</button>
        <span className="annonce-step-num">3 / 3</span>
        <h2 className="annonce-step-titre">{cat.emoji} {cat.label} — Photos</h2>
      </div>

      <form className="annonce-form" onSubmit={handleSubmit}>
        <div className="photos-zone">
          <div
            className="photos-dropzone"
            onClick={() => fileRef.current?.click()}
            onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
            tabIndex={0}
            role="button"
            aria-label="Ajouter des photos"
          >
            <span style={{ fontSize: 32 }}>📷</span>
            <p>Cliquez pour ajouter des photos</p>
            <span className="form-hint">Max 5 photos · 5 Mo chacune · JPG / PNG / WebP</span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handlePhotos}
          />

          {previews.length > 0 && (
            <div className="photos-previews">
              {previews.map((src, i) => (
                <div key={i} className="photo-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Photo ${i + 1}`} />
                  <button
                    type="button"
                    className="photo-remove"
                    onClick={() => removePhoto(i)}
                    aria-label="Supprimer"
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="annonce-error">{error}</p>}

        <div className="annonce-submit-row">
          <div className="annonce-quota-info">
            ℹ️ Les 2 premières annonces sont gratuites et publiées instantanément si elles respectent nos règles.
          </div>
          <button type="submit" className="annonce-submit-btn" disabled={isPending}>
            {isPending ? 'Publication en cours…' : '🚀 Publier l\'annonce'}
          </button>
        </div>
      </form>
    </div>
  )
}
