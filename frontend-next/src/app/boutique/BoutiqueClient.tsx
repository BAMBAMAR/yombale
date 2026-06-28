'use client'
import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { createBoutique, updateBoutique, deleteBoutique } from './actions'
import { initierWaveBoutiqueSponsoring } from '@/app/actions/paiement'
import type { ActionState } from '@/lib/backend-fetch'

const CATEGORIES = [
  { value: 'smartphones',  label: 'Smartphones' },
  { value: 'informatique', label: 'Informatique' },
  { value: 'tv-electro',   label: 'TV & Électro' },
  { value: 'mode',         label: 'Mode' },
  { value: 'maison',       label: 'Maison' },
  { value: 'auto-moto',    label: 'Auto & Moto' },
  { value: 'jeux',         label: 'Jeux' },
  { value: 'services',     label: 'Services' },
  { value: 'alimentation', label: 'Alimentation' },
  { value: 'beaute',       label: 'Beauté' },
  { value: 'autre',        label: 'Autre' },
]

interface Boutique {
  id: string
  nom: string
  description: string | null
  categorie: string | null
  telephone: string | null
  adresse: string | null
  ville: string
  logo_url: string | null
  actif: boolean
  sponsorise: boolean | null
  sponsor_jusqu_au: string | null
  created_at: string
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        padding: '10px 24px', background: pending ? '#94a3b8' : 'var(--blue2)',
        color: '#fff', border: 'none', borderRadius: '8px',
        fontSize: '14px', fontWeight: 700, cursor: pending ? 'not-allowed' : 'pointer',
      }}
    >
      {pending ? 'En cours…' : label}
    </button>
  )
}

