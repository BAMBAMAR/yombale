'use client'
import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { createBoutique, updateBoutique, deleteBoutique, createProduit, updateProduit, deleteProduit } from './actions'
import { initierWaveBoutiqueSponsoring } from '@/app/actions/paiement'
import { fcfa } from '@/lib/format'
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
  whatsapp: string | null
  adresse: string | null
  ville: string
  logo_url: string | null
  cover_url: string | null
  site_web: string | null
  facebook: string | null
  instagram: string | null
  actif: boolean
  sponsorise: boolean | null
  sponsor_jusqu_au: string | null
  created_at: string
}

interface Produit {
  id: string
  nom: string
  description: string | null
  prix: number | null
  prix_barre: number | null
  images: string[]
  en_stock: boolean
}

// ── Helpers de style ──────────────────────────────────────────────────────────

const inputStyle = {
  padding: '10px 14px', border: '1px solid #d1d5db',
  borderRadius: 8, fontSize: 14, width: '100%',
  background: '#fff', boxSizing: 'border-box' as const,
}

const labelStyle = {
  fontSize: 13, fontWeight: 600 as const, color: '#374151',
  display: 'block' as const, marginBottom: 4,
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} style={{
      padding: '10px 24px', background: pending ? '#94a3b8' : '#1d4ed8',
      color: '#fff', border: 'none', borderRadius: 8,
      fontSize: 14, fontWeight: 700, cursor: pending ? 'not-allowed' : 'pointer',
    }}>
      {pending ? 'En cours…' : label}
    </button>
  )
}

// ── Formulaire boutique ───────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em', margin: '4px 0 0', borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>
      {children}
    </p>
  )
}

