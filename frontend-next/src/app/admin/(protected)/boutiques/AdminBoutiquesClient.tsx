'use client'

import { useTransition } from 'react'
import { modererBoutique, activerSponsoringBoutique } from '@/app/actions/admin'

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
  sponsorise: boolean
  sponsor_jusqu_au: string | null
  created_at: string
  proprietaire_nom: string | null
  proprietaire_email: string | null
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('fr-SN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isSponsorActif(b: Boutique) {
  if (!b.sponsorise) return false
  if (!b.sponsor_jusqu_au) return true
  return new Date(b.sponsor_jusqu_au) > new Date()
}

function BoutiqueRow({ boutique, onAction }: { boutique: Boutique; onAction: () => void }) {
  const [pending, startTransition] = useTransition()
  const sponsorActif = isSponsorActif(boutique)

  function handleToggleActif() {
    startTransition(async () => {
      await modererBoutique(boutique.id, !boutique.actif)
      onAction()
    })
  }

  function handleToggleSponsor() {
    startTransition(async () => {
      await activerSponsoringBoutique(boutique.id, !sponsorActif)
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
          {sponsorActif && (
            <span style={{ marginLeft: 8, fontSize: 11, background: '#D97706', color: '#fff', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>
              ⭐ SPONSOR
            </span>
          )}
          {boutique.categorie && (
            <span style={{ fontWeight: 400, color: 'var(--text2)', marginLeft: 6, fontSize: 12 }}>· {boutique.categorie}</span>
          )}
        </p>
        <p className="admin-annonce-meta">
          {[boutique.adresse, boutique.ville].filter(Boolean).join(', ') || 'Dakar'}
          {boutique.telephone ? ` · ${boutique.telephone}` : ''}
        </p>
        <p className="admin-annonce-meta">
          {boutique.proprietaire_nom || '—'} · {boutique.proprietaire_email || '—'}
        </p>
        <p className="admin-annonce-date">
          Créée le {formatDate(boutique.created_at)}
          {sponsorActif && boutique.sponsor_jusqu_au && (
            <> · <span style={{ color: '#D97706', fontWeight: 600 }}>Sponsor jusqu&apos;au {formatDate(boutique.sponsor_jusqu_au)}</span></>
          )}
        </p>
      </div>
      <div className="admin-annonce-statut-col">
        <span className={`admin-annonce-statut admin-annonce-statut--${boutique.actif ? 'active' : 'attente'}`}>
          {boutique.actif ? 'Active' : 'Désactivée'}
        </span>
        {sponsorActif && (
          <span style={{ display: 'block', fontSize: 11, color: '#D97706', fontWeight: 600, marginTop: 4 }}>⭐ Sponsorisée</span>
        )}
      </div>
      <div className="admin-annonce-actions" style={{ gap: 6, flexDirection: 'column', alignItems: 'stretch' }}>
        <button
          onClick={handleToggleSponsor}
          disabled={pending}
          className="admin-btn"
          style={{
            background: sponsorActif ? '#fff8e1' : '#D97706',
            color: sponsorActif ? '#92400e' : '#fff',
            border: sponsorActif ? '1.5px solid #fcd34d' : 'none',
            fontSize: 12,
          }}
        >
          {pending ? '…' : sponsorActif ? '✕ Retirer sponsor' : '⭐ Sponsoriser 30j'}
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          <a
            href={`/boutiques/${boutique.id}`}
            target="_blank"
            rel="noreferrer"
            className="admin-btn"
            style={{ background: 'var(--bg)', color: 'var(--navy)', border: '1.5px solid var(--border)', textDecoration: 'none', fontSize: 11, flex: 1, textAlign: 'center' }}
          >
            Voir ↗
          </a>
          <button
            onClick={handleToggleActif}
            disabled={pending}
            className={`admin-btn ${boutique.actif ? 'admin-btn--rejeter' : 'admin-btn--approuver'}`}
            style={{ fontSize: 11, flex: 1 }}
          >
            {pending ? '…' : boutique.actif ? 'Désactiver' : 'Réactiver'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminBoutiquesClient({ boutiques }: { boutiques: Boutique[] }) {
  const [, startTransition] = useTransition()

  function refresh() {
    startTransition(() => { window.location.reload() })
  }

  const sponsorisees = boutiques.filter(b => isSponsorActif(b))
  const autres       = boutiques.filter(b => !isSponsorActif(b))

  if (boutiques.length === 0) {
    return <p className="admin-empty">Aucune boutique enregistrée.</p>
  }

  return (
    <div className="admin-annonces-sections">
      {sponsorisees.length > 0 && (
        <section className="admin-annonces-section" style={{ marginBottom: 32 }}>
          <h2 className="admin-section-titre" style={{ color: '#D97706' }}>
            ⭐ Boutiques sponsorisées
            <span className="admin-section-count">{sponsorisees.length}</span>
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
            Ces boutiques apparaissent en premier dans la liste publique.
          </p>
          <div className="admin-annonces-list">
            {sponsorisees.map(b => (
              <BoutiqueRow key={b.id} boutique={b} onAction={refresh} />
            ))}
          </div>
        </section>
      )}

      <section className="admin-annonces-section">
        <h2 className="admin-section-titre">
          Autres boutiques
          <span className="admin-section-count">{autres.length}</span>
        </h2>
        <div className="admin-annonces-list">
          {autres.map(b => (
            <BoutiqueRow key={b.id} boutique={b} onAction={refresh} />
          ))}
        </div>
      </section>
    </div>
  )
}
