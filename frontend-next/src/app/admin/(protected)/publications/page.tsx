'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import Link from 'next/link'
import {
  Share2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  Radio,
  FileSpreadsheet,
} from 'lucide-react'
import BatchActionBar from '@/components/admin/BatchActionBar'
import { TokenBanner, TokenModal } from './components/TokenManagement'
import { PublicationCard, type FbPost } from './components/PublicationCard'
import { PublicationForm, type PublicationFormData } from './components/PublicationForm'

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(`/admin-proxy/fb/${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...((opts.headers as Record<string, string>) || {}) },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur')
  return data
}

export default function PublicationsPage() {
  const [posts, setPosts] = useState<FbPost[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<PublicationFormData>({
    message: '',
    lien: '',
    image_url: '',
    publier_instagram: false,
    date_publication: '',
  })
  const [editId, setEditId] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  const [isPending, startTransition] = useTransition()
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [tokenKey, setTokenKey] = useState(0)

  const [showPublies, setShowPublies] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [copiedFeed, setCopiedFeed] = useState(false)

  const catalogFeedUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/flux-catalogue/global/meta.xml`
    : 'https://nopalou.com/api/flux-catalogue/global/meta.xml'

  const visiblePosts = posts.filter(p => showPublies || p.statut !== 'publie')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setPosts(await api(''))
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erreur')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function resetForm() {
    setForm({ message: '', lien: '', image_url: '', publier_instagram: false, date_publication: '' })
    setEditId(null)
    setErr('')
    setOk('')
  }

  function generer(type: string) {
    setErr('')
    setOk('')
    startTransition(async () => {
      try {
        const data = await api(`generer/${type}`)
        setForm(f => ({
          ...f,
          message: data.message || '',
          image_url: data.image_url || '',
          lien: data.lien || '',
        }))
        setEditId(null)
        setOk(`Post "${type}" généré avec succès — modifiez si besoin puis créez le brouillon.`)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : 'Erreur génération')
      }
    })
  }

  function startEdit(p: FbPost) {
    setEditId(p.id)
    setForm({
      message: p.message,
      lien: p.lien || '',
      image_url: p.image_url || '',
      publier_instagram: p.publier_instagram,
      date_publication: p.date_publication ? p.date_publication.slice(0, 16) : '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function submit() {
    setErr('')
    setOk('')
    startTransition(async () => {
      try {
        const body = {
          message: form.message,
          lien: form.lien || null,
          image_url: form.image_url || null,
          publier_instagram: form.publier_instagram,
          date_publication: form.date_publication || null,
        }
        if (editId) {
          await api(`${editId}`, { method: 'PATCH', body: JSON.stringify(body) })
          setOk('Publication mise à jour avec succès.')
        } else {
          await api('', { method: 'POST', body: JSON.stringify(body) })
          setOk('Brouillon créé avec succès.')
        }
        resetForm()
        load()
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  function approuver(id: string) {
    startTransition(async () => {
      try {
        await api(`${id}`, { method: 'PATCH', body: JSON.stringify({ statut: 'approuve' }) })
        setOk('Publication approuvée — sera diffusée selon le planning programmé.')
        load()
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  function remettreEnBrouillon(id: string) {
    startTransition(async () => {
      try {
        await api(`${id}`, { method: 'PATCH', body: JSON.stringify({ statut: 'brouillon' }) })
        load()
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  function publierMaintenant(id: string) {
    if (!confirm('Publier immédiatement sur Facebook (et Instagram si coché) ?')) return
    startTransition(async () => {
      try {
        const res = await api(`${id}/publier`, { method: 'POST' })
        setOk(`Publié avec succès ! FB: ${res.fb_id || '—'}${res.ig_id ? ' · IG: ' + res.ig_id : ''}`)
        load()
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  function supprimer(id: string) {
    if (!confirm('Supprimer définitivement cette publication ?')) return
    startTransition(async () => {
      try {
        await api(`${id}`, { method: 'DELETE' })
        load()
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  const copyCatalogUrl = () => {
    navigator.clipboard.writeText(catalogFeedUrl)
    setCopiedFeed(true)
    setTimeout(() => setCopiedFeed(false), 3000)
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px', paddingBottom: 60 }}>
      {/* Barre d'onglets Social Media Unifiée */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, flexWrap: 'wrap' }}>
        <Link
          href="/admin/publications"
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            textDecoration: 'none',
            background: '#1c2b4a',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Share2 size={15} />
          Publications & Diffusion Meta
        </Link>
        <Link
          href="/admin/integrations"
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            textDecoration: 'none',
            background: '#f8fafc',
            color: '#475569',
            border: '1px solid #cbd5e1',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Radio size={15} />
          Connecteurs Sociaux & Pixels
        </Link>
      </div>

      {/* En-tête de page */}
      <div style={{ marginBottom: 20 }}>
        <h1 className="admin-page-titre" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Share2 size={24} color="#0284c7" />
          Réseaux Sociaux : Diffusion & Publications
        </h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13.5 }}>
          Pilotez les publications officielles sur la page Facebook et le compte Instagram Nopalou.
        </p>
      </div>

      {/* Bannière Flux Catalogue Meta Shopping */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#166534', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <FileSpreadsheet size={15} /> Flux Meta Commerce Manager (Instagram & Facebook Shopping)
          </span>
          <div style={{ fontSize: 12, color: '#4b7c59', marginTop: 2, wordBreak: 'break-all' }}>
            {catalogFeedUrl}
          </div>
        </div>
        <button
          onClick={copyCatalogUrl}
          style={{
            padding: '6px 12px',
            background: copiedFeed ? '#15803d' : '#fff',
            color: copiedFeed ? '#fff' : '#166534',
            border: '1px solid #86efac',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          {copiedFeed ? <CheckCircle2 size={13} /> : <Copy size={13} />}
          {copiedFeed ? 'Copié !' : 'Copier l\'URL du flux'}
        </button>
      </div>

      {/* Statut Token Facebook / Instagram */}
      <TokenBanner key={tokenKey} onRenew={() => setShowTokenModal(true)} />

      {showTokenModal && (
        <TokenModal
          onClose={() => setShowTokenModal(false)}
          onSaved={() => setTokenKey(k => k + 1)}
        />
      )}

      {/* Générateurs IA / Données automatiques */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #e2e8f0', marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#1c2b4a', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={15} color="#c75b00" />
          Générer automatiquement un post à fort engagement depuis la base
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { key: 'bon-plan', label: 'Bon plan du jour', bg: '#fef3c7', text: '#92400e' },
            { key: 'comparatif', label: 'Comparatif prix', bg: '#eff6ff', text: '#1d4ed8' },
            { key: 'immo', label: 'Annonce immo', bg: '#f0fdf4', text: '#166534' },
            { key: 'conseil', label: 'Conseil d\'achat', bg: '#fdf4ff', text: '#7e22ce' },
            { key: 'abonnement', label: 'Promo abonnement', bg: '#fff7ed', text: '#c75b00' },
            { key: 'boutiques', label: 'Vitrine boutique', bg: '#ecfdf5', text: '#065f46' },
            { key: 'telecom', label: 'Forfait télécom', bg: '#f0f9ff', text: '#0369a1' },
            { key: 'apporteur', label: 'Programme apporteur', bg: '#fef9c3', text: '#854d0e' },
            { key: 'vente-flash', label: 'Vente flash', bg: '#fef2f2', text: '#991b1b' },
          ].map(g => (
            <button
              key={g.key}
              onClick={() => generer(g.key)}
              disabled={isPending}
              style={{
                padding: '7px 12px',
                borderRadius: 7,
                border: 'none',
                background: g.bg,
                color: g.text,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Formulaire d'édition / création */}
      <PublicationForm
        form={form}
        setForm={setForm}
        editId={editId}
        isPending={isPending}
        err={err}
        ok={ok}
        onSubmit={submit}
        onCancel={resetForm}
      />

      {/* Liste des publications */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1c2b4a', margin: 0 }}>
          {showPublies ? `Toutes les publications (${posts.length})` : `En cours de validation (${posts.filter(p => p.statut !== 'publie').length})`}
        </h2>
        <button
          onClick={() => setShowPublies(v => !v)}
          style={{
            fontSize: 12,
            padding: '5px 12px',
            background: '#f1f5f9',
            color: '#475569',
            border: '1px solid #e2e8f0',
            borderRadius: 7,
            cursor: 'pointer',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {showPublies ? <EyeOff size={13} /> : <Eye size={13} />}
          {showPublies ? 'Masquer les publiés' : `Voir les publiés (${posts.filter(p => p.statut === 'publie').length})`}
        </button>
      </div>

      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={visiblePosts.length}
        allSelected={visiblePosts.length > 0 && selectedIds.length === visiblePosts.length}
        onToggleSelectAll={() => {
          if (selectedIds.length === visiblePosts.length) setSelectedIds([])
          else setSelectedIds(visiblePosts.map(p => p.id))
        }}
        onClearSelection={() => setSelectedIds([])}
        actions={[
          {
            key: 'approuver',
            label: 'Approuver la sélection',
            icon: '',
            color: 'green',
            onClick: async () => {
              for (const id of selectedIds) {
                try { await api(`${id}/approuver`, { method: 'POST' }) } catch {}
              }
              setSelectedIds([])
              load()
            },
          },
          {
            key: 'supprimer',
            label: 'Supprimer la sélection',
            icon: '',
            color: 'red',
            confirmMsg: 'Supprimer définitivement ces publications ?',
            onClick: async () => {
              for (const id of selectedIds) {
                try { await api(id, { method: 'DELETE' }) } catch {}
              }
              setSelectedIds([])
              load()
            },
          },
        ]}
        itemLabel="publication(s)"
      />

      {loading && <p style={{ color: '#94a3b8', fontSize: 13 }}>Chargement des publications...</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visiblePosts.map(p => (
          <PublicationCard
            key={p.id}
            post={p}
            isSelected={selectedIds.includes(p.id)}
            onToggleSelect={id => {
              setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
            }}
            onStartEdit={startEdit}
            onApprouver={approuver}
            onPublierMaintenant={publierMaintenant}
            onRemettreEnBrouillon={remettreEnBrouillon}
            onSupprimer={supprimer}
          />
        ))}
      </div>
    </div>
  )
}
