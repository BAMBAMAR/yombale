'use client'
import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteAnnonce } from '@/app/actions/annonces'
import { cloudinaryHQ } from '@/lib/cloudinary'
import { useTranslation } from '@/i18n/context'
import { fcfa } from '@/lib/format'

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

function StatutBadge({ a }: { a: Annonce }) {
  const { t } = useTranslation()
  if (a.rejete)            return <span className="annonce-statut annonce-statut--rejete">{t('account.adStatusRejected')}</span>
  if (a.actif)             return <span className="annonce-statut annonce-statut--active">{t('account.adStatusPublished')}</span>
  if (a.payee && !a.actif) return <span className="annonce-statut annonce-statut--moderation">{t('account.adStatusModeration')}</span>
  return <span className="annonce-statut annonce-statut--attente">{t('account.adStatusPending')}</span>
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
  const [deleteErr, setDeleteErr] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { t } = useTranslation()

  function handleDelete() {
    if (!confirm(t('account.adConfirmDelete'))) return
    setDeleteErr(null)
    setMenuOpen(false)
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

        {/* Barre d'action pro : 1 bouton dominant + 1 menu compact [⋯] */}
        <div className="annonce-card-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, position: 'relative' }}>
          {needsPayment ? (
            <Link
              href={`/payer-annonce/${annonce.id}`}
              className="annonce-action-btn annonce-action-btn--pay"
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 8,
                fontWeight: 800,
                fontSize: 12,
              }}
            >
              ⚡ {t('account.adActionActivate')} ({fcfa(prixAnnonce)})
            </Link>
          ) : (
            <Link
              href={`/mes-annonces/${annonce.id}/modifier`}
              className="annonce-action-btn annonce-action-btn--edit"
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 8,
                fontWeight: 800,
                fontSize: 12,
              }}
            >
              ✏️ {t('account.adActionEdit')}
            </Link>
          )}

          {/* Menu d'options compact */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 34,
                height: 34,
                borderRadius: 8,
                background: menuOpen ? '#E2E8F0' : '#F1F5F9',
                border: '1px solid #CBD5E1',
                color: 'var(--navy, #1C2B4A)',
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 900,
                lineHeight: 1,
              }}
              title="Options de l'annonce"
            >
              ⋯
            </button>

            {menuOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                  onClick={() => setMenuOpen(false)}
                />
                <div style={{
                  position: 'absolute',
                  right: 0,
                  bottom: '100%',
                  marginBottom: 6,
                  width: 210,
                  background: '#ffffff',
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  border: '1px solid #E2E8F0',
                  padding: '6px',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}>
                  {needsPayment && (
                    <Link
                      href={`/mes-annonces/${annonce.id}/modifier`}
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 10px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--navy, #1C2B4A)',
                        textDecoration: 'none',
                      }}
                    >
                      ✏️ {t('account.adActionEdit')}
                    </Link>
                  )}

                  {annonce.actif && (
                    <>
                      <Link
                        href={`/payer-boost/${annonce.id}`}
                        onClick={() => setMenuOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 750,
                          color: 'var(--accent, #C75B00)',
                          textDecoration: 'none',
                        }}
                      >
                        🚀 {t('account.adActionBoost')}
                      </Link>

                      <Link
                        href={`/annonces/${annonce.id}`}
                        target="_blank"
                        onClick={() => setMenuOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 650,
                          color: '#475569',
                          textDecoration: 'none',
                        }}
                      >
                        👁️ Voir l&apos;annonce en ligne
                      </Link>
                    </>
                  )}

                  <div style={{ height: 1, background: '#F1F5F9', margin: '3px 0' }} />

                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isPending}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#DC2626',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    🗑️ {isPending ? 'Suppression…' : t('account.adActionDelete')}
                  </button>
                </div>
              </>
            )}
          </div>
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
  const { t } = useTranslation()

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
      {loading && annonces.length === 0 && <p style={{ padding: 20 }}>{t('common.loading')}</p>}
      {created && (
        <div className="annonce-created-banner">
          {t('account.adCreatedSuccess')}
        </div>
      )}
      {updated && (
        <div className="annonce-created-banner">
          {t('account.adUpdatedSuccess')}
        </div>
      )}

      <div className="mes-annonces-header">
        <p style={{ fontSize: 14, color: 'var(--text2)', margin: 0 }}>
          {annonces.length} {t('account.adsCount')}
        </p>
        <Link href="/deposer-annonce" className="annonce-new-btn">
          + {t('account.navPublishAd')}
        </Link>
      </div>

      {annonces.length === 0 ? (
        <div style={{
          marginTop: 24,
          padding: '40px 24px',
          background: '#ffffff',
          borderRadius: 16,
          border: '1.5px dashed #CBD5E1',
          textAlign: 'center',
          boxShadow: '0 4px 14px rgba(26,22,18,0.02)',
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FFF3E8 0%, #FFEDD5 100%)',
            color: 'var(--accent, #C75B00)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 30,
            marginBottom: 16,
            boxShadow: '0 4px 12px rgba(199,91,0,0.15)',
          }}>
            📣
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
            Vous n&apos;avez aucune annonce en ligne pour le moment
          </h3>
          <p style={{ margin: '0 auto 20px', maxWidth: 460, fontSize: 13.5, color: '#64748B', lineHeight: 1.5 }}>
            Vendez des téléphones, du mobilier, des véhicules ou de la mode auprès de milliers d&apos;acheteurs vérifiés à Dakar et dans tout le Sénégal !
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/deposer-annonce"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                borderRadius: 10,
                background: 'var(--accent, #C75B00)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 14,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(199,91,0,0.25)',
              }}
            >
              <span>+</span>
              <span>Publier ma première annonce</span>
            </Link>

            <Link
              href="/creer-boutique"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                borderRadius: 10,
                background: '#F8FAFC',
                border: '1.5px solid #CBD5E1',
                color: 'var(--navy, #1C2B4A)',
                fontWeight: 750,
                fontSize: 13.5,
                textDecoration: 'none',
              }}
            >
              <span>🏪</span>
              <span>Ouvrir une boutique pro</span>
            </Link>
          </div>
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
