'use client'

import { useState, useTransition } from 'react'
import { modererPartenaire } from '@/app/actions/admin'

interface Partenaire {
  id: string
  nom_entreprise: string
  secteur: string | null
  contact_nom: string | null
  contact_tel: string | null
  email: string | null
  description: string | null
  statut: string
  created_at: string
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('fr-SN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function PartenaireRow({ demande, onAction }: { demande: Partenaire; onAction: () => void }) {
  const [pending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)

  function handleAction(statut: 'approuve' | 'rejete') {
    startTransition(async () => {
      await modererPartenaire(demande.id, statut)
      onAction()
    })
  }

  return (
    <div className={`admin-annonce-row${pending ? ' admin-annonce-row--loading' : ''}`}>
      <div className="admin-annonce-thumb">
        <div className="admin-annonce-img admin-annonce-img--vide" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
          🤝
        </div>
      </div>
      <div className="admin-annonce-info">
        <p className="admin-annonce-titre">{demande.nom_entreprise}</p>
        <p className="admin-annonce-meta">
          {demande.secteur || 'Secteur non précisé'}
          {demande.contact_nom ? ` · ${demande.contact_nom}` : ''}
          {demande.contact_tel ? ` · ${demande.contact_tel}` : ''}
        </p>
        {demande.email && (
          <p className="admin-annonce-meta">
            <a href={`mailto:${demande.email}`} style={{ color: 'var(--accent)' }}>{demande.email}</a>
          </p>
        )}
        <p className="admin-annonce-date">{formatDate(demande.created_at)}</p>
        {demande.description && (
          <>
            <button
              type="button"
              className="admin-annonce-voir-btn"
              onClick={() => setExpanded(e => !e)}
            >
              {expanded ? '▲ Masquer' : '▼ Voir description'}
            </button>
            {expanded && (
              <div className="admin-annonce-details">
                <p className="admin-annonce-desc">{demande.description}</p>
              </div>
            )}
          </>
        )}
      </div>
      <div className="admin-annonce-statut-col">
        <span className="admin-annonce-statut admin-annonce-statut--attente">En attente</span>
      </div>
      <div className="admin-annonce-actions">
        <button
          onClick={() => handleAction('approuve')}
          disabled={pending}
          className="admin-btn admin-btn--approuver"
        >
          Approuver
        </button>
        <button
          onClick={() => handleAction('rejete')}
          disabled={pending}
          className="admin-btn admin-btn--rejeter"
        >
          Rejeter
        </button>
      </div>
    </div>
  )
}

export default function AdminPartenairesClient({ demandes }: { demandes: Partenaire[] }) {
  const [, startTransition] = useTransition()

  function refresh() {
    startTransition(() => { window.location.reload() })
  }

  if (demandes.length === 0) {
    return <p className="admin-empty">Aucune demande de partenariat en attente. ✓</p>
  }

  return (
    <div className="admin-annonces-sections">
      <section className="admin-annonces-section">
        <h2 className="admin-section-titre admin-section-titre--orange">
          Demandes à traiter
          <span className="admin-section-count">{demandes.length}</span>
        </h2>
        <div className="admin-annonces-list">
          {demandes.map(d => (
            <PartenaireRow key={d.id} demande={d} onAction={refresh} />
          ))}
        </div>
      </section>
    </div>
  )
}
