'use client'
import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateAnnonce } from '@/app/actions/annonces'
import { useTranslation } from '@/i18n/context'

interface Annonce {
  id: string
  titre: string
  categorie_slug: string
  description: string | null
  prix: number | null
  ville: string | null
  quartier: string | null
  contact_nom: string | null
  contact_tel: string | null
  photos: string[] | null
  caracteristiques: Record<string, string> | null
}

const ETATS = ['Neuf', 'Bon état', 'Occasion', 'Pour pièces']
const PLATEFORMES = ['PS4', 'PS5', 'Xbox One', 'Xbox Series', 'Nintendo Switch', 'PC', 'Mobile']
const GENRES = ['Homme', 'Femme', 'Enfant', 'Unisexe']
const VILLES = ['Dakar', 'Thiès', 'Ziguinchor', 'Saint-Louis', 'Kaolack', 'Rufisque', 'Pikine', 'Touba', 'Autre']

const CAT_LABELS: Record<string, string> = {
  smartphones: '📱 Téléphone',
  informatique: '💻 Informatique',
  'tv-electro': '📺 TV & Électro',
  mode: '👗 Mode',
  maison: '🏠 Maison',
  'auto-moto': '🚗 Auto & Moto',
  jeux: '🎮 Jeux',
  services: '🛠 Services',
}

interface CaracteristiquesProps {
  slug: string
  values: Record<string, string>
  onChange: (k: string, v: string) => void
}

function CaracteristiquesFields({ slug, values, onChange }: CaracteristiquesProps) {
  const { t } = useTranslation()
  const inp = (k: string, label: string, placeholder = '', type = 'text') => (
    <div className="form-field" key={k}>
      <label className="form-label">{label}</label>
      <input
        type={type}
        value={values[k] ?? ''}
        onChange={e => onChange(k, e.target.value)}
        className="form-input"
        placeholder={placeholder}
        min={type === 'number' ? '1980' : undefined}
        max={type === 'number' ? '2030' : undefined}
      />
    </div>
  )

  const sel = (k: string, label: string, opts: string[]) => (
    <div className="form-field" key={k}>
      <label className="form-label">{label}</label>
      <select
        value={values[k] ?? ''}
        onChange={e => onChange(k, e.target.value)}
        className="form-input"
      >
        <option value="">{t('common.choose')}</option>
        {opts.map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}
      </select>
    </div>
  )

  if (slug === 'smartphones' || slug === 'informatique' || slug === 'tv-electro') {
    return <>{inp('marque', t('account.brand'), 'ex: Samsung, Apple…')}{sel('etat', t('account.condition'), ETATS)}</>
  }
  if (slug === 'auto-moto') {
    return <>
      {inp('marque', t('account.brand'), 'ex: Toyota…')}
      {inp('modele', t('account.model'), 'ex: Corolla…')}
      {inp('annee', t('account.year'), 'ex: 2019', 'number')}
      {sel('etat', t('account.condition'), ETATS)}
    </>
  }
  if (slug === 'jeux') {
    return <>{sel('plateforme', t('account.platform'), PLATEFORMES)}{sel('etat', t('account.condition'), ETATS)}</>
  }
  if (slug === 'mode') {
    return <>
      {inp('taille', t('account.size'), 'ex: M, 42, XL…')}
      {sel('genre', t('account.gender'), GENRES)}
      {sel('etat', t('account.condition'), ETATS)}
    </>
  }
  if (slug === 'maison') {
    return <>{inp('type_article', t('account.itemType'), 'ex: Canapé, Réfrigérateur…')}{sel('etat', t('account.condition'), ETATS)}</>
  }
  if (slug === 'services') {
    return <>{inp('type_service', t('account.serviceType'), 'ex: Plomberie, Cours, Transport…')}</>
  }
  return null
}