function BoutiqueForm({ boutique, onCancel, onSuccess }: {
  boutique?: Boutique
  onCancel: () => void
  onSuccess: () => void
}) {
  const action = boutique ? updateBoutique.bind(null, boutique.id) : createBoutique
  const [state, formAction] = useFormState<ActionState, FormData>(action, {})

  useEffect(() => { if (state.success) onSuccess() }, [state.success])

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, margin: 0 }}>
        {boutique ? 'Modifier la boutique' : 'Créer une boutique'}
      </h2>

      {state.error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 14 }}>
          {state.error}
        </div>
      )}

      <SectionTitle>📋 Informations</SectionTitle>

      <div>
        <label style={labelStyle}>Nom de la boutique *</label>
        <input name="nom" required maxLength={200} defaultValue={boutique?.nom} style={inputStyle} placeholder="Ex: Tech Dakar" />
      </div>
      <div>
        <label style={labelStyle}>Description</label>
        <textarea name="description" rows={3} defaultValue={boutique?.description ?? ''} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Décrivez votre boutique…" />
      </div>
      <div>
        <label style={labelStyle}>Catégorie</label>
        <select name="categorie" defaultValue={boutique?.categorie ?? ''} style={inputStyle}>
          <option value="">— Sélectionner —</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Adresse</label>
          <input name="adresse" defaultValue={boutique?.adresse ?? ''} style={inputStyle} placeholder="Av. Cheikh Anta Diop" />
        </div>
        <div>
          <label style={labelStyle}>Ville</label>
          <input name="ville" defaultValue={boutique?.ville ?? 'Dakar'} style={inputStyle} placeholder="Dakar" />
        </div>
      </div>

      <SectionTitle>📞 Contact</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Téléphone</label>
          <input name="telephone" type="tel" defaultValue={boutique?.telephone ?? ''} style={inputStyle} placeholder="77 000 00 00" />
        </div>
        <div>
          <label style={labelStyle}>WhatsApp</label>
          <input name="whatsapp" type="tel" defaultValue={boutique?.whatsapp ?? ''} style={inputStyle} placeholder="77 000 00 00" />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Site web</label>
        <input name="site_web" type="url" defaultValue={boutique?.site_web ?? ''} style={inputStyle} placeholder="https://votresite.com" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Page Facebook</label>
          <input name="facebook" type="url" defaultValue={boutique?.facebook ?? ''} style={inputStyle} placeholder="https://facebook.com/…" />
        </div>
        <div>
          <label style={labelStyle}>Instagram</label>
          <input name="instagram" type="url" defaultValue={boutique?.instagram ?? ''} style={inputStyle} placeholder="https://instagram.com/…" />
        </div>
      </div>

      <SectionTitle>🖼 Photos</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Logo (max 5 Mo)</label>
          <input name="logo" type="file" accept="image/*" style={{ fontSize: 13 }} />
          {boutique?.logo_url && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={boutique.logo_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }} />
              <span style={{ fontSize: 11, color: '#6b7280' }}>Logo actuel</span>
            </div>
          )}
        </div>
        <div>
          <label style={labelStyle}>Photo de couverture (max 5 Mo)</label>
          <input name="cover" type="file" accept="image/*" style={{ fontSize: 13 }} />
          {boutique?.cover_url && (
            <div style={{ marginTop: 6, borderRadius: 6, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={boutique.cover_url} alt="" style={{ width: '100%', height: 50, objectFit: 'cover' }} />
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
        <SubmitButton label={boutique ? 'Enregistrer' : 'Créer la boutique'} />
        <button type="button" onClick={onCancel} style={{
          padding: '10px 20px', background: 'none', border: '1px solid #d1d5db',
          borderRadius: 8, fontSize: 14, cursor: 'pointer',
        }}>
          Annuler
        </button>
      </div>
    </form>
  )
}

// ── Formulaire produit ────────────────────────────────────────────────────────

function ProduitForm({ boutiqueId, produit, onCancel, onSuccess }: {
  boutiqueId: string
  produit?: Produit
  onCancel: () => void
  onSuccess: () => void
}) {
  const action = produit
    ? updateProduit.bind(null, boutiqueId, produit.id)
    : createProduit.bind(null, boutiqueId)
  const [state, formAction] = useFormState<ActionState, FormData>(action, {})
  const [enStock, setEnStock] = useState(produit?.en_stock !== false)

  useEffect(() => { if (state.success) onSuccess() }, [state.success])

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, margin: 0 }}>
        {produit ? 'Modifier le produit' : 'Ajouter un produit'}
      </h3>

      {state.error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>
          {state.error}
        </div>
      )}

      <div>
        <label style={labelStyle}>Nom du produit *</label>
        <input name="nom" required maxLength={300} defaultValue={produit?.nom} style={inputStyle} placeholder="Ex: iPhone 14 Pro 256Go" />
      </div>
      <div>
        <label style={labelStyle}>Description</label>
        <textarea name="description" rows={2} defaultValue={produit?.description ?? ''} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Détails, état, caractéristiques…" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Prix (FCFA)</label>
          <input name="prix" type="number" min={0} defaultValue={produit?.prix ?? ''} style={inputStyle} placeholder="Ex: 350000" />
        </div>
        <div>
          <label style={labelStyle}>Prix barré (ancien prix)</label>
          <input name="prix_barre" type="number" min={0} defaultValue={produit?.prix_barre ?? ''} style={inputStyle} placeholder="Ex: 400000" />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Photo du produit (max 5 Mo)</label>
        <input name="image" type="file" accept="image/*" style={{ fontSize: 14 }} />
        {produit?.images?.[0] && (
          <div style={{ marginTop: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={produit.images[0]} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input type="hidden" name="en_stock" value={enStock ? 'true' : 'false'} />
        <button type="button" onClick={() => setEnStock(!enStock)} style={{
          width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
          background: enStock ? '#16a34a' : '#d1d5db', transition: 'background .2s', position: 'relative',
        }}>
          <span style={{
            position: 'absolute', top: 3, left: enStock ? 20 : 4,
            width: 16, height: 16, borderRadius: '50%', background: '#fff',
            transition: 'left .2s', display: 'block',
          }} />
        </button>
        <span style={{ fontSize: 13, color: '#374151' }}>
          {enStock ? '✅ En stock' : '❌ Rupture de stock'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <SubmitButton label={produit ? 'Enregistrer' : 'Ajouter le produit'} />
        <button type="button" onClick={onCancel} style={{
          padding: '10px 20px', background: 'none', border: '1px solid #d1d5db',
          borderRadius: 8, fontSize: 14, cursor: 'pointer',
        }}>
          Annuler
        </button>
      </div>
    </form>
  )
}

// ── Gestionnaire de catalogue produits ───────────────────────────────────────

function CatalogueProduits({ boutique, planActif }: { boutique: Boutique; planActif: 'pro' | 'business' | null }) {
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'list' | 'create' | { editing: Produit }>('list')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  async function loadProduits() {
    setLoading(true)
    try {
      const res = await fetch(`${backendUrl}/api/boutiques/${boutique.id}/produits`)
      const data = await res.json()
      setProduits(data.produits ?? [])
    } catch {
      setProduits([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProduits() }, [boutique.id])

  if (!planActif) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 20px', background: '#fffbeb', borderRadius: 12, border: '1px solid #fcd34d' }}>
        <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>⭐</span>
        <p style={{ fontWeight: 700, marginBottom: 6 }}>Catalogue disponible en Boutique Pro</p>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          Ajoutez vos produits avec photos et prix. Vos clients peuvent parcourir votre catalogue directement sur Nopalou.
        </p>
        <Link href="/boutique/abonnement" style={{
          display: 'inline-block', background: '#C75B00', color: '#fff',
          padding: '10px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 700,
        }}>
          Passer en Pro — 15 000 FCFA/mois
        </Link>
      </div>
    )
  }

  const quota = planActif === 'business' ? '∞' : '50'

  if (mode === 'create' || (typeof mode === 'object' && 'editing' in mode)) {
    return (
      <div style={{ maxWidth: 560 }}>
        <ProduitForm
          boutiqueId={boutique.id}
          produit={typeof mode === 'object' ? mode.editing : undefined}
          onCancel={() => setMode('list')}
          onSuccess={() => {
            setMode('list')
            setSuccessMsg(typeof mode === 'object' ? '✅ Produit modifié !' : '✅ Produit ajouté !')
            loadProduits()
          }}
        />
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
          {produits.length} produit{produits.length !== 1 ? 's' : ''} / {quota} max
        </p>
        <button
          onClick={() => setMode('create')}
          style={{
            background: '#C75B00', color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          + Ajouter un produit
        </button>
      </div>

      {successMsg && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', color: '#16a34a', fontSize: 14, marginBottom: 12, fontWeight: 600 }}>
          {successMsg}
        </div>
      )}
      {deleteError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 14, marginBottom: 12 }}>
          {deleteError}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Chargement…</p>
      ) : produits.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 20px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #d1d5db' }}>
          <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>📦</span>
          <p style={{ color: '#6b7280', margin: '0 0 16px' }}>Aucun produit dans votre catalogue.</p>
          <button
            onClick={() => setMode('create')}
            style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}
          >
            Ajouter mon premier produit
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {produits.map(p => (
            <div key={p.id} style={{
              display: 'flex', gap: 12, alignItems: 'center',
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px',
            }}>
              {/* Image */}
              <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {p.images?.[0]
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={p.images[0]} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 24 }}>📦</span>
                }
              </div>
              {/* Infos */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{p.nom}</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                  {p.prix && <span style={{ fontSize: 13, color: '#C75B00', fontWeight: 700 }}>{fcfa(p.prix)}</span>}
                  {p.prix_barre && <span style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through' }}>{fcfa(p.prix_barre)}</span>}
                  <span style={{
                    fontSize: 11, padding: '1px 6px', borderRadius: 20,
                    background: p.en_stock ? '#dcfce7' : '#fee2e2',
                    color: p.en_stock ? '#16a34a' : '#dc2626', fontWeight: 700,
                  }}>
                    {p.en_stock ? 'En stock' : 'Rupture'}
                  </span>
                </div>
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => setMode({ editing: p })}
                  style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Modifier
                </button>
                <button
                  onClick={() => {
                    if (!confirm('Supprimer ce produit ?')) return
                    setDeleteError(null)
                    startTransition(async () => {
                      const res = await deleteProduit(boutique.id, p.id)
                      if (res.error) setDeleteError(res.error)
                      else { setSuccessMsg('Produit supprimé.'); loadProduits() }
                    })
                  }}
                  style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Carte boutique (dans la liste) ───────────────────────────────────────────

function BoutiqueCard({ boutique, planActif, onEdit, onDelete, onSponsoring, onManage }: {
  boutique: Boutique
  planActif: 'pro' | 'business' | null
  onEdit: () => void
  onDelete: () => void
  onSponsoring: () => void
  onManage: () => void
}) {
  const sponsorActif = boutique.sponsorise && boutique.sponsor_jusqu_au && new Date(boutique.sponsor_jusqu_au) > new Date()

  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb',
      borderLeft: planActif === 'business' ? '4px solid #1e3a5f'
               : planActif === 'pro'      ? '4px solid #C75B00'
               : '4px solid #e5e7eb',
      borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)',
      display: 'flex', gap: 16, alignItems: 'flex-start',
    }}>
      {boutique.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={boutique.logo_url} alt={boutique.nom}
          style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
      ) : (
        <div style={{ width: 64, height: 64, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
          🏪
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15, margin: 0 }}>{boutique.nom}</p>
            {planActif === 'business' && (
              <span style={{ fontSize: 11, background: '#1e3a5f', color: '#fff', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>💼 Business</span>
            )}
            {planActif === 'pro' && (
              <span style={{ fontSize: 11, background: '#C75B00', color: '#fff', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>⭐ Pro</span>
            )}
            {sponsorActif && (
              <span style={{ fontSize: 11, background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>⭐ En avant</span>
            )}
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, flexShrink: 0,
            color: boutique.actif ? '#16a34a' : '#9ca3af',
            background: boutique.actif ? '#dcfce7' : '#f1f5f9',
          }}>
            {boutique.actif ? 'Active' : 'Inactive'}
          </span>
        </div>

        {boutique.description && (
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0' }}>{boutique.description}</p>
        )}
        <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 12px' }}>
          {[boutique.categorie, boutique.ville, boutique.telephone].filter(Boolean).join(' · ')}
        </p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={onManage} style={{
            fontSize: 13, color: '#fff', background: '#C75B00', border: 'none',
            borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 700,
          }}>
            🛍 Gérer la boutique
          </button>
          <button onClick={onEdit} style={{
            fontSize: 13, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 600,
          }}>
            ✏️ Modifier
          </button>
          <Link href="/boutique/analytics" style={{
            fontSize: 13, color: '#16a34a', background: '#f0fdf4', border: '1px solid #86efac',
            borderRadius: 6, padding: '6px 14px', fontWeight: 600, textDecoration: 'none',
          }}>
            📊 Analytics
          </Link>
          <a href={`/boutiques/${boutique.id}`} target="_blank" rel="noreferrer" style={{
            fontSize: 13, color: '#374151', background: '#f8fafc', border: '1px solid #e5e7eb',
            borderRadius: 6, padding: '6px 14px', fontWeight: 600, textDecoration: 'none',
          }}>
            Voir ↗
          </a>
          <button onClick={onSponsoring} style={{
            fontSize: 13, color: '#92400e', background: '#fffbeb', border: '1px solid #fcd34d',
            borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 600,
          }}>
            ⭐ Mettre en avant
          </button>
          <button onClick={onDelete} style={{
            fontSize: 13, color: '#dc2626', background: 'none', border: '1px solid #fecaca',
            borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
          }}>
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Vue de gestion d'une boutique ────────────────────────────────────────────

function BoutiqueManage({ boutique, planActif, onBack }: {
  boutique: Boutique
  planActif: 'pro' | 'business' | null
  onBack: () => void
}) {
  const [tab, setTab] = useState<'produits' | 'infos'>('produits')

  const tabBtn = (t: typeof tab, label: string) => (
    <button type="button" onClick={() => setTab(t)} style={{
      padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
      fontSize: 14, fontWeight: tab === t ? 700 : 500,
      color: tab === t ? '#C75B00' : '#6b7280',
      borderBottom: tab === t ? '2px solid #C75B00' : '2px solid transparent',
    }}>
      {label}
    </button>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{
          background: 'none', border: '1px solid #e5e7eb', borderRadius: 8,
          padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: '#374151',
        }}>
          ← Retour
        </button>
        <div>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, margin: 0 }}>{boutique.nom}</h2>
          {planActif && (
            <span style={{ fontSize: 12, color: planActif === 'business' ? '#1e3a5f' : '#C75B00', fontWeight: 700 }}>
              {planActif === 'business' ? '💼 Plan Business' : '⭐ Plan Pro'}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 20 }}>
        {tabBtn('produits', '🛍 Catalogue produits')}
        {tabBtn('infos', 'ℹ Infos & contact')}
      </div>

      {tab === 'produits' && <CatalogueProduits boutique={boutique} planActif={planActif} />}

      {tab === 'infos' && (
        <div style={{ maxWidth: 560 }}>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
            Modifiez les informations de votre boutique : contacts, réseaux sociaux, photos.
          </p>
          {/* On réutilise le BoutiqueForm en mode édition, sans le wrapper conteneur */}
          <Link href="/boutique" style={{
            display: 'inline-block', background: '#1d4ed8', color: '#fff',
            padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14,
          }}>
            Modifier la boutique ✏️
          </Link>
        </div>
      )}
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function BoutiqueClient({
  boutiques,
  canCreate,
  planActif,
}: {
  boutiques: Boutique[]
  canCreate: boolean
  planActif?: 'pro' | 'business' | null
}) {
  type Mode = 'list' | 'create' | { editing: Boutique } | { managing: Boutique }
  const [mode, setMode] = useState<Mode>('list')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [sponsorError, setSponsorError] = useState<string | null>(null)
  const [, startSponsoring] = useTransition()
  const router = useRouter()

  async function handleSponsoring(boutiqueId: string) {
    setSponsorError(null)
    startSponsoring(async () => {
      const res = await initierWaveBoutiqueSponsoring(boutiqueId)
      if (res.ok && res.url) window.location.href = res.url
      else setSponsorError(res.error ?? 'Impossible d\'initialiser le paiement.')
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette boutique définitivement ?')) return
    setDeleteError(null)
    const result = await deleteBoutique(id)
    if (result.error) setDeleteError(result.error)
    else { setSuccessMsg('Boutique supprimée.'); router.refresh() }
  }

  function handleSuccess() {
    const isEdit = typeof mode === 'object' && 'editing' in mode
    setSuccessMsg(isEdit ? '✅ Boutique modifiée !' : '✅ Boutique créée !')
    setMode('list')
    router.refresh()
  }

  // Mode formulaire création/édition
  if (mode === 'create' || (typeof mode === 'object' && 'editing' in mode)) {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 20px' }}>
        <BoutiqueForm
          boutique={typeof mode === 'object' && 'editing' in mode ? mode.editing : undefined}
          onCancel={() => setMode('list')}
          onSuccess={handleSuccess}
        />
      </div>
    )
  }

  // Mode gestion d'une boutique (catalogue + infos)
  if (typeof mode === 'object' && 'managing' in mode) {
    return (
      <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 20px' }}>
        <BoutiqueManage
          boutique={mode.managing}
          planActif={planActif ?? null}
          onBack={() => setMode('list')}
        />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 22, margin: 0 }}>Ma boutique</h1>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>{boutiques.length}/3 boutiques</p>
        </div>
        {canCreate && (
          <button onClick={() => setMode('create')} style={{
            padding: '9px 18px', background: '#1d4ed8', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            + Créer une boutique
          </button>
        )}
      </div>

      {/* Messages */}
      {successMsg && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', color: '#16a34a', fontSize: 14, marginBottom: 16, fontWeight: 600 }}>
          {successMsg}
        </div>
      )}
      {deleteError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 14, marginBottom: 16 }}>
          {deleteError}
        </div>
      )}
      {sponsorError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 14, marginBottom: 16 }}>
          ❌ {sponsorError}
        </div>
      )}

      {/* Bannière abonnement (si pas encore abonné) */}
      {!planActif && (
        <Link href="/boutique/abonnement" style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'linear-gradient(135deg, #fff8f0, #fff3e0)',
          border: '1px solid #f59e0b', borderRadius: 12,
          padding: '14px 18px', marginBottom: 20, textDecoration: 'none',
        }}>
          <span style={{ fontSize: 28 }}>⭐</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#92400e' }}>Passer en Boutique Pro</p>
            <p style={{ margin: 0, fontSize: 12, color: '#b45309' }}>Catalogue produits · Placement prioritaire · Analytics — 15 000 FCFA/mois</p>
          </div>
          <span style={{ color: '#C75B00', fontWeight: 700, fontSize: 13 }}>Voir →</span>
        </Link>
      )}

      {boutiques.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9ca3af' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>🏪</p>
          <p style={{ fontSize: 15, marginBottom: 16 }}>Vous n&apos;avez pas encore de boutique.</p>
          <button onClick={() => setMode('create')} style={{
            padding: '10px 24px', background: '#1d4ed8', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Créer ma boutique
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {boutiques.map(b => (
            <BoutiqueCard
              key={b.id}
              boutique={b}
              planActif={planActif ?? null}
              onEdit={() => setMode({ editing: b })}
              onDelete={() => handleDelete(b.id)}
              onSponsoring={() => handleSponsoring(b.id)}
              onManage={() => setMode({ managing: b })}
            />
          ))}
        </div>
      )}
    </div>
  )
}
