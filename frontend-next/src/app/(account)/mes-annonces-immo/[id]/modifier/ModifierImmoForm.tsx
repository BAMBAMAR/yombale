'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateAnnonceImmo } from '@/app/actions/immo'
import { useTranslation } from '@/i18n/context'

import DeleteImmoButton from '../../DeleteImmoButton'

interface AnnonceImmo {
  id: string
  titre: string
  type_bien: string | null
  transaction: string | null
  prix: number | null
  surface_m2: number | null
  nb_pieces: number | null
  nb_chambres: number | null
  meuble: boolean
  ville: string | null
  quartier: string | null
  description: string | null
  contact_nom: string | null
  contact_tel: string | null
}

const TYPES_BIEN = [
  { value: 'appartement', label: 'Appartement' },
  { value: 'villa',       label: 'Villa' },
  { value: 'maison',      label: 'Maison' },
  { value: 'studio',      label: 'Studio' },
  { value: 'terrain',     label: 'Terrain' },
  { value: 'bureau',      label: 'Bureau / Commerce' },
]

const TRANSACTIONS = [
  { value: 'location', label: 'Location' },
  { value: 'vente',    label: 'Vente' },
]

const VILLES = ['Dakar', 'Thiès', 'Ziguinchor', 'Saint-Louis', 'Kaolack', 'Rufisque', 'Pikine', 'Touba', 'Autre']

export default function ModifierImmoForm({ annonce }: { annonce: AnnonceImmo }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFieldErrors([])
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await updateAnnonceImmo(annonce.id, fd)
      if (res.ok) {
        router.push('/mes-annonces-immo?updated=1')
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

  return (
    <form className="annonce-form" onSubmit={handleSubmit}>
      <div className="modifier-annonce-warning">
        {t('account.editAdWarning')}
      </div>

      <div className="form-field">
        <label className="form-label">{t('account.adTitle')} <span className="required">*</span></label>
        <input
          name="titre"
          type="text"
          className="form-input"
          defaultValue={annonce.titre}
          required
          minLength={5}
          maxLength={150}
          placeholder={t('account.adTitlePlaceholderImmo')}
        />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label className="form-label">{t('account.propertyType')} <span className="required">*</span></label>
          <select name="type_bien" className="form-input" defaultValue={annonce.type_bien ?? 'appartement'} required>
            {TYPES_BIEN.map(tb => <option key={tb.value} value={tb.value}>{tb.label}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">{t('account.transaction')} <span className="required">*</span></label>
          <select name="transaction" className="form-input" defaultValue={annonce.transaction ?? 'location'} required>
            {TRANSACTIONS.map(tr => <option key={tr.value} value={tr.value}>{tr.label}</option>)}
          </select>
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">{t('account.price')} (FCFA)</label>
        <input
          name="prix"
          type="number"
          min="0"
          className="form-input"
          defaultValue={annonce.prix ?? ''}
          placeholder={t('account.priceNegotiable')}
        />
      </div>

      <div className="form-section-title">{t('account.characteristics')}</div>
      <div className="form-row">
        <div className="form-field">
          <label className="form-label">{t('account.surface')}</label>
          <input name="surface_m2" type="number" min="1" className="form-input" defaultValue={annonce.surface_m2 ?? ''} placeholder="ex: 85" />
        </div>
        <div className="form-field">
          <label className="form-label">{t('account.roomsCount')}</label>
          <input name="nb_pieces" type="number" min="1" max="20" className="form-input" defaultValue={annonce.nb_pieces ?? ''} placeholder="ex: 3" />
        </div>
        <div className="form-field">
          <label className="form-label">{t('account.bedroomsCount')}</label>
          <input name="nb_chambres" type="number" min="0" max="20" className="form-input" defaultValue={annonce.nb_chambres ?? ''} placeholder="ex: 2" />
        </div>
      </div>

      <div className="form-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, display: 'flex' }}>
        <input
          name="meuble"
          id="meuble"
          type="checkbox"
          defaultChecked={annonce.meuble}
          style={{ width: 18, height: 18, accentColor: 'var(--accent)', cursor: 'pointer' }}
        />
        <label htmlFor="meuble" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>{t('account.furnished')}</label>
      </div>

      <div className="form-section-title">{t('account.location')}</div>
      <div className="form-row">
        <div className="form-field">
          <label className="form-label">{t('account.city')} <span className="required">*</span></label>
          <select name="ville" className="form-input" defaultValue={annonce.ville ?? 'Dakar'} required>
            {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">{t('account.neighborhood')}</label>
          <input name="quartier" type="text" className="form-input" defaultValue={annonce.quartier ?? ''} placeholder={t('account.neighborhoodPlaceholder')} />
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">{t('account.description')}</label>
        <textarea
          name="description"
          className="form-input form-textarea"
          rows={4}
          defaultValue={annonce.description ?? ''}
          placeholder={t('account.descriptionPlaceholderImmo')}
          maxLength={3000}
        />
      </div>

      <div className="form-section-title">{t('account.contact')}</div>
      <div className="form-row">
        <div className="form-field">
          <label className="form-label">{t('account.fullName')}</label>
          <input name="contact_nom" type="text" className="form-input" defaultValue={annonce.contact_nom ?? ''} placeholder={t('account.yourName')} maxLength={80} />
        </div>
        <div className="form-field">
          <label className="form-label">{t('account.yourPhone')} <span className="required">*</span></label>
          <input name="contact_tel" type="tel" className="form-input" defaultValue={annonce.contact_tel ?? ''} placeholder="ex: 77 123 45 67" required />
        </div>
      </div>

      {fieldErrors.length > 0 && (
        <ul className="annonce-error" style={{ marginTop: 12 }}>
          {fieldErrors.map((msg, i) => <li key={i}>{msg}</li>)}
        </ul>
      )}
      {error && <p className="annonce-error" style={{ marginTop: 12 }}>{error}</p>}

      <div className="annonce-submit-row" style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href="/mes-annonces-immo" className="annonce-action-btn annonce-action-btn--delete" style={{ textDecoration: 'none', lineHeight: '1' }}>
            {t('common.cancel')}
          </a>
          <DeleteImmoButton id={annonce.id} />
        </div>
        <button type="submit" className="annonce-submit-btn" disabled={isPending}>
          {isPending ? t('common.loading') : t('account.saveModifications')}
        </button>
      </div>
    </form>
  )
}
