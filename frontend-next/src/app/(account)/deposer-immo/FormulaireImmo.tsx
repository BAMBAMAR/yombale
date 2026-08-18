'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deposerAnnonceImmo } from '@/app/actions/immo'
import { useTranslation } from '@/i18n/context'

const VILLES = ['Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Thiès', 'Mbour', 'Saint-Louis', 'Ziguinchor', 'Kaolack', 'Touba', 'Autre']

export default function FormulaireImmo() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [typeBien, setTypeBien] = useState('appartement')
  const [transaction, setTransaction] = useState('location')
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()

  const TYPES_BIEN = [
    { val: 'appartement', label: t('account.typeApartment'), icon: '🏢' },
    { val: 'villa',       label: t('account.typeVilla'),       icon: '🏡' },
    { val: 'maison',      label: t('account.typeHouse'),      icon: '🏠' },
    { val: 'studio',      label: t('account.typeStudio'),      icon: '🛏' },
    { val: 'terrain',     label: t('account.typeLand'),     icon: '🌿' },
    { val: 'bureau',      label: t('account.typeOffice'),      icon: '🏢' },
  ]

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5)
    setPhotos(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  function removePhoto(i: number) {
    setPhotos(p => p.filter((_, j) => j !== i))
    setPreviews(p => p.filter((_, j) => j !== i))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('type_bien', typeBien)
    fd.set('transaction', transaction)
    fd.delete('photos')
    photos.forEach(f => fd.append('photos', f))

    startTransition(async () => {
      const res = await deposerAnnonceImmo(fd)
      if (res.ok) {
        router.push('/mes-annonces-immo?created=1')
      } else {
        const msgs = res.errors?.map(e => e.msg).join(', ')
        setError(msgs || res.error || t('errors.genericError'))
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="deposer-immo-form">
      {/* Transaction */}
      <div className="form-field">
        <label className="form-label">{t('account.offerType')} <span className="required">*</span></label>
        <div style={{ display: 'flex', gap: 8 }}>
          {['location', 'vente'].map(typeKey => (
            <button
              key={typeKey}
              type="button"
              onClick={() => setTransaction(typeKey)}
              className={`budget-pill${transaction === typeKey ? ' active' : ''}`}
            >
              {typeKey === 'location' ? t('account.offerRent') : t('account.offerSale')}
            </button>
          ))}
        </div>
      </div>

      {/* Type de bien */}
      <div className="form-field">
        <label className="form-label">{t('account.propertyType')} <span className="required">*</span></label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TYPES_BIEN.map(tOption => (
            <button
              key={tOption.val}
              type="button"
              onClick={() => setTypeBien(tOption.val)}
              className={`budget-pill${typeBien === tOption.val ? ' active' : ''}`}
            >
              {tOption.icon} {tOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Titre */}
      <div className="form-field">
        <label className="form-label" htmlFor="titre">{t('account.adTitle')} <span className="required">*</span></label>
        <input
          id="titre"
          name="titre"
          type="text"
          required
          placeholder={t('account.adTitlePlaceholderImmo')}
          className="form-input"
        />
      </div>

      <p className="deposer-immo-section-title">{t('account.location')}</p>

      <div className="deposer-immo-row">
        {/* Ville */}
        <div className="form-field">
          <label className="form-label" htmlFor="ville">{t('account.city')} <span className="required">*</span></label>
          <select id="ville" name="ville" required className="form-input" defaultValue="Dakar">
            {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        {/* Quartier */}
        <div className="form-field">
          <label className="form-label" htmlFor="quartier">{t('account.neighborhood')}</label>
          <input
            id="quartier"
            name="quartier"
            type="text"
            placeholder={t('account.neighborhoodPlaceholder')}
            className="form-input"
          />
        </div>
      </div>

      <p className="deposer-immo-section-title">{t('account.characteristics')}</p>

      <div className="deposer-immo-row">
        {/* Prix */}
        <div className="form-field">
          <label className="form-label" htmlFor="prix">
            {transaction === 'location' ? t('account.priceMonthly') : t('account.price')}
          </label>
          <input
            id="prix"
            name="prix"
            type="number"
            min="0"
            step="1000"
            placeholder="Ex: 350000"
            className="form-input"
          />
        </div>

        {/* Surface */}
        <div className="form-field">
          <label className="form-label" htmlFor="surface_m2">{t('account.surface')}</label>
          <input
            id="surface_m2"
            name="surface_m2"
            type="number"
            min="0"
            placeholder="Ex: 80"
            className="form-input"
          />
        </div>
      </div>

      <div className="deposer-immo-row">
        {/* Nb pièces */}
        <div className="form-field">
          <label className="form-label" htmlFor="nb_pieces">{t('account.roomsCount')}</label>
          <input
            id="nb_pieces"
            name="nb_pieces"
            type="number"
            min="1"
            placeholder="Ex: 3"
            className="form-input"
          />
        </div>

        {/* Nb chambres */}
        <div className="form-field">
          <label className="form-label" htmlFor="nb_chambres">{t('account.bedroomsCount')}</label>
          <input
            id="nb_chambres"
            name="nb_chambres"
            type="number"
            min="0"
            placeholder="Ex: 2"
            className="form-input"
          />
        </div>
      </div>

      {/* Meublé */}
      <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          id="meuble"
          name="meuble"
          type="checkbox"
          value="on"
          style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--accent)' }}
        />
        <label htmlFor="meuble" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
          {t('account.furnished')}
        </label>
      </div>

      {/* Description */}
      <div className="form-field">
        <label className="form-label" htmlFor="description">{t('account.description')}</label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder={t('account.descriptionPlaceholderImmo')}
          className="form-input"
          style={{ resize: 'vertical', minHeight: 100 }}
        />
      </div>

      <p className="deposer-immo-section-title">{t('account.photos')}</p>

      <div className="photos-zone">
        <div
          className="photos-dropzone"
          onClick={() => fileRef.current?.click()}
          onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
          tabIndex={0}
          role="button"
          aria-label={t('account.photosClickToAdd')}
        >
          <span style={{ fontSize: 32 }}>📷</span>
          <p>{t('account.photosClickToAdd')}</p>
          <span className="form-hint">{t('account.photosHint')}</span>
        </div>
        <input
          ref={fileRef}
          type="file"
          name="photos"
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

      <p className="deposer-immo-section-title">{t('account.contact')}</p>

      <div className="deposer-immo-row">
        <div className="form-field">
          <label className="form-label" htmlFor="contact_nom">{t('account.yourName')}</label>
          <input
            id="contact_nom"
            name="contact_nom"
            type="text"
            placeholder={t('account.yourNamePlaceholder')}
            className="form-input"
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="contact_tel">{t('account.yourPhone')} <span className="required">*</span></label>
          <input
            id="contact_tel"
            name="contact_tel"
            type="tel"
            required
            placeholder="Ex: 77 123 45 67"
            className="form-input"
          />
        </div>
      </div>

      {error && (
        <div className="form-error-banner">⚠ {error}</div>
      )}

      <button type="submit" className="form-submit-btn" disabled={isPending}>
        {isPending ? t('account.submitting') : t('account.submitAd')}
      </button>

      <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
        {t('account.submitReviewNotice')}
      </p>
    </form>
  )
}
