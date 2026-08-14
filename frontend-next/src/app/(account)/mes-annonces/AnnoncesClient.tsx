'use client'
import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteAnnonce } from '@/app/actions/annonces'
import { cloudinaryHQ } from '@/lib/cloudinary'

interface Annonce {
  id: string
  titre: string
  categorie_slug: string
  prix: number | null
  ville: string | null
  actif: boolean
  payee: boolean
  rejete: boolean
  photos: string[] | null
  description?: string | null
  caracteristiques?: Record<string, string> | null
  created_at: string
}

const CAT_LABELS: Record<string, string> = {
  smartphones: '📱 Téléphone',
  informatique: '💻 Info',
  'tv-electro': '📺 TV/Électro',
  mode: '👗 Mode',
  maison: '🏠 Maison',
  'auto-moto': '🚗 Auto',
  jeux: '🎮 Jeux',
  services: '🛠 Services',
}

function fcfa(n: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

function StatutBadge({ a }: { a: Annonce }) {
  if (a.rejete)            return <span className="annonce-statut annonce-statut--rejete">Rejetée</span>
  if (a.actif)             return <span className="annonce-statut annonce-statut--active">Publiée ✓</span>
  if (a.payee && !a.actif) return <span className="annonce-statut annonce-statut--moderation">En modération</span>
  return <span className="annonce-statut annonce-statut--attente">En attente</span>
}

function AnnonceCard({
  annonce,
  userId,
  prixAnnonce,
  prixBoost,
  numeroWave,
  numeroOM,
  waveActif,
}: {
  annonce: Annonce
  userId: string
  prixAnnonce: number
  prixBoost: number
  numeroWave: string
  numeroOM: string
  waveActif: boolean
}) {
  const [deleteErr, setDeleteErr]  = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()


  function handleDelete() {
    if (!confirm('Supprimer cette annonce définitivement ?')) return
    setDeleteErr(null)
    startTransition(async () => {
      const res = await deleteAnnonce(annonce.id)
      if (res.error) setDeleteErr(res.error)
      else router.refresh()
    })
  }



  const needsPayment = !annonce.payee && !annonce.actif && !annonce.rejete
  const photo = annonce.photos?.[0] ?? null

  return (
    <div className="annonce-card">
      <div className="annonce-card-thumb">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cloudinaryHQ(photo, { width: 400 })} alt={annonce.titre} loading="lazy" />
        ) : (
          <span className="annonce-thumb-placeholder">📷</span>
        )}
      </div>

      <div className="annonce-card-body">
        <div className="annonce-card-top">
          <div>
            <span className="annonce-cat-label">
              {CAT_LABELS[annonce.categorie_slug] ?? annonce.categorie_slug}
            </span>
            <h3 className="annonce-card-titre">{annonce.titre}</h3>
            <p className="annonce-card-meta">
              {annonce.ville ?? 'Dakar'}
              {annonce.prix ? ` · ${fcfa(annonce.prix)}` : ''}
              {' · '}
              {new Date(annonce.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <StatutBadge a={annonce} />
        </div>

        {deleteErr && <p className="annonce-delete-err">{deleteErr}</p>}

        <div className="annonce-card-actions">
          {needsPayment && (
            <Link href={`/payer-annonce/${annonce.id}`} className="annonce-action-btn annonce-action-btn--pay">
              💳 Activer ({prixAnnonce.toLocaleString('fr-FR')} FCFA)
            </Link>
          )}
          <Link href={`/mes-annonces/${annonce.id}/modifier`} className="annonce-action-btn annonce-action-btn--edit">
            Modifier
          </Link>
          {annonce.actif && (
            <Link href={`/payer-boost/${annonce.id}`} className="annonce-action-btn">
              🚀 Booster 7j
            </Link>
          )}
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="annonce-action-btn annonce-action-btn--delete"
          >
            {isPending ? '…' : 'Supprimer'}
          </button>
        </div>


      </div>
    </div>
  )
}

export default function AnnoncesClient({
  created,
  updated,
  userId,
  prixAnnonce,
  prixBoost,
  numeroWave,
  numeroOM,
  waveActif,
}: {
  created: boolean
  updated: boolean
  userId: string
  prixAnnonce: number
  prixBoost: number
  numeroWave: string
  numeroOM: string
  waveActif: boolean
}) {
  const [annonces, setAnnonces] = useState<Annonce[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cacheKey = `nopalou_offline_annonces_${userId}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) { 
      try { 
        const parsed = JSON.parse(cached)
        setAnnonces(parsed)
      } catch(e) {} 
    }
    if (!cached) setLoading(true)

    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    fetch('/api/annonces/mine', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(r => r.json())
      .then(d => {
        if (d.annonces) {
          setAnnonces(d.annonces)
          localStorage.setItem(cacheKey, JSON.stringify(d.annonces))
        }
      })
      .catch(err => console.warn('[AnnoncesClient] Mode hors-ligne ou erreur réseau lors du fetch :', err))
      .finally(() => setLoading(false))
  }, [userId])

  return (
    <div>
      {loading && annonces.length === 0 && <p style={{ padding: 20 }}>Chargement de vos annonces...</p>}
      {created && (
        <div className="annonce-created-banner">
          ✅ Annonce créée avec succès !
        </div>
      )}
      {updated && (
        <div className="annonce-created-banner">
          ✅ Annonce mise à jour — en cours de modération.
        </div>
      )}

      <div className="mes-annonces-header">
        <p style={{ fontSize: 14, color: 'var(--text2)', margin: 0 }}>
          {annonces.length} annonce{annonces.length !== 1 ? 's' : ''}
        </p>
        <Link href="/deposer-annonce" className="annonce-new-btn">
          + Publier une annonce
        </Link>
      </div>

      {annonces.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 32 }}>
          <span style={{ fontSize: 48 }}>📋</span>
          <p>Vous n&apos;avez pas encore d&apos;annonces.</p>
          <Link href="/deposer-annonce" className="budget-pill active" style={{ marginTop: 8 }}>
            Publier ma première annonce
          </Link>
        </div>
      ) : (
        <div className="annonces-list">
          {annonces.map(a => (
            <AnnonceCard
              key={a.id}
              annonce={a}
              userId={userId}
              prixAnnonce={prixAnnonce}
              prixBoost={prixBoost}
              numeroWave={numeroWave}
              numeroOM={numeroOM}
              waveActif={waveActif}
            />
          ))}
        </div>
      )}
    </div>
  )
}
