'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deposerAnnonceImmo } from '@/app/actions/immo'

const TYPES_BIEN = [
  { val: 'appartement', label: 'Appartement', icon: '🏢' },
  { val: 'villa',       label: 'Villa',       icon: '🏡' },
  { val: 'maison',      label: 'Maison',      icon: '🏠' },
  { val: 'studio',      label: 'Studio',      icon: '🛏' },
  { val: 'terrain',     label: 'Terrain',     icon: '🌿' },
  { val: 'bureau',      label: 'Bureau',      icon: '🏢' },
]

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
        setError(msgs || res.error || 'Une erreur est survenue.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="deposer-immo-form">
      {/* Transaction */}
      <div className="form-field">
        <label className="form-label">Type d&apos;offre <span className="required">*</span></label>
        <div style={{ display: 'flex', gap: 8 }}>
          {['location', 'vente'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTransaction(t)}
              className={`budget-pill${transaction === t ? ' active' : ''}`}
            >
              {t === 'location' ? '🏠 Location' : '🔑 Vente'}
            </button>
          ))}
        </div>
      </div>

      {/* Type de bien */}
      <div className="form-field">
        <label className="form-label">Type de bien <span className="required">*</span></label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TYPES_BIEN.map(t => (
            <button
              key={t.val}
              type="button"
              onClick={() => setTypeBien(t.val)}
              className={`budget-pill${typeBien === t.val ? ' active' : ''}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Titre */}
      <div className="form-field">
        <label className="form-label" htmlFor="titre">Titre de l&apos;annonce <span className="required">*</span></label>
        <input
          id="titre"
          name="titre"
          type="text"
          required
          placeholder="Ex: Appartement 2 pièces meublé à Almadies"
          className="form-input"
        />
      </div>

      <p className="deposer-immo-section-title">Localisation</p>

      <div className="deposer-immo-row">
        {/* Ville */}
        <div className="form-field">
          <label className="form-label" htmlFor="ville">Ville <span className="required">*</span></label>
          <select id="ville" name="ville" required className="form-input" defaultValue="Dakar">
            {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        {/* Quartier */}
        <div className="form-field">
          <label className="form-label" htmlFor="quartier">Quartier</label>
          <input
            id="quartier"
            name="quartier"
            type="text"
            placeholder="Ex: Almadies, Plateau…"
            className="form-input"
          />
        </div>
      </div>

      <p className="deposer-immo-section-title">Caractéristiques</p>

      <div className="deposer-immo-row">
        {/* Prix */}
        <div className="form-field">
          <label className="form-label" htmlFor="prix">
            Prix (FCFA) {transaction === 'location' ? '/mois' : ''}
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
          <label className="form-label" htmlFor="surface_m2">Surface (m²)</label>
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
          <label className="form-label" htmlFor="nb_pieces">Nombre de pièces</label>
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
          <label className="form-label" htmlFor="nb_chambres">Nombre de chambres</label>
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
          Bien meublé / avec mobilier
        </label>
      </div>

      {/* Description */}
      <div className="form-field">
        <label className="form-label" htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="Décrivez le bien : état, équipements, accès, conditions…"
          className="form-input"
          style={{ resize: 'vertical', minHeight: 100 }}
        />
      </div>

      <p className="deposer-immo-section-title">Photos</p>

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
                  aria-label="Supprimer"
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="deposer-immo-section-title">Contact</p>

      <div className="deposer-immo-row">
        <div className="form-field">
          <label className="form-label" htmlFor="contact_nom">Votre nom</label>
          <input
            id="contact_nom"
            name="contact_nom"
            type="text"
            placeholder="Ex: Mamadou Diallo"
            className="form-input"
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="contact_tel">Téléphone <span className="required">*</span></label>
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
        {isPending ? 'Envoi en cours…' : '📤 Soumettre mon annonce'}
      </button>

      <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
        Votre annonce sera visible après validation par notre équipe (généralement sous 24h).
      </p>
    </form>
  )
}
