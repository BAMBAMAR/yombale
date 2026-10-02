'use client'
import { useState, useRef, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { creerAnnonce } from '@/app/actions/annonces'
import { renvoyerEmailVerification } from '@/app/actions/auth'
import { lireBrouillon, ecrireBrouillon, effacerBrouillon } from '@/lib/brouillon-annonce'
import { CATEGORIES as LIB_CATEGORIES } from '@/lib/categories'
import { useTranslation } from '@/i18n/context'

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
  const { t } = useTranslation()

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
        <option value="">{t('common.select') || 'Choisir…'}</option>
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

/** AUD-219 : prévient avant le premier champ que la publication exige un e-mail vérifié (le refus tombait au dernier clic) */
function AvisEmailAPublier({ email }: { email: string }) {
  const [etat, setEtat] = useState<'repos' | 'envoi' | 'envoye'>('repos')
  const [erreur, setErreur] = useState<string | null>(null)
  async function renvoyer() {
    setEtat('envoi')
    setErreur(null)
    const res = await renvoyerEmailVerification()
    if (res.error) {
      setErreur(res.error)
      setEtat('repos')
    } else {
      setEtat('envoye')
    }
  }
  return (
    <div role="status" className="annonce-error" style={{ margin: '0 0 16px', textAlign: 'left' }}>
      <strong>Avant de publier, confirmez votre adresse e-mail.</strong>{' '}
      {etat === 'envoye'
        ? `Un lien vient d’être envoyé${email ? ` à ${email}` : ''}. Ouvrez-le, puis revenez ici : ce que vous avez saisi est conservé.`
        : 'Vous pouvez remplir l’annonce dès maintenant : ce que vous saisissez est conservé sur cet appareil.'}{' '}
      {etat !== 'envoye' && (
        <button type="button" onClick={renvoyer} disabled={etat === 'envoi'} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', fontWeight: 800, textDecoration: 'underline', cursor: 'pointer', color: 'inherit' }}>
          {etat === 'envoi' ? 'Envoi…' : 'Renvoyer le lien de vérification'}
        </button>
      )}
      {erreur && <span> {erreur}</span>}
    </div>
  )
}

export default function FormulaireAnnonce({ email, emailVerifie = true }: { email: string; emailVerifie?: boolean }) {
  const router = useRouter()
  const [step, setStep]   = useState<1 | 2 | 3>(1)
  const [slug, setSlug]   = useState('')
  const [brouillonRestaure, setBrouillonRestaure] = useState(false)
  const [car, setCar]     = useState<Record<string, string>>({})
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const step2Data = useRef<Record<string, string>>({})
  const { t } = useTranslation()

  const CATEGORIES = LIB_CATEGORIES.filter(c => c.value !== 'mixte').map(c => ({
    slug: c.value,
    label: c.label.replace(/^.*? /, ''),
    emoji: c.label.split(' ')[0]
  }))

  // AUD-219 : reprise du brouillon après le montage (jamais pendant le rendu : pas d'écart d'hydratation)
  useEffect(() => {
    const b = lireBrouillon(email)
    if (b && CATEGORIES.some(c => c.slug === b.slug)) {
      setSlug(b.slug)
      setCar(b.car)
      step2Data.current = b.champs
      setStep(b.step)
      setBrouillonRestaure(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sauvegarde à chaque changement de catégorie, de caractéristique ou d'étape (les champs libres sont enregistrés à la saisie)
  useEffect(() => {
    if (slug && step !== 1) ecrireBrouillon(email, { slug, car, champs: step2Data.current, step })
  }, [slug, car, step, email])

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
    Object.entries(step2Data.current).forEach(([k, v]) => { if (!fd.has(k) || !fd.get(k)) fd.set(k, v) })
    fd.delete('photos')
    photos.forEach(f => fd.append('photos', f))

    startTransition(async () => {
      const res = await creerAnnonce(fd)
      if (res.ok) {
        effacerBrouillon(email)
        router.push(res.id ? `/payer-annonce/${res.id}` : '/mes-annonces?created=1')
      } else {
        setError(res.error ?? t('errors.genericError'))
      }
    })
  }

  const avis = (
    <>
      {!emailVerifie && <AvisEmailAPublier email={email} />}
      {brouillonRestaure && (
        <p role="status" className="form-hint" style={{ margin: '0 0 12px' }}>
          Votre annonce en cours a été reprise là où vous l’aviez laissée. Les photos sont à ajouter de nouveau.
        </p>
      )}
    </>
  )

  // Step 1 — choix catégorie
  if (step === 1) {
    return (
      <div className="annonce-steps">
        {avis}
        <div className="annonce-step-header">
          <span className="annonce-step-num">1 / 3</span>
          <h2 className="annonce-step-titre">{t('account.chooseCategory')}</h2>
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
    const d = step2Data.current // valeurs déjà saisies (retour depuis l'étape 3, ou brouillon repris)
    return (
      <div className="annonce-steps">
        {avis}
        <div className="annonce-step-header">
          <button type="button" onClick={() => setStep(1)} className="annonce-back">{t('account.back')}</button>
          <span className="annonce-step-num">2 / 3</span>
          <h2 className="annonce-step-titre">{cat.emoji} {cat.label} — {t('account.stepDetails')}</h2>
        </div>
        <form className="annonce-form"
          onChange={e => {
            // enregistrement à la saisie : un rechargement ou un détour par la messagerie ne fait rien perdre
            const saved: Record<string, string> = {}
            new FormData(e.currentTarget).forEach((v, k) => { if (typeof v === 'string') saved[k] = v })
            step2Data.current = saved
            ecrireBrouillon(email, { slug, car, champs: saved, step: 2 })
          }}
          onSubmit={e => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          const saved: Record<string, string> = {}
          fd.forEach((v, k) => { if (typeof v === 'string') saved[k] = v })
          step2Data.current = saved
          setStep(3)
        }}>
          {/* Titre */}
          <div className="form-field">
            <label className="form-label">{t('account.adTitle')} <span className="required">*</span></label>
            <input name="titre" type="text" className="form-input" placeholder={t('account.adTitlePlaceholder')} required minLength={8} maxLength={150} defaultValue={d.titre ?? ''} />
            <span className="form-hint">{t('account.adTitleHint')}</span>
          </div>

          {/* Prix */}
          <div className="form-field">
            <label className="form-label">{t('account.price')} (FCFA)</label>
            <input name="prix" type="number" min="100" max="500000000" className="form-input" placeholder={t('account.priceNegotiable')} defaultValue={d.prix ?? ''} />
          </div>

          {/* Caractéristiques catégorie */}
          <div className="form-section-title">{t('account.characteristics')}</div>
          <CaracteristiquesFields slug={slug} values={car} onChange={handleCarChange} />

          {/* Localisation */}
          <div className="form-section-title">{t('account.location')}</div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">{t('account.city')}</label>
              <select name="ville" className="form-input" defaultValue={d.ville ?? ''}>
                <option value="">{t('common.select') || 'Choisir…'}</option>
                {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">{t('account.neighborhood')}</label>
              <input name="quartier" type="text" className="form-input" placeholder={t('account.neighborhoodPlaceholder')} defaultValue={d.quartier ?? ''} />
            </div>
          </div>

          {/* Description */}
          <div className="form-field">
            <label className="form-label">{t('account.description')}</label>
            <textarea name="description" className="form-input form-textarea" rows={4} placeholder={t('account.descriptionPlaceholderAd')} maxLength={2000} defaultValue={d.description ?? ''} />
          </div>

          {/* Contact */}
          <div className="form-section-title">{t('account.contact')}</div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">{t('account.yourName')}</label>
              <input name="contact_nom" type="text" className="form-input" placeholder={t('account.yourNamePlaceholder')} maxLength={80} defaultValue={d.contact_nom ?? ''} />
            </div>
            <div className="form-field">
              <label className="form-label">{t('account.yourPhone')} <span className="required">*</span></label>
              <input name="contact_tel" type="tel" className="form-input" placeholder="ex: 77 123 45 67" required defaultValue={d.contact_tel ?? ''} />
            </div>
          </div>

          <button type="submit" className="annonce-next-btn">
            {t('account.continueToPhotos')}
          </button>
        </form>
      </div>
    )
  }

  // Step 3 — photos + soumission
  const cat = CATEGORIES.find(c => c.slug === slug)!
  return (
    <div className="annonce-steps">
      {avis}
      <div className="annonce-step-header">
        <button type="button" onClick={() => setStep(2)} className="annonce-back">{t('account.back')}</button>
        <span className="annonce-step-num">3 / 3</span>
        <h2 className="annonce-step-titre">{cat.emoji} {cat.label} — {t('account.stepPhotos')}</h2>
      </div>

      <form className="annonce-form" onSubmit={handleSubmit}>
        <div className="photos-zone">
          <div
            className="photos-dropzone"
            onClick={() => fileRef.current?.click()}
            onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
            tabIndex={0}
            role="button"
            aria-label={t('account.photosClickToAdd')}
          >
            <span style={{ fontSize: 32 }}></span>
            <p>{t('account.photosClickToAdd')}</p>
            <span className="form-hint">{t('account.photosHint')}</span>
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
                    aria-label={t('common.delete')}
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="annonce-error">{error}</p>}

        <div className="annonce-submit-row">
          <div className="annonce-quota-info">
            {t('account.freeQuotaNotice')}
          </div>
          <button type="submit" className="annonce-submit-btn" disabled={isPending}>
            {isPending ? t('account.publishing') : t('account.publishAdBtn')}
          </button>
        </div>
      </form>
    </div>
  )
}
