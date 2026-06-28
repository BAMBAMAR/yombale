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
  plan_actif: 'pro' | 'business' | null
  plan_fin: string | null
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
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: '#fff', border: '1px solid var(--border)',
      borderLeft: boutique.plan_actif === 'business' ? '4px solid #1e3a5f'
                : boutique.plan_actif === 'pro'      ? '4px solid #C75B00'
                : sponsorActif                        ? '4px solid #D97706'
                : '4px solid var(--border)',
      borderRadius: 10, padding: '12px 16px',
      opacity: pending ? 0.5 : 1,
      transition: 'opacity .2s',
    }}>
      {/* Logo */}
      <div style={{ flexShrink: 0, width: 52, height: 52, borderRadius: 8, overflow: 'hidden', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {boutique.logo_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={boutique.logo_url} alt="" style={{ width: 52, height: 52, objectFit: 'cover' }} />
          : <span style={{ fontSize: 22 }}>🏪</span>
        }
      </div>

      {/* Infos */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{boutique.nom}</span>
          {boutique.plan_actif === 'business' && (
            <span style={{ fontSize: 10, background: '#1e3a5f', color: '#fff', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>💼 BUSINESS</span>
          )}
          {boutique.plan_actif === 'pro' && (
            <span style={{ fontSize: 10, background: '#C75B00', color: '#fff', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>⭐ PRO</span>
          )}
          {sponsorActif && (
            <span style={{ fontSize: 10, background: '#D97706', color: '#fff', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>SPONSOR</span>
          )}
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{boutique.categorie ?? ''}</span>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 1 }}>
          👤 {boutique.proprietaire_nom || '—'} · {boutique.proprietaire_email || '—'}
          {boutique.telephone ? ` · ${boutique.telephone}` : ''}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
          📍 {[boutique.adresse, boutique.ville].filter(Boolean).join(', ') || 'Dakar'}
          {' · '}Créée le {formatDate(boutique.created_at)}
          {boutique.plan_actif && boutique.plan_fin && (
            <span style={{ color: boutique.plan_actif === 'business' ? '#1e3a5f' : '#C75B00', fontWeight: 600 }}>
              {' · '}Plan jusqu&apos;au {formatDate(boutique.plan_fin)}
            </span>
          )}
          {sponsorActif && boutique.sponsor_jusqu_au && (
            <span style={{ color: '#D97706', fontWeight: 600 }}>
              {' · '}Sponsor jusqu&apos;au {formatDate(boutique.sponsor_jusqu_au)}
            </span>
          )}
        </div>
      </div>

      {/* Statut */}
      <div style={{ flexShrink: 0 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
          background: boutique.actif ? '#dcfce7' : '#f1f5f9',
          color: boutique.actif ? '#16a34a' : '#94a3b8',
        }}>
          {boutique.actif ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Actions */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 130 }}>
        <button
          onClick={handleToggleSponsor}
          disabled={pending}
          className="admin-btn"
          style={{
            background: sponsorActif ? '#fffbeb' : '#D97706',
            color: sponsorActif ? '#92400e' : '#fff',
            border: sponsorActif ? '1px solid #fcd34d' : 'none',
            fontSize: 11, padding: '5px 10px',
          }}
        >
          {pending ? '…' : sponsorActif ? '✕ Retirer sponsor' : '⭐ Sponsoriser 30j'}
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          <a
            href={`/boutiques/${boutique.id}`}
            target="_blank" rel="noreferrer"
            className="admin-btn"
            style={{ fontSize: 11, flex: 1, textAlign: 'center', textDecoration: 'none', background: '#f8fafc', color: 'var(--navy)', border: '1px solid var(--border)' }}
          >
            Voir ↗
          </a>
          <button
            onClick={handleToggleActif}
            disabled={pending}
            className={`admin-btn ${boutique.actif ? 'admin-btn--rejeter' : 'admin-btn--approuver'}`}
            style={{ fontSize: 11, flex: 1 }}
          >
            {pending ? '…' : boutique.actif ? 'Désact.' : 'Réact.'}
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

  const abonnees   = boutiques.filter(b => b.plan_actif)
  const sponsorisees = boutiques.filter(b => !b.plan_actif && isSponsorActif(b))
  const autres       = boutiques.filter(b => !b.plan_actif && !isSponsorActif(b))

  if (boutiques.length === 0) {
    return <p className="admin-empty">Aucune boutique enregistrée.</p>
  }

  return (
    <div className="admin-annonces-sections">
      {abonnees.length > 0 && (
        <section className="admin-annonces-section" style={{ marginBottom: 32 }}>
          <h2 className="admin-section-titre" style={{ color: '#C75B00' }}>
            ⭐ Abonnés Pro / Business
            <span className="admin-section-count">{abonnees.length}</span>
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
            Boutiques avec abonnement actif — priorité maximale dans le listing.
          </p>
          <div className="admin-annonces-list">
            {abonnees.map(b => (
              <BoutiqueRow key={b.id} boutique={b} onAction={refresh} />
            ))}
          </div>
        </section>
      )}

      {sponsorisees.length > 0 && (
        <section className="admin-annonces-section" style={{ marginBottom: 32 }}>
          <h2 className="admin-section-titre" style={{ color: '#D97706' }}>
            ⭐ Boutiques sponsorisées
            <span className="admin-section-count">{sponsorisees.length}</span>
          </h2>
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