export default function ModifierAnnonceForm({ annonce }: { annonce: Annonce }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [car, setCar] = useState<Record<string, string>>(annonce.caracteristiques ?? {})
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [keepPhotos, setKeepPhotos] = useState<string[]>(annonce.photos ?? [])
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  function handleCarChange(k: string, v: string) {
    setCar(prev => ({ ...prev, [k]: v }))
  }

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - keepPhotos.length)
    setPhotos(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  function removeNewPhoto(i: number) {
    setPhotos(p => p.filter((_, j) => j !== i))
    setPreviews(p => p.filter((_, j) => j !== i))
  }

  function removeExistingPhoto(url: string) {
    setKeepPhotos(p => p.filter(u => u !== url))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFieldErrors([])
    const fd = new FormData(e.currentTarget)
    fd.set('categorie_slug', annonce.categorie_slug)
    fd.set('caracteristiques', JSON.stringify(car))
    fd.set('photos_existantes', JSON.stringify(keepPhotos))
    fd.delete('photos')
    photos.forEach(f => fd.append('photos', f))

    startTransition(async () => {
      const res = await updateAnnonce(annonce.id, fd)
      if (res.ok) {
        router.push('/mes-annonces?updated=1')
      } else {
        setError(res.error ?? 'Une erreur est survenue.')
        if (res.errors) {
          setFieldErrors(res.errors.map(e => e.msg))
        }
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }
    })
  }

  const totalPhotos = keepPhotos.length + photos.length
  const catLabel = CAT_LABELS[annonce.categorie_slug] ?? annonce.categorie_slug

  return (
    <form className="annonce-form" onSubmit={handleSubmit}>
      <div className="modifier-annonce-warning">
        {t('account.editAdWarning')}
      </div>

      <div className="form-field">
        <label className="form-label">{t('account.category')}</label>
        <div className="modifier-cat-badge">{catLabel}</div>
      </div>

      <div className="form-field">
        <label className="form-label">{t('account.adTitle')} <span className="required">*</span></label>
        <input
          name="titre"
          type="text"
          className="form-input"
          defaultValue={annonce.titre}
          required
          minLength={8}
          maxLength={150}
          placeholder={t('account.adTitlePlaceholder')}
        />
        <span className="form-hint">{t('account.adTitleHint')}</span>
      </div>

      <div className="form-field">
        <label className="form-label">{t('account.price')} (FCFA)</label>
        <input
          name="prix"
          type="number"
          min="100"
          max="500000000"
          className="form-input"
          defaultValue={annonce.prix ?? ''}
          placeholder={t('account.priceNegotiable')}
        />
      </div>

      <div className="form-section-title">{t('account.characteristics')}</div>
      <CaracteristiquesFields slug={annonce.categorie_slug} values={car} onChange={handleCarChange} />

      <div className="form-section-title">{t('account.location')}</div>
      <div className="form-row">
        <div className="form-field">
          <label className="form-label">{t('account.city')}</label>
          <select name="ville" className="form-input" defaultValue={annonce.ville ?? ''}>
            <option value="">{t('common.choose')}</option>
            {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">{t('account.neighborhood')}</label>
          <input
            name="quartier"
            type="text"
            className="form-input"
            defaultValue={annonce.quartier ?? ''}
            placeholder={t('account.neighborhoodPlaceholder')}
          />
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">{t('account.description')}</label>
        <textarea
          name="description"
          className="form-input form-textarea"
          rows={4}
          defaultValue={annonce.description ?? ''}
          placeholder={t('account.descriptionPlaceholderAd')}
          maxLength={2000}
        />
      </div>

      <div className="form-section-title">{t('account.contact')}</div>
      <div className="form-row">
        <div className="form-field">
          <label className="form-label">{t('account.nameOrPseudo')}</label>
          <input
            name="contact_nom"
            type="text"
            className="form-input"
            defaultValue={annonce.contact_nom ?? ''}
            placeholder={t('account.yourName')}
            maxLength={80}
          />
        </div>
        <div className="form-field">
          <label className="form-label">{t('account.yourPhone')} <span className="required">*</span></label>
          <input
            name="contact_tel"
            type="tel"
            className="form-input"
            defaultValue={annonce.contact_tel ?? ''}
            placeholder="ex: 77 123 45 67"
            required
          />
        </div>
      </div>

      <div className="form-section-title">{t('account.photos')} ({totalPhotos}/5)</div>

      {keepPhotos.length > 0 && (
        <div className="modifier-photos-current">
          <p className="form-hint" style={{ marginBottom: 8 }}>{t('account.currentPhotosHint')}</p>
          <div className="photos-previews">
            {keepPhotos.map(url => (
              <div key={url} className="photo-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Photo existante" />
                <button
                  type="button"
                  className="photo-remove"
                  onClick={() => removeExistingPhoto(url)}
                  aria-label={t('common.delete')}
                >✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalPhotos < 5 && (
        <>
          <div
            className="photos-dropzone"
            onClick={() => fileRef.current?.click()}
            onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
            tabIndex={0}
            role="button"
            aria-label={t('account.addPhotos')}
          >
            <span style={{ fontSize: 28 }}>📷</span>
            <p>{t('account.addPhotos')}</p>
            <span className="form-hint">Max {5 - keepPhotos.length} · 5 Mo · JPG/PNG/WebP</span>
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
            <div className="photos-previews" style={{ marginTop: 8 }}>
              {previews.map((src, i) => (
                <div key={i} className="photo-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Nouvelle photo ${i + 1}`} />
                  <button
                    type="button"
                    className="photo-remove"
                    onClick={() => removeNewPhoto(i)}
                    aria-label={t('common.delete')}
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {fieldErrors.length > 0 && (
        <ul className="annonce-error" style={{ marginTop: 12 }}>
          {fieldErrors.map((msg, i) => <li key={i}>{msg}</li>)}
        </ul>
      )}
      {error && <p className="annonce-error" style={{ marginTop: 12 }}>{error}</p>}

      <div className="annonce-submit-row" style={{ marginTop: 24 }}>
        <a href="/mes-annonces" className="annonce-action-btn annonce-action-btn--delete" style={{ textDecoration: 'none', lineHeight: '1' }}>
          {t('common.cancel')}
        </a>
        <button type="submit" className="annonce-submit-btn" disabled={isPending}>
          {isPending ? t('common.loading') : t('account.saveModifications')}
        </button>
      </div>
    </form>
  )
}
