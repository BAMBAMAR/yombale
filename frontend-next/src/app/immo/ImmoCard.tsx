import Link from 'next/link'
import { fcfa } from '@/lib/format'
import { cloudinaryHQ } from '@/lib/cloudinary'
import CardActions from '@/app/CardActions'

export interface AnnonceImmo {
  id: string
  titre: string
  prix: number | null
  ville: string | null
  quartier: string | null
  type_bien: string | null
  transaction: string | null
  surface_m2: number | null
  nb_pieces: number | null
  nb_chambres: number | null
  meuble: boolean | null
  photos: string[] | null
  description: string | null
  source: string | null
  sponsorisee: boolean
  created_at: string
}

export const TYPE_ICONS: Record<string, string> = {
  appartement:        '🏢',
  appartement_meuble: '🏢',
  villa:              '🏡',
  maison:             '🏠',
  studio:             '🛏',
  chambre:            '🛏',
  chambre_meuble:     '🛏',
  terrain:            '🌿',
  bureau:             '🏢',
}

const SOURCE_LABELS: Record<string, string> = {
  coinafrique: 'CoinAfrique',
  expat:       'Expat-Dakar',
  facebook:    'Facebook',
  manuel:      'Particulier',
}

export default function ImmoCard({ a }: { a: AnnonceImmo }) {
  const img = Array.isArray(a.photos) ? a.photos[0] ?? null : null
  const localisation = [a.quartier, a.ville].filter(Boolean).join(', ') || 'Sénégal'
  const typeIcon = TYPE_ICONS[a.type_bien ?? ''] ?? '🏠'
  const isVente = a.transaction === 'vente'

  return (
    <Link href={`/immo/${a.id}`} className="immo-card" style={{ position: 'relative' }}>
      <CardActions id={a.id} nom={a.titre} type="immo" />
      <div className="immo-card-img">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cloudinaryHQ(img, { width: 480 })} alt={a.titre} loading="lazy" />
        ) : (
          <span className="immo-img-placeholder">{typeIcon}</span>
        )}
        <span className={`immo-transaction-badge${isVente ? ' immo-transaction-badge--vente' : ''}`}>
          {isVente ? 'Vente' : 'Location'}
        </span>
        {a.sponsorisee && (
          <span className="immo-sponsored-badge">Sponsorisé</span>
        )}
      </div>

      <div className="immo-card-body">
        {a.type_bien && (
          <span className="immo-type-tag">{typeIcon} {a.type_bien}</span>
        )}
        <h3 className="immo-titre">{a.titre}</h3>
        <p className="immo-localisation">📍 {localisation}</p>

        <div className="immo-specs">
          {a.surface_m2 && (
            <span className="immo-spec">{a.surface_m2} m²</span>
          )}
          {a.nb_pieces && (
            <span className="immo-spec">{a.nb_pieces} pièce{a.nb_pieces > 1 ? 's' : ''}</span>
          )}
          {a.nb_chambres && (
            <span className="immo-spec">{a.nb_chambres} ch.</span>
          )}
          {a.meuble && (
            <span className="immo-spec">Meublé</span>
          )}
        </div>

        <div className="immo-card-footer">
          <span className="immo-prix">
            {a.prix ? fcfa(a.prix) : 'Prix sur demande'}
            {!isVente && a.prix ? <span className="immo-prix-periode">/mois</span> : ''}
          </span>
          {a.source && SOURCE_LABELS[a.source] && (
            <span className="immo-source">{SOURCE_LABELS[a.source]}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