function BoutiqueForm({
  boutique,
  onCancel,
  onSuccess,
}: {
  boutique?: Boutique
  onCancel: () => void
  onSuccess: () => void
}) {
  const action = boutique
    ? updateBoutique.bind(null, boutique.id)
    : createBoutique

  const [state, formAction] = useFormState<ActionState, FormData>(action, {})

  useEffect(() => {
    if (state.success) onSuccess()
  }, [state.success])

  const inputStyle = {
    padding: '10px 14px', border: '1px solid var(--border)',
    borderRadius: '8px', fontSize: '14px', width: '100%',
    background: '#fff', boxSizing: 'border-box' as const,
  }
  const labelStyle = { fontSize: '13px', fontWeight: 600 as const, color: 'var(--text2)', display: 'block' as const, marginBottom: '4px' }

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '18px', margin: 0 }}>
        {boutique ? 'Modifier la boutique' : 'Créer une boutique'}
      </h2>

      {state.error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: 'var(--red)', fontSize: '14px' }}>
          {state.error}
        </div>
      )}

      <div>
        <label style={labelStyle} htmlFor="nom">Nom de la boutique *</label>
        <input id="nom" name="nom" required maxLength={200} defaultValue={boutique?.nom} style={inputStyle} placeholder="Ex: Tech Dakar" />
      </div>

      <div>
        <label style={labelStyle} htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={3} defaultValue={boutique?.description ?? ''} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Décrivez votre boutique…" />
      </div>

      <div>
        <label style={labelStyle} htmlFor="categorie">Catégorie</label>
        <select id="categorie" name="categorie" defaultValue={boutique?.categorie ?? ''} style={inputStyle}>
          <option value="">— Sélectionner —</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle} htmlFor="telephone">Téléphone</label>
          <input id="telephone" name="telephone" type="tel" defaultValue={boutique?.telephone ?? ''} style={inputStyle} placeholder="77 000 00 00" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="ville">Ville</label>
          <input id="ville" name="ville" defaultValue={boutique?.ville ?? 'Dakar'} style={inputStyle} placeholder="Dakar" />
        </div>
      </div>

      <div>
        <label style={labelStyle} htmlFor="adresse">Adresse</label>
        <input id="adresse" name="adresse" defaultValue={boutique?.adresse ?? ''} style={inputStyle} placeholder="Ex: Avenue Cheikh Anta Diop" />
      </div>

      <div>
        <label style={labelStyle} htmlFor="logo">Logo (image, max 5 Mo)</label>
        <input id="logo" name="logo" type="file" accept="image/*" style={{ fontSize: '14px' }} />
        {boutique?.logo_url && (
          <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>
            Logo actuel conservé si aucun nouveau fichier sélectionné.
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <SubmitButton label={boutique ? 'Enregistrer' : 'Créer la boutique'} />
        <button
          type="button"
          onClick={onCancel}
          style={{ padding: '10px 20px', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
        >
          Annuler
        </button>
      </div>
    </form>
  )
}

function BoutiqueCard({
  boutique,
  onEdit,
  onDelete,
  onSponsoring,
}: {
  boutique: Boutique
  onEdit: () => void
  onDelete: () => void
  onSponsoring: () => void
}) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '20px',
      boxShadow: 'var(--shadow)', display: 'flex', gap: '16px', alignItems: 'flex-start',
    }}>
      {boutique.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={boutique.logo_url}
          alt={boutique.nom}
          style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
        />
      ) : (
        <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>
          🏪
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '15px', margin: 0 }}>
            {boutique.nom}
          </p>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {boutique.sponsorise && boutique.sponsor_jusqu_au && new Date(boutique.sponsor_jusqu_au) > new Date() && (
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', color: '#92400E', background: '#FEF3C7' }}>
                ⭐ En avant
              </span>
            )}
            <span style={{
              fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
              color: boutique.actif ? 'var(--green)' : 'var(--text3)',
              background: boutique.actif ? 'var(--green2)' : '#f1f5f9',
            }}>
              {boutique.actif ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        {boutique.description && (
          <p style={{ fontSize: '13px', color: 'var(--text2)', margin: '4px 0' }}>{boutique.description}</p>
        )}
        <p style={{ fontSize: '12px', color: 'var(--text3)', margin: '4px 0 12px' }}>
          {[boutique.categorie, boutique.ville, boutique.telephone].filter(Boolean).join(' · ')}
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={onEdit}
            style={{ fontSize: '13px', color: 'var(--blue2)', background: 'var(--blue3)', border: 'none', borderRadius: '6px', padding: '5px 14px', cursor: 'pointer', fontWeight: 600 }}
          >
            Modifier
          </button>
          <Link
            href="/boutique/analytics"
            style={{ fontSize: '13px', color: '#16a34a', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', padding: '5px 14px', fontWeight: 600, textDecoration: 'none' }}
          >
            📊 Analytics
          </Link>
          <button
            onClick={onSponsoring}
            style={{ fontSize: '13px', color: '#92400E', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '6px', padding: '5px 14px', cursor: 'pointer', fontWeight: 600 }}
          >
            ⭐ Mettre en avant
          </button>
          <button
            onClick={onDelete}
            style={{ fontSize: '13px', color: 'var(--red)', background: 'none', border: '1px solid #fecaca', borderRadius: '6px', padding: '5px 14px', cursor: 'pointer' }}
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BoutiqueClient({
  boutiques,
  canCreate,
}: {
  boutiques: Boutique[]
  canCreate: boolean
}) {
  // mode: 'list' | 'create' | { editing: Boutique }
  type Mode = 'list' | 'create' | { editing: Boutique }
  const [mode, setMode] = useState<Mode>('list')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const router = useRouter()

  const [successMsg, setSuccessMsg]     = useState<string | null>(null)
  const [sponsorError, setSponsorError] = useState<string | null>(null)
  const [, startSponsoring]             = useTransition()

  async function handleSponsoring(boutiqueId: string) {
    setSponsorError(null)
    startSponsoring(async () => {
      const res = await initierWaveBoutiqueSponsoring(boutiqueId)
      if (res.ok && res.url) {
        window.location.href = res.url
      } else {
        setSponsorError(res.error ?? 'Impossible d\'initialiser le paiement.')
      }
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette boutique définitivement ?')) return
    setDeleteError(null)
    const result = await deleteBoutique(id)
    if (result.error) {
      setDeleteError(result.error)
    } else {
      setSuccessMsg('Boutique supprimée.')
      router.refresh()
    }
  }

  function handleSuccess() {
    const isEdit = typeof mode === 'object' && 'editing' in mode
    setSuccessMsg(isEdit ? '✅ Boutique modifiée !' : '✅ Boutique créée !')
    setMode('list')
    router.refresh()
  }

  if (mode === 'create' || (typeof mode === 'object' && 'editing' in mode)) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
        <BoutiqueForm
          boutique={typeof mode === 'object' ? mode.editing : undefined}
          onCancel={() => setMode('list')}
          onSuccess={handleSuccess}
        />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '22px', margin: 0 }}>Ma boutique</h1>
          <p style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '4px' }}>
            {boutiques.length}/3 boutiques
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setMode('create')}
            style={{ padding: '9px 18px', background: 'var(--blue2)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
          >
            + Créer une boutique
          </button>
        )}
      </div>

      {successMsg && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', color: 'var(--green)', fontSize: '14px', marginBottom: '16px', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}
      {deleteError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: 'var(--red)', fontSize: '14px', marginBottom: '16px' }}>
          {deleteError}
        </div>
      )}
      {sponsorError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: 'var(--red)', fontSize: '14px', marginBottom: '16px' }}>
          ❌ {sponsorError}
        </div>
      )}

      {/* Bannière abonnement */}
      <Link href="/boutique/abonnement" style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'linear-gradient(135deg, #fff8f0, #fff3e0)',
        border: '1px solid #f59e0b', borderRadius: 12,
        padding: '14px 18px', marginBottom: 20, textDecoration: 'none',
      }}>
        <span style={{ fontSize: 28 }}>⭐</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#92400e' }}>Passer en Boutique Pro</p>
          <p style={{ margin: 0, fontSize: 12, color: '#b45309' }}>Placement prioritaire · Analytics · 5 annonces incluses — 15 000 FCFA/mois</p>
        </div>
        <span style={{ color: '#C75B00', fontWeight: 700, fontSize: 13 }}>Voir →</span>
      </Link>

      {boutiques.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)' }}>
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>🏪</p>
          <p style={{ fontSize: '15px', marginBottom: '16px' }}>Vous n&apos;avez pas encore de boutique.</p>
          <button
            onClick={() => setMode('create')}
            style={{ padding: '10px 24px', background: 'var(--blue2)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
          >
            Créer ma boutique
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {boutiques.map((b) => (
            <BoutiqueCard
              key={b.id}
              boutique={b}
              onEdit={() => setMode({ editing: b })}
              onDelete={() => handleDelete(b.id)}
              onSponsoring={() => handleSponsoring(b.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
