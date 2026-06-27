'use client'

import { useTransition } from 'react'
import { modererBoutique } from '@/app/actions/admin'

interface Boutique {
  id: string
  nom: string
  description: string | null
  categorie: string | null
  telephone: string | null
  adresse: string | null
  ville: string | null
  logo_url: string | null
  actif: boolean
  created_at: string
  proprietaire_nom: string | null
  proprietaire_email: string | null
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('fr-SN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function BoutiqueRow({ boutique, onAction }: { boutique: Boutique; onAction: () => void }) {
  const [pending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      await modererBoutique(boutique.id, !boutique.actif)
      onAction()
    })
  }

  return (
    <div className={`admin-annonce-row${pending ? ' admin-annonce-row--loading' : ''}`}>
      <div className="admin-annonce-thumb">
        {boutique.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={boutique.logo_url} alt="" className="admin-annonce-img" style={{ objectFit: 'contain' }} />
        ) : (
          <div className="admin-annonce-img admin-annonce-img--vide" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            🏪
          </div>
        )}
      </div>
      <div className="admin-annonce-info">
        <p className="admin-annonce-titre">
          {boutique.nom}
          {boutique.categorie && <span style={{ fontWeight: 400, color: 'var(--text2)', marginLeft: 6, fontSize: 12 }}>· {boutique.categorie}</span>}
        </p>
        <p className="admin-annonce-meta">
          {[boutique.adresse, boutique.ville].filter(Boolean).join(', ') || 'Dakar'}
          {boutique.telephone ? ` · ${boutique.telephone}` : ''}
        </p>
        <p className="admin-annonce-meta">
          {boutique.proprietaire_nom || '—'} · {boutique.proprietaire_email || '—'}
        </p>
        <p className="admin-annonce-date">{formatDate(boutique.created_at)}</p>
        {boutique.description && (
          <p className="admin-annonce-desc" style={{ marginTop: 4, fontSize: 12, color: 'var(--text2)' }}>
            {boutique.description.slice(0, 120)}{boutique.description.length > 120 ? '…' : ''}
          </p>
        )}
      </div>
      <div className="admin-annonce-statut-col">
        <span className={`admin-annonce-statut admin-annonce-statut--${boutique.actif ? 'active' : 'attente'}`}>
          {boutique.actif ? 'Active' : 'Désactivée'}
        </span>
      </div>
      <div className="admin-annonce-actions">
        <a
          href={`/boutiques/${boutique.id}`}
          target="_blank"
          rel="noreferrer"
          className="admin-btn"
          style={{ background: 'var(--bg)', color: 'var(--navy)', border: '1.5px solid var(--border)', textDecoration: 'none', fontSize: 12 }}
        >
          Voir ↗
        </a>
        <button
          onClick={handleToggle}
          disabled={pending}
          className={`admin-btn ${boutique.actif ? 'admin-btn--rejeter' : 'admin-btn--approuver'}`}
        >
          {pending ? '…' : boutique.actif ? 'Désactiver' : 'Réactiver'}
        </button>
      </div>
    </div>
  )
}

export default function AdminBoutiquesClient({ boutiques }: { boutiques: Boutique[] }) {
  const [, startTransition] = useTransition()

  function refresh() {
    startTransition(() => { window.location.reload() })
  }

  const actives    = boutiques.filter(b => b.actif)
  const inactives  = boutiques.filter(b => !b.actif)

  if (boutiques.length === 0) {
    return <p className="admin-empty">Aucune boutique enregistrée.</p>
  }

  return (
    <div className="admin-annonces-sections">
      {inactives.length > 0 && (
        <section className="admin-annonces-section" style={{ marginBottom: 32 }}>
          <h2 className="admin-section-titre admin-section-titre--orange">
            Désactivées
            <span className="admin-section-count">{inactives.length}</span>
          </h2>
          <div className="admin-annonces-list">
            {inactives.map(b => (
              <BoutiqueRow key={b.id} boutique={b} onAction={refresh} />
            ))}
          </div>
        </section>
      )}
      <section className="admin-annonces-section">
        <h2 className="admin-section-titre">
          Boutiques actives
          <span className="admin-section-count">{actives.length}</span>
        </h2>
        <div className="admin-annonces-list">
          {actives.map(b => (
            <BoutiqueRow key={b.id} boutique={b} onAction={refresh} />
          ))}
        </div>
      </section>
    </div>
  )
}
