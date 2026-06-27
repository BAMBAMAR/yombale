'use client'

import { useState, useTransition } from 'react'
import { modererAnnonce } from '@/app/actions/admin'

interface Annonce {
  id: string
  titre: string
  description: string | null
  categorie_slug: string
  prix: number | null
  ville: string | null
  actif: boolean
  payee: boolean
  rejete: boolean
  auteur_nom: string | null
  auteur_email: string | null
  contact_tel: string
  photos: string[]
  created_at: string
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('fr-SN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatPrix(p: number | null) {
  if (!p) return '—'
  return new Intl.NumberFormat('fr-SN').format(p) + ' FCFA'
}

function StatutBadge({ annonce }: { annonce: Annonce }) {
  if (annonce.rejete)  return <span className="admin-annonce-statut admin-annonce-statut--rejete">Rejetée</span>
  if (annonce.actif)   return <span className="admin-annonce-statut admin-annonce-statut--active">Active</span>
  return <span className="admin-annonce-statut admin-annonce-statut--attente">En attente</span>
}

function AnnonceRow({ annonce, onAction }: { annonce: Annonce; onAction: () => void }) {
  const [pending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)

  function handleAction(action: 'approuver' | 'rejeter') {
    startTransition(async () => {
      await modererAnnonce(annonce.id, action)
      onAction()
    })
  }

  const allPhotos = Array.isArray(annonce.photos) ? annonce.photos : []
  const photo = allPhotos[0] ?? null

  return (
    <div className={`admin-annonce-row${pending ? ' admin-annonce-row--loading' : ''}`}>
      <div className="admin-annonce-thumb">
        {photo
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={photo} alt="" className="admin-annonce-img" />
          : <div className="admin-annonce-img admin-annonce-img--vide" />
        }
      </div>
      <div className="admin-annonce-info">
        <p className="admin-annonce-titre">{annonce.titre}</p>
        <p className="admin-annonce-meta">
          {annonce.categorie_slug} · {annonce.ville || 'Dakar'} · {formatPrix(annonce.prix)}
        </p>
        <p className="admin-annonce-meta">
          {annonce.auteur_nom || '—'} · {annonce.auteur_email || '—'} · {annonce.contact_tel}
        </p>
        <p className="admin-annonce-date">{formatDate(annonce.created_at)}</p>
        <button
          type="button"
          className="admin-annonce-voir-btn"
          onClick={() => setExpanded(e => !e)}
        >
          {expanded ? '▲ Masquer détails' : '▼ Voir détails'}
        </button>
        {expanded && (
          <div className="admin-annonce-details">
            {annonce.description ? (
              <p className="admin-annonce-desc">{annonce.description}</p>
            ) : (
              <p className="admin-annonce-no-detail">Aucune description.</p>
            )}
            {allPhotos.length > 0 && (
              <div className="admin-annonce-photos">
                {allPhotos.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <a key={i} href={src} target="_blank" rel="noreferrer">
                    <img src={src} alt={`Photo ${i + 1}`} className="admin-annonce-photo-thumb" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="admin-annonce-statut-col">
        <StatutBadge annonce={annonce} />
        {annonce.payee && <span className="admin-annonce-payee">Payée</span>}
      </div>
      <div className="admin-annonce-actions">
        {!annonce.actif && !annonce.rejete && (
          <>
            <button
              onClick={() => handleAction('approuver')}
              disabled={pending}
              className="admin-btn admin-btn--approuver"
            >
              Approuver
            </button>
            <button
              onClick={() => handleAction('rejeter')}
              disabled={pending}
              className="admin-btn admin-btn--rejeter"
            >
              Rejeter
            </button>
          </>
        )}
        {annonce.actif && (
          <button
            onClick={() => handleAction('rejeter')}
            disabled={pending}
            className="admin-btn admin-btn--rejeter"
          >
            Désactiver
          </button>
        )}
        {!annonce.actif && annonce.rejete && (
          <button
            onClick={() => handleAction('approuver')}
            disabled={pending}
            className="admin-btn admin-btn--approuver"
          >
            Réactiver
          </button>
        )}
      </div>
    </div>
  )
}

export default function AdminAnnoncesClient({
  annonces: initial,
}: {
  annonces: Annonce[]
}) {
  // Local state mirrors the list; after actions we reload to get fresh data
  const [, startTransition] = useTransition()

  function refresh() {
    startTransition(() => {
      window.location.reload()
    })
  }

  const enAttente = initial.filter(a => !a.actif && !a.rejete)
  const actives   = initial.filter(a => a.actif)
  const rejetees  = initial.filter(a => a.rejete)

  const sections = [
    { titre: 'En attente', items: enAttente, accent: 'orange' },
    { titre: 'Actives',    items: actives,   accent: 'green'  },
    { titre: 'Rejetées',   items: rejetees,  accent: 'red'    },
  ]

  return (
    <div className="admin-annonces-sections">
      {sections.map(s => (
        s.items.length === 0 ? null : (
          <section key={s.titre} className="admin-annonces-section">
            <h2 className={`admin-section-titre admin-section-titre--${s.accent}`}>
              {s.titre}
              <span className="admin-section-count">{s.items.length}</span>
            </h2>
            <div className="admin-annonces-list">
              {s.items.map(a => (
                <AnnonceRow key={a.id} annonce={a} onAction={refresh} />
              ))}
            </div>
          </section>
        )
      ))}
      {initial.length === 0 && (
        <p className="admin-empty">Aucune annonce trouvée.</p>
      )}
    </div>
  )
}
