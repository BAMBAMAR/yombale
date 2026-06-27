import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { backendFetch } from '@/lib/backend-fetch'
import { fcfa } from '@/lib/format'
import DeleteImmoButton from './DeleteImmoButton'

export const metadata: Metadata = {
  title: 'Mes annonces immo — Nopalou',
}

interface AnnonceImmo {
  id: string
  titre: string
  type_bien: string | null
  transaction: string | null
  prix: number | null
  ville: string | null
  quartier: string | null
  surface_m2: number | null
  nb_pieces: number | null
  image_url: string | null
  actif: boolean
  created_at: string
}

const TYPE_ICONS: Record<string, string> = {
  appartement: '🏢', villa: '🏡', maison: '🏠',
  studio: '🛏', terrain: '🌿', bureau: '🏢',
}

export default async function MesAnnoncesImmoPage({
  searchParams,
}: {
  searchParams: { created?: string }
}) {
  let annonces: AnnonceImmo[] = []
  let fetchError = false

  try {
    const res = await backendFetch('/api/immo/mine')
    if (res.status === 401) {
      redirect('/connexion?redirect=/mes-annonces-immo')
    }
    if (res.ok) {
      annonces = await res.json()
    } else {
      fetchError = true
    }
  } catch {
    fetchError = true
  }

  const justCreated = searchParams.created === '1'

  return (
    <div className="page-container" style={{ paddingTop: '2rem' }}>
      <div className="mes-immo-header">
        <div>
          <h1 className="mes-immo-titre">Mes annonces immobilières</h1>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 4 }}>
            {annonces.length} annonce{annonces.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/deposer-immo" className="deposer-btn">
          + Publier un bien
        </Link>
      </div>

      {justCreated && (
        <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 14, color: '#065F46' }}>
          ✅ Votre annonce a été soumise — elle sera visible après validation (sous 24h).
        </div>
      )}

      {fetchError && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 14, color: '#7F1D1D' }}>
          ⚠ Impossible de charger vos annonces. Réessayez.
        </div>
      )}

      {annonces.length === 0 && !fetchError ? (
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>🏘</span>
          <p>Vous n&apos;avez pas encore publié d&apos;annonce immobilière.</p>
          <Link href="/deposer-immo" className="budget-pill active" style={{ marginTop: 12 }}>
            Publier mon premier bien
          </Link>
        </div>
      ) : (
        <div className="mes-immo-grid">
          {annonces.map(a => {
            const icon = TYPE_ICONS[a.type_bien ?? ''] ?? '🏠'
            const isActive = a.actif
            return (
              <div key={a.id} className="mes-immo-card">
                <div className="mes-immo-card-img">
                  {a.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.image_url} alt={a.titre} />
                  ) : (
                    <span>{icon}</span>
                  )}
                </div>
                <div className="mes-immo-card-body">
                  <p className="mes-immo-card-titre">{a.titre}</p>
                  <p className="mes-immo-card-prix">
                    {a.prix ? fcfa(a.prix) : 'Prix à négocier'}
                    {a.transaction === 'location' && a.prix ? '/mois' : ''}
                  </p>
                  <div className="mes-immo-card-meta">
                    {a.type_bien && <span>{icon} {a.type_bien}</span>}
                    {a.ville && <span>📍 {[a.quartier, a.ville].filter(Boolean).join(', ')}</span>}
                    {a.surface_m2 && <span>{a.surface_m2} m²</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className={`mes-immo-status ${isActive ? 'mes-immo-status--active' : 'mes-immo-status--attente'}`}>
                      {isActive ? '✅ Active' : '⏳ En attente de validation'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {new Date(a.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <Link
                      href={`/deposer-immo?edit=${a.id}`}
                      style={{
                        padding: '5px 12px', background: 'var(--bg)',
                        border: '1px solid var(--border)', borderRadius: 6,
                        fontSize: 12, color: 'var(--text1)', textDecoration: 'none',
                      }}
                    >
                      ✏️ Modifier
                    </Link>
                    <DeleteImmoButton id={a.id} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
