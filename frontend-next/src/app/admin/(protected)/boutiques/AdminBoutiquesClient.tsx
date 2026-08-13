'use client'

import { useState, useTransition } from 'react'
import { modererBoutique, activerSponsoringBoutique, supprimerBoutique, batchModererBoutiques, batchSupprimerBoutiques } from '@/app/actions/admin'
import { activerPlanTest } from '../abonnements/actions'
import BatchActionBar, { BatchActionConfig } from '@/components/admin/BatchActionBar'

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

function ModalGestionMarchand({ boutique, onClose, onRefresh }: { boutique: Boutique; onClose: () => void; onRefresh: () => void }) {
  const [pending, startTransition] = useTransition()
  const [planSelect, setPlanSelect] = useState<'pro' | 'business'>(boutique.plan_actif || 'pro')
  const [joursSelect, setJoursSelect] = useState<number>(30)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const sponsorActif = isSponsorActif(boutique)

  async function handleActiverPlan() {
    if (!boutique.proprietaire_email) {
      setMsg({ type: 'err', text: 'Email propriétaire manquant' })
      return
    }
    setMsg(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.append('email', boutique.proprietaire_email!)
      fd.append('plan', planSelect)
      fd.append('jours', String(joursSelect))

      const res = await activerPlanTest({}, fd)
      if (res.error) {
        setMsg({ type: 'err', text: res.error })
      } else {
        setMsg({ type: 'ok', text: res.info || 'Plan activé avec succès !' })
        setTimeout(() => {
          onRefresh()
          onClose()
        }, 1200)
      }
    })
  }

  function handleToggleSponsor() {
    startTransition(async () => {
      await activerSponsoringBoutique(boutique.id, !sponsorActif)
      onRefresh()
      onClose()
    })
  }

  function handleToggleActif() {
    startTransition(async () => {
      await modererBoutique(boutique.id, !boutique.actif)
      onRefresh()
      onClose()
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 540,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
        border: '1px solid #e2e8f0', fontFamily: 'system-ui, sans-serif'
      }}>
        {/* Header Modal */}
        <div style={{
          background: boutique.plan_actif === 'business' ? '#1e3a5f' : boutique.plan_actif === 'pro' ? '#C75B00' : '#0f172a',
          color: '#fff', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>🏪</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{boutique.nom}</h3>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.85 }}>
                👤 {boutique.proprietaire_nom || 'Propriétaire'} ({boutique.proprietaire_email || 'sans email'})
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
          {msg && (
            <div style={{
              padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 600,
              background: msg.type === 'ok' ? '#dcfce7' : '#fee2e2',
              color: msg.type === 'ok' ? '#166534' : '#991b1b'
            }}>
              {msg.text}
            </div>
          )}

          {/* Section Plan & Attribution */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              ⭐ Activation / Changement d&apos;Abonnement
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Formule :</label>
                <select
                  value={planSelect}
                  onChange={e => setPlanSelect(e.target.value as 'pro' | 'business')}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600 }}
                >
                  <option value="pro">🟠 Pro (5 000 FCFA/mois)</option>
                  <option value="business">🔵 Business (10 000 FCFA/mois)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Durée engagée :</label>
                <select
                  value={joursSelect}
                  onChange={e => setJoursSelect(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600 }}
                >
                  <option value={30}>1 Mois (30j)</option>
                  <option value={90}>3 Mois (90j — 10% reduc)</option>
                  <option value={180}>6 Mois (180j — 15% reduc)</option>
                  <option value={365}>1 An (365j — 25% reduc)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleActiverPlan}
              disabled={pending}
              style={{
                width: '100%', padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 800,
                background: planSelect === 'business' ? '#1e3a5f' : '#C75B00', color: '#fff',
                border: 'none', cursor: 'pointer', opacity: pending ? 0.7 : 1
              }}
            >
              {pending ? 'Activation en cours…' : `Accorder l'Abonnement ${planSelect.toUpperCase()}`}
            </button>
          </div>

          {/* Section Modération Rapide */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button
              onClick={handleToggleSponsor}
              disabled={pending}
              style={{
                padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 700, border: 'none',
                background: sponsorActif ? '#fee2e2' : '#fef3c7',
                color: sponsorActif ? '#991b1b' : '#92400e', cursor: 'pointer'
              }}
            >
              {sponsorActif ? '❌ Enlever Sponsoring' : '⭐ Mettre en Sponsoring'}
            </button>

            <button
              onClick={handleToggleActif}
              disabled={pending}
              style={{
                padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 700, border: 'none',
                background: boutique.actif ? '#fee2e2' : '#dcfce7',
                color: boutique.actif ? '#991b1b' : '#166534', cursor: 'pointer'
              }}
            >
              {boutique.actif ? '🔴 Désactiver Boutique' : '🟢 Réactiver Boutique'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function BoutiqueRow({
  boutique,
  isSelected,
  onToggleSelect,
  onAction,
  onOpenGestion
}: {
  boutique: Boutique
  isSelected: boolean
  onToggleSelect: () => void
  onAction: () => void
  onOpenGestion: (b: Boutique) => void
}) {
  const [pending, startTransition] = useTransition()
  const sponsorActif = isSponsorActif(boutique)

  function handleToggleActif() {
    startTransition(async () => {
      await modererBoutique(boutique.id, !boutique.actif)
      onAction()
    })
  }

  function handleSupprimer() {
    if (!window.confirm(`Supprimer définitivement la boutique "${boutique.nom}" ?`)) return
    startTransition(async () => {
      await supprimerBoutique(boutique.id)
      onAction()
    })
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      background: '#fff', border: '1px solid var(--border)',
      borderLeft: boutique.plan_actif === 'business' ? '4px solid #1e3a5f'
                : boutique.plan_actif === 'pro'      ? '4px solid #C75B00'
                : sponsorActif                        ? '4px solid #D97706'
                : '4px solid var(--border)',
      borderRadius: 10, padding: '12px 16px',
      opacity: pending ? 0.5 : 1,
      transition: 'opacity .2s',
    }}>
      {/* Checkbox */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }}
        />
      </div>

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
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>
        <button
          onClick={() => onOpenGestion(boutique)}
          style={{
            background: '#1e3a5f', color: '#fff', border: 'none',
            borderRadius: 6, fontSize: 11, padding: '6px 10px', fontWeight: 700, cursor: 'pointer'
          }}
        >
          ⚙️ Gérer le marchand
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
          <button
            onClick={handleSupprimer}
            disabled={pending}
            className="admin-btn admin-btn--rejeter"
            style={{ fontSize: 11, background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminBoutiquesClient({ boutiques }: { boutiques: Boutique[] }) {
  const [, startTransition] = useTransition()
  const [selectedBoutique, setSelectedBoutique] = useState<Boutique | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loadingBatch, setLoadingBatch] = useState(false)

  function refresh() {
    startTransition(() => { window.location.reload() })
  }

  const allIds = boutiques.map(b => b.id)
  const allSelected = allIds.length > 0 && selectedIds.length === allIds.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(allIds)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleBatchActiver = async () => {
    setLoadingBatch(true)
    try {
      await batchModererBoutiques(selectedIds, true)
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const handleBatchDesactiver = async () => {
    setLoadingBatch(true)
    try {
      await batchModererBoutiques(selectedIds, false)
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const handleBatchSupprimer = async () => {
    setLoadingBatch(true)
    try {
      await batchSupprimerBoutiques(selectedIds)
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const batchActions: BatchActionConfig[] = [
    {
      key: 'activer',
      label: 'Activer les boutiques',
      icon: '🟢',
      color: 'green',
      onClick: handleBatchActiver,
    },
    {
      key: 'desactiver',
      label: 'Désactiver les boutiques',
      icon: '🔴',
      color: 'amber',
      onClick: handleBatchDesactiver,
    },
    {
      key: 'supprimer',
      label: 'Supprimer définitivement',
      icon: '🗑️',
      color: 'red',
      confirmMsg: 'Êtes-vous sûr de vouloir supprimer définitivement ces boutiques ?',
      onClick: handleBatchSupprimer,
    },
  ]

  const abonnees   = boutiques.filter(b => b.plan_actif)
  const sponsorisees = boutiques.filter(b => !b.plan_actif && isSponsorActif(b))
  const autres       = boutiques.filter(b => !b.plan_actif && !isSponsorActif(b))

  if (boutiques.length === 0) {
    return <p className="admin-empty">Aucune boutique enregistrée.</p>
  }

  return (
    <div className="admin-annonces-sections">
      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={boutiques.length}
        allSelected={allSelected}
        onToggleSelectAll={toggleSelectAll}
        onClearSelection={() => setSelectedIds([])}
        actions={batchActions}
        loading={loadingBatch}
        itemLabel="boutique(s)"
      />

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
              <BoutiqueRow
                key={b.id}
                boutique={b}
                isSelected={selectedIds.includes(b.id)}
                onToggleSelect={() => toggleSelect(b.id)}
                onAction={refresh}
                onOpenGestion={setSelectedBoutique}
              />
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
              <BoutiqueRow
                key={b.id}
                boutique={b}
                isSelected={selectedIds.includes(b.id)}
                onToggleSelect={() => toggleSelect(b.id)}
                onAction={refresh}
                onOpenGestion={setSelectedBoutique}
              />
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
            <BoutiqueRow
              key={b.id}
              boutique={b}
              isSelected={selectedIds.includes(b.id)}
              onToggleSelect={() => toggleSelect(b.id)}
              onAction={refresh}
              onOpenGestion={setSelectedBoutique}
            />
          ))}
        </div>
      </section>

      {selectedBoutique && (
        <ModalGestionMarchand
          boutique={selectedBoutique}
          onClose={() => setSelectedBoutique(null)}
          onRefresh={refresh}
        />
      )}
    </div>
  )
}
