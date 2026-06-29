'use client'

import React, { useTransition } from 'react'
import { modererImmo, activerSponsoring } from '@/app/actions/admin'

interface AnnonceImmo {
  id: number
  titre: string
  type_bien: string | null
  transaction: string
  prix: number | null
  ville: string | null
  quartier: string | null
  surface_m2: number | null
  nb_pieces: number | null
  contact_tel: string
  contact_nom: string | null
  actif: boolean
  source: string
  demande_sponsorisation?: boolean
  created_at: string
  photo_url: string | null
}

function formatPrix(p: number | null) {
  if (!p) return '—'
  return new Intl.NumberFormat('fr-SN').format(p) + ' FCFA'
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('fr-SN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function ImmoRow({ annonce, onAction }: { annonce: AnnonceImmo; onAction: () => void }) {
  const [pending, startTransition] = useTransition()
  const [showRejet, setShowRejet] = React.useState(false)
  const [motif, setMotif] = React.useState('')

  function handleValider() {
    startTransition(async () => {
      await modererImmo(annonce.id, true)
      onAction()
    })
  }

  function handleRejeter() {
    if (!motif.trim()) return
    startTransition(async () => {
      await modererImmo(annonce.id, false, motif.trim())
      onAction()
    })
  }

  function handleDesactiver() {
    startTransition(async () => {
      await modererImmo(annonce.id, false)
      onAction()
    })
  }

  return (
    <div className={`admin-annonce-row${pending ? ' admin-annonce-row--loading' : ''}`}>
      <div className="admin-annonce-thumb">
        {annonce.photo_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={annonce.photo_url} alt="" className="admin-annonce-img" />
          : <div className="admin-annonce-img admin-annonce-img--vide" />
        }
      </div>
      <div className="admin-annonce-info">
        <p className="admin-annonce-titre">{annonce.titre}</p>
        <p className="admin-annonce-meta">
          {annonce.type_bien || '—'} · {annonce.transaction} · {annonce.ville || 'Dakar'}
          {annonce.surface_m2 ? ` · ${annonce.surface_m2} m²` : ''}
          {annonce.nb_pieces ? ` · ${annonce.nb_pieces} pièces` : ''}
        </p>
        <p className="admin-annonce-meta">
          {formatPrix(annonce.prix)} · {annonce.contact_tel} · source: {annonce.source}
        </p>
        <p className="admin-annonce-date">{formatDate(annonce.created_at)}</p>

        {showRejet && (
          <div style={{ marginTop: 8 }}>
            <textarea
              value={motif}
              onChange={e => setMotif(e.target.value)}
              placeholder="Motif de rejet (obligatoire)…"
              rows={2}
              style={{
                width: '100%', padding: '6px 10px', borderRadius: 6,
                border: '1px solid #fca5a5', fontSize: 13, resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <button
                onClick={handleRejeter}
                disabled={pending || !motif.trim()}
                className="admin-btn admin-btn--rejeter"
              >
                {pending ? '…' : 'Confirmer le rejet'}
              </button>
              <button
                onClick={() => { setShowRejet(false); setMotif('') }}
                disabled={pending}
                className="admin-btn"
                style={{ background: '#f1f5f9', color: '#374151' }}
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="admin-annonce-statut-col">
        <span className={`admin-annonce-statut admin-annonce-statut--${annonce.actif ? 'active' : 'attente'}`}>
          {annonce.actif ? 'Active' : 'En attente'}
        </span>
      </div>
      <div className="admin-annonce-actions">
        {!annonce.actif && !showRejet && (
          <>
            <button
              onClick={handleValider}
              disabled={pending}
              className="admin-btn admin-btn--approuver"
            >
              Valider
            </button>
            <button
              onClick={() => setShowRejet(true)}
              disabled={pending}
              className="admin-btn admin-btn--rejeter"
            >
              Rejeter
            </button>
          </>
        )}
        {annonce.actif && (
          <button
            onClick={handleDesactiver}
            disabled={pending}
            className="admin-btn admin-btn--rejeter"
          >
            Désactiver
          </button>
        )}
      </div>
    </div>
  )
}

function SponsoringRow({ annonce, onAction }: { annonce: AnnonceImmo; onAction: () => void }) {
  const [pending, startTransition] = useTransition()

  function handleActiver() {
    startTransition(async () => {
      await activerSponsoring(annonce.id)
      onAction()
    })
  }

  return (
    <div className={`admin-annonce-row${pending ? ' admin-annonce-row--loading' : ''}`}>
      <div className="admin-annonce-thumb">
        {annonce.photo_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={annonce.photo_url} alt="" className="admin-annonce-img" />
          : <div className="admin-annonce-img admin-annonce-img--vide" />
        }
      </div>
      <div className="admin-annonce-info">
        <p className="admin-annonce-titre">{annonce.titre}</p>
        <p className="admin-annonce-meta">
          {annonce.type_bien || '—'} · {annonce.ville || 'Dakar'}
          {annonce.prix ? ` · ${formatPrix(annonce.prix)}` : ''}
        </p>
        <p className="admin-annonce-meta">{annonce.contact_nom || '—'} · {annonce.contact_tel}</p>
        <p className="admin-annonce-date">Demande: {formatDate(annonce.created_at)}</p>
      </div>
      <div className="admin-annonce-actions">
        <button
          onClick={handleActiver}
          disabled={pending}
          className="admin-btn admin-btn--approuver"
        >
          {pending ? '…' : 'Activer 30 jours'}
        </button>
      </div>
    </div>
  )
}

export default function AdminImmoClient({
  annonces: initial,
  demandesSponsoring: initialSponsoring,
}: {
  annonces: AnnonceImmo[]
  demandesSponsoring: AnnonceImmo[]
}) {
  const [, startTransition] = useTransition()

  function refresh() {
    startTransition(() => { window.location.reload() })
  }

  return (
    <div className="admin-annonces-sections">
      {initialSponsoring.length > 0 && (
        <section className="admin-annonces-section" style={{ marginBottom: 32 }}>
          <h2 className="admin-section-titre" style={{ color: '#D97706' }}>
            Demandes de sponsoring
            <span className="admin-section-count">{initialSponsoring.length}</span>
          </h2>
          <div className="admin-annonces-list">
            {initialSponsoring.map(a => (
              <SponsoringRow key={a.id} annonce={a} onAction={refresh} />
            ))}
          </div>
        </section>
      )}

      {initial.length === 0 ? (
        <p className="admin-empty">Aucune annonce immo en attente.</p>
      ) : (
        <section className="admin-annonces-section">
          <h2 className="admin-section-titre admin-section-titre--orange">
            En attente de validation
            <span className="admin-section-count">{initial.length}</span>
          </h2>
          <div className="admin-annonces-list">
            {initial.map(a => (
              <ImmoRow key={a.id} annonce={a} onAction={refresh} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
